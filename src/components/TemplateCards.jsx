import React, { useState, useEffect } from 'react';
import { listTemplates, loadLocalTemplate, saveTemplateToFirebase } from '../utils/templateLoader';

const SDG_INFO = {
  1: { emoji: '\u{1F6AB}', name: 'Keine Armut' },
  2: { emoji: '\u{1F35E}', name: 'Kein Hunger' },
  3: { emoji: '\u2764\uFE0F', name: 'Gesundheit' },
  4: { emoji: '\u{1F4DA}', name: 'Bildung' },
  5: { emoji: '\u2696\uFE0F', name: 'Gleichstellung' },
  6: { emoji: '\u{1F4A7}', name: 'Sauberes Wasser' },
  7: { emoji: '\u26A1', name: 'Energie' },
  8: { emoji: '\u{1F4BC}', name: 'Gute Arbeit' },
  9: { emoji: '\u{1F3ED}', name: 'Innovation' },
  10: { emoji: '\u{1F91D}', name: 'Weniger Ungleichheit' },
  11: { emoji: '\u{1F3D8}\uFE0F', name: 'Nachhaltige Staedte' },
  12: { emoji: '\u267B\uFE0F', name: 'Nachhaltiger Konsum' },
  13: { emoji: '\u{1F30D}', name: 'Klimaschutz' },
  14: { emoji: '\u{1F41F}', name: 'Leben im Wasser' },
  15: { emoji: '\u{1F333}', name: 'Leben an Land' },
  16: { emoji: '\u{1F54A}\uFE0F', name: 'Frieden' },
  17: { emoji: '\u{1F91D}', name: 'Partnerschaften' },
};

export default function TemplateCards({ onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const local = loadLocalTemplate();

        // Try remote templates
        let remoteList = [];
        try {
          remoteList = await listTemplates();
        } catch {
          // Firebase unavailable — local fallback is fine
        }

        if (cancelled) return;

        // If no templates in Firebase, seed the example template
        if (remoteList.length === 0) {
          try {
            await saveTemplateToFirebase(local);
            remoteList = [
              {
                id: local.id,
                title: local.title,
                description: local.description,
                duration: local.duration,
                targetAge: local.targetAge,
                sdgs: local.sdgs || [],
                tags: local.tags || [],
                createdBy: local.createdBy || '',
                version: local.version,
                _isLocal: true,
              },
            ];
          } catch {
            // Seed failed — just use local
            remoteList = [];
          }
        }

        if (cancelled) return;

        // Build merged list: local first if not already in remote
        const localEntry = {
          id: local.id,
          title: local.title,
          description: local.description,
          duration: local.duration,
          targetAge: local.targetAge,
          sdgs: local.sdgs || [],
          tags: local.tags || [],
          createdBy: local.createdBy || '',
          version: local.version,
          _isLocal: true,
        };

        const remoteIds = new Set(remoteList.map((t) => t.id));
        const merged = remoteIds.has(localEntry.id)
          ? remoteList.map((t) =>
              t.id === localEntry.id ? { ...t, _isLocal: true } : t
            )
          : [localEntry, ...remoteList];

        setTemplates(merged);
      } catch (err) {
        console.error('[TemplateCards] Load error:', err);
        if (!cancelled) setError('Vorlagen konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={cs.loadingBox}>
        <div style={cs.spinner} />
        <span style={cs.loadingText}>Vorlagen laden...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={cs.errorBox}>
        {'\u26A0\uFE0F'} {error}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div style={cs.emptyBox}>
        <span style={{ fontSize: 40 }}>{'\u{1F4DA}'}</span>
        <p style={cs.emptyText}>Keine Vorlagen verfuegbar.</p>
      </div>
    );
  }

  return (
    <div style={cs.grid}>
      {templates.map((t) => (
        <div key={t.id} style={cs.card}>
          <div style={cs.cardHeader}>
            <h3 style={cs.cardTitle}>{t.title}</h3>
            {t._isLocal && <span style={cs.offlineBadge}>Offline</span>}
          </div>

          {t.description && <p style={cs.cardDesc}>{t.description}</p>}

          <div style={cs.metaRow}>
            {t.duration > 0 && (
              <span style={cs.metaChip}>
                {'\u{1F4C5}'} {t.duration} Tage
              </span>
            )}
            {t.targetAge && (
              <span style={cs.metaChip}>
                {'\u{1F9D2}'} {t.targetAge} Jahre
              </span>
            )}
            {t.version && <span style={cs.metaChip}>v{t.version}</span>}
          </div>

          {t.sdgs && t.sdgs.length > 0 && (
            <div style={cs.sdgRow}>
              {t.sdgs.map((num) => (
                <span
                  key={num}
                  style={cs.sdgChip}
                  title={SDG_INFO[num]?.name || `SDG ${num}`}
                >
                  {SDG_INFO[num]?.emoji || '\u{1F30D}'} SDG {num}
                </span>
              ))}
            </div>
          )}

          {t.tags && t.tags.length > 0 && (
            <div style={cs.tagRow}>
              {t.tags.slice(0, 5).map((tag) => (
                <span key={tag} style={cs.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {t.createdBy && <p style={cs.createdBy}>{t.createdBy}</p>}

          <button style={cs.selectButton} onClick={() => onSelect(t)}>
            Auswaehlen
          </button>
        </div>
      ))}
    </div>
  );
}

const cs = {
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  loadingBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  spinner: {
    width: 24,
    height: 24,
    border: '3px solid #E0D6CC',
    borderTopColor: '#FF6B35',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    color: '#8B5A2B',
    fontWeight: 500,
  },
  errorBox: {
    background: '#FFF3E0',
    borderRadius: 14,
    padding: '14px 20px',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    color: '#E65100',
    fontWeight: 500,
    textAlign: 'center',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '32px 20px',
  },
  emptyText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    color: '#555',
    margin: '8px 0 0',
    fontWeight: 600,
  },
  card: {
    background: '#FAFAFA',
    borderRadius: 16,
    padding: '18px 20px',
    border: '1.5px solid #EEE',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 17,
    fontWeight: 700,
    color: '#333',
    margin: 0,
    flex: 1,
  },
  offlineBadge: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    color: '#2E7D32',
    background: '#E8F5E9',
    padding: '2px 8px',
    borderRadius: 6,
    border: '1.5px solid #C8E6C9',
    whiteSpace: 'nowrap',
    marginLeft: 8,
  },
  cardDesc: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    color: '#666',
    lineHeight: 1.5,
    margin: '0 0 10px',
  },
  metaRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaChip: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: '#8B5A2B',
    background: 'rgba(255, 107, 53, 0.08)',
    padding: '3px 8px',
    borderRadius: 6,
  },
  sdgRow: {
    display: 'flex',
    gap: 5,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  sdgChip: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: '#1565C0',
    background: '#E3F2FD',
    padding: '2px 7px',
    borderRadius: 6,
  },
  tagRow: {
    display: 'flex',
    gap: 5,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 10,
    fontWeight: 500,
    color: '#777',
    background: '#F0F0F0',
    padding: '2px 7px',
    borderRadius: 5,
  },
  createdBy: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    color: '#999',
    margin: '0 0 10px',
    fontWeight: 500,
  },
  selectButton: {
    width: '100%',
    padding: '11px',
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    color: '#fff',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(255, 107, 53, 0.25)',
  },
};
