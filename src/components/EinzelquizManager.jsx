import React, { useState, useEffect } from 'react';
import { ref, push, set, remove, onValue } from 'firebase/database';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { useProject } from '../contexts/ProjectContext';
import { DEFAULT_EINZELQUIZ_QUESTIONS, QUIZ_TYPE_LABELS, QUIZ_TYPE_COLORS } from '../data/einzelquizQuestions';
import EinzelquizCreator from './EinzelquizCreator';
import EinzelquizResults from './EinzelquizResults';
import EinzelquizComparison from './EinzelquizComparison';
import QuizRandomizer from './QuizRandomizer';
import { generateShortCode, saveShortCode } from '../utils/shortCode';

function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel, danger }) {
  return (
    <div style={s.confirmOverlay}>
      <div style={s.confirmCard}>
        <p style={s.confirmText}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onConfirm} style={{ ...s.confirmBtn, background: danger ? '#E74C3C' : '#2980B9' }}>
            {confirmLabel}
          </button>
          <button onClick={onCancel} style={s.confirmCancelBtn}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

export default function EinzelquizManager({ dayColor, projectId: propProjectId }) {
  const { projectId: ctxProjectId } = useProject();
  const projectId = propProjectId || ctxProjectId;
  const [quizzes, setQuizzes] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' | 'create' | 'edit' | 'results' | 'comparison' | 'randomize'
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [resultsQuizId, setResultsQuizId] = useState(null);
  const [resultsQuiz, setResultsQuiz] = useState(null);
  const [expandedQR, setExpandedQR] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const color = dayColor || '#2980B9';

  useEffect(() => {
    const quizzesRef = ref(db, 'einzelquizzes');
    const unsub = onValue(quizzesRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data)
          .map(([key, val]) => ({ ...val, _key: key }))
          .filter(item => item.projectId === projectId);
        list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
        setQuizzes(list);
      } else {
        setQuizzes([]);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleCreateDefault = async (quizType) => {
    const label = QUIZ_TYPE_LABELS[quizType] || quizType;
    const shortCode = generateShortCode();
    const newRef = push(ref(db, 'einzelquizzes'));
    try {
      await set(newRef, {
        title: `${label} \u2014 Kinderrechte`,
        quizType,
        shortCode,
        showCorrectAfterEach: false,
        questions: DEFAULT_EINZELQUIZ_QUESTIONS.map(q => ({ ...q })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        projectId: projectId || null,
      });
      await saveShortCode(shortCode, newRef.key);
    } catch (e) { console.error(e); }
  };

  const handleSaveNew = async (quizData) => {
    const shortCode = generateShortCode();
    const newRef = push(ref(db, 'einzelquizzes'));
    try {
      await set(newRef, {
        ...quizData,
        shortCode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        projectId: projectId || null,
      });
      await saveShortCode(shortCode, newRef.key);
    } catch (e) { console.error(e); }
    setMode('list');
  };

  const handleSaveEdit = (quizData) => {
    if (!editingQuiz?._key) return;
    set(ref(db, 'einzelquizzes/' + editingQuiz._key), {
      ...quizData,
      createdAt: editingQuiz.createdAt || Date.now(),
      updatedAt: Date.now(),
      projectId: editingQuiz.projectId || projectId || null,
    }).catch(console.error);
    setEditingQuiz(null);
    setMode('list');
  };

  const handleDelete = (quizKey) => {
    setConfirm({
      message: 'Einzelquiz und alle Ergebnisse endgültig löschen?',
      confirmLabel: 'Löschen',
      danger: true,
      onConfirm: () => {
        remove(ref(db, 'einzelquizzes/' + quizKey)).catch(console.error);
        remove(ref(db, 'einzelquizResults/' + quizKey)).catch(console.error);
        setConfirm(null);
      },
    });
  };

  // Find vortest and nachtest for comparison
  const vortest = quizzes.find(q => q.quizType === 'vortest');
  const nachtest = quizzes.find(q => q.quizType === 'nachtest');

  // --- CREATE MODE ---
  if (mode === 'create') {
    return (
      <EinzelquizCreator
        quiz={null}
        onSave={handleSaveNew}
        onCancel={() => setMode('list')}
        dayColor={color}
      />
    );
  }

  // --- EDIT MODE ---
  if (mode === 'edit' && editingQuiz) {
    return (
      <EinzelquizCreator
        quiz={editingQuiz}
        onSave={handleSaveEdit}
        onCancel={() => { setEditingQuiz(null); setMode('list'); }}
        dayColor={color}
      />
    );
  }

  // --- RESULTS MODE ---
  if (mode === 'results' && resultsQuizId) {
    return (
      <EinzelquizResults
        quizId={resultsQuizId}
        quiz={resultsQuiz}
        dayColor={color}
        onClose={() => { setResultsQuizId(null); setResultsQuiz(null); setMode('list'); }}
      />
    );
  }

  // --- RANDOMIZE MODE ---
  if (mode === 'randomize') {
    return (
      <QuizRandomizer
        mode="einzelquiz"
        dayColor={color}
        onGenerate={async (result) => {
          const shortCode = generateShortCode();
          const newRef = push(ref(db, 'einzelquizzes'));
          try {
            await set(newRef, {
              title: result.title,
              quizType: 'uebung',
              shortCode,
              showCorrectAfterEach: true,
              questions: result.questions,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              projectId: projectId || null,
            });
            await saveShortCode(shortCode, newRef.key);
          } catch (e) { console.error(e); }
          setMode('list');
        }}
        onCancel={() => setMode('list')}
      />
    );
  }

  // --- COMPARISON MODE ---
  if (mode === 'comparison' && vortest && nachtest) {
    return (
      <EinzelquizComparison
        vortestId={vortest._key}
        nachtestId={nachtest._key}
        vortestQuiz={vortest}
        nachtestQuiz={nachtest}
        dayColor={color}
        onClose={() => setMode('list')}
      />
    );
  }

  // --- LIST MODE ---
  return (
    <div style={s.container}>
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Quick create */}
      <div style={s.quickSection}>
        <div style={s.quickLabel}>Schnell erstellen:</div>
        <div style={s.quickRow}>
          {!vortest && (
            <button onClick={() => handleCreateDefault('vortest')} style={{ ...s.quickBtn, background: QUIZ_TYPE_COLORS.vortest }}>
              + Standard-Vortest
            </button>
          )}
          {!nachtest && (
            <button onClick={() => handleCreateDefault('nachtest')} style={{ ...s.quickBtn, background: QUIZ_TYPE_COLORS.nachtest }}>
              + Standard-Nachtest
            </button>
          )}
          <button onClick={() => setMode('create')} style={{ ...s.quickBtn, background: color }}>
            + Eigenes Quiz
          </button>
          <button onClick={() => setMode('randomize')} style={{ ...s.quickBtn, background: '#8E44AD' }}>
            {'\u{1F3B2}'} Zufallsquiz
          </button>
        </div>
      </div>

      {/* Comparison button */}
      {vortest && nachtest && (
        <button onClick={() => setMode('comparison')} style={s.compareBtn}>
          {'\u{1F4CA}'} Vortest vs Nachtest vergleichen
        </button>
      )}

      {/* Quiz list */}
      {quizzes.length > 0 && (
        <div style={s.list}>
          {quizzes.map(q => {
            const typeColor = QUIZ_TYPE_COLORS[q.quizType] || '#999';
            const typeLabel = QUIZ_TYPE_LABELS[q.quizType] || q.quizType;
            const qCount = q.questions?.length || 0;
            const date = q.updatedAt
              ? new Date(q.updatedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
              : '';
            const quizUrl = q.shortCode
              ? `${window.location.origin}/q/${q.shortCode}`
              : `${window.location.origin}/einzelquiz/${q._key}`;
            const isExpanded = expandedQR === q._key;

            return (
              <div key={q._key} style={s.listItem}>
                <div style={s.listItemHeader}>
                  <div style={s.listItemInfo}>
                    <div style={s.listItemRow}>
                      <span style={{ ...s.listTypeBadge, background: typeColor }}>{typeLabel}</span>
                      <span style={s.listTitle}>{q.title}</span>
                    </div>
                    <div style={s.listMeta}>{date} · {qCount} Frage{qCount !== 1 ? 'n' : ''}</div>
                  </div>
                </div>

                <div style={s.listActions}>
                  <button onClick={() => setExpandedQR(isExpanded ? null : q._key)} style={s.actionBtn}>
                    {isExpanded ? 'QR \u25B2' : 'QR \u25BC'}
                  </button>
                  <button
                    onClick={() => { setResultsQuizId(q._key); setResultsQuiz(q); setMode('results'); }}
                    style={{ ...s.actionBtn, background: '#E8F5E9', color: '#2E7D32' }}
                  >
                    Ergebnisse
                  </button>
                  <button
                    onClick={() => { setEditingQuiz(q); setMode('edit'); }}
                    style={{ ...s.actionBtn, background: '#E3F2FD', color: '#1976D2' }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(q._key)}
                    style={{ ...s.actionBtn, background: '#FFEBEE', color: '#C62828' }}
                  >
                    Löschen
                  </button>
                </div>

                {isExpanded && (
                  <div style={s.qrSection}>
                    <QRCodeSVG value={quizUrl} size={160} level="M" />
                    <div style={s.qrUrl}>{quizUrl}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {quizzes.length === 0 && (
        <div style={s.emptyCard}>
          <p style={s.emptyText}>Noch keine Einzelquizze erstellt.</p>
          <p style={s.emptyHint}>Erstelle einen Standard-Vortest oder ein eigenes Quiz.</p>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 12 },
  quickSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  quickLabel: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color: '#999' },
  quickRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  quickBtn: { fontFamily: "'Lilita One', cursive", fontSize: 15, padding: '10px 16px', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap' },
  compareBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #2980B9, #27AE60)',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    textAlign: 'center',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  listItem: {
    background: '#F8F8F8',
    borderRadius: 14,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  listItemHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  listItemInfo: { flex: 1, minWidth: 0 },
  listItemRow: { display: 'flex', alignItems: 'center', gap: 6 },
  listTypeBadge: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: 'white',
    padding: '2px 8px',
    borderRadius: 6,
    flexShrink: 0,
  },
  listTitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listMeta: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    color: '#999',
    fontWeight: 500,
    marginTop: 2,
  },
  listActions: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  actionBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 10px',
    background: 'rgba(0,0,0,0.04)',
    color: '#555',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '12px 0',
  },
  qrUrl: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    color: '#999',
    fontWeight: 500,
    wordBreak: 'break-all',
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyCard: { padding: '24px 16px', background: '#F8F8F8', borderRadius: 12, textAlign: 'center' },
  emptyText: { fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 600, color: '#999', margin: 0 },
  emptyHint: { fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 500, color: '#BBB', margin: '4px 0 0' },
  // Confirm dialog
  confirmOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: {
    background: 'white',
    borderRadius: 20,
    padding: '32px 28px',
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  confirmText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    color: '#333',
    fontWeight: 600,
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.5,
  },
  confirmBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
  },
  confirmCancelBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    padding: '10px 20px',
    background: 'rgba(0,0,0,0.06)',
    color: '#666',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
  },
};
