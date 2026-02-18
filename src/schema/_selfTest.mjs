// Quick self-test: validates the example template and logs the result
// Run: node --experimental-vm-modules src/schema/_selfTest.mjs

import { DAYS } from '../data/days.js';
import { validateTemplate, validateDay, validateStep } from './validateTemplate.js';
import { STEP_TYPES, SUB_STEP_TYPES, TEMPLATE_SCHEMA, MISSION_TYPE_CONFIG } from './templateSchema.js';

console.log('=== Template Schema Self-Test ===\n');

// 1. Schema exports check
console.log('STEP_TYPES:', Object.keys(STEP_TYPES).join(', '));
console.log('SUB_STEP_TYPES:', Object.keys(SUB_STEP_TYPES).join(', '));
console.log('TEMPLATE_SCHEMA fields:', Object.keys(TEMPLATE_SCHEMA.fields).join(', '));
console.log('MISSION_TYPE_CONFIG step types:', Object.keys(MISSION_TYPE_CONFIG.steps).join(', '));
console.log('MISSION_TYPE_CONFIG subStep types:', Object.keys(MISSION_TYPE_CONFIG.subSteps).join(', '));
console.log('');

// 2. Validate full template
const template = {
  id: 'kinderrechte-projektwoche-v1',
  title: 'Projektwoche Kinderrechte',
  description: 'Fünftägige Projektwoche',
  duration: 5,
  targetAge: '9-12',
  languages: ['de'],
  sdgs: [4, 10, 16, 17],
  tags: ['Kinderrechte'],
  createdBy: 'Weltverbinder',
  version: '1.0.0',
  days: DAYS,
};

const result = validateTemplate(template);
console.log('Full template validation:');
console.log('  Valid:', result.valid);
console.log('  Errors:', result.errors.length);
if (result.errors.length > 0) {
  result.errors.forEach(e => console.log('    -', e));
}
console.log('');

// 3. Validate individual days
DAYS.forEach((day, i) => {
  const dayResult = validateDay(day);
  console.log(`Day ${day.id} (${day.name}): ${dayResult.valid ? 'PASS' : 'FAIL'} (${day.steps.length} steps, ${dayResult.errors.length} errors)`);
  if (!dayResult.valid) {
    dayResult.errors.forEach(e => console.log('    -', e));
  }
});
console.log('');

// 4. Validate individual steps
let stepCount = 0;
let stepErrors = 0;
DAYS.forEach(day => {
  day.steps.forEach(step => {
    stepCount++;
    const stepResult = validateStep(step);
    if (!stepResult.valid) {
      stepErrors++;
      console.log(`  FAIL: ${step.id} (${step.type}):`);
      stepResult.errors.forEach(e => console.log('    -', e));
    }
  });
});
console.log(`Steps: ${stepCount} total, ${stepCount - stepErrors} passed, ${stepErrors} failed`);
console.log('');

// 5. Coverage: list all step types and subTypes found in DAYS
const foundTypes = new Set();
const foundSubTypes = new Set();
DAYS.forEach(day => {
  day.steps.forEach(step => {
    foundTypes.add(step.type);
    if (step.type === 'multi-step' && step.content?.subSteps) {
      step.content.subSteps.forEach(sub => foundSubTypes.add(sub.subType || 'text'));
    }
  });
});
console.log('Step types used in DAYS:', [...foundTypes].join(', '));
console.log('SubTypes used in DAYS:', [...foundSubTypes].join(', '));
console.log('Step types in schema not used:', Object.keys(STEP_TYPES).filter(t => !foundTypes.has(t)).join(', ') || '(none)');
console.log('SubTypes in schema not used:', Object.keys(SUB_STEP_TYPES).filter(t => !foundSubTypes.has(t)).join(', ') || '(none)');

console.log('\n=== Self-Test Complete ===');
