// validateTemplate.js — Plain JS validators for workshop templates
// No external dependencies. Returns { valid: boolean, errors: string[] }

import { STEP_TYPES, SUB_STEP_TYPES } from './templateSchema.js';

// ─── HELPERS ────────────────────────────────────────────────────────────────────

function isString(v) { return typeof v === 'string'; }
function isNumber(v) { return typeof v === 'number' && !isNaN(v); }
function isBoolean(v) { return typeof v === 'boolean'; }
function isArray(v) { return Array.isArray(v); }
function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function pushIf(errors, condition, msg) {
  if (condition) errors.push(msg);
}

const VALID_STEP_TYPES = Object.keys(STEP_TYPES);
const VALID_SUB_STEP_TYPES = Object.keys(SUB_STEP_TYPES);
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const STEP_ID_PATTERN = /^t\d+-\d+$/;

// ─── BOARD CONFIG VALIDATOR ─────────────────────────────────────────────────────

function validateBoardConfig(bc, path, errors) {
  if (!isObject(bc)) {
    errors.push(`${path}: boardConfig must be an object`);
    return;
  }
  if (bc.taskId && bc.referenceTaskId) {
    errors.push(`${path}: boardConfig cannot have both taskId and referenceTaskId`);
  }
  if (!bc.taskId && !bc.referenceTaskId) {
    errors.push(`${path}: boardConfig needs either taskId or referenceTaskId`);
  }
  if (bc.taskId && !isString(bc.taskId)) {
    errors.push(`${path}.taskId: must be a string`);
  }
  if (bc.referenceTaskId && !isString(bc.referenceTaskId)) {
    errors.push(`${path}.referenceTaskId: must be a string`);
  }
  if (bc.title !== undefined && !isString(bc.title)) {
    errors.push(`${path}.title: must be a string`);
  }
  if (bc.columns !== undefined) {
    if (!isArray(bc.columns)) {
      errors.push(`${path}.columns: must be an array of strings`);
    } else if (bc.columns.some(c => !isString(c))) {
      errors.push(`${path}.columns: all items must be strings`);
    }
  }
  if (bc.mode !== undefined && bc.mode !== 'gallery') {
    errors.push(`${path}.mode: must be "gallery" or undefined`);
  }
  if (bc.buttonLabel !== undefined && !isString(bc.buttonLabel)) {
    errors.push(`${path}.buttonLabel: must be a string`);
  }
}

// ─── SUB-STEP VALIDATOR ─────────────────────────────────────────────────────────

