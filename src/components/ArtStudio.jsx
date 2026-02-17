import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ref, set, onValue, remove } from 'firebase/database';
import { db } from '../firebase';

const API_URL = 'https://harmonious-taffy-89ea6b.netlify.app/.netlify/functions/generate-image';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const DEVICE_LANG = (() => {
  const raw = (navigator.language || navigator.languages?.[0] || 'en').slice(0, 2).toLowerCase();
  return ['de', 'en', 'tr', 'sw', 'fr'].includes(raw) ? raw : 'en';
})();

const UI = {
  de: {
    title: 'KI-Kunststudio',
    placeholder: 'Was m\u00F6chtest du erstellen? Beschreibe dein Bild...',
    generate: 'Bild erstellen!',
    loading: 'KI erstellt dein Bild...',
    save: 'Speichern',
    retry: 'Nochmal',
    unsafe: 'Dieser Text ist nicht erlaubt. Bitte versuche etwas anderes! \u{1F648}',
    error: 'Etwas ist schiefgelaufen. Bitte versuche es nochmal.',
    gallery: 'Deine Bilder',
    close: 'Schlie\u00DFen',
    chars: 'Zeichen',
    createRoom: 'Raum erstellen',
    closeRoom: 'Raum schlie\u00DFen',
    studentGallery: 'Sch\u00FCler-Galerie',
    noImages: 'Noch keine Bilder',
    pause: 'Pausieren',
    resume: 'Fortsetzen',
    by: 'von',
  },
  en: {
    title: 'AI Art Studio',
    placeholder: 'What do you want to create? Describe your image...',
    generate: 'Create Image!',
    loading: 'AI is creating your image...',
    save: 'Save',
    retry: 'Try Again',
    unsafe: 'This text is not allowed. Please try something else! \u{1F648}',
    error: 'Something went wrong. Please try again.',
    gallery: 'Your Images',
    close: 'Close',
    chars: 'chars',
    createRoom: 'Create Room',
    closeRoom: 'Close Room',
    studentGallery: 'Student Gallery',
    noImages: 'No images yet',
    pause: 'Pause',
    resume: 'Resume',
    by: 'by',
  },
  tr: {
    title: 'Yapay Zeka Sanat St\u00FCdyosu',
    placeholder: 'Ne olu\u015Fturmak istiyorsun? Resmini a\u00E7\u0131kla...',
    generate: 'Resim Olu\u015Ftur!',
    loading: 'Yapay zeka resminizi olu\u015Fturuyor...',
    save: 'Kaydet',
    retry: 'Tekrar Dene',
    unsafe: 'Bu metin izin verilmiyor. L\u00FCtfen ba\u015Fka bir \u015Fey deneyin! \u{1F648}',
    error: 'Bir \u015Feyler ters gitti. L\u00FCtfen tekrar deneyin.',
    gallery: 'Resimlerin',
    close: 'Kapat',
    chars: 'karakter',
    createRoom: 'Oda Olu\u015Ftur',
    closeRoom: 'Oday\u0131 Kapat',
    studentGallery: '\u00D6\u011Frenci Galerisi',
    noImages: 'Hen\u00FCz resim yok',
    pause: 'Duraklat',
    resume: 'Devam Et',
    by: '\u2013',
  },
  sw: {
    title: 'Studio ya Sanaa ya AI',
    placeholder: 'Unataka kuunda nini? Eleza picha yako...',
    generate: 'Tengeneza Picha!',
    loading: 'AI inatengeneza picha yako...',
    save: 'Hifadhi',
    retry: 'Jaribu Tena',
    unsafe: 'Maandishi haya hayaruhusiwi. Tafadhali jaribu kitu kingine! \u{1F648}',
    error: 'Kitu kilienda vibaya. Tafadhali jaribu tena.',
    gallery: 'Picha Zako',
    close: 'Funga',
    chars: 'herufi',
    createRoom: 'Unda Chumba',
    closeRoom: 'Funga Chumba',
    studentGallery: 'Picha za Wanafunzi',
    noImages: 'Hakuna picha bado',
    pause: 'Simamisha',
    resume: 'Endelea',
    by: 'na',
  },
  fr: {
    title: 'Studio d\'Art IA',
    placeholder: 'Que voulez-vous cr\u00E9er ? D\u00E9crivez votre image...',
    generate: 'Cr\u00E9er l\'image !',
    loading: 'L\'IA cr\u00E9e votre image...',
    save: 'Enregistrer',
    retry: 'R\u00E9essayer',
    unsafe: 'Ce texte n\'est pas autoris\u00E9. Essayez autre chose ! \u{1F648}',
    error: 'Quelque chose s\'est mal pass\u00E9. Veuillez r\u00E9essayer.',
    gallery: 'Vos Images',
    close: 'Fermer',
    chars: 'caract\u00E8res',
    createRoom: 'Cr\u00E9er une Salle',
    closeRoom: 'Fermer la Salle',
    studentGallery: 'Galerie des \u00E9l\u00E8ves',
    noImages: 'Pas encore d\'images',
    pause: 'Pause',
    resume: 'Reprendre',
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

export default function ArtStudio({ onClose, initialMode }) {
  const t = UI[DEVICE_LANG];
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('illustration');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedModel, setSelectedModel] = useState('schnell');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [previewImg, setPreviewImg] = useState(null);
  const progressRef = useRef(null);

  // Room state
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('artroom-teacher-code') || '');
  const [room, setRoom] = useState(null);
  const [studentImages, setStudentImages] = useState([]);
  const [showRoom, setShowRoom] = useState(initialMode === 'room');

  // Inject animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'art-studio-anims';
    style.textContent = `
      @keyframes artRainbow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      @keyframes artFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      @keyframes artPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // Subscribe to room if code exists
  useEffect(() => {
    if (!roomCode) { setRoom(null); setStudentImages([]); return; }
    const roomRef = ref(db, 'artRooms/' + roomCode);
    const unsub = onValue(roomRef, (snap) => {
      const data = snap.val();
      setRoom(data);
      if (!data) {
        localStorage.removeItem('artroom-teacher-code');
        setRoomCode('');
      }
    });
    return () => unsub();
  }, [roomCode]);

  // Subscribe to student images
  useEffect(() => {
    if (!roomCode) return;
    const imgsRef = ref(db, 'artRooms/' + roomCode + '/images');
    const unsub = onValue(imgsRef, (snap) => {
      const data = snap.val();
      if (!data) { setStudentImages([]); return; }
      const list = Object.entries(data).map(([k, v]) => ({ id: k, ...v }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setStudentImages(list);
    });
    return () => unsub();
  }, [roomCode]);

  // Fake progress bar
  useEffect(() => {
    if (!generating) { setProgress(0); return; }
    setProgress(0);
    const start = Date.now();
    const dur = selectedModel === 'schnell' ? 15000 : 30000;
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(95, (elapsed / dur) * 100));
    }, 200);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [generating, selectedModel]);

  const handleCreateRoom = async () => {
    const code = generateCode();
    await set(ref(db, 'artRooms/' + code), {
      createdAt: Date.now(),
      createdBy: 'teacher',
      active: true,
      settings: { imageEnabled: true, videoEnabled: false },
    });
    localStorage.setItem('artroom-teacher-code', code);
    setRoomCode(code);
    setShowRoom(true);
  };

  const handleCloseRoom = async () => {
    if (!roomCode) return;
    await set(ref(db, 'artRooms/' + roomCode + '/active'), false);
    localStorage.removeItem('artroom-teacher-code');
    setRoomCode('');
    setRoom(null);
    setShowRoom(false);
  };

  const handleTogglePause = async () => {
    if (!roomCode || !room) return;
    const current = room.settings?.imageEnabled !== false;
    await set(ref(db, 'artRooms/' + roomCode + '/settings/imageEnabled'), !current);
  };

  const handleDeleteImage = async (imgId) => {
    if (!roomCode) return;
    await remove(ref(db, 'artRooms/' + roomCode + '/images/' + imgId));
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setResult(null);
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
        setError(`HTTP ${res.status} - Antwort konnte nicht gelesen werden`);
        setGenerating(false);
        return;
      }

      if (!res.ok) {
        if (data.error === 'unsafe') {
          setError('unsafe');
        } else {
          setError(data.details || data.error || `HTTP ${res.status}`);
        }
        setGenerating(false);
        return;
      }

      setResult(data);
      setProgress(100);
      setGallery(prev => [{ ...data, style: styleName, ratio: selectedRatio, timestamp: Date.now() }, ...prev]);
    } catch (err) {
      setError(`Netzwerkfehler: ${err.message}`);
    }

    setGenerating(false);
  }, [prompt, selectedStyle, selectedRatio, selectedModel, generating]);

  const handleDownload = useCallback(async () => {
    if (!result?.imageUrl) return;
    try {
      const resp = await fetch(result.imageUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ki-kunst-${Date.now()}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(result.imageUrl, '_blank');
    }
  }, [result]);

  const handleRetry = () => {
    setResult(null);
    setError(null);
    handleGenerate();
  };

  const roomUrl = roomCode ? `${window.location.origin}/art/${roomCode}` : '';
  const isPaused = room && room.settings?.imageEnabled === false;

  return (
    <div style={st.overlay} onClick={onClose}>
      <div style={st.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={st.header}>
          <h1 style={st.title}>{'\u{1F3A8}'} {t.title}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Room toggle button */}
            {roomCode && room?.active && (
              <button onClick={() => setShowRoom(!showRoom)} style={{
                ...st.roomToggleBtn,
                background: showRoom ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.1)',
              }}>
                {'\u{1F465}'} {studentImages.length}
              </button>
            )}
            {!roomCode && (
              <button onClick={handleCreateRoom} style={st.createRoomBtn}>{t.createRoom}</button>
            )}
            <button onClick={onClose} style={st.closeBtn}>{'\u2715'}</button>
          </div>
        </div>

        <div style={st.body}>
          {/* Room panel (teacher view) */}
          {showRoom && roomCode && room?.active && (
            <div style={st.roomPanel}>
              <div style={st.qrSection}>
                <div style={st.qrBox}>
                  <QRCodeSVG value={roomUrl} size={100} level="M" bgColor="transparent" fgColor="white" />
                </div>
                <div style={st.qrInfo}>
                  <div style={st.roomCodeDisplay}>Code: <strong>{roomCode}</strong></div>
                  <div style={st.roomUrlDisplay}>{roomUrl}</div>
                  <div style={st.roomControls}>
                    <button onClick={handleTogglePause} style={{
                      ...st.roomCtrlBtn,
                      background: isPaused ? 'rgba(78,205,196,0.2)' : 'rgba(255,230,109,0.2)',
                      color: isPaused ? '#4ECDC4' : '#FFE66D',
                    }}>
                      {isPaused ? '\u25B6\uFE0F ' + t.resume : '\u23F8\uFE0F ' + t.pause}
                    </button>
                    <button onClick={handleCloseRoom} style={st.closeRoomBtn}>
                      {'\u2715'} {t.closeRoom}
                    </button>
                  </div>
                </div>
              </div>

              {/* Student images */}
              <div style={st.studentGalTitle}>{t.studentGallery} ({studentImages.length})</div>
              {studentImages.length === 0 && (
                <div style={st.noImagesText}>{t.noImages}</div>
              )}
              <div style={st.studentGalGrid}>
                {studentImages.map(img => (
                  <div key={img.id} style={st.studentGalCard}>
                    <img src={img.imageUrl} alt={img.prompt} style={st.studentGalImg} onClick={() => setPreviewImg(img)} />
                    <div style={st.studentGalMeta}>
                      <span style={st.studentGalAuthor}>{img.author}</span>
                      <button onClick={() => handleDeleteImage(img.id)} style={st.deleteImgBtn} title="L\u00F6schen">{'\u{1F5D1}\uFE0F'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teacher's own generation UI */}
          {!showRoom && (
            <>
              {/* Prompt input */}
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

              {/* Style chips */}
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
                    <span style={{ fontSize: 18 }}>{s.emoji}</span>
                    <span style={st.chipLabel}>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Aspect ratio pills */}
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

              {/* Generate button */}
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

              {/* Loading */}
              {generating && (
                <div style={st.loadingWrap}>
                  <div style={st.loadingEmoji}>{'\u{1F58C}\uFE0F'}</div>
                  <div style={st.loadingText}>{t.loading}</div>
                  <div style={st.progressBar}>
                    <div style={{ ...st.progressFill, width: progress + '%' }} />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && !generating && (
                <div style={st.errorBox}>
                  {error === 'unsafe' ? t.unsafe : error === 'general' ? t.error : error}
                </div>
              )}

              {/* Result */}
              {result && !generating && (
                <div style={st.resultWrap}>
                  <img src={result.imageUrl} alt={result.originalPrompt} style={st.resultImg} />
                  <div style={st.resultActions}>
                    <button onClick={handleDownload} style={st.actionBtn}>{'\u{1F4BE}'} {t.save}</button>
                    <button onClick={handleRetry} style={st.actionBtn}>{'\u{1F504}'} {t.retry}</button>
                  </div>
                </div>
              )}

              {/* Teacher gallery */}
              {gallery.length > 0 && (
                <div style={st.gallerySection}>
                  <h3 style={st.galTitle}>{t.gallery}</h3>
                  <div style={st.galGrid}>
                    {gallery.map((img, i) => (
                      <div key={i} style={st.galThumb} onClick={() => setPreviewImg(img)}>
                        <img src={img.imageUrl} alt={img.originalPrompt} style={st.galImg} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Full-size preview */}
        {previewImg && (
          <div style={st.previewOverlay} onClick={() => setPreviewImg(null)}>
            <img src={previewImg.imageUrl} alt={previewImg.prompt || previewImg.originalPrompt} style={st.previewImg} onClick={e => e.stopPropagation()} />
            {previewImg.author && (
              <div style={st.previewMeta} onClick={e => e.stopPropagation()}>
                <span>"{previewImg.prompt}"</span>
                <span style={{ color: '#A78BFA' }}>{t.by} {previewImg.author}</span>
              </div>
            )}
            <button style={st.previewClose} onClick={() => setPreviewImg(null)}>{'\u2715'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

const st = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    animation: 'artFadeIn 0.3s ease',
  },
  modal: {
    width: '100%',
    height: '100%',
    maxWidth: 600,
    maxHeight: '100dvh',
    background: 'linear-gradient(135deg, #1a0a2e, #0B0D1A)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    flexShrink: 0,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: 'white',
    margin: 0,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    fontSize: 20,
    width: 36,
    height: 36,
    borderRadius: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoomBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #A78BFA, #4ECDC4)',
    color: 'white',
    whiteSpace: 'nowrap',
  },
  roomToggleBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    color: 'white',
    whiteSpace: 'nowrap',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '16px 20px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  // Room panel
  roomPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  qrSection: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  qrBox: {
    flexShrink: 0,
    padding: 8,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  qrInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
    flex: 1,
  },
  roomCodeDisplay: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 20,
    color: 'white',
  },
  roomUrlDisplay: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    wordBreak: 'break-all',
  },
  roomControls: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  roomCtrlBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    padding: '5px 10px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
  closeRoomBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    padding: '5px 10px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    background: 'rgba(255,107,107,0.2)',
    color: '#FF6B6B',
  },
  studentGalTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 17,
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  noImagesText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    padding: '20px 0',
  },
  studentGalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: 8,
  },
  studentGalCard: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
  },
  studentGalImg: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    display: 'block',
    cursor: 'pointer',
  },
  studentGalMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 8px',
  },
  studentGalAuthor: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
  },
  deleteImgBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    padding: 2,
    opacity: 0.5,
  },
  // Generation UI
  promptWrap: { position: 'relative' },
  textarea: {
    width: '100%',
    minHeight: 80,
    padding: '14px 16px',
    fontSize: 16,
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    color: 'white',
    background: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 500,
    color: 'rgba(255,255,255,0.3)',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  chipLabel: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 700,
  },
  ratioRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  ratioPill: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.7)',
    padding: '6px 18px',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  modelRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  modelBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    padding: '8px 20px',
    borderRadius: 14,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  generateBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 20,
    padding: '14px 24px',
    border: 'none',
    borderRadius: 18,
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
    gap: 12,
    padding: '20px 0',
  },
  loadingEmoji: {
    fontSize: 48,
    animation: 'artPulse 1.5s ease-in-out infinite',
  },
  loadingText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
  },
  progressBar: {
    width: '80%',
    height: 6,
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
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: '#FF6B6B',
    background: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid rgba(255, 107, 107, 0.3)',
    borderRadius: 14,
    padding: '12px 16px',
    textAlign: 'center',
  },
  resultWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    animation: 'artFadeIn 0.5s ease',
  },
  resultImg: {
    width: '100%',
    maxHeight: '50vh',
    objectFit: 'contain',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  resultActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    padding: '10px 20px',
    borderRadius: 14,
    border: 'none',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.12)',
    color: 'white',
    transition: 'background 0.15s ease',
  },
  gallerySection: {
    marginTop: 8,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  galTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 12px',
  },
  galGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: 8,
  },
  galThumb: {
    aspectRatio: '1',
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    border: '2px solid rgba(255,255,255,0.1)',
    transition: 'border-color 0.15s ease',
  },
  galImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 10,
  },
  previewImg: {
    maxWidth: '90%',
    maxHeight: '75%',
    objectFit: 'contain',
    borderRadius: 16,
  },
  previewMeta: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  previewClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: 'white',
    fontSize: 22,
    width: 40,
    height: 40,
    borderRadius: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
