import React, { useState, useEffect } from 'react';

// SDG icons mapping (UN SDG numbers → emoji + short name)
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
  11: { emoji: '\u{1F3D8}\uFE0F', name: 'Nachhaltige Städte' },
  12: { emoji: '\u267B\uFE0F', name: 'Nachhaltiger Konsum' },
  13: { emoji: '\u{1F30D}', name: 'Klimaschutz' },
  14: { emoji: '\u{1F41F}', name: 'Leben im Wasser' },
  15: { emoji: '\u{1F333}', name: 'Leben an Land' },
  16: { emoji: '\u{1F54A}\uFE0F', name: 'Frieden' },
  17: { emoji: '\u{1F91D}', name: 'Partnerschaften' },
};

export default function TemplateSelector({ onSelect, onSkip }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Load local template (always available)
        const { loadLocalTemplate } = await import('../utils/templateLoader');
        const local = loadLocalTemplate();
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

        // Try loading remote templates
        let remoteTemplates = [];
        try {
          const { listTemplates } = await import('../utils/templateLoader');
          remoteTemplates = await listTemplates();
        } catch {
          // Firebase unavailable — that's fine, local template is enough
        }

        if (cancelled) return;

        // Merge: local first, then remote (skip duplicates by id)
        const remoteIds = new Set(remoteTemplates.map(t => t.id));
        const merged = remoteIds.has(localEntry.id)
          ? remoteTemplates.map(t => t.id === localEntry.id ? { ...t, _isLocal: true } : t)
          : [localEntry, ...remoteTemplates];

        setTemplates(merged);
      } catch (err) {
        console.error('[TemplateSelector] Load error:', err);
        if (!cancelled) setError('Vorlagen konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = async (template) => {
    if (template._isLocal) {
      // Use local template directly — no Firebase fetch needed
      const { loadLocalTemplate } = await import('../utils/templateLoader');
      onSelect(loadLocalTemplate());
    } else {
      // Load full template from Firebase
      const { loadTemplateFromFirebase } = await import('../utils/templateLoader');
      const full = await loadTemplateFromFirebase(template.id);
      if (full) {
        onSelect(full);
      } else {
        setError('Vorlage konnte nicht geladen werden.');
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.headerSection}>
          <h1 style={styles.title}>{'\u{1F3AF}'} Vorlage wählen</h1>
          <p style={styles.subtitle}>Wähle eine Workshop-Vorlage für deine Projektwoche</p>
        </div>

        {loading && (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <span style={styles.loadingText}>Vorlagen laden...</span>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <span>{'\u26A0\uFE0F'} {error}</span>
          </div>
        )}

        {!loading && templates.length === 0 && !error && (
          <div style={styles.emptyBox}>
            <span style={{ fontSize: 40 }}>{'\u{1F4DA}'}</span>
            <p style={styles.emptyText}>Keine Vorlagen verfügbar.</p>
          </div>
        )}

        <div style={styles.grid}>
          {templates.map(t => (
            <div key={t.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{t.title}</h3>
                {t._isLocal && <span style={styles.offlineBadge}>Offline</span>}
              </div>

              {t.description && (
                <p style={styles.cardDesc}>{t.description}</p>
              )}

              <div style={styles.metaRow}>
                {t.duration > 0 && (
                  <span style={styles.metaChip}>
                    {'\u{1F4C5}'} {t.duration} Tage
                  </span>
                )}
                {t.targetAge && (
                  <span style={styles.metaChip}>
                    {'\u{1F9D2}'} {t.targetAge} Jahre
                  </span>
                )}
                {t.version && (
                  <span style={styles.metaChip}>
                    v{t.version}
                  </span>
                )}
              </div>

              {t.sdgs && t.sdgs.length > 0 && (
                <div style={styles.sdgRow}>
                  {t.sdgs.map(num => (
                    <span key={num} style={styles.sdgChip} title={SDG_INFO[num]?.name || `SDG ${num}`}>
                      {SDG_INFO[num]?.emoji || '\u{1F30D}'} SDG {num}
                    </span>
                  ))}
                </div>
              )}

              {t.tags && t.tags.length > 0 && (
                <div style={styles.tagRow}>
                  {t.tags.slice(0, 5).map(tag => (
                    <span key={tag} style={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}

              {t.createdBy && (
                <p style={styles.createdBy}>{t.createdBy}</p>
              )}

              <button style={styles.selectButton} onClick={() => handleSelect(t)}>
                Starten
              </button>
            </div>
          ))}
        </div>

        {onSkip && (
          <button style={styles.skipButton} onClick={onSkip}>
            Standard-Vorlage verwenden
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, #FFE5D9 0%, #D4E4F7 100%)',
    padding: '40px 20px',
    boxSizing: 'border-box',
  },
  content: {
    maxWidth: 700,
    width: '100%',
  },
  headerSection: {
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 32,
    color: '#8B5A2B',
    margin: 0,
  },
  subtitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    color: '#999',
    margin: '8px 0 0',
    fontWeight: 500,
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
    marginBottom: 16,
  },
  emptyBox: {
    textAlign: 'center',
    padding: '48px 20px',
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 4px 16px rgba(139, 90, 43, 0.06)',
  },
  emptyText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    color: '#555',
    margin: '12px 0 0',
    fontWeight: 600,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '24px',
    boxShadow: '0 4px 16px rgba(139, 90, 43, 0.08)',
    border: '1px solid rgba(255, 166, 107, 0.12)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: '#333',
    margin: 0,
    flex: 1,
  },
  offlineBadge: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: '#2E7D32',
    background: '#E8F5E9',
    padding: '3px 10px',
    borderRadius: 8,
    border: '1.5px solid #C8E6C9',
    whiteSpace: 'nowrap',
    marginLeft: 8,
  },
  cardDesc: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    color: '#666',
    lineHeight: 1.5,
    margin: '0 0 12px',
  },
  metaRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metaChip: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: '#8B5A2B',
    background: 'rgba(255, 107, 53, 0.08)',
    padding: '4px 10px',
    borderRadius: 8,
  },
  sdgRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  sdgChip: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: '#1565C0',
    background: '#E3F2FD',
    padding: '3px 8px',
    borderRadius: 8,
  },
  tagRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: '#777',
    background: '#F5F5F5',
    padding: '3px 8px',
    borderRadius: 6,
  },
  createdBy: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    color: '#999',
    margin: '0 0 12px',
    fontWeight: 500,
  },
  selectButton: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    color: '#fff',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(255, 107, 53, 0.3)',
  },
  skipButton: {
    display: 'block',
    width: '100%',
    padding: '14px',
    border: '2px solid #E0D6CC',
    borderRadius: 14,
    background: '#fff',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: '#8B5A2B',
    cursor: 'pointer',
    marginTop: 16,
    textAlign: 'center',
  },
};
