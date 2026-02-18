// templateAdapter.js — Bridge between template format and App.jsx's DAYS format
// Creator saves full template → Studio reads just the days array

/**
 * Extract the days array from a full template object.
 * This is what App.jsx needs to drive the game.
 * @param {object} template - Full template with metadata + days
 * @returns {Array} days array compatible with DAYS from days.js
 */
export function templateToDays(template) {
  if (!template || !template.days) return [];

  // Ensure days is an array (Firebase may convert to object with numeric keys)
  const days = Array.isArray(template.days)
    ? template.days
    : Object.values(template.days);

  // Normalize each day's steps
  return days.map(day => ({
    ...day,
    steps: Array.isArray(day.steps)
      ? day.steps.map(step => ({
          ...step,
          content: step.content
            ? {
                ...step.content,
                subSteps: step.content.subSteps
                  ? (Array.isArray(step.content.subSteps)
                      ? step.content.subSteps
                      : Object.values(step.content.subSteps))
                  : undefined,
              }
            : step.content,
        }))
      : Object.values(day.steps || {}),
  }));
}

/**
 * Get template metadata (everything except days).
 * Useful for displaying template info without the heavy days payload.
 */
export function templateToMeta(template) {
  if (!template) return null;
  const { days, ...meta } = template;
  return {
    ...meta,
    dayCount: Array.isArray(days) ? days.length : Object.keys(days || {}).length,
    stepCount: (Array.isArray(days) ? days : Object.values(days || {}))
      .reduce((sum, day) => {
        const steps = Array.isArray(day.steps) ? day.steps : Object.values(day.steps || {});
        return sum + steps.length;
      }, 0),
  };
}
