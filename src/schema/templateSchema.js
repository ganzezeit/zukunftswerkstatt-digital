// templateSchema.js — Complete schema for Zukunftswerkstatt workshop templates
// Extracted from days.js + all component consumers (StepViewer, MultiStepViewer, ActivityScreen, etc.)

// ─── STEP TYPES ─────────────────────────────────────────────────────────────────
// Top-level step types as rendered by StepViewer.jsx

export const STEP_TYPES = {
  activity: {
    label: 'Aktivität',
    description: 'Text-based activity with optional timer, bullets, image, groups, and board',
    component: 'ActivityScreen',
    required: ['title'],
    optional: ['text', 'bullets', 'image', 'layout', 'groups', 'boardConfig'],
    contentSchema: {
      title:       { type: 'string',   description: 'Activity heading' },
      text:        { type: 'string',   description: 'Body text (supports glossary tooltips)' },
      bullets:     { type: 'array',    items: 'string', description: 'Bullet point list' },
      image:       { type: 'string',   description: 'URL to an image asset' },
      layout:      { type: 'string',   enum: ['group-cards'], description: 'Layout variant' },
      groups:      { type: 'array',    items: 'group', description: 'Group cards (requires layout: "group-cards")' },
      boardConfig: { type: 'object',   schema: 'boardConfig', description: 'Collaborative board configuration' },
    },
  },

  slides: {
    label: 'Präsentation',
    description: 'PDF slideshow rendered via pdfjs-dist',
    component: 'SlideViewer',
    required: ['slides', 'slideCount'],
    optional: [],
    contentSchema: {
      slides:     { type: 'string', description: 'PDF filename (e.g. "tag1-rechte.pdf")' },
      slideCount: { type: 'number', description: 'Total number of pages in the PDF' },
    },
  },

  video: {
    label: 'Video',
    description: 'HTML5 video player with optional start/end time',
    component: 'VideoPlayer',
    required: ['src'],
    optional: ['startTime', 'endTime'],
    contentSchema: {
      src:       { type: 'string', description: 'Path to MP4 file (e.g. "/videos/kinderrechte.mp4")' },
      startTime: { type: 'number', description: 'Seconds to start at (default: 0)' },
      endTime:   { type: 'number', description: 'Seconds to stop at (null = play to end)', nullable: true },
    },
  },

  'multi-step': {
    label: 'Multi-Step',
    description: 'Container for multiple sub-steps with progress dots',
    component: 'MultiStepViewer',
    required: ['subSteps'],
    optional: [],
    contentSchema: {
      subSteps: { type: 'array', items: 'subStep', description: 'Array of sub-step objects' },
    },
  },

  einzelquiz: {
    label: 'Einzelquiz',
    description: 'Individual quiz with QR code (Vortest/Nachtest)',
    component: 'EinzelquizStepCard',
    required: ['quizType'],
    optional: ['description'],
    contentSchema: {
      quizType:    { type: 'string', enum: ['vortest', 'nachtest'], description: 'Quiz variant' },
      description: { type: 'string', description: 'Description text shown on the card' },
    },
  },

  kahoot: {
    label: 'Kahoot',
    description: 'External Kahoot quiz link (opens in new tab)',
    component: 'ExternalLink',
    required: ['url'],
    optional: ['label', 'description'],
    contentSchema: {
      url:         { type: 'string', description: 'Full Kahoot URL' },
      label:       { type: 'string', description: 'Button text (default: "Öffnen")' },
      description: { type: 'string', description: 'Optional description text' },
    },
  },

  meet: {
    label: 'Video-Call',
    description: 'External video call link (opens in new tab)',
    component: 'ExternalLink',
    required: ['url'],
    optional: ['label', 'description'],
    contentSchema: {
      url:         { type: 'string', description: 'Google Meet or video call URL' },
      label:       { type: 'string', description: 'Button text (default: "Öffnen")' },
      description: { type: 'string', description: 'Optional description text' },
    },
  },

  videochat: {
    label: 'Chat & Übersetzer',
    description: 'Jitsi video chat with real-time translation between languages',
    component: 'ChatManager',
    required: [],
    optional: ['roomName', 'enableTranslation', 'supportedLanguages', 'description'],
    contentSchema: {
      roomName:            { type: 'string', description: 'Pre-set room name (auto-generated if empty)' },
      enableTranslation:   { type: 'boolean', description: 'Enable real-time translation (default: true)' },
      supportedLanguages:  { type: 'array', items: 'string', description: 'Supported languages (e.g. ["de", "en", "tr", "fr", "sw"])' },
      description:         { type: 'string', description: 'Description shown on the step card' },
    },
  },

  'art-studio': {
    label: 'KI-Kunststudio',
    description: 'AI creative studio for generating images, videos, and music',
    component: 'ArtStudio',
    required: [],
    optional: ['enabledModes', 'allowedStyles', 'promptTemplate', 'contentFilter', 'galleryEnabled', 'multiDevice', 'maxGenerations'],
    contentSchema: {
      enabledModes:     { type: 'array',   items: 'string', description: 'Allowed creation modes: "image", "video", "music" (default: all)' },
      allowedStyles:    { type: 'array',   items: 'string', description: 'Allowed image styles (default: all 10 styles)' },
      promptTemplate:   { type: 'string',  description: 'Starter prompt hint shown to students' },
      contentFilter:    { type: 'boolean', description: 'Enable content safety filter (default: true)' },
      galleryEnabled:   { type: 'boolean', description: 'Show shared gallery (default: true)' },
      multiDevice:      { type: 'boolean', description: 'Allow QR code for student devices (default: true)' },
      maxGenerations:   { type: 'number',  description: 'Max generations per student (default: 3)' },
    },
  },
};

