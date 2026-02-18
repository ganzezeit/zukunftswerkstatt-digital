import React, { useState } from 'react';

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function secsToMinSec(secs) {
  if (secs === null || secs === undefined || secs === '') return '';
  const n = Number(secs);
  if (isNaN(n)) return '';
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function minSecToSecs(str) {
  if (!str || !str.trim()) return undefined;
  const clean = str.trim();
  if (clean.includes(':')) {
    const [mm, ss] = clean.split(':');
    return (parseInt(mm) || 0) * 60 + (parseInt(ss) || 0);
  }
  const n = parseInt(clean);
  return isNaN(n) ? undefined : n;
}

export default function VideoConfig({ content, onChange }) {
  const c = content || {};
  const [sourceType, setSourceType] = useState(c.url ? 'url' : 'file');
  const [startStr, setStartStr] = useState(secsToMinSec(c.startTime));
  const [endStr, setEndStr] = useState(secsToMinSec(c.endTime));

  const update = (key, val) => onChange({ ...c, [key]: val });

  const handleSourceTypeChange = (type) => {
    setSourceType(type);
    if (type === 'url') {
      update('src', '');
    } else {
      update('url', '');
    }
  };

  const handleStartChange = (str) => {
    setStartStr(str);
    const secs = minSecToSecs(str);
    update('startTime', secs !== undefined ? secs : 0);
  };

  const handleEndChange = (str) => {
    setEndStr(str);
    const secs = minSecToSecs(str);
    update('endTime', secs !== undefined ? secs : null);
  };

  const ytId = getYouTubeId(c.url);

  return (
    <div>
      {/* Source type toggle */}
      <label style={s.label}>Videoquelle</label>
      <div style={s.tabRow}>
        <button
          onClick={() => handleSourceTypeChange('url')}
          style={{ ...s.tab, ...(sourceType === 'url' ? s.tabActive : {}) }}
        >
          {'\u{1F4F9}'} YouTube / Vimeo
        </button>
        <button
          onClick={() => handleSourceTypeChange('file')}
          style={{ ...s.tab, ...(sourceType === 'file' ? s.tabActive : {}) }}
        >
          {'\u{1F4C1}'} Eigene Datei
        </button>
      </div>

      {/* URL input */}
      {sourceType === 'url' ? (
        <div>
          <input
            type="url"
            value={c.url || ''}
            onChange={e => update('url', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            style={s.input}
          />
          {ytId && (
            <div style={s.preview}>
              <img
                src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                alt="Video-Vorschau"
                style={s.thumbnail}
              />
              <span style={s.previewLabel}>{'\u2705'} YouTube-Video erkannt</span>
            </div>
          )}
          {c.url && !ytId && c.url.length > 5 && (
            <span style={s.hint}>{'\u{1F517}'} Link wird verwendet (kein YouTube-Embed)</span>
          )}
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={c.src || ''}
            onChange={e => update('src', e.target.value)}
            placeholder="/videos/mein-video.mp4"
            style={s.input}
          />
          <span style={s.hint}>Pfad relativ zum public-Ordner</span>
        </div>
      )}

      {/* Time inputs */}
      <div style={s.timeRow}>
        <div style={s.timeField}>
          <label style={s.label}>Startzeit</label>
          <input
            type="text"
            value={startStr}
            onChange={e => handleStartChange(e.target.value)}
            placeholder="0:00"
            style={s.timeInput}
          />
          <span style={s.timeHint}>mm:ss</span>
        </div>
        <div style={s.timeField}>
          <label style={s.label}>Endzeit</label>
          <input
            type="text"
            value={endStr}
            onChange={e => handleEndChange(e.target.value)}
            placeholder="Leer = bis Ende"
            style={s.timeInput}
          />
          <span style={s.timeHint}>mm:ss (leer = ganz)</span>
        </div>
      </div>

      {/* Description */}
      <label style={s.label}>Beschreibung</label>
      <textarea
        value={c.description || ''}
        onChange={e => update('description', e.target.value)}
        placeholder="Anweisungen oder Hinweise zum Video..."
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
  textarea: {
    width: '100%', padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: '#333', outline: 'none',
    boxSizing: 'border-box', resize: 'vertical', minHeight: 50,
  },
  tabRow: { display: 'flex', gap: 6, marginBottom: 8 },
  tab: {
    flex: 1, padding: '8px 12px', border: '2px solid #E0E0E0', borderRadius: 10,
    background: '#FAFAFA', fontFamily: "'Fredoka', sans-serif", fontSize: 13,
    fontWeight: 600, color: '#999', cursor: 'pointer', textAlign: 'center',
  },
  tabActive: {
    background: '#9B5DE518', borderColor: '#9B5DE5', color: '#9B5DE5',
  },
  preview: {
    marginTop: 8, borderRadius: 10, overflow: 'hidden',
    border: '1px solid #EEE', background: '#000',
  },
  thumbnail: {
    width: '100%', display: 'block', objectFit: 'cover', maxHeight: 160,
  },
  previewLabel: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600,
    color: '#4CAF50', display: 'block', padding: '6px 10px', background: '#fff',
  },
  hint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 500,
    color: '#999', display: 'block', marginTop: 4,
  },
  timeRow: { display: 'flex', gap: 12, marginTop: 4 },
  timeField: { flex: 1 },
  timeInput: {
    width: '100%', padding: '8px 12px', border: '2px solid #E0D6CC', borderRadius: 10,
    fontFamily: "'Baloo 2', cursive", fontSize: 16, fontWeight: 700, color: '#333',
    outline: 'none', boxSizing: 'border-box', textAlign: 'center',
  },
  timeHint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 10, fontWeight: 500,
    color: '#BBB', display: 'block', textAlign: 'center', marginTop: 2,
  },
};
