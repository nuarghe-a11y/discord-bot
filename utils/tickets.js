// utils/tickets.js
// Ticket helpers zonder database. Metadata wordt in het kanaal-topic opgeslagen.

const { IDS, TICKET_CATEGORIES } = require('../config');

function buildTicketChannelName(user) {
  const safeName = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18) || 'ticket';
  return `ticket-${safeName}`;
}

function buildTicketTopic({ ownerId, category, state = 'open', deleteAt = 0 }) {
  return `ticket|owner:${ownerId}|category:${encodeURIComponent(category)}|state:${state}|deleteAt:${deleteAt}`;
}

function parseTicketTopic(topic = '') {
  if (!topic.startsWith('ticket|')) {
    return null;
  }

  const data = {};
  const parts = topic.split('|').slice(1);

  for (const part of parts) {
    const separatorIndex = part.indexOf(':');
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex);
    const value = part.slice(separatorIndex + 1);
    data[key] = decodeURIComponent(value);
  }

  return {
    ownerId: data.owner || '',
    category: data.category || 'overige',
    state: data.state || 'open',
    deleteAt: Number(data.deleteAt || 0),
  };
}

function getTicketCategoryLabel(value) {
  const category = TICKET_CATEGORIES.find((item) => item.value === value);
  return category ? category.label : value;
}

function findOpenTicketChannel(guild, userId) {
  return guild.channels.cache.find((channel) => {
    if (channel.parentId !== IDS.TICKET_CATEGORY_ID) return false;
    const metadata = parseTicketTopic(channel.topic || '');
    if (!metadata) return false;
    return metadata.ownerId === userId && metadata.state === 'open';
  });
}

function scheduleTicketDeletionAt(client, channel, deleteAt, reason) {
  if (!client.ticketTimeouts) {
    client.ticketTimeouts = new Map();
  }

  const existingTimeout = client.ticketTimeouts.get(channel.id);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(async () => {
    try {
      const freshChannel = await channel.guild.channels.fetch(channel.id).catch(() => null);
      if (freshChannel) {
        await freshChannel.delete(reason).catch(() => null);
      }
    } finally {
      client.ticketTimeouts.delete(channel.id);
    }
  }, Math.max(deleteAt - Date.now(), 0));

  client.ticketTimeouts.set(channel.id, timeout);
}

async function sweepTicketDeletions(client) {
  for (const guild of client.guilds.cache.values()) {
    const ticketChannels = guild.channels.cache.filter(
      (channel) => channel.parentId === IDS.TICKET_CATEGORY_ID
    );

    for (const channel of ticketChannels.values()) {
      const metadata = parseTicketTopic(channel.topic || '');
      if (!metadata || !metadata.deleteAt) continue;

      if (metadata.deleteAt <= Date.now()) {
        await channel.delete('Ticket timeout bereikt.').catch(() => null);
      } else {
        scheduleTicketDeletionAt(client, channel, metadata.deleteAt, 'Ticket timeout bereikt.');
      }
    }
  }
}

function startTicketSweeper(client) {
  sweepTicketDeletions(client).catch((error) => {
    console.error('Fout tijdens ticket sweep:', error);
  });

  setInterval(() => {
    sweepTicketDeletions(client).catch((error) => {
      console.error('Fout tijdens ticket sweep:', error);
    });
  }, 5 * 60 * 1000);
}

module.exports = {
  buildTicketChannelName,
  buildTicketTopic,
  findOpenTicketChannel,
  getTicketCategoryLabel,
  parseTicketTopic,
  scheduleTicketDeletionAt,
  startTicketSweeper,
};
