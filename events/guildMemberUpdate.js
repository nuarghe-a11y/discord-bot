const { Events } = require('discord.js');
const { MEMBER_LIST_ROLES } = require('../config');
const { updateMemberListMessage } = require('../utils/memberList');

module.exports = {
  name: Events.GuildMemberUpdate,

  async execute(oldMember, newMember) {
    const watchedRoles = MEMBER_LIST_ROLES.map(r => r.roleId);

    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const changed = watchedRoles.some(roleId => {
      return oldRoles.has(roleId) !== newRoles.has(roleId);
    });

    if (!changed) return;

    await updateMemberListMessage(newMember.guild).catch(() => null);
  },
};