// utils/componentHandlers.js
// Handlers voor buttons, select menus en modals.

const {
  ActionRowBuilder,
  ChannelType,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { COLORS, COMPONENT_IDS, IDS, TICKET_DELETE_DELAY_MS } = require('../config');
const {
  createTicketActionRow,
  createTicketEmbed,
  createTicketPanelRow,
  createTicketStatusEmbed,
} = require('./views');
const { canManageMember, canManageRole, getTicketStaffRoleIds, hasTicketStaffAccess } = require('./permissions');
const {
  buildTicketChannelName,
  buildTicketTopic,
  findOpenTicketChannel,
  getTicketCategoryLabel,
  parseTicketTopic,
  scheduleTicketDeletionAt,
} = require('./tickets');

async function handleWelcomeButton(interaction) {
  const memberRole = interaction.guild.roles.cache.get(IDS.MEMBER_ROLE_ID);
  if (!memberRole) {
    return interaction.reply({
      content: 'De ledenrol kon niet worden gevonden.',
      ephemeral: true,
    });
  }

  const botMember = interaction.guild.members.me;
  if (!canManageRole(botMember, memberRole) || !canManageMember(botMember, interaction.member, interaction.guild)) {
    return interaction.reply({
      content: 'Ik kan deze rol niet geven door permissies of rolpositie.',
      ephemeral: true,
    });
  }

  if (interaction.member.roles.cache.has(memberRole.id)) {
    return interaction.reply({
      content: 'Je hebt deze rol al.',
      ephemeral: true,
    });
  }

  await interaction.member.roles.add(memberRole, 'Gebruiker heeft akkoord gegeven op de regels.');

  return interaction.reply({
    content: 'Akkoord ontvangen. Je toegang is geactiveerd.',
    ephemeral: true,
  });
}

async function handleTicketSelect(interaction) {
  const category = interaction.values[0];

  const modal = new ModalBuilder()
    .setCustomId(`${COMPONENT_IDS.TICKET_MODAL_PREFIX}:${category}`)
    .setTitle(`Ticket openen • ${getTicketCategoryLabel(category)}`);

  const subjectInput = new TextInputBuilder()
    .setCustomId('subject')
    .setLabel('Onderwerp')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Bijvoorbeeld: Rangvraag of klacht over situatie')
    .setRequired(true)
    .setMaxLength(100);

  const detailsInput = new TextInputBuilder()
    .setCustomId('details')
    .setLabel('Vraag / uitleg')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Leg hier duidelijk uit waarvoor je ticket is.')
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(subjectInput),
    new ActionRowBuilder().addComponents(detailsInput)
  );

  await interaction.showModal(modal);
}

