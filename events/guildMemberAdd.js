const { Events } = require('discord.js');
const { IDS } = require('../config');
const { createWelcomeEmbed, createWelcomeRow } = require('../utils/views');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const channel = await member.guild.channels.fetch(IDS.WELCOME_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return;
    }

    await channel.send({
      embeds: [createWelcomeEmbed(member)],
      components: [createWelcomeRow()],
    }).catch(() => null);
  },
};