// ─── SUB-STEP TYPES ─────────────────────────────────────────────────────────────
// SubTypes used inside multi-step content.subSteps[]

export const SUB_STEP_TYPES = {
  text: {
    label: 'Text',
    description: 'Text card with optional board, bullets, and notes',
    component: 'MultiStepViewer (default)',
    required: ['title'],
    optional: ['text', 'bullets', 'note', 'boardEnabled', 'taskId', 'boardConfig'],
    fields: {
      title:        { type: 'string',  description: 'Sub-step heading' },
      text:         { type: 'string',  description: 'Body text (supports glossary tooltips)' },
      bullets:      { type: 'array',   items: 'string', description: 'Bullet point list' },
      note:         { type: 'string',  description: 'Italicized note with pin emoji' },
      boardEnabled: { type: 'boolean', description: 'Show "Klassen-Board öffnen" button' },
      taskId:       { type: 'string',  description: 'Task ID for board creation (used with boardEnabled)' },
      boardConfig:  { type: 'object',  schema: 'boardConfig', description: 'Board configuration' },
    },
  },

  slides: {
    label: 'Präsentation',
    description: 'PDF slideshow inside multi-step (fullscreen)',
    component: 'SlideViewer',
    required: ['title'],
    optional: ['content'],
    fields: {
      title:   { type: 'string', description: 'Sub-step heading' },
      content: {
        type: 'object',
        description: 'Slide content',
        fields: {
          slides:     { type: 'string', description: 'PDF filename' },
          slideCount: { type: 'number', description: 'Total pages in PDF' },
        },
      },
    },
  },

  video: {
    label: 'Video',
    description: 'Video player inside multi-step (fullscreen)',
    component: 'VideoPlayer',
    required: ['title'],
    optional: ['content'],
    fields: {
      title:   { type: 'string', description: 'Sub-step heading' },
      content: {
        type: 'object',
        description: 'Video content',
        fields: {
          src:       { type: 'string', description: 'Path to MP4 file' },
          startTime: { type: 'number', description: 'Start time in seconds' },
          endTime:   { type: 'number', description: 'End time in seconds', nullable: true },
        },
      },
    },
  },

  kahoot: {
    label: 'Kahoot',
    description: 'External Kahoot quiz link inside multi-step',
    component: 'KahootSubStep',
    required: ['title'],
    optional: ['content'],
    fields: {
      title:   { type: 'string', description: 'Sub-step heading' },
      content: {
        type: 'object',
        description: 'Kahoot content',
        fields: {
          url:   { type: 'string', description: 'Full Kahoot URL' },
          label: { type: 'string', description: 'Button text' },
        },
      },
    },
  },

  lernkarten: {
    label: 'Lernkarten',
    description: 'Memory matching game (uses global lernkarten data)',
    component: 'LernkartenGame',
    required: ['title'],
    optional: ['text'],
    fields: {
      title: { type: 'string', description: 'Sub-step heading' },
      text:  { type: 'string', description: 'Introductory text' },
    },
  },

  einzelquiz: {
    label: 'Einzelquiz',
    description: 'Individual quiz step inside multi-step',
    component: 'EinzelquizStepCard',
    required: ['title'],
    optional: ['quizType'],
    fields: {
      title:    { type: 'string', description: 'Sub-step heading' },
      quizType: { type: 'string', enum: ['vortest', 'nachtest'], description: 'Quiz variant' },
    },
  },

  landeskunde: {
    label: 'Landeskunde',
    description: 'Country info slides + quiz (uses global landeskunde data)',
    component: 'LandeskundeViewer',
    required: ['title'],
    optional: ['text'],
    fields: {
      title: { type: 'string', description: 'Sub-step heading' },
      text:  { type: 'string', description: 'Introductory text' },
    },
  },

  'matching-game': {
    label: 'Zuordnungsspiel',
    description: 'Term-definition matching game with custom or default pairs',
    component: 'MatchingGameSubStep',
    required: ['title'],
    optional: ['pairs'],
    fields: {
      title: { type: 'string', description: 'Sub-step heading' },
      pairs: {
        type: 'array',
        description: 'Term-definition pairs (default pairs used if empty)',
        items: {
          term:       { type: 'string', description: 'Term to match' },
          definition: { type: 'string', description: 'Definition to match' },
        },
      },
    },
  },

  quiz: {
    label: 'Quiz (Legacy)',
    description: 'Landeskunde quiz mode (legacy, uses LandeskundeViewer in quiz mode)',
    component: 'LandeskundeViewer',
    required: ['title'],
    optional: [],
    fields: {
      title: { type: 'string', description: 'Sub-step heading' },
    },
  },
};

