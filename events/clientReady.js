const { Events } = require('discord.js');
const { startTicketSweeper } = require('../utils/tickets');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Bot is online! Ingelogd als ${client.user.tag}`);
    startTicketSweeper(client);
  },
};
