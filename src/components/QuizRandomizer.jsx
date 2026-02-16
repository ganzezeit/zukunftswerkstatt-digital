import React, { useState } from 'react';
import { INDICATOR_LABELS, INDICATOR_COLORS, generateRandomQuiz } from '../data/questionPool';

const COUNT_OPTIONS = [5, 8, 10, 12, 15];

const TYPE_LABELS = {
  mc: 'Multiple Choice',
  tf: 'Richtig/Falsch',
  open: 'Offene Antwort',
  slider: 'Schätzfrage',
  wordcloud: 'Wortwolke',
  sorting: 'Sortieren',
};

export default function QuizRandomizer({ mode, dayColor, onGenerate, onCancel }) {
  const color = dayColor || '#2980B9';
  const isLive = mode === 'live';

  const allTypes = isLive
    ? ['mc', 'tf', 'open', 'slider', 'wordcloud', 'sorting']
    : ['mc', 'tf', 'open', 'slider'];

  const [count, setCount] = useState(10);
  const [selectedIndicators, setSelectedIndicators] = useState(
    () => Object.keys(INDICATOR_LABELS)
  );
  const [selectedTypes, setSelectedTypes] = useState(() => [...allTypes]);
  const [preview, setPreview] = useState(null);

  const toggleIndicator = (key) => {
    setSelectedIndicators(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setPreview(null);
  };

  const toggleType = (key) => {
    setSelectedTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
    setPreview(null);
  };

  const toggleAllIndicators = () => {
    if (selectedIndicators.length === Object.keys(INDICATOR_LABELS).length) {
      setSelectedIndicators([]);
    } else {
      setSelectedIndicators(Object.keys(INDICATOR_LABELS));
    }
    setPreview(null);
  };

  const handleGenerate = () => {
    if (selectedIndicators.length === 0) return;
    if (selectedTypes.length === 0) return;
    const result = generateRandomQuiz({
      count,
      indicators: selectedIndicators,
      types: selectedTypes,
      mode,
    });
    setPreview(result);
  };

  const handleAccept = () => {
    if (preview) {
      onGenerate(preview);
    }
  };

  const handleReroll = () => {
    handleGenerate();
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={onCancel} style={s.backBtn}>{'\u2190'}</button>
        <h2 style={{ ...s.title, color }}>
          {'\u{1F3B2}'} Quiz-Randomizer
        </h2>
      </div>
      <p style={s.subtitle}>
        {isLive ? 'Zufälliges Live-Quiz' : 'Zufälliges Einzelquiz'} aus dem Fragenpool erstellen
      </p>

      {/* Question count */}
      <div style={s.section}>
        <label style={s.label}>Anzahl Fragen</label>
        <div style={s.chipRow}>
          {COUNT_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => { setCount(n); setPreview(null); }}
              style={{
                ...s.chip,
                background: count === n ? color : 'rgba(0,0,0,0.04)',
                color: count === n ? 'white' : '#555',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Indicators */}
      <div style={s.section}>
        <div style={s.labelRow}>
          <label style={s.label}>Indikatoren / Themenbereiche</label>
          <button onClick={toggleAllIndicators} style={s.toggleAll}>
            {selectedIndicators.length === Object.keys(INDICATOR_LABELS).length ? 'Keine' : 'Alle'}
          </button>
        </div>
        <div style={s.chipRow}>
          {Object.entries(INDICATOR_LABELS).map(([key, label]) => {
            const active = selectedIndicators.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleIndicator(key)}
                style={{
                  ...s.indicatorChip,
                  background: active ? INDICATOR_COLORS[key] : 'rgba(0,0,0,0.04)',
                  color: active ? 'white' : '#777',
                  border: active ? `2px solid ${INDICATOR_COLORS[key]}` : '2px solid transparent',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question types */}
      <div style={s.section}>
        <label style={s.label}>Fragetypen</label>
        <div style={s.chipRow}>
          {allTypes.map(t => {
            const active = selectedTypes.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                style={{
                  ...s.chip,
                  background: active ? '#2C3E50' : 'rgba(0,0,0,0.04)',
                  color: active ? 'white' : '#555',
                }}
              >
                {TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={selectedIndicators.length === 0 || selectedTypes.length === 0}
        style={{
          ...s.generateBtn,
          background: color,
          opacity: (selectedIndicators.length === 0 || selectedTypes.length === 0) ? 0.4 : 1,
        }}
      >
        {'\u{1F3B2}'} Zufälliges Quiz erstellen
      </button>

      {/* Preview */}
      {preview && (
        <div style={s.previewSection}>
          <h3 style={s.previewTitle}>
            Vorschau: {preview.questions.length} Fragen
          </h3>
          <div style={s.previewList}>
            {preview.questions.map((q, i) => {
              const typeBadge = TYPE_LABELS[q.type] || q.type;
              return (
                <div key={i} style={s.previewItem}>
                  <span style={s.previewNum}>{i + 1}.</span>
                  <span style={s.previewText}>{q.text}</span>
                  <span style={s.previewBadge}>{typeBadge}</span>
                </div>
              );
            })}
          </div>

          <div style={s.previewActions}>
            <button onClick={handleAccept} style={{ ...s.acceptBtn, background: '#27AE60' }}>
              {'\u2705'} Übernehmen
            </button>
            <button onClick={handleReroll} style={{ ...s.rerollBtn, background: color }}>
              {'\u{1F504}'} Neu würfeln
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: '4px 0',
  },
  header: { display: 'flex', alignItems: 'center', gap: 10 },
  backBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    padding: '4px 10px',
    background: 'rgba(0,0,0,0.06)',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    color: '#555',
    lineHeight: 1,
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    margin: 0,
  },
  subtitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: '#999',
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: '#777',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleAll: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    padding: '2px 8px',
    background: 'rgba(0,0,0,0.04)',
    color: '#999',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  chipRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    padding: '6px 14px',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  indicatorChip: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  generateBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    padding: '14px 24px',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: 4,
  },
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: '#F8F8F8',
    borderRadius: 14,
    padding: '14px 12px',
  },
  previewTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    color: '#333',
    margin: 0,
  },
  previewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: '30vh',
    overflowY: 'auto',
  },
  previewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    background: 'white',
    borderRadius: 8,
  },
  previewNum: {
    fontFamily: "'Baloo 2', cursive",
    fontSize: 14,
    fontWeight: 700,
    color: '#999',
    width: 24,
    textAlign: 'center',
    flexShrink: 0,
  },
  previewText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  previewBadge: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    color: '#777',
    padding: '2px 6px',
    background: 'rgba(0,0,0,0.06)',
    borderRadius: 4,
    flexShrink: 0,
  },
  previewActions: {
    display: 'flex',
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'center',
  },
  rerollBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'center',
  },
};