function validateSubStep(sub, index, stepPath, errors) {
  const path = `${stepPath}.content.subSteps[${index}]`;

  if (!isObject(sub)) {
    errors.push(`${path}: must be an object`);
    return;
  }

  // title is required on all sub-steps
  pushIf(errors, !sub.title || !isString(sub.title), `${path}.title: required string`);

  const subType = sub.subType || 'text';
  if (!VALID_SUB_STEP_TYPES.includes(subType)) {
    errors.push(`${path}.subType: "${subType}" is not a valid subType. Valid: ${VALID_SUB_STEP_TYPES.join(', ')}`);
    return;
  }

  // Type-specific validation
  switch (subType) {
    case 'text': {
      if (sub.text !== undefined) pushIf(errors, !isString(sub.text), `${path}.text: must be a string`);
      if (sub.bullets !== undefined) {
        pushIf(errors, !isArray(sub.bullets), `${path}.bullets: must be an array`);
        if (isArray(sub.bullets)) sub.bullets.forEach((b, i) => pushIf(errors, !isString(b), `${path}.bullets[${i}]: must be a string`));
      }
      if (sub.note !== undefined) pushIf(errors, !isString(sub.note), `${path}.note: must be a string`);
      if (sub.boardEnabled !== undefined) pushIf(errors, !isBoolean(sub.boardEnabled), `${path}.boardEnabled: must be a boolean`);
      if (sub.boardEnabled && !sub.taskId && !sub.boardConfig) {
        errors.push(`${path}: boardEnabled requires taskId or boardConfig`);
      }
      if (sub.boardConfig) validateBoardConfig(sub.boardConfig, `${path}.boardConfig`, errors);
      break;
    }
    case 'slides': {
      const c = sub.content;
      if (c) {
        pushIf(errors, !isObject(c), `${path}.content: must be an object`);
        if (isObject(c)) {
          pushIf(errors, !c.slides || !isString(c.slides), `${path}.content.slides: required string`);
          pushIf(errors, !c.slideCount || !isNumber(c.slideCount) || c.slideCount < 1, `${path}.content.slideCount: required positive number`);
        }
      }
      break;
    }
    case 'video': {
      const c = sub.content;
      if (c) {
        pushIf(errors, !isObject(c), `${path}.content: must be an object`);
        if (isObject(c)) {
          pushIf(errors, !c.src || !isString(c.src), `${path}.content.src: required string`);
          if (c.startTime !== undefined) pushIf(errors, !isNumber(c.startTime), `${path}.content.startTime: must be a number`);
          if (c.endTime !== undefined && c.endTime !== null) pushIf(errors, !isNumber(c.endTime), `${path}.content.endTime: must be a number or null`);
        }
      }
      break;
    }
    case 'kahoot': {
      const c = sub.content;
      if (c) {
        pushIf(errors, !isObject(c), `${path}.content: must be an object`);
        if (isObject(c)) {
          pushIf(errors, !c.url || !isString(c.url), `${path}.content.url: required string`);
          if (c.label !== undefined) pushIf(errors, !isString(c.label), `${path}.content.label: must be a string`);
        }
      }
      break;
    }
    case 'lernkarten':
    case 'landeskunde':
    case 'quiz': {
      // Only title needed (uses global data)
      if (sub.text !== undefined) pushIf(errors, !isString(sub.text), `${path}.text: must be a string`);
      break;
    }
    case 'einzelquiz': {
      if (sub.quizType !== undefined) {
        pushIf(errors, !['vortest', 'nachtest'].includes(sub.quizType), `${path}.quizType: must be "vortest" or "nachtest"`);
      }
      break;
    }
    case 'matching-game': {
      if (sub.pairs !== undefined) {
        pushIf(errors, !isArray(sub.pairs), `${path}.pairs: must be an array`);
        if (isArray(sub.pairs)) {
          sub.pairs.forEach((p, i) => {
            const pp = `${path}.pairs[${i}]`;
            pushIf(errors, !isObject(p), `${pp}: must be an object`);
            if (isObject(p)) {
              pushIf(errors, !p.term || !isString(p.term), `${pp}.term: required string`);
              pushIf(errors, !p.definition || !isString(p.definition), `${pp}.definition: required string`);
            }
          });
        }
      }
      break;
    }
  }
}

// ─── STEP CONTENT VALIDATOR ─────────────────────────────────────────────────────

