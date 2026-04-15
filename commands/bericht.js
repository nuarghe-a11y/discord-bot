const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { createAnnouncementEmbed } = require('../utils/views');
const { hasPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bericht')
    .setDescription('Plaats een professioneel embed-bericht in dit kanaal.')
    .addStringOption((option) =>
      option.setName('titel').setDescription('Titel van het bericht').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('tekst').setDescription('Inhoud van het bericht').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!hasPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: 'Je hebt geen permissie om dit command te gebruiken.',
        ephemeral: true,
      });
    }

    const title = interaction.options.getString('titel', true);
    const text = interaction.options.getString('tekst', true);

    return interaction.reply({
      embeds: [createAnnouncementEmbed(title, text)],
    });
  },
};
