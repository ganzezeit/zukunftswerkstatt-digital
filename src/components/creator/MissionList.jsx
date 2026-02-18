import React, { useRef } from 'react';
import { MISSION_TYPE_CONFIG } from '../../schema/templateSchema';

const TYPE_META = {};
Object.entries(MISSION_TYPE_CONFIG.steps).forEach(([type, cfg]) => {
  TYPE_META[type] = { icon: cfg.icon, label: cfg.label, color: cfg.color };
});

export default function MissionList({ missions, dayColor, onEdit, onDelete, onReorder, editingIdx }) {
  const dragRef = useRef(null);

  const handleDragStart = (e, idx) => {
    dragRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `mission-${idx}`);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragRef.current === null) {
      // Could be from palette
      e.dataTransfer.dropEffect = 'copy';
      return;
    }
    if (dragRef.current === idx) return;
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    // Check for palette drop
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data?.source === 'palette') {
        // Palette drop is handled by parent — for now, just ignore (click-to-add is primary)
        dragRef.current = null;
        return;
      }
    } catch {}

    if (dragRef.current !== null && dragRef.current !== idx) {
      onReorder(dragRef.current, idx);
    }
    dragRef.current = null;
  };

  const handleDragEnd = () => { dragRef.current = null; };

  if (missions.length === 0) {
    return (
      <div style={s.empty}>
        <span style={{ fontSize: 40 }}>{'\u{1F4CB}'}</span>
        <p style={s.emptyTitle}>Noch keine Missionen</p>
        <p style={s.emptyHint}>Klicke rechts auf eine Mission um sie hinzuzufuegen.</p>
      </div>
    );
  }

  return (
    <div style={s.list}>
      {missions.map((m, i) => {
        const meta = TYPE_META[m.type] || { icon: '\u{1F4DD}', label: m.type, color: '#999' };
        const isEditing = editingIdx === i;
        return (
          <div
            key={m.id || i}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onClick={() => onEdit(i)}
            style={{
              ...s.card,
              borderLeftColor: meta.color || dayColor,
              background: isEditing ? '#FFF8F0' : '#fff',
              outline: isEditing ? `2px solid ${meta.color || dayColor}` : 'none',
            }}
          >
            <div style={s.dragHandle} title="Ziehen zum Sortieren">{'\u2630'}</div>
            <div style={{ ...s.iconBox, background: (meta.color || dayColor) + '18' }}>
              {m.iconImage ? (
                <img src={m.iconImage} alt="" style={s.iconImg} />
              ) : (
                <span style={{ fontSize: 20 }}>{m.icon || meta.icon}</span>
              )}
            </div>
            <div style={s.cardInfo}>
              <span style={s.cardTitle}>{m.title}</span>
              <div style={s.cardMeta}>
                <span style={{ ...s.typeBadge, background: (meta.color || dayColor) + '18', color: meta.color || dayColor }}>
                  {meta.label}
                </span>
                <span style={s.energy}>{'\u26A1'} {m.energyCost || 10}</span>
                {m.type === 'multi-step' && m.content?.subSteps && (
                  <span style={s.subCount}>{m.content.subSteps.length} Schritte</span>
                )}
              </div>
            </div>
            <div style={s.cardActions}>
              <button
                onClick={(e) => { e.stopPropagation(); if (i > 0) onReorder(i, i - 1); }}
                style={s.arrowBtn}
                disabled={i === 0}
                title="Nach oben"
              >
                {'\u25B2'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (i < missions.length - 1) onReorder(i, i + 1); }}
                style={s.arrowBtn}
                disabled={i === missions.length - 1}
                title="Nach unten"
              >
                {'\u25BC'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                style={s.deleteBtn}
                title="Loeschen"
              >
                {'\u{1F5D1}\uFE0F'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  empty: {
    textAlign: 'center', padding: '48px 20px',
    background: '#fff', borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  emptyTitle: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 700,
    color: '#555', margin: '12px 0 4px',
  },
  emptyHint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 500,
    color: '#999', margin: 0,
  },
  card: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderRadius: 14,
    border: '1px solid #EEE', borderLeft: '4px solid #FF6B35',
    background: '#fff', cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.2s',
  },
  dragHandle: {
    fontSize: 14, color: '#CCC', cursor: 'grab',
    padding: '4px', userSelect: 'none', flexShrink: 0,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    overflow: 'hidden',
  },
  iconImg: {
    width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, color: '#333',
    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardMeta: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
  },
  typeBadge: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700,
    padding: '2px 8px', borderRadius: 6,
  },
  energy: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600, color: '#FFB300',
  },
  subCount: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 500, color: '#999',
  },
  cardActions: {
    display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
  },
  arrowBtn: {
    width: 24, height: 20, border: 'none', borderRadius: 4,
    background: 'none', fontSize: 10, color: '#BBB',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 24, height: 24, border: 'none', borderRadius: 4,
    background: 'none', fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
