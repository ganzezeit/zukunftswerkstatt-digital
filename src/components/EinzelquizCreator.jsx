import React, { useState, useRef, useEffect } from 'react';
import { QUIZ_TYPE_LABELS, QUIZ_TYPE_COLORS } from '../data/einzelquizQuestions';

const MC_COLORS = ['#E74C3C', '#2980B9', '#F1C40F', '#27AE60'];
const MC_SHAPES = ['\u25B2', '\u25CF', '\u25A0', '\u25C6'];

const TYPE_CONFIG = {
  mc:     { label: 'Multiple Choice', badge: 'MC',  badgeColor: '#2980B9', icon: '\u{1F534}\u{1F535}\u{1F7E2}\u{1F7E1}' },
  tf:     { label: 'Richtig/Falsch',  badge: 'W/F', badgeColor: '#8E44AD', icon: '\u2705\u274C' },
  open:   { label: 'Offene Antwort',  badge: 'OA',  badgeColor: '#E67E22', icon: '\u270F\uFE0F' },
  slider: { label: 'Schätzfrage', badge: 'SF', badgeColor: '#2C3E50', icon: '\u{1F4CA}' },
};

function emptyQuestion(type) {
  switch (type) {
    case 'tf': return { type: 'tf', text: '', options: ['Richtig', 'Falsch'], correctIndex: 0, imageUrl: null };
    case 'open': return { type: 'open', text: '', acceptedAnswers: [], ignoreCase: true, imageUrl: null };
    case 'slider': return { type: 'slider', text: '', min: 0, max: 100, correctValue: 50, unit: '', tolerance: 10, imageUrl: null };
    default: return { type: 'mc', text: '', options: ['', '', '', ''], correctIndex: 0, imageUrl: null };
  }
}

function cloneDraft(q) {
  const d = { ...q };
  if (d.options) d.options = [...d.options];
  if (d.acceptedAnswers) d.acceptedAnswers = [...d.acceptedAnswers];
  return d;
}

