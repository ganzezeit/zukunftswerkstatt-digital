import React, { useState, useRef, useEffect } from 'react';

const API_URL = 'https://harmonious-taffy-89ea6b.netlify.app/.netlify/functions/generate-image';
const POLL_URL = 'https://harmonious-taffy-89ea6b.netlify.app/.netlify/functions/poll-image';
const ICON_SUFFIX = ', simple flat icon, transparent background, single object, clean minimal design, no text';

export default function IconGenerator({ onSelect, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]); // last N generated icons
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  // Fake progress bar
  useEffect(() => {
    if (!generating) { setProgress(0); return; }
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      setProgress(Math.min(92, ((Date.now() - start) / 15000) * 100));
    }, 200);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [generating]);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim() + ICON_SUFFIX,
          style: 'Illustration',
          aspectRatio: '1:1',
          model: 'schnell',
        }),
      });

      let data;
      try { data = await res.json(); } catch {
        setError('Antwort konnte nicht gelesen werden');
        setGenerating(false);
        return;
      }

      if (!res.ok) {
        setError(data.error === 'unsafe' ? 'Text nicht erlaubt. Bitte anders formulieren.' : (data.details || data.error || 'Fehler'));
        setGenerating(false);
        return;
      }

      if (data.imageUrl) {
        setHistory(prev => [data.imageUrl, ...prev].slice(0, 8));
        setProgress(100);
        setGenerating(false);
        return;
      }

      // Polling for async models
      if (data.status === 'processing' && data.pollUrl) {
        let polls = 0;
        while (polls < 60) {
          await new Promise(r => setTimeout(r, 2000));
          polls++;
          try {
            const pollRes = await fetch(POLL_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pollUrl: data.pollUrl }),
            });
            const pollData = await pollRes.json();
            if (pollData.status === 'succeeded' && pollData.imageUrl) {
              setHistory(prev => [pollData.imageUrl, ...prev].slice(0, 8));
              setProgress(100);
              setGenerating(false);
              return;
            }
            if (pollData.status === 'failed') {
              setError('Generierung fehlgeschlagen');
              setGenerating(false);
              return;
            }
            setProgress(Math.min(90, 30 + polls * 2));
          } catch { /* keep polling */ }
        }
        setError('Zeitüberschreitung');
        setGenerating(false);
      }
    } catch (err) {
      setError('Netzwerkfehler: ' + err.message);
      setGenerating(false);
    }
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h3 style={s.title}>{'\u{1F3A8}'} KI-Icon erstellen</h3>
          <button onClick={onClose} style={s.closeBtn}>{'\u2715'}</button>
        </div>

        {/* Prompt input */}
        <div style={s.inputRow}>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder="z.B. Kinderrechte, Musik, Natur..."
            style={s.input}
            disabled={generating}
            autoFocus
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            style={{
              ...s.genBtn,
              opacity: generating || !prompt.trim() ? 0.5 : 1,
            }}
          >
            {generating ? '\u23F3' : '\u2728'}
          </button>
        </div>

        {/* Progress */}
        {generating && (
          <div style={s.progressWrap}>
            <div style={{ ...s.progressBar, width: `${progress}%` }} />
            <span style={s.progressText}>Generiere Icon...</span>
          </div>
        )}

        {/* Error */}
        {error && <p style={s.error}>{'\u26A0\uFE0F'} {error}</p>}

        {/* Generated icons grid */}
        {history.length > 0 && (
          <div>
            <label style={s.label}>Generierte Icons (klicke zum Ausw\u00E4hlen)</label>
            <div style={s.grid}>
              {history.map((url, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(url)}
                  style={s.iconCard}
                  title="\u00DCbernehmen"
                >
                  <img src={url} alt="Icon" style={s.iconImg} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hint */}
        {history.length === 0 && !generating && (
          <p style={s.hint}>
            Beschreibe kurz, was das Icon zeigen soll.{'\n'}
            Es wird automatisch als einfaches, flaches Icon generiert.
          </p>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', zIndex: 9500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: '#fff', borderRadius: 20, padding: '20px 24px',
    width: 360, maxWidth: '92%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    maxHeight: '80vh', overflowY: 'auto',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 17, fontWeight: 700,
    color: '#333', margin: 0,
  },
  closeBtn: {
    width: 30, height: 30, border: 'none', borderRadius: 8,
    background: '#F5F5F5', fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999',
  },
  inputRow: { display: 'flex', gap: 8 },
  input: {
    flex: 1, padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, color: '#333', outline: 'none',
    boxSizing: 'border-box',
  },
  genBtn: {
    width: 44, height: 44, border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    fontSize: 20, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  progressWrap: {
    position: 'relative', height: 24, background: '#F5F0EB',
    borderRadius: 12, marginTop: 10, overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute', top: 0, left: 0, height: '100%',
    background: 'linear-gradient(90deg, #FF6B35, #FFD166)',
    borderRadius: 12, transition: 'width 0.3s ease',
  },
  progressText: {
    position: 'relative', zIndex: 1, fontFamily: "'Fredoka', sans-serif",
    fontSize: 11, fontWeight: 600, color: '#8B5A2B',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%',
  },
  error: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600,
    color: '#D32F2F', margin: '8px 0 0', padding: '6px 10px',
    background: '#FFEBEE', borderRadius: 8,
  },
  label: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600,
    color: '#888', display: 'block', margin: '12px 0 6px',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
  },
  iconCard: {
    aspectRatio: '1', border: '2px solid #EEE', borderRadius: 12,
    background: '#FAFAFA', cursor: 'pointer', padding: 4,
    overflow: 'hidden', display: 'flex', alignItems: 'center',
    justifyContent: 'center', transition: 'border-color 0.2s, transform 0.15s',
  },
  iconImg: {
    width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8,
  },
  hint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 500,
    color: '#999', textAlign: 'center', margin: '20px 0 8px',
    lineHeight: 1.5, whiteSpace: 'pre-line',
  },
};
