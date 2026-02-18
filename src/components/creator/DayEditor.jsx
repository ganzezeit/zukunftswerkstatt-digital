import React, { useState, useRef } from 'react';

const EMOJI_OPTIONS = [
  '\u{1F4D6}', '\u{1F30D}', '\u{1F3AE}', '\u{1F6E0}\uFE0F', '\u{1F389}',
  '\u{1F31F}', '\u{1F3A8}', '\u{1F4DA}', '\u26BD', '\u{1F4F9}',
  '\u{1F3AF}', '\u{1F4BB}', '\u2764\uFE0F', '\u{1F4AC}', '\u{1F3B5}',
  '\u{1F680}', '\u{1F333}', '\u{1F41F}', '\u{1F54A}\uFE0F', '\u{1F91D}',
];

const COLOR_OPTIONS = [
  '#FF6B35', '#00B4D8', '#9B5DE5', '#2ECC71', '#E74C3C',
  '#FFD166', '#00897B', '#FF85A2', '#5C6BC0', '#8D6E63',
];

export default function DayEditor({ days, selectedDayIdx, onSelectDay, onAddDay, onDeleteDay, onUpdateDay, onReorderDays }) {
  const [editingDay, setEditingDay] = useState(null); // index of day being edited
  const dragRef = useRef(null);

  const handleDragStart = (e, idx) => {
    dragRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `day-${idx}`);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragRef.current === null || dragRef.current === idx) return;
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragRef.current === null || dragRef.current === idx) return;
    onReorderDays(dragRef.current, idx);
    dragRef.current = null;
  };

  const day = editingDay !== null ? days[editingDay] : null;

  return (
    <div style={s.wrapper}>
      <div style={s.tabsRow}>
        {days.map((d, i) => (
          <div
            key={i}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onClick={() => onSelectDay(i)}
            onDoubleClick={() => setEditingDay(i)}
            style={{
              ...s.tab,
              borderBottomColor: i === selectedDayIdx ? (d.color || '#FF6B35') : 'transparent',
              background: i === selectedDayIdx ? '#fff' : '#FAFAFA',
            }}
          >
            <span style={s.tabEmoji}>{d.emoji}</span>
            <span style={s.tabName}>{d.name}</span>
            {d.sub && <span style={s.tabSub}>{d.sub}</span>}
          </div>
        ))}
        <button onClick={onAddDay} style={s.addTab} title="Tag hinzufuegen">+</button>
      </div>

      {/* Day editor popover */}
      {editingDay !== null && day && (
        <div style={s.dayEditorOverlay} onClick={(e) => e.target === e.currentTarget && setEditingDay(null)}>
          <div style={s.dayEditorPanel}>
            <h3 style={s.panelTitle}>{day.emoji} {day.name} bearbeiten</h3>

            <label style={s.label}>Name</label>
            <input
              value={day.name}
              onChange={e => onUpdateDay(editingDay, { name: e.target.value })}
              style={s.input}
            />

            <label style={s.label}>Untertitel</label>
            <input
              value={day.sub}
              onChange={e => onUpdateDay(editingDay, { sub: e.target.value })}
              placeholder="z.B. Kinderrechte entdecken"
              style={s.input}
            />

            <label style={s.label}>Emoji</label>
            <div style={s.emojiGrid}>
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  onClick={() => onUpdateDay(editingDay, { emoji: em })}
                  style={{ ...s.emojiBtn, outline: day.emoji === em ? '3px solid #FF6B35' : 'none' }}
                >
                  {em}
                </button>
              ))}
            </div>

            <label style={s.label}>Farbe</label>
            <div style={s.colorGrid}>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => onUpdateDay(editingDay, { color: c })}
                  style={{
                    ...s.colorBtn,
                    background: c,
                    outline: day.color === c ? '3px solid #333' : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>

            <div style={s.panelActions}>
              {days.length > 1 && (
                <button
                  onClick={() => { onDeleteDay(editingDay); setEditingDay(null); }}
                  style={s.deleteBtn}
                >
                  Tag loeschen
                </button>
              )}
              <button onClick={() => setEditingDay(null)} style={s.doneBtn}>Fertig</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper: { flexShrink: 0 },
  tabsRow: {
    display: 'flex', alignItems: 'flex-end', gap: 0,
    padding: '0 16px', background: '#F5F0EB',
    borderBottom: '1px solid #E0D6CC', overflowX: 'auto',
  },
  tab: {
    padding: '10px 16px 8px', cursor: 'pointer',
    borderBottom: '3px solid transparent',
    borderRadius: '12px 12px 0 0', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 2,
    minWidth: 80, transition: 'background 0.2s',
  },
  tabEmoji: { fontSize: 22 },
  tabName: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, color: '#333',
  },
  tabSub: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 10, fontWeight: 500, color: '#999',
    maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  addTab: {
    padding: '10px 16px', cursor: 'pointer', border: 'none',
    background: 'none', fontSize: 22, color: '#999',
    borderRadius: '12px 12px 0 0', fontWeight: 700,
  },
  // Day editor overlay
  dayEditorOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', zIndex: 8000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dayEditorPanel: {
    background: '#fff', borderRadius: 20, padding: '24px 28px',
    maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  panelTitle: {
    fontFamily: "'Lilita One', cursive", fontSize: 20, color: '#8B5A2B',
    margin: '0 0 12px', textAlign: 'center',
  },
  label: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600,
    color: '#666', display: 'block', margin: '12px 0 4px',
  },
  input: {
    width: '100%', padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: '#333', outline: 'none', boxSizing: 'border-box',
  },
  emojiGrid: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  emojiBtn: {
    width: 38, height: 38, border: 'none', borderRadius: 10,
    background: '#F5F5F5', fontSize: 20, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  colorGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  colorBtn: {
    width: 32, height: 32, border: 'none', borderRadius: 10, cursor: 'pointer',
  },
  panelActions: {
    display: 'flex', gap: 10, marginTop: 18,
  },
  deleteBtn: {
    flex: 1, padding: '10px', borderRadius: 12, border: '2px solid #FFCDD2',
    background: '#FFEBEE', fontFamily: "'Fredoka', sans-serif", fontSize: 14,
    fontWeight: 600, color: '#D32F2F', cursor: 'pointer',
  },
  doneBtn: {
    flex: 1, padding: '10px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
    color: '#fff', cursor: 'pointer',
  },
};
