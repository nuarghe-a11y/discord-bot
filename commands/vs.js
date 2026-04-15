const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createOrUpdatePlayerProfile, getStoredGangNames, updateGangOverviewMessage } = require('../utils/gangs');
const { hasPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vs')
    .setDescription('Voeg een speler toe aan een gang en maak een profiel aan.')
    .addStringOption((option) =>
      option
        .setName('naam')
        .setDescription('Naam van de speler')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('gang')
        .setDescription('Gang van de speler')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('rol')
        .setDescription('Rol van de speler in de gang')
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName('foto')
        .setDescription('Foto van de speler')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!hasPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: 'Je hebt geen permissie om dit command te gebruiken.',
        ephemeral: true,
      });
    }

    const playerName = interaction.options.getString('naam', true).trim();
    const gangName = interaction.options.getString('gang', true).trim();
    const roleName = interaction.options.getString('rol', true).trim();
    const photo = interaction.options.getAttachment('foto', false);

    const gangs = await getStoredGangNames(interaction.guild);
    const matchedGang = gangs.find((name) => name.toLowerCase() === gangName.toLowerCase());

    if (!matchedGang) {
      return interaction.reply({
        content: 'Deze gang bestaat nog niet. Voeg hem eerst toe met /vg.',
        ephemeral: true,
      });
    }

    const result = await createOrUpdatePlayerProfile(interaction.guild, {
      playerName,
      gangName: matchedGang,
      roleName,
      photoUrl: photo?.url || '',
    });

    if (!result.ok) {
      return interaction.reply({
        content: 'De profielcategorie kon niet worden gevonden.',
        ephemeral: true,
      });
    }

    await updateGangOverviewMessage(interaction.guild);

    return interaction.reply({
      content: `Speler toegevoegd of bijgewerkt: **${playerName}** in **${matchedGang}**. Profiel: ${result.channel}`,
      ephemeral: true,
    });
  },
};