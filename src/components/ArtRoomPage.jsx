import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, push, set } from 'firebase/database';
import { db } from '../firebase';

const API_URL = 'https://harmonious-taffy-89ea6b.netlify.app/.netlify/functions/generate-image';

const DEVICE_LANG = (() => {
  const raw = (navigator.language || navigator.languages?.[0] || 'en').slice(0, 2).toLowerCase();
  return ['de', 'en', 'tr', 'sw', 'fr'].includes(raw) ? raw : 'en';
})();

const UI = {
  de: {
    title: 'KI-Kunststudio',
    joinTitle: 'KI-Kunststudio beitreten',
    nameLabel: 'Dein Name:',
    join: 'Beitreten',
    placeholder: 'Was m\u00F6chtest du erstellen? Beschreibe dein Bild...',
    generate: 'Bild erstellen!',
    loading: 'KI erstellt dein Bild...',
    unsafe: 'Dieser Text ist nicht erlaubt. Bitte versuche etwas anderes!',
    gallery: 'Galerie',
    closed: 'Dieser Raum existiert nicht oder ist geschlossen.',
    paused: 'Bildgenerierung ist gerade pausiert.',
    chars: 'Zeichen',
    by: 'von',
  },
  en: {
    title: 'AI Art Studio',
    joinTitle: 'Join AI Art Studio',
    nameLabel: 'Your Name:',
    join: 'Join',
    placeholder: 'What do you want to create? Describe your image...',
    generate: 'Create Image!',
    loading: 'AI is creating your image...',
    unsafe: 'This text is not allowed. Please try something else!',
    gallery: 'Gallery',
    closed: 'This room does not exist or is closed.',
    paused: 'Image generation is currently paused.',
    chars: 'chars',
    by: 'by',
  },
  tr: {
    title: 'Yapay Zeka Sanat St\u00FCdyosu',
    joinTitle: 'Yapay Zeka Sanat St\u00FCdyosuna Kat\u0131l',
    nameLabel: 'Ad\u0131n:',
    join: 'Kat\u0131l',
    placeholder: 'Ne olu\u015Fturmak istiyorsun? Resmini a\u00E7\u0131kla...',
    generate: 'Resim Olu\u015Ftur!',
    loading: 'Yapay zeka resminizi olu\u015Fturuyor...',
    unsafe: 'Bu metin izin verilmiyor. L\u00FCtfen ba\u015Fka bir \u015Fey deneyin!',
    gallery: 'Galeri',
    closed: 'Bu oda mevcut de\u011Fil veya kapal\u0131.',
    paused: 'Resim olu\u015Fturma \u015Fu anda duraklat\u0131ld\u0131.',
    chars: 'karakter',
    by: '\u2013',
  },
  sw: {
    title: 'Studio ya Sanaa ya AI',
    joinTitle: 'Jiunge na Studio ya Sanaa ya AI',
    nameLabel: 'Jina lako:',
    join: 'Jiunge',
    placeholder: 'Unataka kuunda nini? Eleza picha yako...',
    generate: 'Tengeneza Picha!',
    loading: 'AI inatengeneza picha yako...',
    unsafe: 'Maandishi haya hayaruhusiwi. Tafadhali jaribu kitu kingine!',
    gallery: 'Picha',
    closed: 'Chumba hiki hakipo au kimefungwa.',
    paused: 'Utengenezaji wa picha umesimamishwa kwa sasa.',
    chars: 'herufi',
    by: 'na',
  },
  fr: {
    title: 'Studio d\'Art IA',
    joinTitle: 'Rejoindre le Studio d\'Art IA',
    nameLabel: 'Ton nom :',
    join: 'Rejoindre',
    placeholder: 'Que voulez-vous cr\u00E9er ? D\u00E9crivez votre image...',
    generate: 'Cr\u00E9er l\'image !',
    loading: 'L\'IA cr\u00E9e votre image...',
    unsafe: 'Ce texte n\'est pas autoris\u00E9. Essayez autre chose !',
    gallery: 'Galerie',
    closed: 'Cette salle n\'existe pas ou est ferm\u00E9e.',
    paused: 'La g\u00E9n\u00E9ration d\'images est actuellement en pause.',
    chars: 'caract\u00E8res',
    by: 'par',
  },
};

