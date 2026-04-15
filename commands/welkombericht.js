const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { IDS } = require('../config');
const { hasPermission } = require('../utils/permissions');
const { createWelcomeEmbed, createWelcomeRow } = require('../utils/views');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welkombericht')
    .setDescription('Plaats het welkomstbericht opnieuw in het welkomstkanaal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!hasPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: 'Je hebt geen permissie om dit command te gebruiken.',
        ephemeral: true,
      });
    }

    const channel = await interaction.guild.channels.fetch(IDS.WELCOME_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: 'Het welkomstkanaal is niet gevonden.',
        ephemeral: true,
      });
    }

    await channel.send({
      embeds: [createWelcomeEmbed()],
      components: [createWelcomeRow()],
    });

    return interaction.reply({
      content: `Welkomstbericht geplaatst in ${channel}.`,
      ephemeral: true,
    });
  },
};
