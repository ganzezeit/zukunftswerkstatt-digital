import React, { useState, useEffect, useRef } from 'react';
import { ref, set, remove, onValue } from 'firebase/database';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const DEFAULT_COLUMNS = ['Pause & Freizeit', 'Schule & Lernen', 'Mitbestimmung', 'Alltag'];
const TIMEOUT_MS = 8000;

// Confirmation dialog overlay
function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel, danger }) {
  return (
    <div style={s.confirmOverlay}>
      <div style={s.confirmCard}>
        <p style={s.confirmText}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onConfirm}
            style={{ ...s.confirmBtn, background: danger ? '#E74C3C' : '#FF6B35' }}
          >
            {confirmLabel}
          </button>
          <button onClick={onCancel} style={s.confirmCancelBtn}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

export default function BoardCreator({ title, columns, dayColor, onClose }) {
  const [code, setCode] = useState(null);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('creating');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirm, setConfirm] = useState(null);
  const createdRef = useRef(false);

  const cols = columns || DEFAULT_COLUMNS;

  // Create board on mount
  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    const newCode = generateCode();
    console.log('[BoardCreator] Creating board...', newCode);

    const boardRef = ref(db, 'boards/' + newCode);
    const timeout = setTimeout(() => {
      console.error('[BoardCreator] Timeout');
      setStatus('error');
      setErrorMsg(
        'Verbindung fehlgeschlagen. Bitte prüfe die Internetverbindung.' +
        '\n\nFalls der Fehler bestehen bleibt: Bitte in der Firebase Console unter Realtime Database → Rules die Lese- und Schreibrechte aktivieren.'
      );
    }, TIMEOUT_MS);

    set(boardRef, {
      title: title || 'Fragen-Werkstatt',
      columns: cols,
      active: true,
      createdAt: Date.now(),
    })
      .then(() => {
        clearTimeout(timeout);
        console.log('[BoardCreator] Board created successfully:', newCode);
        setCode(newCode);
        setStatus('ready');
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error('[BoardCreator] Firebase write failed:', err.message || err);
        setStatus('error');
        setErrorMsg(
          `Board konnte nicht erstellt werden: ${err.message || 'Unbekannter Fehler'}` +
          '\n\nFalls der Fehler bestehen bleibt: Bitte in der Firebase Console unter Realtime Database → Rules die Lese- und Schreibrechte aktivieren.'
        );
      });

    return () => clearTimeout(timeout);
  }, []);

  const handleRetry = () => {
    createdRef.current = false;
    setStatus('creating');
    setErrorMsg('');

    const newCode = generateCode();
    console.log('[BoardCreator] Retrying...', newCode);

    const boardRef = ref(db, 'boards/' + newCode);
    const timeout = setTimeout(() => {
      setStatus('error');
      setErrorMsg('Verbindung fehlgeschlagen. Bitte prüfe die Internetverbindung.');
    }, TIMEOUT_MS);

    set(boardRef, {
      title: title || 'Fragen-Werkstatt',
      columns: cols,
      active: true,
      createdAt: Date.now(),
    })
      .then(() => {
        clearTimeout(timeout);
        console.log('[BoardCreator] Retry successful:', newCode);
        setCode(newCode);
        setStatus('ready');
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error('[BoardCreator] Retry failed:', err.message || err);
        setStatus('error');
        setErrorMsg(`Board konnte nicht erstellt werden: ${err.message || 'Unbekannter Fehler'}`);
      });
  };

  // Listen to posts once board is created
  useEffect(() => {
    if (!code) return;
    console.log('[BoardCreator] Listening for posts on board:', code);
    const postsRef = ref(db, 'boards/' + code + '/posts');
    const unsub = onValue(postsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const p = Object.entries(data).map(([key, val]) => ({ ...val, _key: key }));
        p.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setPosts(p);
      } else {
        setPosts([]);
      }
    }, (err) => {
      console.error('[BoardCreator] Error listening to posts:', err.message || err);
    });
    return () => unsub();
  }, [code]);

  const boardUrl = code ? `${window.location.origin}/board/${code}` : '';

  // --- Admin actions ---
  const handleCloseBoard = () => {
    setConfirm({
      message: 'Board schließen? Schüler können dann nicht mehr schreiben.',
      confirmLabel: 'Ja, schließen',
      danger: false,
      action: () => {
        set(ref(db, 'boards/' + code + '/active'), false).catch((err) => {
          console.error('[BoardCreator] Error closing board:', err);
        });
        onClose();
      },
    });
  };

  const handleClearPosts = () => {
    setConfirm({
      message: 'Alle Beiträge löschen? Das kann nicht rückgängig gemacht werden.',
      confirmLabel: 'Ja, löschen',
      danger: true,
      action: () => {
        remove(ref(db, 'boards/' + code + '/posts')).catch((err) => {
          console.error('[BoardCreator] Error clearing posts:', err);
        });
        setConfirm(null);
      },
    });
  };

  const handleDeleteBoard = () => {
    setConfirm({
      message: 'Board und alle Beiträge endgültig löschen?',
      confirmLabel: 'Endgültig löschen',
      danger: true,
      action: () => {
        remove(ref(db, 'boards/' + code)).catch((err) => {
          console.error('[BoardCreator] Error deleting board:', err);
        });
        onClose();
      },
    });
  };

  const handleDeletePost = (postKey) => {
    remove(ref(db, `boards/${code}/posts/${postKey}`)).catch((err) => {
      console.error('[BoardCreator] Error deleting post:', err);
    });
  };

  const handleRefresh = () => {
    // Force re-subscribe by toggling code briefly
    const currentCode = code;
    setCode(null);
    setTimeout(() => setCode(currentCode), 100);
  };

  // Loading / Error state
  if (status !== 'ready') {
    return (
      <div style={s.overlay}>
        <div style={s.card}>
          {status === 'creating' && (
            <>
              <div style={s.loadingText}>Board wird erstellt...</div>
              <div style={s.loadingSub}>Verbindung zu Firebase wird hergestellt...</div>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{ ...s.loadingText, color: '#CC3333' }}>
                ⚠️ Verbindung fehlgeschlagen
              </div>
              <div style={s.errorText}>{errorMsg}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
                <button onClick={handleRetry} style={{ ...s.retryBtn, background: dayColor }}>
                  🔄 Nochmal versuchen
                </button>
                <button onClick={onClose} style={s.adminBtnGrey}>Zurück</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={s.overlay}>
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={{ ...s.title, color: dayColor }}>📋 Klassen-Board</h1>
          <div style={s.adminRow}>
            <button onClick={handleRefresh} style={s.adminBtn} title="Aktualisieren">🔄</button>
            <button onClick={handleClearPosts} style={s.adminBtnOrange}>Board leeren</button>
            <button onClick={handleCloseBoard} style={s.adminBtnGrey}>Board schließen</button>
            <button onClick={handleDeleteBoard} style={s.adminBtnRed}>Board löschen</button>
          </div>
        </div>

        {/* QR + Info */}
        <div style={s.qrRow}>
          <div style={s.qrCard}>
            <QRCodeSVG value={boardUrl} size={180} level="M" />
            <div style={s.codeLabel}>Code: <strong>{code}</strong></div>
            <div style={s.urlLabel}>{boardUrl}</div>
          </div>
          <div style={s.infoCard}>
            <h2 style={{ ...s.infoTitle, color: dayColor }}>{title || 'Fragen-Werkstatt'}</h2>
            <p style={s.infoText}>
              📱 Scannt den QR-Code mit eurem Tablet oder Handy!
            </p>
            <p style={s.infoText}>
              👥 {posts.length} Beiträge bisher
            </p>
            <div style={s.columnTags}>
              {cols.map((c, i) => (
                <span key={i} style={{ ...s.colTag, borderColor: dayColor }}>{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Live board view */}
        <div style={s.boardArea}>
          <div style={s.colContainer}>
            {cols.map((colName, ci) => {
              const colPosts = posts.filter(p => p.column === ci);
              return (
                <div key={ci} style={s.column}>
                  <div style={{ ...s.colHeader, color: dayColor }}>{colName}</div>
                  <div style={s.colPosts}>
                    {colPosts.map((p) => {
                      const likeCount = p.likes ? Object.keys(p.likes).length : 0;
                      return (
                        <div key={p._key} style={{
                          ...s.stickyNote,
                          background: p.color || '#FFE0B2',
                          border: likeCount >= 3 ? '2px solid rgba(231,76,60,0.3)' : 'none',
                        }}>
                          <div style={s.noteHeader}>
                            <div style={s.noteAuthor}>{p.author}</div>
                            <button
                              onClick={() => handleDeletePost(p._key)}
                              style={s.deletePostBtn}
                              title="Beitrag löschen"
                            >✕</button>
                          </div>
                          <div style={s.noteText}>{p.text}</div>
                          {likeCount > 0 && (
                            <div style={s.likeInfo}>❤️ {likeCount}</div>
                          )}
                        </div>
                      );
                    })}
                    {colPosts.length === 0 && (
                      <div style={s.emptyCol}>Noch keine Beiträge</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(255, 250, 245, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  container: {
    width: '100%',
    maxWidth: 1200,
    maxHeight: '95vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 28,
    margin: 0,
  },
  adminRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  adminBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.05)',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
  },
  adminBtnOrange: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 14px',
    background: '#FF6B35',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
  },
  adminBtnGrey: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 14px',
    background: 'rgba(0,0,0,0.08)',
    color: '#555',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
  },
  adminBtnRed: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 14px',
    background: '#E74C3C',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
  },
  loadingText: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: '#8B5A2B',
    textAlign: 'center',
  },
  loadingSub: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    color: '#999',
    fontWeight: 600,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    color: '#666',
    fontWeight: 600,
    textAlign: 'center',
    marginTop: 12,
    whiteSpace: 'pre-line',
    lineHeight: 1.5,
    maxWidth: 500,
  },
  retryBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    padding: '12px 28px',
    color: 'white',
    border: 'none',
    borderRadius: 20,
    cursor: 'pointer',
  },
  card: {
    background: 'white',
    borderRadius: 20,
    padding: '40px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: 550,
    width: '100%',
  },
  qrRow: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  qrCard: {
    background: 'white',
    borderRadius: 20,
    padding: '24px 28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  codeLabel: {
    fontFamily: "'Baloo 2', cursive",
    fontSize: 22,
    color: '#333',
    letterSpacing: 3,
  },
  urlLabel: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    color: '#999',
    wordBreak: 'break-all',
    textAlign: 'center',
    maxWidth: 220,
  },
  infoCard: {
    background: 'white',
    borderRadius: 20,
    padding: '24px 28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  infoTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    margin: 0,
  },
  infoText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    color: '#555',
    fontWeight: 600,
    margin: 0,
  },
  columnTags: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  colTag: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 10,
    border: '2px solid',
    color: '#555',
    background: 'rgba(255,255,255,0.8)',
  },
  boardArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  colContainer: {
    display: 'flex',
    gap: 14,
    minHeight: 200,
  },
  column: {
    flex: '1 1 0',
    minWidth: 200,
    background: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  colHeader: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: '2px solid rgba(0,0,0,0.08)',
  },
  colPosts: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  stickyNote: {
    borderRadius: 10,
    padding: '8px 12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
    position: 'relative',
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteAuthor: {
    fontSize: 11,
    fontWeight: 700,
    color: '#8B5A2B',
    marginBottom: 3,
    opacity: 0.7,
  },
  deletePostBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#999',
    padding: '2px 4px',
    borderRadius: 6,
    lineHeight: 1,
  },
  noteText: {
    fontSize: 15,
    color: '#333',
    fontWeight: 600,
    fontFamily: "'Fredoka', sans-serif",
    lineHeight: 1.4,
  },
  likeInfo: {
    fontSize: 13,
    color: '#E74C3C',
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    marginTop: 4,
  },
  emptyCol: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    color: '#aaa',
    fontWeight: 600,
    textAlign: 'center',
    padding: '16px 8px',
    fontStyle: 'italic',
  },
  // Confirm dialog
  confirmOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 3000,
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
