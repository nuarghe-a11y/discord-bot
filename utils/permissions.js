// utils/permissions.js
// Kleine helpers voor permissies en rolchecks.

const { PermissionFlagsBits } = require('discord.js');
const { IDS } = require('../config');

function hasPermission(member, permission) {
  return member.permissions.has(permission);
}

function canManageRole(botMember, role) {
  return Boolean(botMember && role && role.position < botMember.roles.highest.position);
}

function canManageMember(botMember, targetMember, guild) {
  if (!botMember || !targetMember || !guild) return false;
  if (targetMember.id === guild.ownerId) return false;
  if (!targetMember.manageable) return false;
  return targetMember.roles.highest.position < botMember.roles.highest.position;
}

function hasTicketStaffAccess(member, guild) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const staffRole = guild.roles.cache.get(IDS.STAFF_ROLE_ID);
  if (!staffRole) {
    return false;
  }

  return member.roles.cache.some((role) => role.position >= staffRole.position);
}

function getTicketStaffRoleIds(guild) {
  const staffRole = guild.roles.cache.get(IDS.STAFF_ROLE_ID);
  if (!staffRole) {
    return [];
  }

  return guild.roles.cache
    .filter((role) => role.id !== guild.id && role.position >= staffRole.position)
    .map((role) => role.id);
}

module.exports = {
  canManageMember,
  canManageRole,
  getTicketStaffRoleIds,
  hasPermission,
  hasTicketStaffAccess,
};