function validateStepContent(step, path, errors) {
  const content = step.content;
  if (!isObject(content)) {
    // Allow empty content object for draft saves
    return;
  }

  const type = step.type;
  switch (type) {
    case 'activity': {
      if (content.title !== undefined) pushIf(errors, !isString(content.title), `${path}.content.title: must be a string`);
      if (content.text !== undefined) pushIf(errors, !isString(content.text), `${path}.content.text: must be a string`);
      if (content.bullets !== undefined) {
        pushIf(errors, !isArray(content.bullets), `${path}.content.bullets: must be an array`);
        if (isArray(content.bullets)) content.bullets.forEach((b, i) => pushIf(errors, !isString(b), `${path}.content.bullets[${i}]: must be a string`));
      }
      if (content.image !== undefined) pushIf(errors, !isString(content.image), `${path}.content.image: must be a string`);
      if (content.layout !== undefined) {
        pushIf(errors, content.layout !== 'group-cards', `${path}.content.layout: must be "group-cards" or undefined`);
      }
      if (content.layout === 'group-cards' && content.groups !== undefined) {
        pushIf(errors, !isArray(content.groups), `${path}.content.groups: must be an array`);
        if (isArray(content.groups)) {
          content.groups.forEach((g, i) => {
            const gp = `${path}.content.groups[${i}]`;
            pushIf(errors, !isObject(g), `${gp}: must be an object`);
            if (isObject(g)) {
              if (g.name !== undefined) pushIf(errors, !isString(g.name), `${gp}.name: must be a string`);
              if (g.icon !== undefined) pushIf(errors, !isString(g.icon), `${gp}.icon: must be a string`);
              if (g.task !== undefined) pushIf(errors, !isString(g.task), `${gp}.task: must be a string`);
              if (g.members !== undefined) {
                pushIf(errors, !isArray(g.members), `${gp}.members: must be an array`);
                if (isArray(g.members)) g.members.forEach((m, j) => pushIf(errors, !isString(m), `${gp}.members[${j}]: must be a string`));
              }
            }
          });
        }
      }
      if (content.boardConfig) validateBoardConfig(content.boardConfig, `${path}.content.boardConfig`, errors);
      break;
    }
    case 'slides': {
      if (content.slides !== undefined) pushIf(errors, !isString(content.slides), `${path}.content.slides: must be a string`);
      if (content.slideCount !== undefined) pushIf(errors, !isNumber(content.slideCount) || content.slideCount < 1, `${path}.content.slideCount: must be a positive number`);
      if (content.autoAdvance !== undefined) pushIf(errors, !isBoolean(content.autoAdvance), `${path}.content.autoAdvance: must be a boolean`);
      if (content.timerPerSlide !== undefined) pushIf(errors, !isNumber(content.timerPerSlide) || content.timerPerSlide < 1, `${path}.content.timerPerSlide: must be a positive number`);
      if (content.description !== undefined) pushIf(errors, !isString(content.description), `${path}.content.description: must be a string`);
      break;
    }
    case 'video': {
      if (content.src !== undefined) pushIf(errors, !isString(content.src), `${path}.content.src: must be a string`);
      if (content.url !== undefined) pushIf(errors, !isString(content.url), `${path}.content.url: must be a string`);
      if (content.startTime !== undefined) pushIf(errors, !isNumber(content.startTime), `${path}.content.startTime: must be a number`);
      if (content.endTime !== undefined && content.endTime !== null) pushIf(errors, !isNumber(content.endTime), `${path}.content.endTime: must be a number or null`);
      if (content.description !== undefined) pushIf(errors, !isString(content.description), `${path}.content.description: must be a string`);
      break;
    }
    case 'multi-step': {
      if (content.subSteps !== undefined) {
        pushIf(errors, !isArray(content.subSteps), `${path}.content.subSteps: must be an array`);
        if (isArray(content.subSteps)) {
          content.subSteps.forEach((sub, i) => validateSubStep(sub, i, path, errors));
        }
      }
      break;
    }
    case 'einzelquiz': {
      if (content.quizType !== undefined) pushIf(errors, !['vortest', 'nachtest'].includes(content.quizType), `${path}.content.quizType: must be "vortest" or "nachtest"`);
      if (content.description !== undefined) pushIf(errors, !isString(content.description), `${path}.content.description: must be a string`);
      break;
    }
    case 'kahoot':
    case 'meet': {
      if (content.url !== undefined) pushIf(errors, !isString(content.url), `${path}.content.url: must be a string`);
      if (content.label !== undefined) pushIf(errors, !isString(content.label), `${path}.content.label: must be a string`);
      if (content.description !== undefined) pushIf(errors, !isString(content.description), `${path}.content.description: must be a string`);
      break;
    }
    case 'videochat': {
      if (content.roomName !== undefined) pushIf(errors, !isString(content.roomName), `${path}.content.roomName: must be a string`);
      if (content.enableTranslation !== undefined) pushIf(errors, !isBoolean(content.enableTranslation), `${path}.content.enableTranslation: must be a boolean`);
      if (content.description !== undefined) pushIf(errors, !isString(content.description), `${path}.content.description: must be a string`);
      if (content.supportedLanguages !== undefined) {
        pushIf(errors, !isArray(content.supportedLanguages), `${path}.content.supportedLanguages: must be an array`);
        if (isArray(content.supportedLanguages)) {
          content.supportedLanguages.forEach((l, i) => pushIf(errors, !isString(l), `${path}.content.supportedLanguages[${i}]: must be a string`));
        }
      }
      break;
    }
    case 'art-studio': {
      if (content.enabledModes !== undefined) {
        pushIf(errors, !isArray(content.enabledModes), `${path}.content.enabledModes: must be an array`);
        if (isArray(content.enabledModes)) {
          content.enabledModes.forEach((m, i) => pushIf(errors, !['image', 'video', 'music'].includes(m), `${path}.content.enabledModes[${i}]: must be "image", "video", or "music"`));
        }
      }
      if (content.allowedStyles !== undefined) {
        pushIf(errors, !isArray(content.allowedStyles), `${path}.content.allowedStyles: must be an array`);
        if (isArray(content.allowedStyles)) {
          content.allowedStyles.forEach((s, i) => pushIf(errors, !isString(s), `${path}.content.allowedStyles[${i}]: must be a string`));
        }
      }
      if (content.promptTemplate !== undefined) pushIf(errors, !isString(content.promptTemplate), `${path}.content.promptTemplate: must be a string`);
      if (content.contentFilter !== undefined) pushIf(errors, !isBoolean(content.contentFilter), `${path}.content.contentFilter: must be a boolean`);
      if (content.galleryEnabled !== undefined) pushIf(errors, !isBoolean(content.galleryEnabled), `${path}.content.galleryEnabled: must be a boolean`);
      if (content.multiDevice !== undefined) pushIf(errors, !isBoolean(content.multiDevice), `${path}.content.multiDevice: must be a boolean`);
      if (content.maxGenerations !== undefined) pushIf(errors, !isNumber(content.maxGenerations) || content.maxGenerations < 1, `${path}.content.maxGenerations: must be a positive number`);
      break;
    }
  }
}

