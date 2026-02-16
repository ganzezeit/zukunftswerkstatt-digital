import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export default function EinzelquizResults({ quizId, quiz, dayColor, onClose }) {
  const [results, setResults] = useState([]);
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'name' | 'time'
  const color = dayColor || '#2980B9';

  useEffect(() => {
    const resultsRef = ref(db, `einzelquizResults/${quizId}`);
    const unsub = onValue(resultsRef, (snap) => {
      const data = snap.val();
      if (data) {
        setResults(Object.values(data));
      } else {
        setResults([]);
      }
    });
    return () => unsub();
  }, [quizId]);

  const questions = quiz?.questions || [];
  const sorted = [...results].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'time') return (a.submittedAt || 0) - (b.submittedAt || 0);
    return 0;
  });

  const avg = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;
  const best = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
  const worst = results.length > 0 ? Math.min(...results.map(r => r.score)) : 0;

  // Per-question stats
  const questionStats = questions.map((q, i) => {
    let correct = 0;
    results.forEach(r => {
      if (r.answers?.[i]?.correct) correct++;
    });
    return {
      question: q.text,
      type: q.type,
      correctCount: correct,
      totalCount: results.length,
      pct: results.length > 0 ? Math.round((correct / results.length) * 100) : 0,
    };
  });

  const scoreColor = (pct) => pct >= 70 ? '#27AE60' : pct >= 40 ? '#E67E22' : '#E74C3C';

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={onClose} style={s.backBtn} className="no-print">{'\u2190'}</button>
        <h2 style={{ ...s.title, color }}>{'\u{1F4CA}'} Ergebnisse: {quiz?.title}</h2>
      </div>

      {results.length === 0 ? (
        <div style={s.emptyCard}>
          <p style={s.emptyText}>Noch keine Ergebnisse vorhanden.</p>
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <div style={s.statValue}>{results.length}</div>
              <div style={s.statLabel}>Teilnehmer</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statValue, color: scoreColor(avg) }}>{avg}%</div>
              <div style={s.statLabel}>Durchschnitt</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statValue, color: '#27AE60' }}>{best}%</div>
              <div style={s.statLabel}>Beste</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statValue, color: '#E74C3C' }}>{worst}%</div>
              <div style={s.statLabel}>Schlechteste</div>
            </div>
          </div>

          {/* Sort buttons */}
          <div style={s.sortRow} className="no-print">
            {[
              { key: 'score', label: 'Nach Ergebnis' },
              { key: 'name', label: 'Nach Name' },
              { key: 'time', label: 'Nach Zeit' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                style={{
                  ...s.sortBtn,
                  background: sortBy === opt.key ? color : 'rgba(0,0,0,0.04)',
                  color: sortBy === opt.key ? 'white' : '#555',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Per-student table */}
          <div style={s.tableSection}>
            <h3 style={s.sectionTitle}>{'\u{1F465}'} Ergebnisse pro Schüler</h3>
            <div style={s.table}>
              {sorted.map((r, i) => {
                const c = scoreColor(r.score);
                const time = r.submittedAt
                  ? new Date(r.submittedAt).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                  : '';
                return (
                  <div key={r.name + i} style={s.tableRow}>
                    <span style={s.rank}>{i + 1}.</span>
                    <span style={s.studentName}>{r.name}</span>
                    <span style={s.studentDetail}>{r.correctCount}/{r.totalQuestions}</span>
                    <span style={{ ...s.studentPct, color: c }}>{r.score}%</span>
                    <span style={s.studentTime}>{time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-question analysis */}
          <div style={s.tableSection}>
            <h3 style={s.sectionTitle}>{'\u{1F4CB}'} Analyse pro Frage</h3>
            {questionStats.map((qs, i) => (
              <div key={i} style={s.questionRow}>
                <div style={s.qHeader}>
                  <span style={s.qNum}>{i + 1}.</span>
                  <span style={s.qText}>{qs.question}</span>
                  <span style={{ ...s.qBadge, background: qs.type === 'mc' ? '#2980B9' : qs.type === 'tf' ? '#8E44AD' : qs.type === 'slider' ? '#2C3E50' : '#E67E22' }}>
                    {qs.type.toUpperCase()}
                  </span>
                </div>
                <div style={s.barBg}>
                  <div style={{ ...s.barFill, width: `${qs.pct}%`, background: scoreColor(qs.pct) }} />
                </div>
                <div style={s.qFooter}>
                  <span style={{ ...s.qPct, color: scoreColor(qs.pct) }}>{qs.pct}% richtig</span>
                  <span style={s.qCount}>{qs.correctCount}/{qs.totalCount}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Print */}
          <button onClick={() => window.print()} style={{ ...s.printBtn, background: color }} className="no-print">
            {'\u{1F5A8}\uFE0F'} Drucken / PDF
          </button>
        </>
      )}
    </div>
  );
}

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' },
  header: { display: 'flex', alignItems: 'center', gap: 10 },
  backBtn: { fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, padding: '4px 10px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#555', lineHeight: 1 },
  title: { fontFamily: "'Lilita One', cursive", fontSize: 20, margin: 0 },
  emptyCard: { padding: '24px 16px', background: '#F8F8F8', borderRadius: 12, textAlign: 'center' },
  emptyText: { fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 600, color: '#999', margin: 0 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  statCard: { background: '#F8F8F8', borderRadius: 12, padding: '12px 8px', textAlign: 'center' },
  statValue: { fontFamily: "'Baloo 2', cursive", fontSize: 24, fontWeight: 800, color: '#333' },
  statLabel: { fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600, color: '#999' },
  sortRow: { display: 'flex', gap: 6 },
  sortBtn: { fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, padding: '6px 12px', border: 'none', borderRadius: 8, cursor: 'pointer' },
  tableSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionTitle: { fontFamily: "'Lilita One', cursive", fontSize: 18, color: '#333', margin: 0 },
  table: { display: 'flex', flexDirection: 'column', gap: 4 },
  tableRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#F8F8F8', borderRadius: 8 },
  rank: { fontFamily: "'Baloo 2', cursive", fontSize: 16, fontWeight: 700, color: '#999', width: 28, textAlign: 'center', flexShrink: 0 },
  studentName: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: '#333', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  studentDetail: { fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600, color: '#777', flexShrink: 0 },
  studentPct: { fontFamily: "'Baloo 2', cursive", fontSize: 16, fontWeight: 800, flexShrink: 0, width: 44, textAlign: 'right' },
  studentTime: { fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 500, color: '#BBB', flexShrink: 0, width: 80, textAlign: 'right' },
  questionRow: { display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', background: '#F8F8F8', borderRadius: 10 },
  qHeader: { display: 'flex', alignItems: 'center', gap: 6 },
  qNum: { fontFamily: "'Baloo 2', cursive", fontSize: 14, fontWeight: 700, color: '#999', flexShrink: 0 },
  qText: { fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  qBadge: { fontFamily: "'Fredoka', sans-serif", fontSize: 10, fontWeight: 700, color: 'white', padding: '1px 6px', borderRadius: 4, flexShrink: 0 },
  barBg: { width: '100%', height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease' },
  qFooter: { display: 'flex', justifyContent: 'space-between' },
  qPct: { fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700 },
  qCount: { fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600, color: '#999' },
  printBtn: { fontFamily: "'Lilita One', cursive", fontSize: 16, padding: '10px 20px', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'center' },
};
