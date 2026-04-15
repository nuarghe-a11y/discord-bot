const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
  createOrUpdatePlayerProfile,
  getStoredGangNames,
  updateGangOverviewMessage,
} = require('../utils/gangs');
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
    await interaction.deferReply({ ephemeral: true });

    try {
      if (!hasPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply({
          content: 'Je hebt geen permissie om dit command te gebruiken.',
        });
      }

      const playerName = interaction.options.getString('naam', true).trim();
      const gangName = interaction.options.getString('gang', true).trim();
      const roleName = interaction.options.getString('rol', true).trim();
      const photo = interaction.options.getAttachment('foto', false);

      const gangs = await getStoredGangNames(interaction.guild);
      const matchedGang = gangs.find(
        (name) => name.toLowerCase() === gangName.toLowerCase()
      );

      if (!matchedGang) {
        return interaction.editReply({
          content: 'Deze gang bestaat nog niet. Voeg hem eerst toe met /vg.',
        });
      }

      const photoUrl =
        photo && photo.contentType && photo.contentType.startsWith('image/')
          ? (photo.proxyURL || photo.url)
          : '';

      const result = await createOrUpdatePlayerProfile(interaction.guild, {
        playerName,
        gangName: matchedGang,
        roleName,
        photoUrl,
      });

      if (!result.ok) {
        return interaction.editReply({
          content: 'De profielcategorie kon niet worden gevonden.',
        });
      }

      await updateGangOverviewMessage(interaction.guild);

      return interaction.editReply({
        content: `Speler toegevoegd of bijgewerkt: **${playerName}** in **${matchedGang}**. Profiel: ${result.channel}`,
      });
    } catch (error) {
      console.error('Fout in /vs:', error);

      return interaction.editReply({
        content: 'Er ging iets mis bij het toevoegen van de speler.',
      }).catch(() => null);
    }
  },
};