const STYLES = [
  { id: 'illustration', label: 'Illustration', emoji: '\u{1F58C}\uFE0F', color: '#FFE0B2' },
  { id: 'photo', label: 'Foto', emoji: '\u{1F4F7}', color: '#B3E5FC' },
  { id: 'cartoon', label: 'Cartoon', emoji: '\u{1F3AD}', color: '#F8BBD0' },
  { id: 'watercolor', label: 'Aquarell', emoji: '\u{1F3A8}', color: '#C8E6C9' },
  { id: 'pixel', label: 'Pixel Art', emoji: '\u{1F47E}', color: '#D1C4E9' },
  { id: '3d', label: '3D', emoji: '\u{1F9CA}', color: '#B2EBF2' },
];

const RATIOS = ['1:1', '16:9', '9:16'];

export default function ArtRoomPage({ code }) {
  const t = UI[DEVICE_LANG];
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState(() => localStorage.getItem('artroom-author') || '');
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem('artroom-author'));
  const [nameInput, setNameInput] = useState('');

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('illustration');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedModel, setSelectedModel] = useState('schnell');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [sharedGallery, setSharedGallery] = useState([]);
  const [previewImg, setPreviewImg] = useState(null);
  const progressRef = useRef(null);

  // Inject animations
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'artroom-anims';
    style.textContent = `
      @keyframes artRainbow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      @keyframes artFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      @keyframes artPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // Override global overflow for mobile scrolling
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'artroom-scroll-fix';
    style.textContent = `html, body, #root { overflow: auto !important; height: auto !important; min-height: 100vh !important; position: static !important; -webkit-overflow-scrolling: touch !important; }`;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // Subscribe to room data
  useEffect(() => {
    const roomRef = ref(db, 'artRooms/' + code);
    const unsub = onValue(roomRef, (snap) => {
      setRoom(snap.val());
      setLoading(false);
    });
    return () => unsub();
  }, [code]);

  // Subscribe to shared gallery
  useEffect(() => {
    const imgsRef = ref(db, 'artRooms/' + code + '/images');
    const unsub = onValue(imgsRef, (snap) => {
      const data = snap.val();
      if (!data) { setSharedGallery([]); return; }
      const list = Object.entries(data).map(([k, v]) => ({ id: k, ...v }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setSharedGallery(list);
    });
    return () => unsub();
  }, [code]);

  // Fake progress
  useEffect(() => {
    if (!generating) { setProgress(0); return; }
    setProgress(0);
    const start = Date.now();
    const dur = selectedModel === 'schnell' ? 15000 : 30000;
    progressRef.current = setInterval(() => {
      const pct = Math.min(95, ((Date.now() - start) / dur) * 100);
      setProgress(pct);
    }, 200);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [generating, selectedModel]);

  const handleSetName = (e) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem('artroom-author', name);
    setAuthor(name);
    setNameSet(true);
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);

    const styleName = STYLES.find(s => s.id === selectedStyle)?.label || 'illustration';

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style: styleName, aspectRatio: selectedRatio, model: selectedModel }),
      });

      let data;
      try { data = await res.json(); } catch {
        setError(`HTTP ${res.status}`);
        setGenerating(false);
        return;
      }

      if (!res.ok) {
        setError(data.error === 'unsafe' ? 'unsafe' : (data.details || data.error || `HTTP ${res.status}`));
        setGenerating(false);
        return;
      }

      setProgress(100);

      // Save to Firebase shared gallery
      await push(ref(db, 'artRooms/' + code + '/images'), {
        imageUrl: data.imageUrl,
        prompt: prompt.trim(),
        enhancedPrompt: data.enhancedPrompt || '',
        author,
        createdAt: Date.now(),
        style: styleName,
      });

      setPrompt('');
    } catch (err) {
      setError(err.message);
    }

    setGenerating(false);
  }, [prompt, selectedStyle, selectedRatio, selectedModel, generating, code, author]);

  // Loading
  if (loading) {
    return (
      <div style={st.page}>
        <div style={st.centerBox}>
          <div style={{ fontSize: 40, animation: 'artPulse 1.5s ease-in-out infinite' }}>{'\u{1F3A8}'}</div>
          <div style={st.loadingText}>Laden...</div>
        </div>
      </div>
    );
  }

  // Room not found or inactive
  if (!room || !room.active) {
    return (
      <div style={st.page}>
        <div style={st.centerBox}>
          <div style={{ fontSize: 48 }}>{'\u{1F6AB}'}</div>
          <p style={st.closedText}>{t.closed}</p>
        </div>
      </div>
    );
  }

  // Name entry
  if (!nameSet) {
    return (
      <div style={st.page}>
        <div style={st.joinCard}>
          <div style={{ fontSize: 48, textAlign: 'center' }}>{'\u{1F3A8}'}</div>
          <h1 style={st.joinTitle}>{t.joinTitle}</h1>
          <form onSubmit={handleSetName} style={st.joinForm}>
            <label style={st.joinLabel}>{t.nameLabel}</label>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              style={st.joinInput}
              maxLength={20}
              autoFocus
              placeholder="Max, Lina, Ali..."
            />
            <button type="submit" disabled={!nameInput.trim()} style={{
              ...st.joinBtn,
              opacity: nameInput.trim() ? 1 : 0.5,
            }}>{t.join}</button>
          </form>
        </div>
      </div>
    );
  }

  const isPaused = room.settings && !room.settings.imageEnabled;

  // Main studio
  return (
    <div style={st.page}>
      <div style={st.studio}>
        {/* Header */}
        <div style={st.header}>
          <h1 style={st.title}>{'\u{1F3A8}'} {t.title}</h1>
          <span style={st.authorBadge}>{author}</span>
        </div>

        {/* Generation paused */}
        {isPaused && (
          <div style={st.pausedBox}>{'\u23F8\uFE0F'} {t.paused}</div>
        )}

        {/* Prompt + controls */}
        {!isPaused && (
          <>
            <div style={st.promptWrap}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value.slice(0, 300))}
                placeholder={t.placeholder}
                style={st.textarea}
                maxLength={300}
                rows={3}
              />
              <div style={st.charCount}>{prompt.length}/300 {t.chars}</div>
            </div>

            <div style={st.chipsRow}>
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  style={{
                    ...st.chip,
                    background: selectedStyle === s.id ? s.color : 'rgba(255,255,255,0.08)',
                    border: selectedStyle === s.id ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
                    color: selectedStyle === s.id ? '#1a0a2e' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span style={st.chipLabel}>{s.label}</span>
                </button>
              ))}
            </div>

            <div style={st.ratioRow}>
              {RATIOS.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRatio(r)}
                  style={{
                    ...st.ratioPill,
                    background: selectedRatio === r ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                    border: selectedRatio === r ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.1)',
                  }}
                >{r}</button>
              ))}
            </div>

            {/* Model selector */}
            <div style={st.modelRow}>
              <button
                onClick={() => setSelectedModel('schnell')}
                style={{
                  ...st.modelBtn,
                  background: selectedModel === 'schnell' ? 'rgba(78,205,196,0.2)' : 'rgba(255,255,255,0.05)',
                  border: selectedModel === 'schnell' ? '2px solid rgba(78,205,196,0.5)' : '2px solid rgba(255,255,255,0.1)',
                  color: selectedModel === 'schnell' ? '#4ECDC4' : 'rgba(255,255,255,0.5)',
                }}
              >
                {'\u26A1'} Schnell
              </button>
              <button
                onClick={() => setSelectedModel('quality')}
                style={{
                  ...st.modelBtn,
                  background: selectedModel === 'quality' ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                  border: selectedModel === 'quality' ? '2px solid rgba(167,139,250,0.5)' : '2px solid rgba(255,255,255,0.1)',
                  color: selectedModel === 'quality' ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                }}
              >
                {'\u2728'} Qualit\u00E4t
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              style={{
                ...st.generateBtn,
                opacity: (!prompt.trim() || generating) ? 0.5 : 1,
                cursor: (!prompt.trim() || generating) ? 'default' : 'pointer',
              }}
            >
              {'\u2728'} {generating ? t.loading : t.generate}
            </button>

            {generating && (
              <div style={st.loadingWrap}>
                <div style={{ fontSize: 40, animation: 'artPulse 1.5s ease-in-out infinite' }}>{'\u{1F58C}\uFE0F'}</div>
                <div style={st.loadingText}>{t.loading}</div>
                <div style={st.progressBar}>
                  <div style={{ ...st.progressFill, width: progress + '%' }} />
                </div>
              </div>
            )}

            {error && !generating && (
              <div style={st.errorBox}>
                {error === 'unsafe' ? t.unsafe : error}
              </div>
            )}
          </>
        )}

        {/* Shared gallery */}
        {sharedGallery.length > 0 && (
          <div style={st.gallerySection}>
            <h3 style={st.galTitle}>{t.gallery} ({sharedGallery.length})</h3>
            <div style={st.galGrid}>
              {sharedGallery.map(img => (
                <div key={img.id} style={st.galCard} onClick={() => setPreviewImg(img)}>
                  <img src={img.imageUrl} alt={img.prompt} style={st.galImg} />
                  <div style={st.galMeta}>
                    <span style={st.galAuthor}>{img.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview overlay */}
      {previewImg && (
        <div style={st.previewOverlay} onClick={() => setPreviewImg(null)}>
          <img src={previewImg.imageUrl} alt={previewImg.prompt} style={st.previewImg} onClick={e => e.stopPropagation()} />
          <div style={st.previewInfo} onClick={e => e.stopPropagation()}>
            <p style={st.previewPrompt}>"{previewImg.prompt}"</p>
            <p style={st.previewAuthor}>{t.by} {previewImg.author}</p>
          </div>
          <button style={st.previewClose} onClick={() => setPreviewImg(null)}>{'\u2715'}</button>
        </div>
      )}
    </div>
  );
}

const st = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0a2e, #0B0D1A)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Fredoka', sans-serif",
  },
  centerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: 16,
  },
  loadingText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
  },
  closedText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    padding: '0 32px',
    margin: 0,
  },
  joinCard: {
    marginTop: '20vh',
    width: '90%',
    maxWidth: 380,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: '32px 24px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  joinTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    color: 'white',
    margin: 0,
    textAlign: 'center',
  },
  joinForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  joinLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
  },
  joinInput: {
    padding: '12px 16px',
    fontSize: 18,
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    color: 'white',
    background: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(255,255,255,0.15)',
    borderRadius: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  joinBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    padding: '12px',
    border: 'none',
    borderRadius: 14,
    color: 'white',
    background: 'linear-gradient(135deg, #A78BFA, #4ECDC4)',
    cursor: 'pointer',
    marginTop: 4,
  },
  studio: {
    width: '100%',
    maxWidth: 520,
    padding: '16px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    color: 'white',
    margin: 0,
  },
  authorBadge: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: '#A78BFA',
    background: 'rgba(167,139,250,0.15)',
    padding: '4px 12px',
    borderRadius: 12,
  },
  pausedBox: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: '#FFE66D',
    background: 'rgba(255,230,109,0.1)',
    border: '1px solid rgba(255,230,109,0.3)',
    borderRadius: 14,
    padding: '12px 16px',
    textAlign: 'center',
  },
  promptWrap: { position: 'relative' },
  textarea: {
    width: '100%',
    minHeight: 70,
    padding: '12px 14px',
    fontSize: 15,
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    color: 'white',
    background: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
  },
  charCount: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.3)',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    borderRadius: 16,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  chipLabel: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 700,
  },
  ratioRow: {
    display: 'flex',
    gap: 6,
    justifyContent: 'center',
  },
  ratioPill: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.7)',
    padding: '5px 14px',
    borderRadius: 16,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  modelRow: {
    display: 'flex',
    gap: 6,
    justifyContent: 'center',
  },
  modelBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    padding: '7px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  generateBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    padding: '12px 20px',
    border: 'none',
    borderRadius: 16,
    color: 'white',
    background: 'linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #A78BFA, #FF6B6B)',
    backgroundSize: '200% 100%',
    animation: 'artRainbow 4s ease infinite',
    width: '100%',
    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '16px 0',
  },
  progressBar: {
    width: '80%',
    height: 5,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4ECDC4, #A78BFA)',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  errorBox: {
    fontSize: 14,
    fontWeight: 600,
    color: '#FF6B6B',
    background: 'rgba(255,107,107,0.1)',
    border: '1px solid rgba(255,107,107,0.3)',
    borderRadius: 12,
    padding: '10px 14px',
    textAlign: 'center',
  },
  gallerySection: {
    marginTop: 8,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: 14,
  },
  galTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 17,
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 10px',
  },
  galGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 8,
  },
  galCard: {
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    border: '2px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    transition: 'border-color 0.15s ease',
  },
  galImg: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    display: 'block',
  },
  galMeta: {
    padding: '4px 8px',
  },
  galAuthor: {
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
  },
  previewOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.92)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    gap: 12,
  },
  previewImg: {
    maxWidth: '92%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: 14,
  },
  previewInfo: {
    textAlign: 'center',
    padding: '0 20px',
  },
  previewPrompt: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    margin: '0 0 4px',
    fontStyle: 'italic',
  },
  previewAuthor: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: '#A78BFA',
    margin: 0,
  },
  previewClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: 'white',
    fontSize: 20,
    width: 38,
    height: 38,
    borderRadius: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