// ─── BOARD CONFIG SCHEMA ────────────────────────────────────────────────────────

export const BOARD_CONFIG_SCHEMA = {
  description: 'Configuration for a collaborative classroom board',
  fields: {
    taskId:          { type: 'string', description: 'Creates a new board with this task ID', conflictsWith: 'referenceTaskId' },
    referenceTaskId: { type: 'string', description: 'References an existing board by task ID', conflictsWith: 'taskId' },
    title:           { type: 'string', description: 'Board display title' },
    columns:         { type: 'array',  items: 'string', description: 'Column headers (default: standard 4 columns)' },
    mode:            { type: 'string', enum: ['gallery'], description: '"gallery" for image gallery view, undefined for columns' },
    buttonLabel:     { type: 'string', description: 'Button text (default: "Board öffnen")' },
  },
};

// ─── GROUP SCHEMA ───────────────────────────────────────────────────────────────

export const GROUP_SCHEMA = {
  description: 'Group card for activity layout: "group-cards"',
  fields: {
    name:    { type: 'string', required: true,  description: 'Group name/title' },
    icon:    { type: 'string', required: false, description: 'Emoji icon' },
    members: { type: 'array',  items: 'string', required: false, description: 'List of member names' },
    task:    { type: 'string', required: false, description: 'Task description for this group' },
  },
};

// ─── DAY INTRO SCHEMA ───────────────────────────────────────────────────────────

export const DAY_INTRO_SCHEMA = {
  description: 'Optional intro screen shown before day starts (Tag 2+)',
  fields: {
    recap: {
      type: 'object',
      description: 'Recap section',
      fields: {
        title: { type: 'string', description: 'Recap heading' },
        text:  { type: 'string', description: 'Recap body text' },
      },
    },
    energizer: {
      type: 'object',
      description: 'Energizer activity',
      fields: {
        title:      { type: 'string',  description: 'Energizer heading' },
        text:       { type: 'string',  description: 'Energizer intro text' },
        useRandom:  { type: 'boolean', description: 'Pick random energizer from global ENERGIZERS' },
        statements: { type: 'array', items: 'string', description: 'Statements for "Ich stimme zu" energizer' },
      },
    },
  },
};