export default function EinzelquizCreator({ quiz, onSave, onCancel, dayColor }) {
  const color = dayColor || '#2980B9';
  const [title, setTitle] = useState(quiz?.title || '');
  const [quizType, setQuizType] = useState(quiz?.quizType || 'vortest');
  const [showCorrectAfterEach, setShowCorrectAfterEach] = useState(quiz?.showCorrectAfterEach ?? false);
  const [questions, setQuestions] = useState(() => (quiz?.questions || []).map(q => ({ ...q })));
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [error, setError] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [acceptedText, setAcceptedText] = useState('');

  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editDraft?.type === 'open') {
      setAcceptedText((editDraft.acceptedAnswers || []).join(', '));
    }
  }, [editingIndex]);

  const startEdit = (idx) => {
    setEditDraft(cloneDraft(questions[idx]));
    setEditingIndex(idx);
    setError('');
    setShowTypePicker(false);
  };

  const startAdd = (type) => {
    const q = emptyQuestion(type);
    setQuestions(prev => [...prev, q]);
    setEditDraft(cloneDraft(q));
    setEditingIndex(questions.length);
    setError('');
    setShowTypePicker(false);
  };

  const saveQuestion = () => {
    if (!editDraft) return;
    if (!editDraft.text.trim()) { setError('Bitte Fragetext eingeben.'); return; }
    if (editDraft.type === 'mc' && editDraft.options.some(o => !o.trim())) { setError('Bitte alle Optionen ausfüllen.'); return; }
    if (editDraft.type === 'open') {
      const parsed = acceptedText.split(',').map(s => s.trim()).filter(Boolean);
      if (parsed.length === 0) { setError('Mindestens eine erwartete Antwort eingeben.'); return; }
      editDraft.acceptedAnswers = parsed;
    }
    if (editDraft.type === 'slider') {
      if (editDraft.min >= editDraft.max) { setError('Min muss kleiner als Max sein.'); return; }
      if (editDraft.correctValue < editDraft.min || editDraft.correctValue > editDraft.max) { setError('Richtige Antwort muss im Bereich liegen.'); return; }
      if (editDraft.tolerance <= 0) { setError('Toleranz muss größer als 0 sein.'); return; }
    }
    const updated = [...questions];
    updated[editingIndex] = editDraft;
    setQuestions(updated);
    setEditingIndex(null);
    setEditDraft(null);
    setError('');
  };

  const cancelEdit = () => {
    if (editDraft && !editDraft.text.trim() && editingIndex === questions.length - 1) {
      const isNew = !quiz?.questions?.[editingIndex];
      if (isNew) setQuestions(prev => prev.slice(0, -1));
    }
    setEditingIndex(null);
    setEditDraft(null);
    setError('');
  };

  const deleteQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    if (editingIndex === idx) { setEditingIndex(null); setEditDraft(null); }
  };

  const moveQuestion = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const updated = [...questions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setQuestions(updated);
  };

  const handleSave = () => {
    if (!title.trim()) { setError('Bitte Quiz-Titel eingeben.'); return; }
    if (questions.length === 0) { setError('Mindestens eine Frage hinzufügen.'); return; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) { setError(`Frage ${i + 1} hat keinen Text.`); return; }
      if (q.type === 'mc' && q.options.some(o => !o.trim())) { setError(`Frage ${i + 1}: Alle Optionen ausfüllen.`); return; }
      if (q.type === 'open' && (!q.acceptedAnswers || q.acceptedAnswers.length === 0)) { setError(`Frage ${i + 1}: Erwartete Antworten fehlen.`); return; }
      if (q.type === 'slider' && q.min >= q.max) { setError(`Frage ${i + 1}: Min/Max ungültig.`); return; }
    }
    onSave({ title: title.trim(), quizType, showCorrectAfterEach, questions });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/') || !editDraft) return;
    setImageUploading(true);
    setImageProgress(0);
    try {
      const { compressImage, uploadQuizImage } = await import('../utils/imageUpload');
      const compressed = await compressImage(file);
      const { downloadURL } = await uploadQuizImage(compressed, (pct) => setImageProgress(pct));
      setEditDraft(prev => ({ ...prev, imageUrl: downloadURL }));
    } catch (err) {
      console.error('[EinzelquizCreator] Image upload failed:', err);
      setError('Bild-Upload fehlgeschlagen.');
    } finally {
      setImageUploading(false);
      setImageProgress(0);
    }
  };

  const tc = TYPE_CONFIG;

  return (
    <div style={st.container}>
      <div style={st.header}>
        <button onClick={onCancel} style={st.backBtn}>{'\u2190'}</button>
        <h2 style={{ ...st.title, color }}>{quiz ? 'Quiz bearbeiten' : 'Neues Einzelquiz'}</h2>
      </div>

      {/* Title */}
      <label style={st.label}>Quiz-Titel</label>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Vortest Kinderrechte" style={st.input} />

      {/* Quiz type */}
      <label style={st.label}>Quiz-Typ</label>
      <div style={st.typeRow}>
        {Object.entries(QUIZ_TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setQuizType(key)}
            style={{
              ...st.typeBtn,
              background: quizType === key ? QUIZ_TYPE_COLORS[key] : 'rgba(0,0,0,0.04)',
              color: quizType === key ? 'white' : '#555',
              border: quizType === key ? `2px solid ${QUIZ_TYPE_COLORS[key]}` : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Show correct toggle */}
      <label style={{ ...st.label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={showCorrectAfterEach}
          onChange={(e) => setShowCorrectAfterEach(e.target.checked)}
        />
        <span>Richtige Antwort nach jeder Frage zeigen</span>
      </label>

      {/* Question list */}
      <div style={st.questionList}>
        {questions.map((q, i) => {
          const cfg = tc[q.type] || tc.mc;
          return (
            <div key={i} style={{ ...st.questionCard, border: editingIndex === i ? `2px solid ${color}` : '2px solid transparent' }}>
              <div style={st.questionCardHeader}>
                <span style={{ ...st.typeBadge, background: cfg.badgeColor }}>{cfg.badge}</span>
                <span style={st.questionText}>{q.text || '(Kein Text)'}</span>
              </div>
              <div style={st.questionActions}>
                <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} style={st.smallBtn}>{'\u2191'}</button>
                <button onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1} style={st.smallBtn}>{'\u2193'}</button>
                <button onClick={() => startEdit(i)} style={{ ...st.smallBtn, color: '#2980B9' }}>Bearbeiten</button>
                <button onClick={() => deleteQuestion(i)} style={{ ...st.smallBtn, color: '#E74C3C' }}>Löschen</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor */}
      {editingIndex !== null && editDraft && (
        <div style={st.editorPanel}>
          <h3 style={st.editorTitle}>Frage {editingIndex + 1} — {tc[editDraft.type]?.label}</h3>
          <textarea
            value={editDraft.text}
            onChange={(e) => setEditDraft({ ...editDraft, text: e.target.value })}
            placeholder="Frage eingeben..."
            rows={3}
            style={st.textarea}
          />

          {/* Photo */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
          {editDraft.imageUrl ? (
            <div style={st.imagePreviewBox}>
              <img src={editDraft.imageUrl} alt="Frage-Bild" style={st.imagePreview} />
              <button onClick={() => setEditDraft(prev => ({ ...prev, imageUrl: null }))} style={st.imageRemoveBtn}>{'\u2715'}</button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} disabled={imageUploading} style={st.addImageBtn}>
              {imageUploading ? `Hochladen... ${imageProgress}%` : '\u{1F5BC}\uFE0F Bild hinzufügen'}
            </button>
          )}

          {/* MC options */}
          {editDraft.type === 'mc' && (
            <div style={st.optionsGrid}>
              {editDraft.options.map((opt, oi) => (
                <div key={oi} style={{
                  ...st.optionRow,
                  borderColor: editDraft.correctIndex === oi ? MC_COLORS[oi] : 'rgba(0,0,0,0.1)',
                  borderWidth: editDraft.correctIndex === oi ? 3 : 2,
                }}>
                  <span style={{ ...st.optionShape, color: MC_COLORS[oi] }}>{MC_SHAPES[oi]}</span>
                  <input
                    type="text" value={opt}
                    onChange={(e) => { const o = [...editDraft.options]; o[oi] = e.target.value; setEditDraft({ ...editDraft, options: o }); }}
                    placeholder={`Option ${oi + 1}`} style={st.optionInput}
                  />
                  <button onClick={() => setEditDraft({ ...editDraft, correctIndex: oi })} style={{
                    ...st.correctBtn,
                    background: editDraft.correctIndex === oi ? '#27AE60' : 'rgba(0,0,0,0.06)',
                    color: editDraft.correctIndex === oi ? 'white' : '#999',
                  }}>{editDraft.correctIndex === oi ? '\u2713' : '\u25CB'}</button>
                </div>
              ))}
            </div>
          )}

          {/* TF */}
          {editDraft.type === 'tf' && (
            <div style={st.tfRow}>
              <button onClick={() => setEditDraft({ ...editDraft, correctIndex: 0 })} style={{
                ...st.tfBtnEditor,
                background: editDraft.correctIndex === 0 ? '#27AE60' : 'rgba(39,174,96,0.1)',
                color: editDraft.correctIndex === 0 ? 'white' : '#27AE60',
                border: editDraft.correctIndex === 0 ? '3px solid #27AE60' : '2px solid rgba(39,174,96,0.3)',
              }}>Richtig {editDraft.correctIndex === 0 ? '\u2713' : ''}</button>
              <button onClick={() => setEditDraft({ ...editDraft, correctIndex: 1 })} style={{
                ...st.tfBtnEditor,
                background: editDraft.correctIndex === 1 ? '#E74C3C' : 'rgba(231,76,60,0.1)',
                color: editDraft.correctIndex === 1 ? 'white' : '#E74C3C',
                border: editDraft.correctIndex === 1 ? '3px solid #E74C3C' : '2px solid rgba(231,76,60,0.3)',
              }}>Falsch {editDraft.correctIndex === 1 ? '\u2713' : ''}</button>
            </div>
          )}

          {/* Open */}
          {editDraft.type === 'open' && (
            <>
              <label style={st.label}>Erwartete Antworten (kommagetrennt)</label>
              <input type="text" value={acceptedText} onChange={(e) => setAcceptedText(e.target.value)} placeholder="z.B. Bildung, Recht auf Bildung" style={st.input} />
            </>
          )}

          {/* Slider */}
          {editDraft.type === 'slider' && (
            <>
              <div style={st.sliderGrid}>
                <div style={st.sliderField}>
                  <label style={st.label}>Min</label>
                  <input type="number" value={editDraft.min} onChange={(e) => setEditDraft({ ...editDraft, min: Number(e.target.value) })} style={st.sliderNumInput} />
                </div>
                <div style={st.sliderField}>
                  <label style={st.label}>Max</label>
                  <input type="number" value={editDraft.max} onChange={(e) => setEditDraft({ ...editDraft, max: Number(e.target.value) })} style={st.sliderNumInput} />
                </div>
                <div style={st.sliderField}>
                  <label style={st.label}>Richtige Antwort</label>
                  <input type="number" value={editDraft.correctValue} onChange={(e) => setEditDraft({ ...editDraft, correctValue: Number(e.target.value) })} style={st.sliderNumInput} />
                </div>
                <div style={st.sliderField}>
                  <label style={st.label}>Toleranz (±)</label>
                  <input type="number" value={editDraft.tolerance} onChange={(e) => setEditDraft({ ...editDraft, tolerance: Math.max(0, Number(e.target.value)) })} style={st.sliderNumInput} />
                </div>
              </div>
              <div style={st.sliderField}>
                <label style={st.label}>Einheit (optional)</label>
                <input type="text" value={editDraft.unit || ''} onChange={(e) => setEditDraft({ ...editDraft, unit: e.target.value })} placeholder="z.B. km, Mio." style={st.input} />
              </div>
              <div style={st.hint}>Richtig: {editDraft.correctValue} ± {editDraft.tolerance}{editDraft.unit ? ` ${editDraft.unit}` : ''}</div>
            </>
          )}

          <div style={st.editorActions}>
            <button onClick={saveQuestion} disabled={imageUploading} style={{ ...st.saveQuestionBtn, background: color }}>Frage speichern</button>
            <button onClick={cancelEdit} style={st.cancelQuestionBtn}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Add question */}
      {editingIndex === null && !showTypePicker && (
        <button onClick={() => setShowTypePicker(true)} style={{ ...st.addBtnMain, borderColor: color, color }}>
          + Frage hinzufügen
        </button>
      )}
      {editingIndex === null && showTypePicker && (
        <div style={st.typePicker}>
          {Object.entries(tc).map(([type, cfg]) => (
            <button key={type} onClick={() => startAdd(type)} style={{ ...st.typePickerBtn, borderColor: cfg.badgeColor }}>
              <span style={st.typePickerIcon}>{cfg.icon}</span>
              <span style={{ ...st.typePickerLabel, color: cfg.badgeColor }}>{cfg.label}</span>
            </button>
          ))}
          <button onClick={() => setShowTypePicker(false)} style={st.typePickerCancel}>Abbrechen</button>
        </div>
      )}

      {error && <div style={st.error}>{error}</div>}

      <div style={st.footer}>
        <span style={st.questionCount}>{questions.length} Frage{questions.length !== 1 ? 'n' : ''}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} style={{ ...st.saveBtn, background: color }}>Quiz speichern</button>
          <button onClick={onCancel} style={st.cancelBtn}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

const st = {
  container: { display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '85vh', overflowY: 'auto', padding: '4px 0' },
  header: { display: 'flex', alignItems: 'center', gap: 10 },
  backBtn: { fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, padding: '4px 10px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#555', lineHeight: 1 },
  title: { fontFamily: "'Lilita One', cursive", fontSize: 22, margin: 0 },
  label: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color: '#777', marginTop: 4 },
  input: { fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 500, padding: '10px 14px', border: '2px solid rgba(0,0,0,0.1)', borderRadius: 12, outline: 'none', background: '#FAFAFA' },
  typeRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  typeBtn: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, padding: '8px 16px', borderRadius: 10, cursor: 'pointer' },
  questionList: { display: 'flex', flexDirection: 'column', gap: 8 },
  questionCard: { background: '#F8F8F8', borderRadius: 12, padding: '10px 14px', borderStyle: 'solid' },
  questionCardHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  typeBadge: { fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700, color: 'white', padding: '2px 8px', borderRadius: 6, flexShrink: 0 },
  questionText: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  questionActions: { display: 'flex', gap: 6, marginTop: 6 },
  smallBtn: { fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600, padding: '4px 8px', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#555' },
  editorPanel: { background: 'white', border: '2px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 },
  editorTitle: { fontFamily: "'Lilita One', cursive", fontSize: 18, color: '#333', margin: 0 },
  textarea: { fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 500, padding: '10px 14px', border: '2px solid rgba(0,0,0,0.1)', borderRadius: 12, outline: 'none', background: '#FAFAFA', resize: 'vertical', minHeight: 60 },
  addImageBtn: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, padding: '10px 16px', background: 'rgba(0,0,0,0.04)', color: '#777', border: '2px dashed rgba(0,0,0,0.12)', borderRadius: 10, cursor: 'pointer', textAlign: 'center' },
  imagePreviewBox: { position: 'relative', borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(0,0,0,0.08)' },
  imagePreview: { width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block', borderRadius: 8 },
  imageRemoveBtn: { position: 'absolute', top: 6, right: 6, width: 28, height: 28, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  optionRow: { display: 'flex', alignItems: 'center', gap: 8, borderStyle: 'solid', borderRadius: 10, padding: '6px 10px', background: '#FAFAFA' },
  optionShape: { fontSize: 20, flexShrink: 0, width: 24, textAlign: 'center' },
  optionInput: { flex: 1, fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 500, padding: '6px 10px', border: 'none', outline: 'none', background: 'transparent' },
  correctBtn: { width: 32, height: 32, borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 },
  tfRow: { display: 'flex', gap: 12 },
  tfBtnEditor: { flex: 1, fontFamily: "'Lilita One', cursive", fontSize: 18, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'center' },
  sliderGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  sliderField: { display: 'flex', flexDirection: 'column', gap: 4 },
  sliderNumInput: { fontFamily: "'Baloo 2', cursive", fontSize: 18, fontWeight: 700, padding: '8px 12px', border: '2px solid rgba(0,0,0,0.1)', borderRadius: 10, outline: 'none', background: '#FAFAFA', textAlign: 'center' },
  hint: { fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 500, color: '#999', fontStyle: 'italic', textAlign: 'center' },
  editorActions: { display: 'flex', gap: 10, marginTop: 4 },
  saveQuestionBtn: { flex: 1, fontFamily: "'Lilita One', cursive", fontSize: 16, padding: '10px 20px', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer' },
  cancelQuestionBtn: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, padding: '10px 16px', background: 'rgba(0,0,0,0.06)', color: '#666', border: 'none', borderRadius: 12, cursor: 'pointer' },
  addBtnMain: { fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700, padding: '14px 16px', background: 'transparent', borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, cursor: 'pointer', textAlign: 'center' },
  typePicker: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  typePickerBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 10px', background: 'white', borderWidth: 2, borderStyle: 'solid', borderRadius: 12, cursor: 'pointer' },
  typePickerIcon: { fontSize: 20 },
  typePickerLabel: { fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700 },
  typePickerCancel: { gridColumn: '1 / -1', fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 16px', background: 'rgba(0,0,0,0.04)', color: '#999', border: 'none', borderRadius: 10, cursor: 'pointer' },
  error: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color: '#E74C3C', textAlign: 'center', padding: '8px 12px', background: '#FFF3F0', borderRadius: 10 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.08)' },
  questionCount: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color: '#999' },
  saveBtn: { fontFamily: "'Lilita One', cursive", fontSize: 17, padding: '10px 24px', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer' },
  cancelBtn: { fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 600, padding: '10px 18px', background: 'rgba(0,0,0,0.06)', color: '#666', border: 'none', borderRadius: 14, cursor: 'pointer' },
};
