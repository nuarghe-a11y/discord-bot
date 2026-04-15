const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { COLORS, IDS } = require('../config');
const { canManageMember, canManageRole, hasPermission } = require('../utils/permissions');
const { createLogEmbed } = require('../utils/views');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Voeg een nieuwe promotierol toe aan een gebruiker.')
    .addUserOption((option) =>
      option.setName('user').setDescription('De gebruiker').setRequired(true)
    )
    .addRoleOption((option) =>
      option.setName('role').setDescription('De nieuwe rol').setRequired(true)
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
    const role = interaction.options.getRole('role', true);
    const uitleg = interaction.options.getString('uitleg', true);
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    const botMember = interaction.guild.members.me;

    if (!canManageMember(botMember, targetMember, interaction.guild)) {
      return interaction.reply({
        content: 'Ik kan deze gebruiker niet beheren door rolpositie of eigenaarschap.',
        ephemeral: true,
      });
    }

    if (!canManageRole(botMember, role)) {
      return interaction.reply({
        content: 'Ik kan deze rol niet geven door rolpositie.',
        ephemeral: true,
      });
    }

    if (!targetMember.roles.cache.has(role.id)) {
      await targetMember.roles.add(role, `Promotie door ${interaction.user.tag}: ${uitleg}`);
    }

    const embed = createLogEmbed({
      title: 'Promotie',
      emoji: '🔥',
      color: COLORS.promote,
      fields: [
        { name: 'Gebruiker', value: `${targetMember}`, inline: true },
        { name: 'Nieuwe rol', value: `${role}`, inline: true },
        { name: 'Uitvoerder', value: `${interaction.user}`, inline: true },
        { name: 'Uitleg', value: uitleg, inline: false },
      ],
    });

    const logChannel = await interaction.guild.channels.fetch(IDS.PROMOTION_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [embed] });
    }

    return interaction.reply({
      content: 'Promotie verwerkt en gelogd.',
      ephemeral: true,
    });
  },
};