// ─── DAY SCHEMA ─────────────────────────────────────────────────────────────────

export const DAY_SCHEMA = {
  description: 'A single day in the workshop',
  required: ['id', 'name', 'sub', 'emoji', 'color', 'steps'],
  optional: ['iconImage', 'dayIntro'],
  fields: {
    id:        { type: 'number', description: 'Day number (1-5)' },
    name:      { type: 'string', description: 'Display name (e.g. "Tag 1")' },
    sub:       { type: 'string', description: 'Day subtitle (e.g. "Kinderrechte entdecken")' },
    emoji:     { type: 'string', description: 'Day emoji icon' },
    color:     { type: 'string', description: 'Hex color for day accent (e.g. "#FF6B35")' },
    iconImage: { type: 'string', description: 'Path to day icon image' },
    dayIntro:  { type: 'object', schema: 'dayIntro', description: 'Intro screen config (Tag 2+)' },
    steps:     { type: 'array',  items: 'step', description: 'Array of step objects' },
  },
};

// ─── STEP SCHEMA ────────────────────────────────────────────────────────────────

export const STEP_SCHEMA = {
  description: 'A single step within a day',
  required: ['id', 'title', 'icon', 'type', 'content'],
  optional: ['energyCost', 'desc'],
  fields: {
    id:         { type: 'string', description: 'Unique step ID (e.g. "t1-1")' },
    title:      { type: 'string', description: 'Step title shown in timeline' },
    icon:       { type: 'string', description: 'Emoji icon for timeline display' },
    type:       { type: 'string', enum: Object.keys(STEP_TYPES), description: 'Step type' },
    energyCost: { type: 'number', description: 'Energy consumed (default: 5, triggers timer if >= 10)' },
    desc:       { type: 'string', description: 'Optional description shown in day timeline' },
    content:    { type: 'object', description: 'Type-specific content (see STEP_TYPES)' },
  },
};

// ─── TEMPLATE METADATA ──────────────────────────────────────────────────────────

export const TEMPLATE_METADATA_SCHEMA = {
  description: 'Workshop template metadata',
  required: ['id', 'title', 'version'],
  optional: ['description', 'duration', 'targetAge', 'languages', 'sdgs', 'tags', 'createdBy', 'createdAt', 'updatedAt'],
  fields: {
    id:          { type: 'string', description: 'Unique template identifier (UUID or slug)' },
    title:       { type: 'string', description: 'Template display title' },
    description: { type: 'string', description: 'Template description' },
    duration:    { type: 'number', description: 'Duration in days (e.g. 5)' },
    targetAge:   { type: 'string', description: 'Target age range (e.g. "9-12")' },
    languages:   { type: 'array',  items: 'string', description: 'Supported languages (e.g. ["de", "en"])' },
    sdgs:        { type: 'array',  items: 'number', description: 'Related UN SDG numbers (e.g. [4, 10, 16])' },
    tags:        { type: 'array',  items: 'string', description: 'Searchable tags' },
    createdBy:   { type: 'string', description: 'Author name or ID' },
    createdAt:   { type: 'string', description: 'ISO date string' },
    updatedAt:   { type: 'string', description: 'ISO date string' },
    version:     { type: 'string', description: 'Semver version (e.g. "1.0.0")' },
  },
};

// ─── FULL TEMPLATE SCHEMA ───────────────────────────────────────────────────────

export const TEMPLATE_SCHEMA = {
  description: 'Complete workshop template: metadata + days',
  required: ['id', 'title', 'version', 'days'],
  fields: {
    ...TEMPLATE_METADATA_SCHEMA.fields,
    days: { type: 'array', items: 'day', description: 'Array of day objects (1-5)' },
  },
};

// ─── MISSION TYPE CONFIG (for Creator UI) ───────────────────────────────────────
// Defines which UI fields the Workshop Creator should show for each step/subType

