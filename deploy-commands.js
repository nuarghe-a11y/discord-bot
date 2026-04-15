// deploy-commands.js
// Registreert alle slash commands in 1 guild voor snelle testing.

require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

if (!process.env.TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  console.error('TOKEN, CLIENT_ID of GUILD_ID ontbreekt.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`Command ${file} heeft geen data.`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Bezig met registreren van ${commands.length} slash commands...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('Slash commands zijn geregistreerd.');
  } catch (error) {
    console.error('Registreren mislukt:', error);
  }
})();