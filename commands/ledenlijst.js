const { SlashCommandBuilder } = require('discord.js');
const { updateMemberListMessage } = require('../utils/memberList');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ledenlijst')
    .setDescription('Plaats de ledenlijst'),

  async execute(interaction) {
    const message = await updateMemberListMessage(interaction.guild);

    if (!message) {
      return interaction.reply({
        content: 'Ledenlijst kanaal niet gevonden of ongeldig.',
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: `Ledenlijst geplaatst in ${message.channel}.`,
      ephemeral: true,
    });
  },
};