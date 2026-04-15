const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { COLORS, IDS } = require('../config');
const { canManageMember, canManageRole, hasPermission } = require('../utils/permissions');
const { createLogEmbed } = require('../utils/views');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Geef een eerste of tweede warn aan een gebruiker.')
    .addUserOption((option) =>
      option.setName('user').setDescription('De gebruiker').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('uitleg').setDescription('Uitleg of reden').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    if (!hasPermission(interaction.member, PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'Je hebt geen permissie hiervoor.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user', true);
    const uitleg = interaction.options.getString('uitleg', true);
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    const botMember = interaction.guild.members.me;
    const firstWarnRole = interaction.guild.roles.cache.get(IDS.FIRST_WARN_ROLE_ID);
    const secondWarnRole = interaction.guild.roles.cache.get(IDS.SECOND_WARN_ROLE_ID);

    if (!firstWarnRole || !secondWarnRole) {
      return interaction.reply({
        content: 'Een of beide warn-rollen konden niet worden gevonden.',
        ephemeral: true,
      });
    }

    if (!canManageMember(botMember, targetMember, interaction.guild)) {
      return interaction.reply({
        content: 'Ik kan deze gebruiker niet beheren door rolpositie of eigenaarschap.',
        ephemeral: true,
      });
    }

    let givenRole = null;
    let warnLabel = '';

    if (!targetMember.roles.cache.has(firstWarnRole.id)) {
      if (!canManageRole(botMember, firstWarnRole)) {
        return interaction.reply({
          content: 'Ik kan de eerste warn-rol niet geven door rolpositie.',
          ephemeral: true,
        });
      }

      await targetMember.roles.add(firstWarnRole, `Eerste warn door ${interaction.user.tag}: ${uitleg}`);
      givenRole = firstWarnRole;
      warnLabel = 'Eerste warn';
    } else if (!targetMember.roles.cache.has(secondWarnRole.id)) {
      if (!canManageRole(botMember, secondWarnRole)) {
        return interaction.reply({
          content: 'Ik kan de tweede warn-rol niet geven door rolpositie.',
          ephemeral: true,
        });
      }

      await targetMember.roles.add(secondWarnRole, `Tweede warn door ${interaction.user.tag}: ${uitleg}`);
      givenRole = secondWarnRole;
      warnLabel = 'Tweede warn';
    } else {
      return interaction.reply({
        content: 'Deze gebruiker heeft al beide warn-rollen.',
        ephemeral: true,
      });
    }

    const embed = createLogEmbed({
      title: 'Warn',
      emoji: '⚠️',
      color: COLORS.warn,
      fields: [
        { name: 'Gebruiker', value: `${targetMember}`, inline: true },
        { name: 'Warn', value: warnLabel, inline: true },
        { name: 'Rol', value: `${givenRole}`, inline: true },
        { name: 'Uitvoerder', value: `${interaction.user}`, inline: true },
        { name: 'Uitleg', value: uitleg, inline: false },
      ],
    });

    const channelId = IDS.WARN_LOG_CHANNEL_ID || interaction.channelId;
    const logChannel = await interaction.guild.channels.fetch(channelId).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [embed] });
    }

    return interaction.reply({
      content: 'Warn verwerkt en gelogd.',
      ephemeral: true,
    });
  },
};
