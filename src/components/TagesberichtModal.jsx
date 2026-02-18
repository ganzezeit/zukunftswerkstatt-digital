import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';
import { DAYS } from '../data/days';

export default function TagesberichtModal({ dayNumber, className, teacherName, onClose, onSaved }) {
  const [whatWasDone, setWhatWasDone] = useState('');
  const [studentReaction, setStudentReaction] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const day = DAYS.find(d => d.id === dayNumber);
  const dayTitle = day ? `${day.emoji} ${day.name}` : `Tag ${dayNumber}`;

  // Load existing report if any
  useEffect(() => {
    if (!className || !dayNumber) return;
    get(ref(db, `classes/${className}/dailyReports/${dayNumber}`)).then(snap => {
      const data = snap.val();
      if (data) {
        setWhatWasDone(data.whatWasDone || '');
        setStudentReaction(data.studentReaction || '');
        setObservations(data.observations || '');
      }
    }).catch(() => {});
  }, [className, dayNumber]);

  const canSave = whatWasDone.trim().length >= 10;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await set(ref(db, `classes/${className}/dailyReports/${dayNumber}`), {
        whatWasDone: whatWasDone.trim(),
        studentReaction: studentReaction.trim(),
        observations: observations.trim(),
        completedAt: Date.now(),
        completedBy: teacherName || 'Lehrkraft',
      });
      setToast('Gespeichert!');
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 800);
    } catch (e) {
      console.error('Save daily report error:', e);
      setSaving(false);
    }
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <h2 style={s.title}>{'\u{1F4DD}'} Tagesbericht — {dayTitle}</h2>
        <p style={s.subtitle}>Bitte fasse kurz zusammen, was heute gemacht wurde.</p>

        <label style={s.label}>Was wurde heute umgesetzt? *</label>
        <textarea
          value={whatWasDone}
          onChange={e => setWhatWasDone(e.target.value.slice(0, 500))}
          placeholder="Welche Aktivitaeten wurden durchgefuehrt?"
          style={s.textarea}
          rows={3}
          autoFocus
        />
        <div style={s.charCount}>{whatWasDone.length}/500{whatWasDone.length > 0 && whatWasDone.length < 10 && ' (min. 10 Zeichen)'}</div>

        <label style={s.label}>Wie haben die Schueler:innen reagiert?</label>
        <textarea
          value={studentReaction}
          onChange={e => setStudentReaction(e.target.value.slice(0, 500))}
          placeholder="Beteiligung, Motivation, besondere Momente..."
          style={s.textarea}
          rows={3}
        />
        <div style={s.charCount}>{studentReaction.length}/500</div>

        <label style={s.label}>Besondere Beobachtungen?</label>
        <textarea
          value={observations}
          onChange={e => setObservations(e.target.value.slice(0, 500))}
          placeholder="Gab es Probleme oder Highlights?"
          style={s.textarea}
          rows={3}
        />
        <div style={s.charCount}>{observations.length}/500</div>

        <div style={s.actions}>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{ ...s.saveBtn, opacity: canSave && !saving ? 1 : 0.5 }}
          >
            {saving ? 'Wird gespeichert...' : '\u{1F4BE} Speichern'}
          </button>
          <button onClick={onClose} style={s.laterBtn}>
            {'\u23ED\uFE0F'} Spaeter
          </button>
        </div>

        {toast && <div style={s.toast}>{'\u2705'} {toast}</div>}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9800,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    background: '#fff',
    borderRadius: 24,
    padding: '28px 28px 24px',
    maxWidth: 540,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    position: 'relative',
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: '#333',
    margin: '0 0 4px',
  },
  subtitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    color: '#999',
    margin: '0 0 16px',
    fontWeight: 500,
  },
  label: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: '#555',
    display: 'block',
    marginBottom: 4,
    marginTop: 10,
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid #E0D6CC',
    borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    color: '#333',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: 1.5,
  },
  charCount: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    color: '#BBB',
    textAlign: 'right',
    marginTop: 2,
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 18,
  },
  saveBtn: {
    flex: 1,
    padding: '12px 20px',
    border: 'none',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)',
    color: '#fff',
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(39, 174, 96, 0.3)',
  },
  laterBtn: {
    flex: 1,
    padding: '12px 20px',
    border: '2px solid #E0D6CC',
    borderRadius: 14,
    background: '#fff',
    color: '#666',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  toast: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#E8F5E9',
    color: '#2E7D32',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 20px',
    borderRadius: 10,
    animation: 'fadeIn 0.3s ease',
  },
};
