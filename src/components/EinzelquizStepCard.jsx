import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { playClickSound, playSuccessSound } from '../utils/audio';

export default function EinzelquizStepCard({ step, dayColor, onComplete }) {
  const [matchingQuiz, setMatchingQuiz] = useState(null);
  const [matchingKey, setMatchingKey] = useState(null);
  const [loading, setLoading] = useState(true);

  const quizType = step.content?.quizType || 'vortest';

  useEffect(() => {
    const quizzesRef = ref(db, 'einzelquizzes');
    const unsub = onValue(quizzesRef, (snap) => {
      const data = snap.val();
      setLoading(false);
      if (!data) { setMatchingQuiz(null); setMatchingKey(null); return; }
      const entry = Object.entries(data).find(([, v]) => v.quizType === quizType);
      if (entry) {
        setMatchingKey(entry[0]);
        setMatchingQuiz(entry[1]);
      } else {
        setMatchingQuiz(null);
        setMatchingKey(null);
      }
    });
    return () => unsub();
  }, [quizType]);

  const quizUrl = matchingKey ? `${window.location.origin}/einzelquiz/${matchingKey}` : '';

  const handleDone = () => {
    playSuccessSound();
    onComplete();
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <span style={{ fontSize: 56 }}>{'\u{1F4DD}'}</span>
        <h2 style={{ ...s.title, color: dayColor }}>{step.title}</h2>

        {loading ? (
          <p style={s.desc}>Lade Quiz...</p>
        ) : matchingQuiz ? (
          <>
            <p style={s.desc}>
              Scannt den QR-Code mit eurem Handy und beantwortet die Fragen alleine.
            </p>
            <div style={s.qrBox}>
              <QRCodeSVG value={quizUrl} size={200} level="M" />
            </div>
            <div style={s.urlBox}>{quizUrl}</div>
            <p style={s.questionCount}>
              {matchingQuiz.questions?.length || 0} Fragen
            </p>
          </>
        ) : (
          <div style={s.noQuiz}>
            <p style={s.noQuizText}>
              Noch kein {quizType === 'vortest' ? 'Vortest' : 'Nachtest'} erstellt.
            </p>
            <p style={s.noQuizHint}>
              Erstelle einen im Quiz-Menü (Einzelquiz-Tab).
            </p>
          </div>
        )}

        <button onClick={handleDone} style={{ ...s.doneBtn, background: dayColor }}>
          Fertig {'\u2705'}
        </button>
      </div>
    </div>
  );
}

const s = {
  container: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(255, 250, 245, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1500,
    padding: 40,
  },
  card: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: 24,
    padding: '40px 48px',
    boxShadow: '0 6px 30px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    maxWidth: 500,
    textAlign: 'center',
    animation: 'popIn 0.4s ease-out',
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 28,
  },
  desc: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    color: '#444',
    fontWeight: 600,
    lineHeight: 1.5,
    margin: 0,
  },
  qrBox: {
    background: 'white',
    padding: 16,
    borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  urlBox: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    color: '#999',
    fontWeight: 500,
    wordBreak: 'break-all',
    maxWidth: 360,
  },
  questionCount: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: '#777',
    margin: 0,
  },
  noQuiz: {
    padding: '16px 20px',
    background: '#FFF3E0',
    borderRadius: 12,
  },
  noQuizText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#E67E22',
    margin: 0,
  },
  noQuizHint: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: '#999',
    margin: '4px 0 0',
  },
  doneBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    padding: '14px 44px',
    color: 'white',
    borderRadius: 40,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    marginTop: 8,
  },
};
