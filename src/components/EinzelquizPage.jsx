import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';

const MC_COLORS = ['#E74C3C', '#2980B9', '#F1C40F', '#27AE60'];
const MC_SHAPES = ['\u25B2', '\u25CF', '\u25A0', '\u25C6'];

function sanitizeName(name) {
  return name.replace(/[.#$\[\]\/]/g, '_');
}

function scoreAnswer(question, answer) {
  if (answer === null || answer === undefined) return false;
  switch (question.type) {
    case 'mc':
    case 'tf':
      return answer === question.correctIndex;
    case 'open': {
      const student = (answer || '').trim().toLowerCase();
      return (question.acceptedAnswers || []).some(a => a.trim().toLowerCase() === student);
    }
    case 'slider': {
      const diff = Math.abs(answer - question.correctValue);
      return diff <= (question.tolerance || 10);
    }
    default:
      return false;
  }
}

export default function EinzelquizPage({ quizId }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('einzelquiz-player-name') || '');
  const [nameInput, setNameInput] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState('loading'); // loading, name, quiz, review, submitting, results
  const [sliderValue, setSliderValue] = useState(null);
  const [result, setResult] = useState(null);

  // Fix scroll for mobile
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'einzelquiz-scroll-fix';
    style.textContent = `
      html, body, #root {
        overflow: auto !important;
        height: auto !important;
        min-height: 100vh !important;
        position: static !important;
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior: auto !important;
      }
      input[type="range"].eq-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 44px; height: 44px; border-radius: 50%;
        background: #2C3E50; cursor: pointer;
        border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      input[type="range"].eq-slider::-moz-range-thumb {
        width: 44px; height: 44px; border-radius: 50%;
        background: #2C3E50; cursor: pointer;
        border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // Load quiz
  useEffect(() => {
    get(ref(db, 'einzelquizzes/' + quizId)).then(snap => {
      const data = snap.val();
      setQuiz(data);
      setLoading(false);
      setPhase(data ? 'name' : 'not-found');
    }).catch(() => {
      setLoading(false);
      setPhase('not-found');
    });
  }, [quizId]);

  // Auto-set name if stored
  useEffect(() => {
    if (phase === 'name' && playerName && quiz) {
      checkExisting(playerName);
    }
  }, [phase, playerName, quiz]);

  const checkExisting = async (name) => {
    const safeKey = sanitizeName(name);
    try {
      const snap = await get(ref(db, `einzelquizResults/${quizId}/${safeKey}`));
      if (snap.exists()) {
        setAlreadySubmitted(snap.val());
        setNameSet(true);
        setPhase('already-done');
      } else {
        setNameSet(true);
        setPhase('quiz');
      }
    } catch {
      setNameSet(true);
      setPhase('quiz');
    }
  };

  const handleSetName = (e) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem('einzelquiz-player-name', name);
    setPlayerName(name);
    checkExisting(name);
  };

  const handleAnswer = (qIdx, answer) => {
    setAnswers(prev => ({ ...prev, [qIdx]: answer }));
  };

  const handleNext = () => {
    // For slider: save current slider value
    const q = quiz.questions[currentQ];
    if (q.type === 'slider' && sliderValue !== null && answers[currentQ] === undefined) {
      handleAnswer(currentQ, sliderValue);
    }
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSliderValue(null);
    } else {
      setPhase('review');
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setSliderValue(null);
    }
  };

  const handleSubmit = async () => {
    setPhase('submitting');
    const questions = quiz.questions || [];
    let correctCount = 0;
    const answerData = {};

    for (let i = 0; i < questions.length; i++) {
      const a = answers[i];
      const correct = scoreAnswer(questions[i], a);
      if (correct) correctCount++;
      answerData[i] = { answer: a !== undefined ? a : null, correct };
    }

    const resultObj = {
      name: playerName,
      answers: answerData,
      score: Math.round((correctCount / questions.length) * 100),
      totalQuestions: questions.length,
      correctCount,
      submittedAt: Date.now(),
    };

    try {
      const safeKey = sanitizeName(playerName);
      await set(ref(db, `einzelquizResults/${quizId}/${safeKey}`), resultObj);
      setResult(resultObj);
      setPhase('results');
    } catch (err) {
      console.error('[EinzelquizPage] Submit failed:', err);
      setPhase('review');
    }
  };

  // --- LOADING ---
  if (phase === 'loading') {
    return (
      <div style={s.page}>
        <div style={s.loadingText}>Lade Quiz...</div>
      </div>
    );
  }

  // --- NOT FOUND ---
  if (phase === 'not-found') {
    return (
      <div style={s.page}>
        <div style={s.messageCard}>
          <div style={{ fontSize: 48 }}>{'\u{1F50D}'}</div>
          <div style={s.loadingText}>Quiz nicht gefunden.</div>
          <p style={s.messageDesc}>Bitte prüfe den Link und versuche es erneut.</p>
        </div>
      </div>
    );
  }

  // --- NAME ENTRY ---
  if (phase === 'name' && !nameSet) {
    return (
      <div style={s.page}>
        <div style={s.nameCard}>
          <h1 style={s.nameTitle}>{'\u{1F4DD}'} Einzelquiz</h1>
          <p style={s.nameDesc}>{quiz.title}</p>
          <p style={s.namePrompt}>Wie heißt du?</p>
          <form onSubmit={handleSetName} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Dein Name..."
              autoFocus
              style={s.nameInput}
            />
            <button type="submit" style={s.nameBtn}>Los geht's!</button>
          </form>
        </div>
      </div>
    );
  }

  // --- ALREADY SUBMITTED ---
  if (phase === 'already-done' && alreadySubmitted) {
    const r = alreadySubmitted;
    const isAssessment = quiz?.quizType === 'vortest' || quiz?.quizType === 'nachtest';
    if (isAssessment) {
      return (
        <div style={s.page}>
          <div style={s.resultCard}>
            <div style={{ fontSize: 56 }}>{'\u2705'}</div>
            <h2 style={{ ...s.resultTitle, color: '#27AE60' }}>Bereits abgegeben!</h2>
            <p style={s.resultName}>{r.name}</p>
            <p style={s.resultDetail}>Deine Antworten wurden gespeichert.</p>
          </div>
        </div>
      );
    }
    const pct = r.score;
    const color = pct >= 70 ? '#27AE60' : pct >= 40 ? '#E67E22' : '#E74C3C';
    return (
      <div style={s.page}>
        <div style={s.resultCard}>
          <div style={{ fontSize: 48 }}>{pct >= 70 ? '\u{1F389}' : pct >= 40 ? '\u{1F44D}' : '\u{1F4AA}'}</div>
          <h2 style={{ ...s.resultTitle, color }}>Bereits abgegeben!</h2>
          <p style={s.resultName}>{r.name}</p>
          <div style={{ ...s.scoreBig, color }}>{pct}%</div>
          <p style={s.resultDetail}>{r.correctCount} von {r.totalQuestions} richtig</p>
        </div>
      </div>
    );
  }

  const questions = quiz?.questions || [];

  // --- QUIZ PHASE ---
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    const progressPct = ((currentQ + 1) / questions.length) * 100;
    const hasAnswer = answers[currentQ] !== undefined;

    return (
      <div style={s.page}>
        <div style={s.quizContainer}>
          {/* Progress bar */}
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, width: `${progressPct}%` }} />
          </div>
          <div style={s.progressText}>
            Frage {currentQ + 1} von {questions.length}
          </div>

          {/* Question */}
          <div style={s.qCard}>
            {q.imageUrl && (
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <img src={q.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 12, objectFit: 'contain' }} />
              </div>
            )}
            <div style={s.qText}>{q.text}</div>
          </div>

          {/* MC */}
          {q.type === 'mc' && (
            <div style={s.mcGrid}>
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => handleAnswer(currentQ, oi)}
                  style={{
                    ...s.mcBtn,
                    background: MC_COLORS[oi],
                    opacity: answers[currentQ] === oi ? 1 : (answers[currentQ] !== undefined ? 0.4 : 0.85),
                    transform: answers[currentQ] === oi ? 'scale(1.03)' : 'scale(1)',
                    border: answers[currentQ] === oi ? '3px solid white' : '3px solid transparent',
                  }}
                >
                  <span style={s.mcShape}>{MC_SHAPES[oi]}</span>
                  <span style={s.mcText}>{opt}</span>
                </button>
              ))}
            </div>
          )}

          {/* TF */}
          {q.type === 'tf' && (
            <div style={s.tfGrid}>
              {['Richtig', 'Falsch'].map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => handleAnswer(currentQ, oi)}
                  style={{
                    ...s.tfBtn,
                    background: oi === 0 ? '#27AE60' : '#E74C3C',
                    opacity: answers[currentQ] === oi ? 1 : (answers[currentQ] !== undefined ? 0.4 : 0.85),
                    border: answers[currentQ] === oi ? '3px solid white' : '3px solid transparent',
                  }}
                >
                  <span style={s.tfIcon}>{oi === 0 ? '\u2713' : '\u2717'}</span>
                  <span style={s.tfText}>{opt}</span>
                </button>
              ))}
            </div>
          )}

          {/* Open */}
          {q.type === 'open' && (
            <div style={s.openArea}>
              <input
                type="text"
                value={answers[currentQ] || ''}
                onChange={(e) => handleAnswer(currentQ, e.target.value)}
                placeholder="Deine Antwort..."
                style={s.openInput}
              />
            </div>
          )}

          {/* Slider */}
          {q.type === 'slider' && (() => {
            const min = q.min ?? 0;
            const max = q.max ?? 100;
            const val = answers[currentQ] !== undefined ? answers[currentQ] : (sliderValue !== null ? sliderValue : Math.round((min + max) / 2));
            return (
              <div style={s.sliderArea}>
                <div style={s.sliderValue}>
                  {val}{q.unit ? ` ${q.unit}` : ''}
                </div>
                <input
                  type="range"
                  className="eq-slider"
                  min={min}
                  max={max}
                  step={1}
                  value={val}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSliderValue(v);
                    handleAnswer(currentQ, v);
                  }}
                  style={s.sliderInput}
                />
                <div style={s.sliderMinMax}>
                  <span>{min}{q.unit ? ` ${q.unit}` : ''}</span>
                  <span>{max}{q.unit ? ` ${q.unit}` : ''}</span>
                </div>
              </div>
            );
          })()}

          {/* Navigation */}
          <div style={s.navRow}>
            <button
              onClick={handlePrev}
              disabled={currentQ === 0}
              style={{ ...s.navBtn, opacity: currentQ === 0 ? 0.3 : 1 }}
            >
              {'\u2190 Zur\u00fcck'}
            </button>
            <button
              onClick={handleNext}
              disabled={!hasAnswer && q.type !== 'slider'}
              style={{
                ...s.navBtnPrimary,
                opacity: (!hasAnswer && q.type !== 'slider') ? 0.4 : 1,
              }}
            >
              {currentQ === questions.length - 1 ? '\u00dcbersicht \u2192' : 'Weiter \u2192'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- REVIEW ---
  if (phase === 'review') {
    const answered = Object.keys(answers).length;
    const total = questions.length;
    return (
      <div style={s.page}>
        <div style={s.reviewCard}>
          <h2 style={s.reviewTitle}>{'\u{1F4CB}'} Übersicht</h2>
          <p style={s.reviewSub}>{answered}/{total} Fragen beantwortet</p>

          <div style={s.reviewList}>
            {questions.map((q, i) => {
              const has = answers[i] !== undefined;
              let display = '';
              if (has) {
                if (q.type === 'mc') display = q.options[answers[i]] || '';
                else if (q.type === 'tf') display = answers[i] === 0 ? 'Richtig' : 'Falsch';
                else if (q.type === 'open') display = answers[i];
                else if (q.type === 'slider') display = `${answers[i]}${q.unit ? ` ${q.unit}` : ''}`;
              }
              return (
                <div
                  key={i}
                  onClick={() => { setCurrentQ(i); setPhase('quiz'); }}
                  style={{ ...s.reviewItem, borderLeft: `4px solid ${has ? '#27AE60' : '#E74C3C'}` }}
                >
                  <div style={s.reviewNum}>{i + 1}</div>
                  <div style={s.reviewContent}>
                    <div style={s.reviewQText}>{q.text}</div>
                    <div style={{ ...s.reviewAnswer, color: has ? '#27AE60' : '#E74C3C' }}>
                      {has ? display : 'Nicht beantwortet'}
                    </div>
                  </div>
                  <div style={s.reviewEdit}>{'\u270F\uFE0F'}</div>
                </div>
              );
            })}
          </div>

          <button onClick={handleSubmit} style={s.submitBtn}>
            Abgeben {'\u2705'}
          </button>
          <button onClick={() => { setCurrentQ(0); setPhase('quiz'); }} style={s.backToQuizBtn}>
            {'Zur\u00fcck zu den Fragen'}
          </button>
        </div>
      </div>
    );
  }

  // --- SUBMITTING ---
  if (phase === 'submitting') {
    return (
      <div style={s.page}>
        <div style={s.messageCard}>
          <div style={{ fontSize: 48, animation: 'pulse 1.5s ease-in-out infinite' }}>{'\u{1F4E4}'}</div>
          <div style={s.loadingText}>Wird abgeschickt...</div>
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  if (phase === 'results' && result) {
    const isAssessment = quiz?.quizType === 'vortest' || quiz?.quizType === 'nachtest';
    if (isAssessment) {
      return (
        <div style={s.page}>
          <div style={s.resultCard}>
            <div style={{ fontSize: 56 }}>{'\u{1F4E8}'}</div>
            <h2 style={{ ...s.resultTitle, color: '#27AE60' }}>Danke!</h2>
            <p style={s.resultDetail}>Deine Antworten wurden gespeichert.</p>
            <p style={{ ...s.resultDetail, fontSize: 15, color: '#999' }}>
              {'Du kannst das Fenster jetzt schlie\u00dfen.'}
            </p>
          </div>
        </div>
      );
    }
    const pct = result.score;
    const color = pct >= 70 ? '#27AE60' : pct >= 40 ? '#E67E22' : '#E74C3C';
    return (
      <div style={s.page}>
        <div style={s.resultCard}>
          <div style={{ fontSize: 56 }}>{pct >= 70 ? '\u{1F389}' : pct >= 40 ? '\u{1F44D}' : '\u{1F4AA}'}</div>
          <h2 style={{ ...s.resultTitle, color }}>
            {pct >= 70 ? 'Super gemacht!' : pct >= 40 ? 'Gut gemacht!' : 'Weiter so!'}
          </h2>
          <div style={{ ...s.scoreBig, color }}>{pct}%</div>
          <p style={s.resultDetail}>{result.correctCount} von {result.totalQuestions} richtig</p>

          {/* Per-question breakdown */}
          <div style={s.breakdownList}>
            {questions.map((q, i) => {
              const a = answers[i];
              const correct = scoreAnswer(q, a);
              return (
                <div key={i} style={{ ...s.breakdownItem, borderLeft: `4px solid ${correct ? '#27AE60' : '#E74C3C'}` }}>
                  <span style={{ ...s.breakdownIcon, color: correct ? '#27AE60' : '#E74C3C' }}>
                    {correct ? '\u2713' : '\u2717'}
                  </span>
                  <span style={s.breakdownText}>{q.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #FFF5EE 0%, #FFE8D6 50%, #F0E6D6 100%)',
    padding: '20px 16px 40px',
    fontFamily: "'Fredoka', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto',
    boxSizing: 'border-box',
    width: '100%',
  },
  loadingText: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: '#8B5A2B',
    textAlign: 'center',
  },
  messageCard: {
    background: 'white',
    borderRadius: 20,
    padding: '32px 20px',
    maxWidth: 'min(420px, 90vw)',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    textAlign: 'center',
  },
  messageDesc: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 17,
    color: '#777',
    fontWeight: 600,
    margin: 0,
  },
  // Name entry
  nameCard: {
    background: 'white',
    borderRadius: 20,
    padding: '32px 20px',
    maxWidth: 'min(400px, 90vw)',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  nameTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 28,
    color: '#2980B9',
    margin: 0,
  },
  nameDesc: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#333',
    margin: 0,
    textAlign: 'center',
  },
  namePrompt: { fontSize: 16, color: '#777', fontWeight: 600, margin: 0 },
  nameInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 18,
    borderRadius: 14,
    border: '2px solid rgba(41,128,185,0.3)',
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box',
  },
  nameBtn: {
    width: '100%',
    padding: '14px 24px',
    fontSize: 18,
    fontFamily: "'Lilita One', cursive",
    background: '#2980B9',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  // Quiz container
  quizContainer: {
    width: '100%',
    maxWidth: 'min(500px, 92vw)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxSizing: 'border-box',
  },
  progressBar: {
    width: '100%',
    height: 8,
    background: 'rgba(0,0,0,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2980B9, #27AE60)',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: '#999',
    textAlign: 'center',
  },
  qCard: {
    background: 'white',
    borderRadius: 16,
    padding: '20px 16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    boxSizing: 'border-box',
  },
  qText: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    wordBreak: 'break-word',
  },
  // MC
  mcGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  mcBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '18px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 70,
    transition: 'transform 0.15s ease, opacity 0.15s ease',
    WebkitTapHighlightColor: 'transparent',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  mcShape: { fontSize: 24, color: 'rgba(255,255,255,0.8)', flexShrink: 0 },
  mcText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 17,
    fontWeight: 700,
    color: 'white',
    textAlign: 'left',
    wordBreak: 'break-word',
    minWidth: 0,
  },
  // TF
  tfGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  tfBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '20px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    transition: 'transform 0.15s ease, opacity 0.15s ease',
    WebkitTapHighlightColor: 'transparent',
  },
  tfIcon: { fontSize: 28, color: 'white' },
  tfText: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    color: 'white',
  },
  // Open
  openArea: { display: 'flex', flexDirection: 'column', gap: 12 },
  openInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 18,
    borderRadius: 14,
    border: '2px solid rgba(41,128,185,0.3)',
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
  },
  // Slider
  sliderArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: 'white',
    borderRadius: 16,
    padding: '20px 16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    boxSizing: 'border-box',
    alignItems: 'center',
  },
  sliderValue: {
    fontFamily: "'Baloo 2', cursive",
    fontSize: 40,
    fontWeight: 800,
    color: '#2C3E50',
    textAlign: 'center',
  },
  sliderInput: {
    width: '100%',
    height: 44,
    WebkitAppearance: 'none',
    appearance: 'none',
    background: 'linear-gradient(90deg, #BDC3C7, #2C3E50)',
    borderRadius: 22,
    outline: 'none',
    cursor: 'pointer',
  },
  sliderMinMax: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: '#999',
  },
  // Navigation
  navRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'space-between',
  },
  navBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    padding: '12px 20px',
    background: 'rgba(0,0,0,0.06)',
    color: '#555',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
  },
  navBtnPrimary: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    padding: '12px 24px',
    background: '#2980B9',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    flex: 1,
    textAlign: 'center',
  },
  // Review
  reviewCard: {
    background: 'white',
    borderRadius: 20,
    padding: '24px 16px',
    maxWidth: 'min(500px, 92vw)',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  reviewTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: '#333',
    margin: 0,
    textAlign: 'center',
  },
  reviewSub: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: '#999',
    margin: 0,
    textAlign: 'center',
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: '50vh',
    overflowY: 'auto',
  },
  reviewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: '#F8F8F8',
    borderRadius: 10,
    cursor: 'pointer',
  },
  reviewNum: {
    fontFamily: "'Baloo 2', cursive",
    fontSize: 18,
    fontWeight: 700,
    color: '#999',
    width: 28,
    textAlign: 'center',
    flexShrink: 0,
  },
  reviewContent: { flex: 1, minWidth: 0 },
  reviewQText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  reviewAnswer: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  reviewEdit: { fontSize: 14, flexShrink: 0 },
  submitBtn: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 20,
    padding: '14px 24px',
    background: '#27AE60',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    textAlign: 'center',
  },
  backToQuizBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    padding: '10px 16px',
    background: 'rgba(0,0,0,0.06)',
    color: '#666',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    textAlign: 'center',
  },
  // Results
  resultCard: {
    background: 'white',
    borderRadius: 24,
    padding: '32px 20px',
    maxWidth: 'min(500px, 92vw)',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    textAlign: 'center',
  },
  resultTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 26,
    margin: 0,
  },
  resultName: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: '#777',
    margin: 0,
  },
  scoreBig: {
    fontFamily: "'Baloo 2', cursive",
    fontSize: 56,
    fontWeight: 800,
    lineHeight: 1,
  },
  resultDetail: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 18,
    fontWeight: 600,
    color: '#555',
    margin: 0,
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
    marginTop: 8,
    maxHeight: '40vh',
    overflowY: 'auto',
  },
  breakdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    background: '#F8F8F8',
    borderRadius: 8,
  },
  breakdownIcon: {
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
    width: 24,
    textAlign: 'center',
  },
  breakdownText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
};
