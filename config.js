// config.js
// Pas hier later makkelijk je branding, teksten en Discord IDs aan.

const LOGO_URL = 'https://cdn.discordapp.com/attachments/1346112182303326321/1493835359899881553/6E49F473-B14E-43B4-8C0F-C57CE3F8A1A6.png';

module.exports = {
  BRAND_NAME: 'Mano Segreta',
  FOOTER_TEXT: 'Mano Segreta • MRP Gang Server',
  LOGO_URL,

  COLORS: {
    welcome: 0x57f287,
    info: 0x5865f2,
    ticket: 0x3498db,
    promote: 0x57f287,
    demote: 0xf1c40f,
    ontslaan: 0xed4245,
    warn: 0xe67e22,
  },

  IDS: {
    // Welkomsysteem
    WELCOME_CHANNEL_ID: '1237061460736348250',
    MEMBER_ROLE_ID: '1134277865471488080',
    
    // Gang systeem
    GANG_HUB_CHANNEL_ID: '1346112400340025354',
    GANG_PROFILE_CATEGORY_ID: '1494096224385761290',

    // Ticket systeem
    TICKET_PANEL_CHANNEL_ID: '1237062609199435838',
    TICKET_CATEGORY_ID: '1347652872862437526',
    STAFF_ROLE_ID: '1179163440191909928',

    // Logs
    PROMOTION_LOG_CHANNEL_ID: '1346111790551142460',
    TERMINATION_LOG_CHANNEL_ID: '1346111844720316416',

    // Warn logs
    WARN_LOG_CHANNEL_ID: '',

    // Warn rollen
    FIRST_WARN_ROLE_ID: '1134277865416949837',
    SECOND_WARN_ROLE_ID: '1145415140024537250',

    // Ledenlijst
    MEMBER_LIST_CHANNEL_ID: '1346111698234376273',
  },

  COMPONENT_IDS: {
    WELCOME_ACCEPT_BUTTON: 'welcome_accept_button',
    TICKET_SELECT_MENU: 'ticket_select_menu',
    TICKET_MODAL_PREFIX: 'ticket_modal',
    TICKET_ACTION_PREFIX: 'ticket_action',
  },

  TICKET_CATEGORIES: [
    { value: 'vraag', label: 'Vraag', description: 'Algemene vragen of hulp nodig.' },
    { value: 'klacht', label: 'Klacht', description: 'Meld een klacht of probleem.' },
    { value: 'overige', label: 'Overige', description: 'Alles wat niet in de andere opties past.' },
  ],

  TICKET_DELETE_DELAY_MS: 12 * 60 * 60 * 1000,

  MEMBER_LIST_ROLES: [
    { label: '👑 | Boss', roleId: '1259184775219122187' },
    { label: '🖤 | Underboss', roleId: '1173998181193879583' },
    { label: '☠️ | Rechterhand', roleId: '1173998328325865623' },
    { label: '🥷 | Consigliere', roleId: '1173998593426854008' },
    { label: '🟥 | Hoofd Capo', roleId: '1173998506109845554' },
    { label: '🔴 | Capo', roleId: '1173998574577668179' },
    { label: '🕵🏻 | Hoofd Hitman', roleId: '1173998865465233429' },
    { label: '🎯 | Hitman', roleId: '1173998977830637631' },
    { label: '🎯 | Leerling Hitman', roleId: '1173999087306149958' },
    { label: '⚔️ | Hoofd Soldier', roleId: '1173999283784138842' },
    { label: '⚔️ | Soldier', roleId: '1173999527737426051' },
    { label: '⚔️ | Leerling Soldier', roleId: '1173999595710324796' },
    { label: '💂 | Bewaker', roleId: '1173999730074845235' },
    { label: '💼 | Recruit', roleId: '1174000004139069570' },
  ],

  MEMBER_LIST: {
    MESSAGE_ID: '1493830790981615697', // Laat leeg totdat je de eerste keer /ledenlijst gebruikt
  },
};

