// exampleTemplate.js — Wraps the existing DAYS data as a full template
// Validates against the schema to prove correctness

import { DAYS } from '../data/days.js';
import { validateTemplate } from './validateTemplate.js';

export const EXAMPLE_TEMPLATE = {
  // Metadata
  id: 'kinderrechte-projektwoche-v1',
  title: 'Projektwoche Kinderrechte',
  description:
    'Fünftägige Projektwoche rund um Kinderrechte, Austausch mit Tansania, Game Design und kreative Projektarbeit. Für Grundschulkinder mit begrenzten Deutschkenntnissen.',
  duration: 5,
  targetAge: '9-12',
  languages: ['de'],
  sdgs: [4, 10, 16, 17],
  tags: [
    'Kinderrechte',
    'Tansania',
    'Austausch',
    'Medienkompetenz',
    'Game Design',
    'Grundschule',
    'FEB',
  ],
  createdBy: 'Weltverbinder / GanzeZeit e.V.',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  version: '1.0.0',

  // Days
  days: DAYS,
};

// Self-validate
const result = validateTemplate(EXAMPLE_TEMPLATE);
if (!result.valid) {
  console.warn('[EXAMPLE_TEMPLATE] Validation errors:', result.errors);
}

export const EXAMPLE_TEMPLATE_VALIDATION = result;
