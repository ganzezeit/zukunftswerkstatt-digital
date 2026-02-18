import React, { useState, useRef, useEffect } from 'react';

const API_URL = 'https://harmonious-taffy-89ea6b.netlify.app/.netlify/functions/generate-image';
const POLL_URL = 'https://harmonious-taffy-89ea6b.netlify.app/.netlify/functions/poll-image';
const REMBG_URL = 'https://harmonious-taffy-89ea6b.netlify.app/.netlify/functions/remove-bg';
const ICON_SUFFIX = ', simple flat icon, single centered object, clean minimal design, solid white background, professional app icon, no text, no borders';

const MODEL_OPTIONS = [
  { value: 'schnell', label: 'Schnell', desc: '~10 Sek.' },
  { value: 'quality', label: 'Hochwertig', desc: '~30 Sek.' },
];

export default function IconGenerator({ onSelect, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('schnell');
  const [phase, setPhase] = useState(null); // null | 'generating' | 'removing-bg' | 'done'
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState(null);
  const [currentIcon, setCurrentIcon] = useState(null); // final transparent PNG
  const [rawImage, setRawImage] = useState(null); // before bg removal
  const [history, setHistory] = useState([]); // last 4 icons
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);
  const abortRef = useRef(false);

  const isWorking = phase === 'generating' || phase === 'removing-bg';

  // Animated progress bar
  useEffect(() => {
    if (!isWorking) { setProgress(0); return; }
    const duration = phase === 'generating' ? (model === 'schnell' ? 12000 : 30000) : 15000;
    const start = Date.now();
    setProgress(0);
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(92, (elapsed / duration) * 100));
    }, 200);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [phase, model, isWorking]);

  // Generate image, then auto-remove background
  const handleGenerate = async () => {
    if (!prompt.trim() || isWorking) return;
    abortRef.current = false;
    setError(null);
    setCurrentIcon(null);
    setRawImage(null);
    setPhase('generating');
    setStatusText('Bild wird erstellt...');

    try {
      // Step 1: Generate image
      const imageUrl = await generateImage();
      if (abortRef.current || !imageUrl) return;

      setRawImage(imageUrl);
      setPhase('removing-bg');
      setStatusText('Hintergrund wird entfernt...');

      // Step 2: Remove background
      const transparentUrl = await removeBackground(imageUrl);
      if (abortRef.current) return;

      const finalUrl = transparentUrl || imageUrl;
      setCurrentIcon(finalUrl);
      setHistory(prev => [finalUrl, ...prev.filter(u => u !== finalUrl)].slice(0, 4));
      setProgress(100);
      setPhase('done');
      setStatusText('');

    } catch (err) {
      if (!abortRef.current) {
        setError('Fehler: ' + err.message);
        setPhase(null);
        setStatusText('');
      }
    }
  };

  const generateImage = async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.trim() + ICON_SUFFIX,
        style: 'Illustration',
        aspectRatio: '1:1',
        model,
      }),
    });

    let data;
    try { data = await res.json(); } catch {
      throw new Error('Antwort konnte nicht gelesen werden');
    }

    if (!res.ok) {
      if (data.error === 'unsafe') throw new Error('Text nicht erlaubt. Bitte anders formulieren.');
      throw new Error(data.details || data.error || 'Generierung fehlgeschlagen');
    }

    if (data.imageUrl) return data.imageUrl;

    // Polling for async models
    if (data.status === 'processing' && data.pollUrl) {
      let polls = 0;
      while (polls < 60 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 2000));
        polls++;
        try {
          const pollRes = await fetch(POLL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pollUrl: data.pollUrl }),
          });
          const pollData = await pollRes.json();
          if (pollData.status === 'succeeded' && pollData.imageUrl) return pollData.imageUrl;
          if (pollData.status === 'failed') throw new Error('Generierung fehlgeschlagen');
        } catch (e) {
          if (e.message === 'Generierung fehlgeschlagen') throw e;
        }
      }
      throw new Error('Zeitüberschreitung');
    }

    throw new Error('Unerwartete Antwort');
  };

  const removeBackground = async (imageUrl) => {
    try {
      const res = await fetch(REMBG_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      if (!res.ok) {
        console.warn('BG removal failed, using original');
        return null;
      }

      const data = await res.json();
      return data.outputUrl || null;
    } catch (err) {
      console.warn('BG removal error:', err);
      return null; // Fallback to original image
    }
  };

  const handleClose = () => {
    abortRef.current = true;
    onClose();
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h3 style={s.title}>{'\u{1F3A8}'} KI-Icon erstellen</h3>
          <button onClick={handleClose} style={s.closeBtn}>{'\u2715'}</button>
        </div>

        {/* Prompt input */}
        <div style={s.inputRow}>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder="z.B. Kinderrechte, Musik, Natur..."
            style={s.input}
            disabled={isWorking}
            autoFocus
          />
        </div>

        {/* Model selector */}
        <div style={s.modelRow}>
          {MODEL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => !isWorking && setModel(opt.value)}
              style={{
                ...s.modelBtn,
                ...(model === opt.value ? s.modelBtnActive : {}),
                opacity: isWorking ? 0.6 : 1,
              }}
              disabled={isWorking}
            >
              <span style={s.modelLabel}>{opt.label}</span>
              <span style={s.modelDesc}>{opt.desc}</span>
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isWorking || !prompt.trim()}
          style={{
            ...s.generateBtn,
            opacity: isWorking || !prompt.trim() ? 0.5 : 1,
          }}
        >
          {isWorking ? statusText : (currentIcon ? 'Nochmal generieren' : 'Generieren')}
        </button>

        {/* Progress bar */}
        {isWorking && (
          <div style={s.progressWrap}>
            <div style={{ ...s.progressBar, width: `${progress}%` }} />
            <span style={s.progressText}>{statusText}</span>
          </div>
        )}

        {/* Error */}
        {error && <p style={s.error}>{'\u26A0\uFE0F'} {error}</p>}

        {/* Current result with checkerboard */}
        {currentIcon && !isWorking && (
          <div style={s.resultSection}>
            <div style={s.checkerboard}>
              <img src={currentIcon} alt="Icon" style={s.resultImg} />
            </div>
            <button
              onClick={() => onSelect(currentIcon)}
              style={s.applyBtn}
            >
              {'\u2705'} Übernehmen
            </button>
          </div>
        )}

        {/* History grid */}
        {history.length > 0 && (
          <div>
            <label style={s.label}>Letzte Icons</label>
            <div style={s.grid}>
              {history.map((url, i) => (
                <button
                  key={url + i}
                  onClick={() => onSelect(url)}
                  style={{
                    ...s.historyCard,
                    outline: currentIcon === url ? '2px solid #FF6B35' : 'none',
                  }}
                  title={'\u00DCbernehmen'}
                >
                  <div style={s.historyCheckerboard}>
                    <img src={url} alt="Icon" style={s.historyImg} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hint */}
        {history.length === 0 && !isWorking && !currentIcon && (
          <p style={s.hint}>
            Beschreibe kurz, was das Icon zeigen soll.{'\n'}
            Der Hintergrund wird automatisch transparent gemacht.
          </p>
        )}
      </div>
    </div>
  );
}

// Checkerboard pattern as CSS background
const CHECKER = 'repeating-conic-gradient(#E0E0E0 0% 25%, #fff 0% 50%) 0 0 / 16px 16px';

const s = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', zIndex: 9500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: '#fff', borderRadius: 20, padding: '20px 24px',
    width: 380, maxWidth: '92%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    maxHeight: '85vh', overflowY: 'auto',
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
  inputRow: { marginBottom: 8 },
  input: {
    width: '100%', padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, color: '#333', outline: 'none',
    boxSizing: 'border-box',
  },
  // Model selector
  modelRow: { display: 'flex', gap: 6, marginBottom: 10 },
  modelBtn: {
    flex: 1, padding: '6px 10px', border: '2px solid #E0E0E0', borderRadius: 10,
    background: '#FAFAFA', cursor: 'pointer', textAlign: 'center',
    transition: 'all 0.2s',
  },
  modelBtnActive: {
    borderColor: '#FF6B35', background: '#FFF3E0',
  },
  modelLabel: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700,
    color: '#333', display: 'block',
  },
  modelDesc: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 10, fontWeight: 500,
    color: '#999', display: 'block',
  },
  // Generate button
  generateBtn: {
    width: '100%', padding: '10px', border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 14,
    fontWeight: 700, cursor: 'pointer', marginBottom: 8,
  },
  // Progress
  progressWrap: {
    position: 'relative', height: 26, background: '#F5F0EB',
    borderRadius: 12, marginBottom: 8, overflow: 'hidden',
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
    color: '#D32F2F', margin: '0 0 8px', padding: '6px 10px',
    background: '#FFEBEE', borderRadius: 8,
  },
  // Result
  resultSection: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px', background: '#F9F9F9', borderRadius: 14,
    marginBottom: 10,
  },
  checkerboard: {
    width: 80, height: 80, borderRadius: 12, overflow: 'hidden',
    background: CHECKER, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #E0E0E0',
  },
  resultImg: {
    width: '100%', height: '100%', objectFit: 'contain',
  },
  applyBtn: {
    flex: 1, padding: '10px 14px', border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
    color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
  },
  // History
  label: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600,
    color: '#888', display: 'block', margin: '8px 0 6px',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
  },
  historyCard: {
    aspectRatio: '1', border: '2px solid #EEE', borderRadius: 12,
    cursor: 'pointer', padding: 0, overflow: 'hidden',
    transition: 'border-color 0.2s, transform 0.15s',
    background: 'none',
  },
  historyCheckerboard: {
    width: '100%', height: '100%', background: CHECKER,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  historyImg: {
    width: '100%', height: '100%', objectFit: 'contain',
  },
  hint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 500,
    color: '#999', textAlign: 'center', margin: '16px 0 4px',
    lineHeight: 1.5, whiteSpace: 'pre-line',
  },
};
