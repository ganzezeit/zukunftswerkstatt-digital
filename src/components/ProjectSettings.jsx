import React, { useState, useEffect, useRef } from 'react';
import { ref, push, set, onValue } from 'firebase/database';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { DEFAULT_EINZELQUIZ_QUESTIONS, QUIZ_TYPE_LABELS, QUIZ_TYPE_COLORS } from '../data/einzelquizQuestions';
import { generateShortCode, saveShortCode, assignShortCode } from '../utils/shortCode';
import EinzelquizManager from './EinzelquizManager';

export default function ProjectSettings({ project, onBack }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const migratedRef = useRef(new Set());

  useEffect(() => {
    const quizzesRef = ref(db, 'einzelquizzes');
    const unsub = onValue(quizzesRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data)
          .map(([key, val]) => ({ ...val, _key: key }))
          .filter(item => item.projectId === project.id);
        setQuizzes(list);
        // Auto-migrate: assign short codes to quizzes that lack one
        list.forEach(q => {
          if (!q.shortCode && !migratedRef.current.has(q._key)) {
            migratedRef.current.add(q._key);
            assignShortCode(q._key).catch(console.error);
          }
        });
      } else {
        setQuizzes([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [project.id]);

  const vortest = quizzes.find(q => q.quizType === 'vortest');
  const nachtest = quizzes.find(q => q.quizType === 'nachtest');

  const handleQuickCreate = async (quizType) => {
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
        projectId: project.id,
      });
      await saveShortCode(shortCode, newRef.key);
    } catch (e) { console.error(e); }
  };

  return (
    <div style={s.container}>
      <div style={s.content}>
        {/* Header */}
        <div style={s.header}>
          <button onClick={onBack} style={s.backButton}>
            {'\u2190'} Zurueck
          </button>
          <div style={s.headerInfo}>
            <h1 style={s.title}>{project.name} einrichten</h1>
            <p style={s.subtitle}>
              Klasse {project.className}
              {project.studentCount > 0 ? ` \u00B7 ${project.studentCount} Kinder` : ''}
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Checkliste vor dem Start</h2>

          {loading ? (
            <p style={s.loadingText}>Laden...</p>
          ) : (
            <div style={s.checklistItems}>
              <ChecklistItem
                label="Vortest"
                quiz={vortest}
                color={QUIZ_TYPE_COLORS.vortest}
                onQuickCreate={() => handleQuickCreate('vortest')}
              />
              <ChecklistItem
                label="Nachtest"
                quiz={nachtest}
                color={QUIZ_TYPE_COLORS.nachtest}
                onQuickCreate={() => handleQuickCreate('nachtest')}
              />
            </div>
          )}
        </div>

        {/* Full quiz manager */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Alle Quizze verwalten</h2>
          <EinzelquizManager dayColor="#FF6B35" projectId={project.id} />
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ label, quiz, color, onQuickCreate }) {
  const [copied, setCopied] = useState(false);
  const ready = !!quiz;
  const shortCode = quiz?.shortCode;
  const shortUrl = shortCode ? `${window.location.origin}/q/${shortCode}` : null;
  const shortPath = shortCode ? `/q/${shortCode}` : null;

  const handleCopy = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  if (!ready) {
    return (
      <div style={s.checklistRow}>
        <div style={s.checklistLeft}>
          <span style={{ ...s.checkIcon, color: '#E74C3C' }}>{'\u274C'}</span>
          <span style={s.checkLabel}>{label}</span>
        </div>
        <button onClick={onQuickCreate} style={{ ...s.quickCreateBtn, background: color }}>
          Jetzt erstellen
        </button>
      </div>
    );
  }

  return (
    <div style={s.readyCard}>
      {/* Top row: status */}
      <div style={s.readyHeader}>
        <div style={s.checklistLeft}>
          <span style={{ ...s.checkIcon, color: '#27AE60' }}>{'\u2705'}</span>
          <span style={s.checkLabel}>{label}</span>
          <span style={s.checkMeta}>{quiz.questions?.length || 0} Fragen</span>
        </div>
        <span style={s.readyPill}>Bereit</span>
      </div>

      {/* Link + QR section */}
      {shortCode ? (
        <div style={s.linkSection}>
          <div style={s.linkLeft}>
            <div style={s.linkLabel}>Link fuer Schueler:</div>
            <div style={s.linkRow}>
              <code style={s.linkCode}>{shortPath}</code>
              <button onClick={handleCopy} style={s.copyBtn}>
                {copied ? 'Kopiert!' : 'Kopieren'}
              </button>
            </div>
            <div style={s.linkFull}>{shortUrl}</div>
          </div>
          <div style={s.qrBox}>
            <QRCodeSVG value={shortUrl} size={80} level="M" />
          </div>
        </div>
      ) : (
        <div style={s.linkPending}>Link wird generiert...</div>
      )}
    </div>
  );
}

const s = {
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
    maxWidth: 800,
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 28,
  },
  backButton: {
    padding: '10px 18px',
    border: '2px solid #E0D6CC',
    borderRadius: 14,
    background: '#fff',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: '#8B5A2B',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 28,
    color: '#8B5A2B',
    margin: 0,
  },
  subtitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    color: '#999',
    margin: '4px 0 0',
    fontWeight: 500,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '24px 28px',
    marginBottom: 20,
    boxShadow: '0 4px 16px rgba(139, 90, 43, 0.08)',
    border: '1px solid rgba(255, 166, 107, 0.12)',
  },
  cardTitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#555',
    margin: '0 0 16px',
  },
  loadingText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    color: '#999',
    margin: 0,
  },
  checklistItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  // Not-ready row
  checklistRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#F8F8F8',
    borderRadius: 14,
  },
  checklistLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: { fontSize: 20 },
  checkLabel: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#333',
  },
  checkMeta: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: '#999',
  },
  quickCreateBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 14,
    padding: '8px 16px',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  // Ready card with link
  readyCard: {
    background: '#F0FAF0',
    borderRadius: 14,
    padding: '12px 16px',
    border: '1.5px solid rgba(39, 174, 96, 0.2)',
  },
  readyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  readyPill: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 10,
    background: '#E8F5E9',
    color: '#2E7D32',
  },
  linkSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: '#fff',
    borderRadius: 12,
    padding: '12px 14px',
    border: '1px solid #E8E8E8',
  },
  linkLeft: {
    flex: 1,
    minWidth: 0,
  },
  linkLabel: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: '#999',
    marginBottom: 4,
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  linkCode: {
    fontFamily: "'Baloo 2', monospace",
    fontSize: 20,
    fontWeight: 700,
    color: '#333',
    letterSpacing: 1,
  },
  copyBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    background: '#E3F2FD',
    color: '#1976D2',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  linkFull: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    color: '#BBB',
    wordBreak: 'break-all',
  },
  qrBox: {
    flexShrink: 0,
    padding: 4,
    background: '#fff',
    borderRadius: 8,
  },
  linkPending: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    padding: '8px 0 0',
  },
};
