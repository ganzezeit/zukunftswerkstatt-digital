import React, { useState, useEffect } from 'react';
import { listClassesWithDetails, deleteClass, sanitizeClassName } from '../utils/firebasePersistence';
import { DAYS } from '../data/days';

function computeProgress(state) {
  if (!state || !state.completedSteps) return { dayNumber: 1, percentage: 0 };
  const totalSteps = DAYS.reduce((sum, d) => sum + d.steps.length, 0);
  const doneCount = Object.keys(state.completedSteps).length;
  const percentage = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  // Find current day number based on completed days
  const completedDays = Array.isArray(state.completedDays) ? state.completedDays.length : 0;
  const dayNumber = Math.min(completedDays + 1, DAYS.length);
  return { dayNumber, percentage };
}

function formatGermanDate(timestamp) {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={s.confirmOverlay} onClick={onCancel}>
      <div style={s.confirmCard} onClick={(e) => e.stopPropagation()}>
        <p style={s.confirmText}>{message}</p>
        <div style={s.confirmButtons}>
          <button style={s.confirmCancel} onClick={onCancel}>Abbrechen</button>
          <button style={s.confirmDelete} onClick={onConfirm}>L{'\u00f6'}schen</button>
        </div>
      </div>
    </div>
  );
}

export default function ClassSetupScreen({ onClassSelected }) {
  const [name, setName] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchClasses = () => {
    setLoading(true);
    listClassesWithDetails().then((list) => {
      setClasses(list);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleSubmit = () => {
    const sanitized = sanitizeClassName(name);
    if (!sanitized) return;
    onClassSelected(sanitized);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteClass(deleteTarget);
    setDeleteTarget(null);
    fetchClasses();
  };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.emoji}>{'\u{1F30D}'}</div>
        <h1 style={s.title}>Willkommen zur Projektwoche!</h1>
        <p style={s.subtitle}>
          W{'\u00e4'}hle eine Klasse oder erstelle eine neue
        </p>

        <div style={s.inputRow}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="z.B. 4b"
            style={s.input}
            autoFocus
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!sanitizeClassName(name)}
          style={{
            ...s.submitBtn,
            opacity: sanitizeClassName(name) ? 1 : 0.5,
          }}
        >
          Neue Klasse starten
        </button>

        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>Vorhandene Klassen</span>
          <div style={s.dividerLine} />
        </div>

        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <span style={s.loadingText}>Klassen werden geladen...</span>
          </div>
        ) : classes.length === 0 ? (
          <p style={s.emptyText}>Noch keine Klassen vorhanden.</p>
        ) : (
          <div style={s.classList}>
            {classes.map((cls) => {
              const { dayNumber, percentage } = computeProgress(cls.state);
              const dateStr = formatGermanDate(cls.lastUpdated);
              return (
                <div key={cls.name} style={s.classRow}>
                  <div style={s.classInfo}>
                    <span style={s.className}>{cls.name}</span>
                    {dateStr && (
                      <span style={s.classMeta}>Zuletzt aktiv: {dateStr}</span>
                    )}
                    <span style={s.classMeta}>Tag {dayNumber} — {percentage}%</span>
                  </div>
                  <div style={s.classActions}>
                    <button
                      style={s.continueBtn}
                      onClick={() => onClassSelected(cls.name)}
                    >
                      Fortsetzen
                    </button>
                    <button
                      style={s.trashBtn}
                      onClick={() => setDeleteTarget(cls.name)}
                      title="Klasse l\u00f6schen"
                    >
                      {'\u{1F5D1}\uFE0F'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={`Klasse "${deleteTarget}" wirklich l\u00f6schen? Alle Fortschritte gehen verloren.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

const s = {
  wrapper: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, #FFE5D9 0%, #D4E4F7 100%)',
    padding: 20,
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  card: {
    background: 'white',
    borderRadius: 24,
    padding: '36px 32px',
    maxWidth: 520,
    width: '100%',
    boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    boxSizing: 'border-box',
    maxHeight: '92vh',
    overflowY: 'auto',
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 28,
    color: '#FF6B35',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    color: '#666',
    fontWeight: 500,
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.5,
  },
  inputRow: {
    width: '100%',
    marginTop: 4,
  },
  input: {
    width: '100%',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 20,
    fontWeight: 600,
    padding: '12px 16px',
    border: '2px solid rgba(0,0,0,0.1)',
    borderRadius: 14,
    outline: 'none',
    background: '#FAFAFA',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    padding: '14px 24px',
    background: '#FF6B35',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
  },
  divider: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#ddd',
  },
  dividerText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: '#aaa',
    whiteSpace: 'nowrap',
  },
  classList: {
    width: '100%',
    maxHeight: 320,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  classRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#FAFAFA',
    border: '1.5px solid #eee',
    borderRadius: 16,
    padding: '12px 16px',
    gap: 12,
  },
  classInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
    flex: 1,
  },
  className: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#333',
  },
  classMeta: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: '#888',
  },
  classActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  continueBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    padding: '8px 16px',
    background: '#00B4D8',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  trashBtn: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 8,
    opacity: 0.5,
    transition: 'opacity 0.2s',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '20px 0',
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid #eee',
    borderTopColor: '#FF6B35',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    color: '#aaa',
    fontWeight: 600,
  },
  emptyText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    color: '#aaa',
    fontWeight: 500,
    textAlign: 'center',
    margin: '8px 0',
  },
  // Confirm dialog
  confirmOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  confirmCard: {
    background: 'white',
    borderRadius: 20,
    padding: '28px 24px',
    maxWidth: 380,
    width: '90%',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  confirmText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 17,
    fontWeight: 600,
    color: '#333',
    margin: '0 0 20px 0',
    lineHeight: 1.5,
  },
  confirmButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  confirmCancel: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    padding: '10px 24px',
    background: '#F0F0F0',
    color: '#555',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
  confirmDelete: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    padding: '10px 24px',
    background: '#E53935',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
};
