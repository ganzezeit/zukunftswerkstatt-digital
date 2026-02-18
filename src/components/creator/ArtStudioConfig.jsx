import React from 'react';

const MODES = [
  { id: 'image', label: 'Bilder', emoji: '\u{1F5BC}\uFE0F' },
  { id: 'video', label: 'Videos', emoji: '\u{1F3AC}' },
  { id: 'music', label: 'Musik', emoji: '\u{1F3B5}' },
];

const STYLES = [
  { id: 'illustration', label: 'Illustration', emoji: '\u{1F58C}\uFE0F' },
  { id: 'photo', label: 'Foto', emoji: '\u{1F4F7}' },
  { id: 'cartoon', label: 'Cartoon', emoji: '\u{1F3AD}' },
  { id: 'watercolor', label: 'Aquarell', emoji: '\u{1F3A8}' },
  { id: 'pixel', label: 'Pixel Art', emoji: '\u{1F47E}' },
  { id: '3d', label: '3D', emoji: '\u{1F9CA}' },
  { id: 'anime', label: 'Anime', emoji: '\u{1F338}' },
  { id: 'oil', label: '\u00D6lgem\u00E4lde', emoji: '\u{1F5BC}\uFE0F' },
  { id: 'comic', label: 'Comic', emoji: '\u{1F4A5}' },
  { id: 'sketch', label: 'Skizze', emoji: '\u270F\uFE0F' },
];

