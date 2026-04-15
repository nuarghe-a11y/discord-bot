// utils/views.js
// Alle nette embeds en componenten op 1 plek.

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { BRAND_NAME, FOOTER_TEXT, LOGO_URL, COLORS, COMPONENT_IDS, TICKET_CATEGORIES } = require('../config');

function createBaseEmbed({ title, description, color, fields = [] }) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  if (LOGO_URL) {
    embed.setThumbnail(LOGO_URL);
  }

  return embed;
}

function createWelcomeEmbed(member) {
  const intro = member
    ? `${member}, welkom bij **${BRAND_NAME}**.`
    : `Welkom bij **${BRAND_NAME}**.`;

  return createBaseEmbed({
    title: `Welkom bij ${BRAND_NAME}`,
    color: COLORS.welcome,
    description: [
      intro,
      '',
      'Voordat je volledige toegang krijgt tot de server, vragen we je om akkoord te gaan met onze huisregels en verwachtingen.',
      '',
      'Binnen deze community staan **respect**, **loyaliteit** en **normaal gedrag** centraal.',
      '',
      '**Wat wij van ieder lid verwachten:**',
      '• Behandel iedereen met respect',
      '• Geen provocerend, toxisch of storend gedrag',
      '• Geen spam of onnodige onrust',
      '• Luister naar staff en volg de serverregels',
      '• Draag positief bij aan de community',
      '',
      'Door op de knop hieronder te drukken, bevestig je dat je akkoord gaat met de regels en toegang wilt krijgen tot de server.',
    ].join('\n'),
  });
}

function createWelcomeRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(COMPONENT_IDS.WELCOME_ACCEPT_BUTTON)
      .setLabel('Ik ga akkoord')
      .setStyle(ButtonStyle.Success)
  );
}

function createAnnouncementEmbed(title, text) {
  return createBaseEmbed({
    title,
    description: text,
    color: COLORS.info,
  });
}

function createTicketPanelEmbed() {
  return createBaseEmbed({
    title: 'Ticket Centrum',
    color: COLORS.ticket,
    description: [
      'Heb je hulp nodig, een klacht of een andere vraag?',
      'Kies hieronder de juiste categorie en vul daarna het formulier in.',
      '',
      'Ons staffteam pakt je ticket zo snel mogelijk op.',
    ].join('\n'),
  });
}

function createTicketPanelRow() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(COMPONENT_IDS.TICKET_SELECT_MENU)
      .setPlaceholder('Kies een ticket categorie')
      .addOptions(
        TICKET_CATEGORIES.map((category) => ({
          label: category.label,
          value: category.value,
          description: category.description,
        }))
      )
  );
}

function createTicketEmbed({ categoryLabel, subject, details, opener }) {
  return createBaseEmbed({
    title: 'Nieuw Ticket',
    color: COLORS.ticket,
    description: 'Een nieuw ticket is geopend en klaar voor behandeling.',
    fields: [
      { name: 'Categorie', value: categoryLabel, inline: true },
      { name: 'Onderwerp', value: subject, inline: true },
      { name: 'Geopend door', value: `${opener}`, inline: false },
      { name: 'Uitleg', value: details, inline: false },
    ],
  });
}

function createTicketActionRow({ finalized = false } = {}) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${COMPONENT_IDS.TICKET_ACTION_PREFIX}:resolve`)
      .setLabel('Afhandelen')
      .setStyle(ButtonStyle.Success)
      .setDisabled(finalized),
    new ButtonBuilder()
      .setCustomId(`${COMPONENT_IDS.TICKET_ACTION_PREFIX}:reject`)
      .setLabel('Afwijzen')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(finalized),
    new ButtonBuilder()
      .setCustomId(`${COMPONENT_IDS.TICKET_ACTION_PREFIX}:close`)
      .setLabel('Sluiten')
      .setStyle(ButtonStyle.Secondary)
  );
}

function createTicketStatusEmbed(title, description, color) {
  return createBaseEmbed({
    title,
    description,
    color,
  });
}

function createLogEmbed({ title, emoji, color, fields }) {
  return createBaseEmbed({
    title: `${emoji} ${title}`,
    color,
    description: 'Actie succesvol verwerkt.',
    fields,
  });
}

module.exports = {
  createAnnouncementEmbed,
  createBaseEmbed,
  createLogEmbed,
  createTicketActionRow,
  createTicketEmbed,
  createTicketPanelEmbed,
  createTicketPanelRow,
  createTicketStatusEmbed,
  createWelcomeEmbed,
  createWelcomeRow,
};
