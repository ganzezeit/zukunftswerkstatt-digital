import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import BoardCreator from './BoardCreator';
import { playClickSound } from '../utils/audio';

export default function MissionBoardButton({ taskId, referenceTaskId, title, columns, buttonLabel, dayColor }) {
  const [showBoard, setShowBoard] = useState(false);
  const [existingBoardCode, setExistingBoardCode] = useState(null);
  const [toast, setToast] = useState(null);

  // Subscribe to boardLinks for the relevant taskId
  const linkId = referenceTaskId || taskId;
  useEffect(() => {
    if (!linkId) return;
    const linkRef = ref(db, 'boardLinks/' + linkId);
    const unsub = onValue(linkRef, (snap) => {
      setExistingBoardCode(snap.val() || null);
    });
    return () => unsub();
  }, [linkId]);

  const handleClick = () => {
    playClickSound();
    // Reference mode: must have an existing board
    if (referenceTaskId && !existingBoardCode) {
      setToast('Erstelle zuerst das Board in der Fragenwerkstatt!');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setShowBoard(true);
  };

  return (
    <>
      <button onClick={handleClick} style={{ ...styles.button, background: dayColor || '#FF6B35' }}>
        {buttonLabel || '\u{1F4CB} Board \u00F6ffnen'}
      </button>

      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}

      {showBoard && (
        <BoardCreator
          title={title || 'Klassen-Board'}
          columns={columns}
          dayColor={dayColor}
          onClose={() => setShowBoard(false)}
          existingCode={existingBoardCode || undefined}
          taskId={referenceTaskId ? undefined : taskId}
        />
      )}
    </>
  );
}

const styles = {
  button: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 20,
    padding: '14px 36px',
    color: 'white',
    borderRadius: 30,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    marginTop: 16,
    marginBottom: 16,
    display: 'block',
    width: 'fit-content',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  toast: {
    position: 'fixed',
    bottom: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#333',
    color: 'white',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    padding: '12px 24px',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    zIndex: 3000,
    animation: 'popIn 0.3s ease-out',
  },
};
