const { EmbedBuilder, ChannelType } = require('discord.js');
const { IDS, LOGO_URL } = require('../config');

const GANGS_TOPIC_PREFIX = 'GANGS:';
const PROFILE_TOPIC_PREFIX = 'PLAYER_PROFILE:';

function normalizeGangName(name) {
  return name.trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildProfileTopic({ playerName, gangName, roleName }) {
  return `${PROFILE_TOPIC_PREFIX}${playerName}|${gangName}|${roleName}`;
}

function parseProfileTopic(topic) {
  if (!topic || !topic.startsWith(PROFILE_TOPIC_PREFIX)) return null;

  const raw = topic.slice(PROFILE_TOPIC_PREFIX.length);
  const parts = raw.split('|');

  if (parts.length < 3) return null;

  return {
    playerName: parts[0],
    gangName: parts[1],
    roleName: parts.slice(2).join('|'),
  };
}

async function getGangHubChannel(guild) {
  const channel = await guild.channels.fetch(IDS.GANG_HUB_CHANNEL_ID).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return null;
  return channel;
}

async function getProfileCategory(guild) {
  const category = await guild.channels.fetch(IDS.GANG_PROFILE_CATEGORY_ID).catch(() => null);
  if (!category || category.type !== ChannelType.GuildCategory) return null;
  return category;
}

function loadGangNamesFromTopic(channel) {
  const topic = channel.topic || '';

  if (!topic.startsWith(GANGS_TOPIC_PREFIX)) {
    return [];
  }

  const raw = topic.slice(GANGS_TOPIC_PREFIX.length).trim();
  if (!raw) return [];

  return raw
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

async function saveGangNamesToTopic(channel, gangNames) {
  const unique = [...new Set(gangNames.map(normalizeGangName))];
  const topic = `${GANGS_TOPIC_PREFIX}${unique.join(',')}`;
  await channel.setTopic(topic);
}

async function getStoredGangNames(guild) {
  const hubChannel = await getGangHubChannel(guild);
  if (!hubChannel) return [];
  return loadGangNamesFromTopic(hubChannel);
}

async function addGangName(guild, gangName) {
  const hubChannel = await getGangHubChannel(guild);
  if (!hubChannel) return { ok: false, reason: 'hub_not_found' };

  const cleanName = normalizeGangName(gangName);
  const current = loadGangNamesFromTopic(hubChannel);

  if (current.some((name) => name.toLowerCase() === cleanName.toLowerCase())) {
    return { ok: false, reason: 'already_exists' };
  }

  current.push(cleanName);
  await saveGangNamesToTopic(hubChannel, current);

  return { ok: true };
}

async function getPlayerProfileChannels(guild) {
  const category = await getProfileCategory(guild);
  if (!category) return [];

  const channels = guild.channels.cache.filter(
    (channel) =>
      channel.parentId === category.id &&
      channel.type === ChannelType.GuildText
  );

  return [...channels.values()];
}

async function collectGangMembers(guild) {
  const storedGangNames = await getStoredGangNames(guild);
  const profileChannels = await getPlayerProfileChannels(guild);

  const map = new Map();

  for (const gangName of storedGangNames) {
    map.set(gangName, []);
  }

  for (const channel of profileChannels) {
    const meta = parseProfileTopic(channel.topic || '');
    if (!meta) continue;

    if (!map.has(meta.gangName)) {
      map.set(meta.gangName, []);
    }

    map.get(meta.gangName).push({
      playerName: meta.playerName,
      roleName: meta.roleName,
      channelId: channel.id,
    });
  }

  for (const [, members] of map) {
    members.sort((a, b) => a.playerName.localeCompare(b.playerName, 'nl'));
  }

  return map;
}

function buildProfileChannelUrl(guildId, channelId) {
  return `https://discord.com/channels/${guildId}/${channelId}/${channelId}`;
}

function buildGangOverviewEmbed(guild, gangMap) {
  const lines = [];

  for (const [gangName, members] of gangMap.entries()) {
    lines.push(`**${gangName}**`);

    if (!members.length) {
      lines.push('-');
      lines.push('');
      continue;
    }

    for (const member of members) {
      const url = buildProfileChannelUrl(guild.id, member.channelId);
      lines.push(`• [${member.playerName}](${url}) — ${member.roleName}`);
    }

    lines.push('');
  }

  const embed = new EmbedBuilder()
    .setTitle('Gangs Overzicht')
    .setDescription(lines.length ? lines.join('\n') : 'Er zijn nog geen gangs of spelers toegevoegd.')
    .setColor(0x5865f2)
    .setFooter({ text: 'Mano Segreta • Gangs Overzicht' })
    .setTimestamp();

  if (LOGO_URL) {
    embed.setThumbnail(LOGO_URL);
  }

  return embed;
}

async function findExistingGangOverviewMessage(channel) {
  const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (!messages) return null;

  return (
    messages.find((msg) => {
      if (!msg.author?.bot) return false;
      if (!msg.embeds?.length) return false;
      return msg.embeds[0]?.title === 'Gangs Overzicht';
    }) || null
  );
}

async function updateGangOverviewMessage(guild) {
  const hubChannel = await getGangHubChannel(guild);
  if (!hubChannel) return null;

  const gangMap = await collectGangMembers(guild);
  const embed = buildGangOverviewEmbed(guild, gangMap);

  const existing = await findExistingGangOverviewMessage(hubChannel);

  if (existing) {
    await existing.edit({ embeds: [embed], components: [] });
    return existing;
  }

  return hubChannel.send({ embeds: [embed] });
}

async function createOrUpdatePlayerProfile(guild, { playerName, gangName, roleName, photoUrl }) {
  const category = await getProfileCategory(guild);
  if (!category) {
    return { ok: false, reason: 'category_not_found' };
  }

  const channelName = `${slugify(playerName)}-profiel`;
  const existing = guild.channels.cache.find(
    (channel) =>
      channel.parentId === category.id &&
      channel.type === ChannelType.GuildText &&
      channel.name === channelName
  );

  let profileChannel = existing;

  if (!profileChannel) {
    profileChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: buildProfileTopic({ playerName, gangName, roleName }),
      reason: `Profiel aangemaakt voor ${playerName}`,
    });
  } else {
    await profileChannel.setTopic(buildProfileTopic({ playerName, gangName, roleName }));
  }

  const embed = new EmbedBuilder()
    .setTitle(playerName)
    .setColor(0x57f287)
    .addFields(
      { name: 'Gang', value: gangName, inline: true },
      { name: 'Rol', value: roleName, inline: true }
    )
    .setFooter({ text: 'Mano Segreta • Spelerprofiel' })
    .setTimestamp();

  if (photoUrl) {
    embed.setImage(photoUrl);
  } else if (LOGO_URL) {
    embed.setThumbnail(LOGO_URL);
  }

  const messages = await profileChannel.messages.fetch({ limit: 20 }).catch(() => null);
  const existingProfileMessage =
    messages?.find((msg) => {
      if (!msg.author?.bot) return false;
      if (!msg.embeds?.length) return false;
      return msg.embeds[0]?.title === playerName;
    }) || null;

  if (existingProfileMessage) {
    await existingProfileMessage.edit({ embeds: [embed], components: [] });
  } else {
    await profileChannel.send({ embeds: [embed] });
  }

  return { ok: true, channel: profileChannel };
}

module.exports = {
  addGangName,
  getStoredGangNames,
  createOrUpdatePlayerProfile,
  updateGangOverviewMessage,
};