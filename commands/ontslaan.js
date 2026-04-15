const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { COLORS, IDS } = require('../config');
const { canManageMember, canManageRole, hasPermission } = require('../utils/permissions');
const { createLogEmbed } = require('../utils/views');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ontslaan')
    .setDescription('Verwijder alle rollen behalve de basisrol van een gebruiker.')
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
    const baseRole = interaction.guild.roles.cache.get(IDS.MEMBER_ROLE_ID);

    if (!baseRole) {
      return interaction.reply({
        content: 'De basisrol kon niet worden gevonden.',
        ephemeral: true,
      });
    }

    if (!canManageMember(botMember, targetMember, interaction.guild)) {
      return interaction.reply({
        content: 'Ik kan deze gebruiker niet beheren door rolpositie of eigenaarschap.',
        ephemeral: true,
      });
    }

    const rolesToRemove = targetMember.roles.cache.filter(
      (role) => role.id !== interaction.guild.id && role.id !== baseRole.id
    );

    const blockedRole = rolesToRemove.find((role) => !canManageRole(botMember, role));
    if (blockedRole) {
      return interaction.reply({
        content: `Ik kan rol "${blockedRole.name}" niet verwijderen door rolpositie.`,
        ephemeral: true,
      });
    }

    if (rolesToRemove.size > 0) {
      await targetMember.roles.remove(rolesToRemove, `Ontslagen door ${interaction.user.tag}: ${uitleg}`);
    }

    if (!targetMember.roles.cache.has(baseRole.id)) {
      await targetMember.roles.add(baseRole, 'Basisrol teruggezet na ontslag.');
    }

    const embed = createLogEmbed({
      title: 'Ontslag',
      emoji: '❌',
      color: COLORS.ontslaan,
      fields: [
        { name: 'Gebruiker', value: `${targetMember}`, inline: true },
        { name: 'Uitvoerder', value: `${interaction.user}`, inline: true },
        { name: 'Behouden rol', value: `${baseRole}`, inline: true },
        { name: 'Uitleg', value: uitleg, inline: false },
      ],
    });

    const logChannel = await interaction.guild.channels.fetch(IDS.TERMINATION_LOG_CHANNEL_ID).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [embed] });
    }

    return interaction.reply({
      content: 'Ontslag verwerkt en gelogd.',
      ephemeral: true,
    });
  },
};
