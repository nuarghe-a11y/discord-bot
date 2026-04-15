const { Events } = require('discord.js');
const {
  handleButtonInteraction,
  handleModalInteraction,
  handleSelectMenuInteraction,
} = require('../utils/componentHandlers');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return;
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Fout in /${interaction.commandName}:`, error);

        const payload = {
          content: 'Er ging iets mis tijdens het uitvoeren van dit command.',
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => null);
        } else {
          await interaction.reply(payload).catch(() => null);
        }
      }

      return;
    }

    if (interaction.isButton()) {
      return handleButtonInteraction(interaction, client);
    }

    if (interaction.isStringSelectMenu()) {
      return handleSelectMenuInteraction(interaction, client);
    }

    if (interaction.isModalSubmit()) {
      return handleModalInteraction(interaction, client);
    }
  },
};
