import React from 'react';

export default function SlidesConfig({ content, onChange }) {
  const c = content || {};
  const autoAdvance = !!c.autoAdvance;

  const update = (key, val) => onChange({ ...c, [key]: val });

  return (
    <div>
      {/* PDF file */}
      <label style={s.label}>PDF-Datei *</label>
      <input
        type="text"
        value={c.slides || ''}
        onChange={e => update('slides', e.target.value)}
        placeholder="z.B. tag1-rechte.pdf"
        style={s.input}
      />
      <span style={s.hint}>Dateiname im public/slides/ Ordner</span>

      {/* Slide count */}
      <label style={s.label}>Seitenanzahl *</label>
      <input
        type="number"
        value={c.slideCount || ''}
        onChange={e => update('slideCount', e.target.value === '' ? undefined : parseInt(e.target.value))}
        min={1}
        placeholder="z.B. 10"
        style={s.numberInput}
      />

      {/* Divider */}
      <div style={s.divider} />

      {/* Auto-advance */}
      <div style={s.toggleRow}>
        <input
          type="checkbox"
          checked={autoAdvance}
          onChange={e => update('autoAdvance', e.target.checked)}
          style={s.checkbox}
        />
        <div>
          <span style={s.toggleLabel}>Automatisch weiterschalten</span>
          <span style={s.toggleHint}>Folien wechseln nach Timer</span>
        </div>
      </div>

      {/* Timer per slide */}
      {autoAdvance && (
        <div style={s.timerSection}>
          <label style={s.label}>Sekunden pro Folie</label>
          <div style={s.sliderRow}>
            <input
              type="range"
              min={3}
              max={60}
              value={c.timerPerSlide || 10}
              onChange={e => update('timerPerSlide', parseInt(e.target.value))}
              style={s.slider}
            />
            <span style={s.sliderVal}>{c.timerPerSlide || 10}s</span>
          </div>
          {c.slideCount > 0 && (
            <span style={s.totalTime}>
              {'\u23F1\uFE0F'} Gesamt: {Math.round(((c.timerPerSlide || 10) * (c.slideCount || 1)) / 60)} Min.
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <label style={s.label}>Beschreibung</label>
      <textarea
        value={c.description || ''}
        onChange={e => update('description', e.target.value)}
        placeholder="Hinweise zur Pr\u00E4sentation..."
        style={s.textarea}
        rows={2}
      />
    </div>
  );
}

const s = {
  label: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600,
    color: '#666', display: 'block', margin: '12px 0 4px',
  },
  input: {
    width: '100%', padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: '#333', outline: 'none', boxSizing: 'border-box',
  },
  numberInput: {
    width: 120, padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Baloo 2', cursive", fontSize: 16, fontWeight: 700, color: '#333',
    outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: '#333', outline: 'none',
    boxSizing: 'border-box', resize: 'vertical', minHeight: 50,
  },
  hint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 500,
    color: '#999', display: 'block', marginTop: 4,
  },
  divider: { height: 1, background: '#EEE', margin: '14px 0' },
  toggleRow: {
    display: 'flex', alignItems: 'flex-start', gap: 8, margin: '8px 0',
  },
  checkbox: { width: 18, height: 18, cursor: 'pointer', flexShrink: 0, marginTop: 2 },
  toggleLabel: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color: '#555',
    display: 'block',
  },
  toggleHint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 500, color: '#999',
    display: 'block',
  },
  timerSection: {
    padding: '8px 12px', background: '#F5F5F5', borderRadius: 10, marginTop: 6,
  },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 10 },
  slider: { flex: 1 },
  sliderVal: {
    fontFamily: "'Baloo 2', cursive", fontSize: 16, fontWeight: 700,
    color: '#00B4D8', minWidth: 40, textAlign: 'center',
  },
  totalTime: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600,
    color: '#888', display: 'block', marginTop: 4,
  },
};
