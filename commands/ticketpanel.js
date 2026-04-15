const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { IDS } = require('../config');
const { hasPermission } = require('../utils/permissions');
const { createTicketPanelEmbed, createTicketPanelRow } = require('../utils/views');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Plaats het ticketpaneel in het ticketkanaal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!hasPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: 'Je hebt geen permissie om dit command te gebruiken.',
        ephemeral: true,
      });
    }

    const channel = await interaction.guild.channels.fetch(IDS.TICKET_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: 'Het ticketpaneelkanaal is niet gevonden.',
        ephemeral: true,
      });
    }

    await channel.send({
      embeds: [createTicketPanelEmbed()],
      components: [createTicketPanelRow()],
    });

    return interaction.reply({
      content: `Ticketpaneel geplaatst in ${channel}.`,
      ephemeral: true,
    });
  },
};
