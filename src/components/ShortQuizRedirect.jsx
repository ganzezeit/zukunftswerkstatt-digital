import React, { useState, useEffect, Suspense, lazy } from 'react';
import { lookupShortCode } from '../utils/shortCode';

const EinzelquizPage = lazy(() => import('./EinzelquizPage'));

export default function ShortQuizRedirect({ code }) {
  const [quizId, setQuizId] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lookupShortCode(code)
      .then(id => {
        if (id) setQuizId(id);
        else setError(true);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [code]);

  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.text}>Laden...</div>
      </div>
    );
  }

  if (error || !quizId) {
    return (
      <div style={s.center}>
        <div style={s.errorCard}>
          <div style={{ fontSize: 48 }}>{'\u{1F50D}'}</div>
          <h2 style={s.errorTitle}>Quiz nicht gefunden</h2>
          <p style={s.errorHint}>Code "{code}" ist ungueltig oder abgelaufen.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div style={s.center}><div style={s.text}>Laden...</div></div>}>
      <EinzelquizPage quizId={quizId} />
    </Suspense>
  );
}

const s = {
  center: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, #FFE5D9 0%, #D4E4F7 100%)',
  },
  text: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 20,
    color: '#8B5A2B',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  errorCard: {
    background: '#fff',
    borderRadius: 24,
    padding: '40px 32px',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    maxWidth: 400,
  },
  errorTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: '#333',
    margin: '12px 0 8px',
  },
  errorHint: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    color: '#999',
    margin: 0,
  },
};