export const MISSION_TYPE_CONFIG = {
  // Top-level step types
  steps: {
    activity: {
      label: 'Aktivität',
      icon: '\u{1F4DD}',
      color: '#FF6B35',
      uiFields: [
        { key: 'content.title', label: 'Titel', type: 'text', required: true },
        { key: 'content.text', label: 'Beschreibung', type: 'textarea', required: false },
        { key: 'content.bullets', label: 'Aufzählung', type: 'string-list', required: false },
        { key: 'content.image', label: 'Bild-URL', type: 'file', accept: 'image/*', required: false },
        { key: 'content.layout', label: 'Layout', type: 'select', options: [{ value: '', label: 'Standard' }, { value: 'group-cards', label: 'Gruppen-Karten' }], required: false },
        { key: 'content.groups', label: 'Gruppen', type: 'group-list', showWhen: { field: 'content.layout', value: 'group-cards' }, required: false },
        { key: 'content.boardConfig', label: 'Board', type: 'board-config', required: false },
      ],
    },
    slides: {
      label: 'Präsentation',
      icon: '\u{1F4CA}',
      color: '#00B4D8',
      uiFields: [
        { key: 'content.slides', label: 'PDF-Datei', type: 'file', accept: '.pdf', required: true },
        { key: 'content.slideCount', label: 'Seitenanzahl', type: 'number', min: 1, required: true },
      ],
    },
    video: {
      label: 'Video',
      icon: '\u{1F4FA}',
      color: '#9B5DE5',
      uiFields: [
        { key: 'content.src', label: 'Video-Datei', type: 'file', accept: 'video/mp4', required: true },
        { key: 'content.startTime', label: 'Startzeit (Sek.)', type: 'number', min: 0, required: false },
        { key: 'content.endTime', label: 'Endzeit (Sek.)', type: 'number', min: 0, required: false },
      ],
    },
    'multi-step': {
      label: 'Multi-Step',
      icon: '\u{1F4CB}',
      color: '#00F5D4',
      uiFields: [
        { key: 'content.subSteps', label: 'Teilschritte', type: 'substep-list', required: true },
      ],
    },
    einzelquiz: {
      label: 'Einzelquiz',
      icon: '\u{1F4DD}',
      color: '#FFD166',
      uiFields: [
        { key: 'content.quizType', label: 'Quiz-Typ', type: 'select', options: [{ value: 'vortest', label: 'Vortest' }, { value: 'nachtest', label: 'Nachtest' }], required: true },
        { key: 'content.description', label: 'Beschreibung', type: 'textarea', required: false },
      ],
    },
    kahoot: {
      label: 'Kahoot',
      icon: '\u{1F3AF}',
      color: '#46178F',
      uiFields: [
        { key: 'content.url', label: 'Kahoot-URL', type: 'url', required: true },
        { key: 'content.label', label: 'Button-Text', type: 'text', required: false, placeholder: 'Quiz starten!' },
        { key: 'content.description', label: 'Beschreibung', type: 'textarea', required: false },
      ],
    },
    meet: {
      label: 'Video-Call',
      icon: '\u{1F4F9}',
      color: '#00897B',
      uiFields: [
        { key: 'content.url', label: 'Meeting-URL', type: 'url', required: true },
        { key: 'content.label', label: 'Button-Text', type: 'text', required: false, placeholder: 'Jetzt sprechen!' },
        { key: 'content.description', label: 'Beschreibung', type: 'textarea', required: false },
      ],
    },
    videochat: {
      label: 'Chat & Übersetzer',
      icon: '\u{1F4AC}',
      color: '#E91E63',
      uiFields: [
        { key: 'content.roomName', label: 'Raumname', type: 'text', required: false, placeholder: 'Leer = automatisch generiert' },
        { key: 'content.enableTranslation', label: 'Übersetzung aktivieren', type: 'checkbox', required: false },
        { key: 'content.supportedLanguages', label: 'Sprachen', type: 'string-list', required: false },
        { key: 'content.description', label: 'Beschreibung', type: 'textarea', required: false },
      ],
    },
    'art-studio': {
      label: 'KI-Kunststudio',
      icon: '\u{1F3A8}',
      color: '#FF5722',
      uiFields: [], // handled by custom ArtStudioConfig component
    },
  },

  // Sub-step types (inside multi-step)
  subSteps: {
    text: {
      label: 'Text',
      icon: '\u{1F4DD}',
      uiFields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'text', label: 'Beschreibung', type: 'textarea', required: false },
        { key: 'bullets', label: 'Aufzählung', type: 'string-list', required: false },
        { key: 'note', label: 'Hinweis', type: 'text', required: false },
        { key: 'boardConfig', label: 'Board', type: 'board-config', required: false },
      ],
    },
    slides: {
      label: 'Präsentation',
      icon: '\u{1F4CA}',
      uiFields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'content.slides', label: 'PDF-Datei', type: 'file', accept: '.pdf', required: true },
        { key: 'content.slideCount', label: 'Seitenanzahl', type: 'number', min: 1, required: true },
      ],
    },
    video: {
      label: 'Video',
      icon: '\u{1F4FA}',
      uiFields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'content.src', label: 'Video-Datei', type: 'file', accept: 'video/mp4', required: true },
        { key: 'content.startTime', label: 'Startzeit (Sek.)', type: 'number', min: 0, required: false },
        { key: 'content.endTime', label: 'Endzeit (Sek.)', type: 'number', min: 0, required: false },
      ],
    },
    kahoot: {
      label: 'Kahoot',
      icon: '\u{1F3AF}',
      uiFields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'content.url', label: 'Kahoot-URL', type: 'url', required: true },
        { key: 'content.label', label: 'Button-Text', type: 'text', required: false },
      ],
    },
    lernkarten: {
      label: 'Lernkarten',
      icon: '\u{1F0CF}',
      uiFields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'text', label: 'Einführungstext', type: 'textarea', required: false },
      ],
    },
    einzelquiz: {
      label: 'Einzelquiz',
      icon: '\u{1F4DD}',
      uiFields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'quizType', label: 'Quiz-Typ', type: 'select', options: [{ value: 'vortest', label: 'Vortest' }, { value: 'nachtest', label: 'Nachtest' }], required: false },
      ],
    },
    landeskunde: {
      label: 'Landeskunde',
      icon: '\u{1F30D}',
      uiFields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'text', label: 'Einführungstext', type: 'textarea', required: false },
      ],
    },
    'matching-game': {
      label: 'Zuordnungsspiel',
      icon: '\u{1F500}',
      uiFields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
        { key: 'pairs', label: 'Paare', type: 'pair-list', required: false, pairFields: { term: 'Begriff', definition: 'Definition' } },
      ],
    },
    quiz: {
      label: 'Quiz (Legacy)',
      icon: '\u2753',
      uiFields: [
        { key: 'title', label: 'Titel', type: 'text', required: true },
      ],
    },
  },

  // Board config UI fields
  boardConfig: {
    uiFields: [
      { key: 'taskId', label: 'Board-ID', type: 'text', required: false, group: 'new' },
      { key: 'referenceTaskId', label: 'Referenz-Board-ID', type: 'text', required: false, group: 'reference' },
      { key: 'title', label: 'Board-Titel', type: 'text', required: false },
      { key: 'columns', label: 'Spalten', type: 'string-list', required: false },
      { key: 'mode', label: 'Modus', type: 'select', options: [{ value: '', label: 'Spalten' }, { value: 'gallery', label: 'Galerie' }], required: false },
      { key: 'buttonLabel', label: 'Button-Text', type: 'text', required: false, placeholder: 'Board öffnen' },
    ],
  },

  // Day intro UI fields
  dayIntro: {
    uiFields: [
      { key: 'recap.title', label: 'Rückblick-Titel', type: 'text', required: false },
      { key: 'recap.text', label: 'Rückblick-Text', type: 'textarea', required: false },
      { key: 'energizer.title', label: 'Energizer-Titel', type: 'text', required: false },
      { key: 'energizer.text', label: 'Energizer-Text', type: 'textarea', required: false },
      { key: 'energizer.useRandom', label: 'Zufälliger Energizer', type: 'checkbox', required: false },
      { key: 'energizer.statements', label: 'Aussagen ("Ich stimme zu")', type: 'string-list', required: false },
    ],
  },
};