// ─── STEP VALIDATOR ─────────────────────────────────────────────────────────────

export function validateStep(step, path = 'step') {
  const errors = [];

  if (!isObject(step)) {
    errors.push(`${path}: must be an object`);
    return { valid: false, errors };
  }

  // Required fields
  pushIf(errors, !step.id || !isString(step.id), `${path}.id: required string`);
  pushIf(errors, !step.title || !isString(step.title), `${path}.title: required string`);
  pushIf(errors, !step.icon || !isString(step.icon), `${path}.icon: required string`);
  pushIf(errors, !step.type || !isString(step.type), `${path}.type: required string`);

  if (step.type && !VALID_STEP_TYPES.includes(step.type)) {
    errors.push(`${path}.type: "${step.type}" is not valid. Valid: ${VALID_STEP_TYPES.join(', ')}`);
  }

  // Optional fields
  if (step.energyCost !== undefined) {
    pushIf(errors, !isNumber(step.energyCost) || step.energyCost < 0, `${path}.energyCost: must be a non-negative number`);
  }
  if (step.desc !== undefined) {
    pushIf(errors, !isString(step.desc), `${path}.desc: must be a string`);
  }
  if (step.iconImage !== undefined) {
    pushIf(errors, !isString(step.iconImage), `${path}.iconImage: must be a string`);
  }

  // Content (validate if present)
  if (!step.content) {
    // Allow missing content for draft saves
  } else if (VALID_STEP_TYPES.includes(step.type)) {
    validateStepContent(step, path, errors);
  }

  return { valid: errors.length === 0, errors };
}

// ─── DAY INTRO VALIDATOR ────────────────────────────────────────────────────────

