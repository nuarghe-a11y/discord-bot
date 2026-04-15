const { EmbedBuilder, ChannelType } = require('discord.js');
const { IDS, MEMBER_LIST_ROLES, LOGO_URL } = require('../config');

function buildMemberListEmbed(guild) {
  const sections = [];

  for (const entry of MEMBER_LIST_ROLES) {
    const role = guild.roles.cache.get(entry.roleId);

    let members = [];
    if (role) {
      members = role.members
        .map((member) => member.toString())
        .sort((a, b) => a.localeCompare(b, 'nl'));
    }

    sections.push(`**${entry.label} :**`);
    sections.push(members.length ? members.join('\n') : '-');
    sections.push('');
  }

  const embed = new EmbedBuilder()
    .setTitle('Ledenlijst')
    .setDescription(sections.join('\n'))
    .setColor(0x111111)
    .setFooter({ text: 'Mano Segreta' })
    .setTimestamp();

  if (LOGO_URL) {
    embed.setThumbnail(LOGO_URL);
  }

  return embed;
}

async function findExistingMemberListMessage(channel) {
  const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (!messages) return null;

  return (
    messages.find((msg) => {
      if (msg.author?.bot !== true) return false;
      if (!msg.embeds || msg.embeds.length === 0) return false;
      return msg.embeds[0]?.title === 'Ledenlijst';
    }) || null
  );
}

async function updateMemberListMessage(guild) {
  const channel = await guild.channels.fetch(IDS.MEMBER_LIST_CHANNEL_ID).catch(() => null);

  if (!channel || channel.type !== ChannelType.GuildText) {
    return null;
  }

  // Zorg dat alle leden geladen zijn, anders verdwijnen namen soms uit de lijst
  await guild.members.fetch().catch(() => null);

  const embed = buildMemberListEmbed(guild);

  // Zoek bestaande ledenlijst-message van de bot
  const existingMessage = await findExistingMemberListMessage(channel);

  if (existingMessage) {
    await existingMessage.edit({
      embeds: [embed],
      components: [],
    });

    return existingMessage;
  }

  // Als hij niet bestaat (bijv. verwijderd), maak automatisch een nieuwe
  const newMessage = await channel.send({
    embeds: [embed],
  });

  return newMessage;
}

module.exports = {
  buildMemberListEmbed,
  updateMemberListMessage,
};