export default function ArtStudioConfig({ content, onChange }) {
  const c = content || {};
  const enabledModes = c.enabledModes || ['image', 'video', 'music'];
  const allowedStyles = c.allowedStyles || STYLES.map(s => s.id);
  const contentFilter = c.contentFilter !== false;
  const galleryEnabled = c.galleryEnabled !== false;
  const multiDevice = c.multiDevice !== false;
  const maxGenerations = c.maxGenerations || 3;

  const update = (key, val) => onChange({ ...c, [key]: val });

  const toggleMode = (modeId) => {
    const next = enabledModes.includes(modeId)
      ? enabledModes.filter(m => m !== modeId)
      : [...enabledModes, modeId];
    if (next.length === 0) return;
    update('enabledModes', next);
  };

  const toggleStyle = (styleId) => {
    const next = allowedStyles.includes(styleId)
      ? allowedStyles.filter(s => s !== styleId)
      : [...allowedStyles, styleId];
    update('allowedStyles', next);
  };

  const toggleAllStyles = () => {
    if (allowedStyles.length === STYLES.length) {
      update('allowedStyles', ['illustration']);
    } else {
      update('allowedStyles', STYLES.map(s => s.id));
    }
  };

  return (
    <div>
      {/* Modes */}
      <label style={s.label}>Kreativ-Modi</label>
      <div style={s.modeGrid}>
        {MODES.map(mode => {
          const active = enabledModes.includes(mode.id);
          return (
            <button
              key={mode.id}
              onClick={() => toggleMode(mode.id)}
              style={{
                ...s.modeBtn,
                background: active ? '#FF572218' : '#F5F5F5',
                borderColor: active ? '#FF5722' : '#E0E0E0',
                color: active ? '#FF5722' : '#999',
              }}
            >
              <span style={{ fontSize: 20 }}>{mode.emoji}</span>
              <span style={s.modeLbl}>{mode.label}</span>
              <span style={{ fontSize: 14 }}>{active ? '\u2705' : '\u2B1C'}</span>
            </button>
          );
        })}
      </div>

      {/* Styles (only relevant when image mode is on) */}
      {enabledModes.includes('image') && (
        <>
          <div style={s.labelRow}>
            <label style={s.label}>Bild-Stile</label>
            <button onClick={toggleAllStyles} style={s.toggleAllBtn}>
              {allowedStyles.length === STYLES.length ? 'Keine' : 'Alle'}
            </button>
          </div>
          <div style={s.styleGrid}>
            {STYLES.map(st => {
              const active = allowedStyles.includes(st.id);
              return (
                <button
                  key={st.id}
                  onClick={() => toggleStyle(st.id)}
                  style={{
                    ...s.styleBtn,
                    background: active ? '#FFF3E0' : '#FAFAFA',
                    borderColor: active ? '#FF5722' : '#EEE',
                    opacity: active ? 1 : 0.5,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{st.emoji}</span>
                  <span style={s.styleLbl}>{st.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Prompt template */}
      <label style={s.label}>Starter-Prompt</label>
      <textarea
        value={c.promptTemplate || ''}
        onChange={e => update('promptTemplate', e.target.value)}
        placeholder="z.B. 'Erstelle ein Bild von deinem Traumhaus...'"
        style={s.textarea}
        rows={2}
      />

      {/* Toggles */}
      <div style={s.divider} />

      <div style={s.toggleRow}>
        <input
          type="checkbox"
          checked={contentFilter}
          onChange={e => update('contentFilter', e.target.checked)}
          style={s.checkbox}
        />
        <div>
          <span style={s.toggleLabel}>Inhaltsfilter</span>
          {!contentFilter && (
            <span style={s.warning}>{'\u26A0\uFE0F'} Nicht empfohlen f\u00FCr Schulen!</span>
          )}
        </div>
      </div>

      <div style={s.toggleRow}>
        <input
          type="checkbox"
          checked={galleryEnabled}
          onChange={e => update('galleryEnabled', e.target.checked)}
          style={s.checkbox}
        />
        <span style={s.toggleLabel}>Gemeinsame Galerie</span>
      </div>

      <div style={s.toggleRow}>
        <input
          type="checkbox"
          checked={multiDevice}
          onChange={e => update('multiDevice', e.target.checked)}
          style={s.checkbox}
        />
        <span style={s.toggleLabel}>Multi-Device (QR-Code)</span>
      </div>

      {/* Max generations */}
      <label style={s.label}>Max. Generierungen pro Sch\u00FCler:in</label>
      <div style={s.numberRow}>
        <input
          type="range"
          min={1}
          max={10}
          value={maxGenerations}
          onChange={e => update('maxGenerations', parseInt(e.target.value))}
          style={s.slider}
        />
        <span style={s.numberVal}>{maxGenerations}</span>
      </div>
    </div>
  );
}

const s = {
  label: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600,
    color: '#666', display: 'block', margin: '12px 0 4px',
  },
  labelRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    margin: '12px 0 4px',
  },
  modeGrid: { display: 'flex', gap: 8 },
  modeBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '10px 8px', borderRadius: 12, border: '2px solid #E0E0E0',
    cursor: 'pointer', background: '#F5F5F5',
  },
  modeLbl: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700,
  },
  styleGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4,
  },
  styleBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 10px', borderRadius: 8, border: '1.5px solid #EEE',
    cursor: 'pointer', background: '#FAFAFA',
  },
  styleLbl: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600, color: '#333',
  },
  toggleAllBtn: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600,
    color: '#FF5722', background: 'none', border: 'none', cursor: 'pointer',
    padding: 0,
  },
  textarea: {
    width: '100%', padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: '#333', outline: 'none',
    boxSizing: 'border-box', resize: 'vertical', minHeight: 50,
  },
  divider: { height: 1, background: '#EEE', margin: '14px 0' },
  toggleRow: {
    display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0',
  },
  checkbox: { width: 18, height: 18, cursor: 'pointer', flexShrink: 0 },
  toggleLabel: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color: '#555',
  },
  warning: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600,
    color: '#E65100', marginLeft: 8,
  },
  numberRow: { display: 'flex', alignItems: 'center', gap: 10 },
  slider: { flex: 1 },
  numberVal: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700,
    color: '#FF5722', minWidth: 30, textAlign: 'center',
  },
};