function validateDayIntro(dayIntro, path, errors) {
  if (!isObject(dayIntro)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  if (dayIntro.recap !== undefined) {
    pushIf(errors, !isObject(dayIntro.recap), `${path}.recap: must be an object`);
    if (isObject(dayIntro.recap)) {
      if (dayIntro.recap.title !== undefined) pushIf(errors, !isString(dayIntro.recap.title), `${path}.recap.title: must be a string`);
      if (dayIntro.recap.text !== undefined) pushIf(errors, !isString(dayIntro.recap.text), `${path}.recap.text: must be a string`);
    }
  }
  if (dayIntro.energizer !== undefined) {
    pushIf(errors, !isObject(dayIntro.energizer), `${path}.energizer: must be an object`);
    if (isObject(dayIntro.energizer)) {
      if (dayIntro.energizer.title !== undefined) pushIf(errors, !isString(dayIntro.energizer.title), `${path}.energizer.title: must be a string`);
      if (dayIntro.energizer.text !== undefined) pushIf(errors, !isString(dayIntro.energizer.text), `${path}.energizer.text: must be a string`);
      if (dayIntro.energizer.useRandom !== undefined) pushIf(errors, !isBoolean(dayIntro.energizer.useRandom), `${path}.energizer.useRandom: must be a boolean`);
      if (dayIntro.energizer.statements !== undefined) {
        pushIf(errors, !isArray(dayIntro.energizer.statements), `${path}.energizer.statements: must be an array`);
        if (isArray(dayIntro.energizer.statements)) {
          dayIntro.energizer.statements.forEach((s, i) => pushIf(errors, !isString(s), `${path}.energizer.statements[${i}]: must be a string`));
        }
      }
    }
  }
}

// ─── DAY VALIDATOR ──────────────────────────────────────────────────────────────

export function validateDay(day, path = 'day') {
  const errors = [];

  if (!isObject(day)) {
    errors.push(`${path}: must be an object`);
    return { valid: false, errors };
  }

  // Required fields
  pushIf(errors, !isNumber(day.id) || day.id < 1, `${path}.id: required positive number`);
  pushIf(errors, !day.name || !isString(day.name), `${path}.name: required string`);
  if (day.sub !== undefined && day.sub !== '') pushIf(errors, !isString(day.sub), `${path}.sub: must be a string`);
  pushIf(errors, !day.emoji || !isString(day.emoji), `${path}.emoji: required string`);
  pushIf(errors, !day.color || !isString(day.color), `${path}.color: required string`);

  if (day.color && isString(day.color) && !HEX_COLOR.test(day.color)) {
    errors.push(`${path}.color: must be a hex color (e.g. "#FF6B35")`);
  }

  // Optional fields
  if (day.iconImage !== undefined) pushIf(errors, !isString(day.iconImage), `${path}.iconImage: must be a string`);
  if (day.dayIntro !== undefined) validateDayIntro(day.dayIntro, `${path}.dayIntro`, errors);

  // Steps (required array, but can be empty during editing)
  pushIf(errors, !isArray(day.steps), `${path}.steps: required array`);
  if (isArray(day.steps)) {
    // Check for unique step IDs within the day
    const stepIds = new Set();
    day.steps.forEach((step, i) => {
      const stepResult = validateStep(step, `${path}.steps[${i}]`);
      errors.push(...stepResult.errors);
      if (step.id) {
        if (stepIds.has(step.id)) {
          errors.push(`${path}.steps[${i}].id: "${step.id}" is duplicated within day ${day.id}`);
        }
        stepIds.add(step.id);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// ─── TEMPLATE VALIDATOR ─────────────────────────────────────────────────────────

export function validateTemplate(template) {
  const errors = [];

  if (!isObject(template)) {
    errors.push('template: must be an object');
    return { valid: false, errors };
  }

  // Required metadata
  pushIf(errors, !template.id || !isString(template.id), 'template.id: required string');
  pushIf(errors, !template.title || !isString(template.title), 'template.title: required string');
  pushIf(errors, !template.version || !isString(template.version), 'template.version: required string');

  // Optional metadata
  if (template.description !== undefined) pushIf(errors, !isString(template.description), 'template.description: must be a string');
  if (template.duration !== undefined) pushIf(errors, !isNumber(template.duration) || template.duration < 1, 'template.duration: must be a positive number');
  if (template.targetAge !== undefined) pushIf(errors, !isString(template.targetAge), 'template.targetAge: must be a string');
  if (template.createdBy !== undefined) pushIf(errors, !isString(template.createdBy), 'template.createdBy: must be a string');
  if (template.createdAt !== undefined) pushIf(errors, !isString(template.createdAt), 'template.createdAt: must be an ISO date string');
  if (template.updatedAt !== undefined) pushIf(errors, !isString(template.updatedAt), 'template.updatedAt: must be an ISO date string');

  if (template.languages !== undefined) {
    pushIf(errors, !isArray(template.languages), 'template.languages: must be an array');
    if (isArray(template.languages)) template.languages.forEach((l, i) => pushIf(errors, !isString(l), `template.languages[${i}]: must be a string`));
  }
  if (template.sdgs !== undefined) {
    pushIf(errors, !isArray(template.sdgs), 'template.sdgs: must be an array');
    if (isArray(template.sdgs)) template.sdgs.forEach((s, i) => pushIf(errors, !isNumber(s) || s < 1 || s > 17, `template.sdgs[${i}]: must be a number 1-17`));
  }
  if (template.tags !== undefined) {
    pushIf(errors, !isArray(template.tags), 'template.tags: must be an array');
    if (isArray(template.tags)) template.tags.forEach((t, i) => pushIf(errors, !isString(t), `template.tags[${i}]: must be a string`));
  }

  // Days (required)
  pushIf(errors, !isArray(template.days), 'template.days: required array');
  if (isArray(template.days)) {
    pushIf(errors, template.days.length === 0, 'template.days: must not be empty');

    // Check for unique day IDs
    const dayIds = new Set();
    // Check for unique step IDs across ALL days
    const allStepIds = new Set();

    template.days.forEach((day, i) => {
      const dayResult = validateDay(day, `template.days[${i}]`);
      errors.push(...dayResult.errors);

      if (isNumber(day.id)) {
        if (dayIds.has(day.id)) {
          errors.push(`template.days[${i}].id: day ${day.id} is duplicated`);
        }
        dayIds.add(day.id);
      }

      // Global step ID uniqueness
      if (isArray(day.steps)) {
        day.steps.forEach((step) => {
          if (step.id && isString(step.id)) {
            if (allStepIds.has(step.id)) {
              errors.push(`template: step ID "${step.id}" is used more than once across days`);
            }
            allStepIds.add(step.id);
          }
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
