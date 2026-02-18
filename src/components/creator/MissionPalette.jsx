import React from 'react';

const PALETTE_CATEGORIES = [
  {
    label: 'Inhalte',
    icon: '\u{1F4DD}',
    items: [
      {
        type: 'activity',
        label: 'Aktivitaet',
        icon: '\u{1F4DD}',
        desc: 'Text, Aufgaben, Board',
        color: '#FF6B35',
        defaultContent: { title: 'Neue Aktivitaet', content: { title: 'Neue Aktivitaet', text: '' } },
      },
      {
        type: 'multi-step',
        label: 'Multi-Step',
        icon: '\u{1F4CB}',
        desc: 'Mehrere Teilschritte',
        color: '#00F5D4',
        defaultContent: { title: 'Neuer Multi-Step', content: { subSteps: [{ title: 'Schritt 1', subType: 'text', text: '' }] } },
      },
      {
        type: 'slides',
        label: 'Praesentation',
        icon: '\u{1F4CA}',
        desc: 'PDF-Folien anzeigen',
        color: '#00B4D8',
        defaultContent: { title: 'Praesentation', content: { slides: '', slideCount: 1 } },
      },
      {
        type: 'video',
        label: 'Video',
        icon: '\u{1F4FA}',
        desc: 'Video abspielen',
        color: '#9B5DE5',
        defaultContent: { title: 'Video', content: { src: '' } },
      },
    ],
  },
  {
    label: 'Interaktiv',
    icon: '\u{1F3AF}',
    items: [
      {
        type: 'kahoot',
        label: 'Quiz (Kahoot)',
        icon: '\u{1F3AF}',
        desc: 'Externes Quiz-Spiel',
        color: '#46178F',
        defaultContent: { title: 'Kahoot-Quiz', content: { url: '', label: 'Quiz starten!' } },
      },
      {
        type: 'einzelquiz',
        label: 'Einzelquiz',
        icon: '\u{1F4DD}',
        desc: 'Vortest oder Nachtest',
        color: '#FFD166',
        defaultContent: { title: 'Einzelquiz', content: { quizType: 'vortest', description: '' } },
      },
    ],
  },
  {
    label: 'Kommunikation',
    icon: '\u{1F4F9}',
    items: [
      {
        type: 'meet',
        label: 'Video-Call',
        icon: '\u{1F4F9}',
        desc: 'Online-Meeting starten',
        color: '#00897B',
        defaultContent: { title: 'Video-Call', content: { url: '', label: 'Jetzt sprechen!', description: '' } },
      },
    ],
  },
];

export default function MissionPalette({ onAdd }) {
  const handleDragStart = (e, item) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      source: 'palette',
      type: item.type,
      defaultContent: item.defaultContent,
    }));
  };

  const handleClick = (item) => {
    onAdd(item.type, { ...item.defaultContent, icon: item.icon });
  };

  return (
    <div style={s.container}>
      <h3 style={s.title}>Missionen</h3>
      <p style={s.hint}>Klicke um hinzuzufuegen</p>

      {PALETTE_CATEGORIES.map(cat => (
        <div key={cat.label} style={s.category}>
          <div style={s.catHeader}>
            <span>{cat.icon}</span>
            <span style={s.catLabel}>{cat.label}</span>
          </div>
          <div style={s.itemGrid}>
            {cat.items.map(item => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => handleClick(item)}
                style={s.item}
                title={item.desc}
              >
                <div style={{ ...s.itemIcon, background: item.color + '18' }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                </div>
                <div style={s.itemInfo}>
                  <span style={s.itemLabel}>{item.label}</span>
                  <span style={s.itemDesc}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  container: { padding: '16px' },
  title: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700,
    color: '#555', margin: '0 0 4px',
  },
  hint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 500,
    color: '#BBB', margin: '0 0 16px',
  },
  category: { marginBottom: 16 },
  catHeader: {
    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
  },
  catLabel: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700,
    color: '#999', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  itemGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
  item: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 12, cursor: 'pointer',
    border: '1.5px solid #EEE', background: '#FAFAFA',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  itemIcon: {
    width: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemInfo: {
    display: 'flex', flexDirection: 'column', minWidth: 0,
  },
  itemLabel: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, color: '#333',
  },
  itemDesc: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 500, color: '#999',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
};