async function handleTicketModal(interaction, client) {
  const [, category] = interaction.customId.split(':');
  const subject = interaction.fields.getTextInputValue('subject');
  const details = interaction.fields.getTextInputValue('details');

  const ticketCategory = interaction.guild.channels.cache.get(IDS.TICKET_CATEGORY_ID);
  if (!ticketCategory) {
    return interaction.reply({
      content: 'De ticketcategorie is niet gevonden.',
      ephemeral: true,
    });
  }

  const existingTicket = findOpenTicketChannel(interaction.guild, interaction.user.id);
  if (existingTicket) {
    return interaction.reply({
      content: `Je hebt al een open ticket: ${existingTicket}`,
      ephemeral: true,
    });
  }

  const botMember = interaction.guild.members.me;
  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({
      content: 'Ik heb geen Manage Channels permissie.',
      ephemeral: true,
    });
  }

  const staffRoleIds = getTicketStaffRoleIds(interaction.guild);
  if (staffRoleIds.length === 0) {
    return interaction.reply({
      content: 'De staffrol voor tickets is niet goed ingesteld.',
      ephemeral: true,
    });
  }

  const permissionOverwrites = [
    {
      id: interaction.guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  for (const roleId of staffRoleIds) {
    permissionOverwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const channel = await interaction.guild.channels.create({
    name: buildTicketChannelName(interaction.user),
    type: ChannelType.GuildText,
    parent: IDS.TICKET_CATEGORY_ID,
    topic: buildTicketTopic({
      ownerId: interaction.user.id,
      category,
      state: 'open',
      deleteAt: 0,
    }),
    permissionOverwrites,
    reason: `Ticket aangemaakt door ${interaction.user.tag}`,
  });

  await channel.send({
    content: `${interaction.user}`,
    embeds: [
      createTicketEmbed({
        categoryLabel: getTicketCategoryLabel(category),
        subject,
        details,
        opener: interaction.user,
      }),
    ],
    components: [createTicketActionRow()],
  });

  await interaction.reply({
    content: `Je ticket is aangemaakt: ${channel}`,
    ephemeral: true,
  });
}

async function handleTicketAction(interaction, client) {
  if (!hasTicketStaffAccess(interaction.member, interaction.guild)) {
    return interaction.reply({
      content: 'Alleen staff kan tickets behandelen.',
      ephemeral: true,
    });
  }

  const metadata = parseTicketTopic(interaction.channel.topic || '');
  if (!metadata) {
    return interaction.reply({
      content: 'Dit kanaal is geen geldig ticketkanaal.',
      ephemeral: true,
    });
  }

  const [, action] = interaction.customId.split(':');

  if (action === 'close') {
    const deleteAt = Date.now() + 5000;

    await interaction.channel.setTopic(
      buildTicketTopic({
        ownerId: metadata.ownerId,
        category: metadata.category,
        state: 'closed',
        deleteAt,
      })
    );

    scheduleTicketDeletionAt(client, interaction.channel, deleteAt, 'Ticket handmatig gesloten.');

    return interaction.reply({
      embeds: [
        createTicketStatusEmbed(
          'Ticket gesloten',
          'Dit ticket wordt over 5 seconden verwijderd.',
          COLORS.warn
        ),
      ],
    });
  }

  if (metadata.state !== 'open') {
    return interaction.reply({
      content: 'Dit ticket is al verwerkt.',
      ephemeral: true,
    });
  }

const isResolve = action === 'resolve';
const newState = isResolve ? 'resolved' : 'rejected';
const deleteAt = Date.now() + TICKET_DELETE_DELAY_MS;

// 🔥 NIEUW: emoji in kanaalnaam
const prefix = isResolve ? '✅' : '❌';
const oldName = interaction.channel.name;

// verwijder oude emoji zodat het niet stapelt
const cleanName = oldName.replace(/^([✅❌]│?-?)/, '');

// zet nieuwe naam
await interaction.channel.setName(`${prefix}│${cleanName}`);

  await interaction.channel.setTopic(
    buildTicketTopic({
      ownerId: metadata.ownerId,
      category: metadata.category,
      state: newState,
      deleteAt,
    })
  );

  await interaction.message.edit({
    components: [createTicketActionRow({ finalized: true })],
  });

  scheduleTicketDeletionAt(
    client,
    interaction.channel,
    deleteAt,
    `Ticket ${isResolve ? 'afgehandeld' : 'afgewezen'} en daarna verwijderd.`
  );

  return interaction.reply({
    embeds: [
      createTicketStatusEmbed(
        isResolve ? 'Ticket afgehandeld' : 'Ticket afgewezen',
        isResolve
          ? 'Dit ticket is afgehandeld. Het kanaal wordt automatisch over 12 uur verwijderd.'
          : 'Dit ticket is afgewezen. Het kanaal wordt automatisch over 12 uur verwijderd.',
        isResolve ? COLORS.welcome : COLORS.ontslaan
      ),
    ],
  });
}

async function handleButtonInteraction(interaction, client) {
  if (interaction.customId === COMPONENT_IDS.WELCOME_ACCEPT_BUTTON) {
    return handleWelcomeButton(interaction);
  }

  if (interaction.customId.startsWith(`${COMPONENT_IDS.TICKET_ACTION_PREFIX}:`)) {
    return handleTicketAction(interaction, client);
  }
}

async function handleSelectMenuInteraction(interaction) {
  if (interaction.customId === COMPONENT_IDS.TICKET_SELECT_MENU) {
    return handleTicketSelect(interaction);
  }
}

async function handleModalInteraction(interaction, client) {
  if (interaction.customId.startsWith(`${COMPONENT_IDS.TICKET_MODAL_PREFIX}:`)) {
    return handleTicketModal(interaction, client);
  }
}

module.exports = {
  handleButtonInteraction,
  handleModalInteraction,
  handleSelectMenuInteraction,
};
