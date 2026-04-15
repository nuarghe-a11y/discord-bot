const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addGangName, updateGangOverviewMessage } = require('../utils/gangs');
const { hasPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vg')
    .setDescription('Voeg een gang toe aan het overzicht.')
    .addStringOption((option) =>
      option
        .setName('naam')
        .setDescription('Naam van de gang')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!hasPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: 'Je hebt geen permissie om dit command te gebruiken.',
        ephemeral: true,
      });
    }

    const gangName = interaction.options.getString('naam', true);
    const result = await addGangName(interaction.guild, gangName);

    if (!result.ok) {
      const message =
        result.reason === 'already_exists'
          ? 'Deze gang bestaat al.'
          : 'Het overzichtkanaal kon niet worden gevonden.';

      return interaction.reply({
        content: message,
        ephemeral: true,
      });
    }

    await updateGangOverviewMessage(interaction.guild);

    return interaction.reply({
      content: `Gang toegevoegd: **${gangName}**`,
      ephemeral: true,
    });
  },
};