// templateLoader.js — Load/save/list workshop templates from Firebase
// Firebase path: templates/{templateId}

import { ref, get, set, push, update, remove } from 'firebase/database';
import { db } from '../firebase';
import { EXAMPLE_TEMPLATE } from '../schema/exampleTemplate';
import { validateTemplate } from '../schema/validateTemplate';

const TEMPLATES_PATH = 'templates';

/**
 * Load a single template from Firebase by ID.
 * Returns the full template object or null if not found.
 */
export async function loadTemplateFromFirebase(templateId) {
  if (!templateId) return null;
  try {
    const snap = await get(ref(db, `${TEMPLATES_PATH}/${templateId}`));
    if (!snap.exists()) return null;
    const template = snap.val();
    // Ensure days array is properly parsed (Firebase may store as object with numeric keys)
    if (template.days && !Array.isArray(template.days)) {
      template.days = Object.values(template.days);
    }
    // Ensure nested arrays are arrays (Firebase converts sparse arrays to objects)
    if (Array.isArray(template.days)) {
      template.days.forEach(day => {
        if (day.steps && !Array.isArray(day.steps)) {
          day.steps = Object.values(day.steps);
        }
        if (Array.isArray(day.steps)) {
          day.steps.forEach(step => {
            if (step.content?.subSteps && !Array.isArray(step.content.subSteps)) {
              step.content.subSteps = Object.values(step.content.subSteps);
            }
          });
        }
      });
    }
    return template;
  } catch (err) {
    console.error('[templateLoader] loadTemplateFromFirebase error:', err);
    return null;
  }
}

/**
 * Save a template to Firebase.
 * If template.id exists, overwrites at that path. Otherwise generates a new ID.
 * Returns the saved template ID.
 */
export async function saveTemplateToFirebase(template) {
  const validation = validateTemplate(template);
  if (!validation.valid) {
    console.error('[templateLoader] Template validation failed:', validation.errors);
    throw new Error(`Template invalid: ${validation.errors[0]}`);
  }

  const id = template.id;
  const data = {
    ...template,
    updatedAt: new Date().toISOString(),
  };

  try {
    await set(ref(db, `${TEMPLATES_PATH}/${id}`), data);
    return id;
  } catch (err) {
    console.error('[templateLoader] saveTemplateToFirebase error:', err);
    throw err;
  }
}

/**
 * List all templates with metadata only (no full days array).
 * Returns array of { id, title, description, duration, targetAge, sdgs, tags, createdBy, version, updatedAt }
 */
export async function listTemplates() {
  try {
    const snap = await get(ref(db, TEMPLATES_PATH));
    if (!snap.exists()) return [];

    const raw = snap.val();
    return Object.entries(raw).map(([key, t]) => ({
      id: t.id || key,
      title: t.title || 'Unbenannt',
      description: t.description || '',
      duration: t.duration || 0,
      targetAge: t.targetAge || '',
      languages: t.languages || [],
      sdgs: t.sdgs || [],
      tags: t.tags || [],
      createdBy: t.createdBy || '',
      version: t.version || '0.0.0',
      updatedAt: t.updatedAt || '',
      _hasFullData: true,
    }));
  } catch (err) {
    console.error('[templateLoader] listTemplates error:', err);
    return [];
  }
}

/**
 * Delete a template from Firebase by ID.
 */
export async function deleteTemplateFromFirebase(templateId) {
  await remove(ref(db, `${TEMPLATES_PATH}/${templateId}`));
}

/**
 * Load the local/bundled example template as fallback.
 * Always available, no network needed.
 */
export function loadLocalTemplate() {
  return EXAMPLE_TEMPLATE;
}
