import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';

export default function EinzelquizComparison({ vortestId, nachtestId, vortestQuiz, nachtestQuiz, dayColor, onClose }) {
  const [vortestResults, setVortestResults] = useState([]);
  const [nachtestResults, setNachtestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const color = dayColor || '#2980B9';

  useEffect(() => {
    Promise.all([
      get(ref(db, `einzelquizResults/${vortestId}`)),
      get(ref(db, `einzelquizResults/${nachtestId}`)),
    ]).then(([vSnap, nSnap]) => {
      setVortestResults(vSnap.val() ? Object.values(vSnap.val()) : []);
      setNachtestResults(nSnap.val() ? Object.values(nSnap.val()) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [vortestId, nachtestId]);

  const scoreColor = (pct) => pct >= 70 ? '#27AE60' : pct >= 40 ? '#E67E22' : '#E74C3C';
  const deltaColor = (d) => d > 0 ? '#27AE60' : d < 0 ? '#E74C3C' : '#999';
  const deltaArrow = (d) => d > 0 ? '\u2191' : d < 0 ? '\u2193' : '\u2192';

  if (loading) {
    return (
      <div style={s.container}>
        <div style={s.header}>
          <button onClick={onClose} style={s.backBtn}>{'\u2190'}</button>
          <h2 style={{ ...s.title, color }}>Lade Vergleich...</h2>
        </div>
      </div>
    );
  }

  // Averages
  const vAvg = vortestResults.length > 0
    ? Math.round(vortestResults.reduce((s, r) => s + r.score, 0) / vortestResults.length)
    : 0;
  const nAvg = nachtestResults.length > 0
    ? Math.round(nachtestResults.reduce((s, r) => s + r.score, 0) / nachtestResults.length)
    : 0;
  const avgDelta = nAvg - vAvg;

  // Students who took both
  const vMap = {};
  vortestResults.forEach(r => { vMap[r.name] = r; });
  const nMap = {};
  nachtestResults.forEach(r => { nMap[r.name] = r; });
  const bothNames = Object.keys(vMap).filter(n => nMap[n]).sort((a, b) => {
    const dA = (nMap[a].score - vMap[a].score);
    const dB = (nMap[b].score - vMap[b].score);
    return dB - dA;
  });

  // Per-question comparison (use shorter list)
  const vQuestions = vortestQuiz?.questions || [];
  const nQuestions = nachtestQuiz?.questions || [];
  const maxQ = Math.min(vQuestions.length, nQuestions.length);
  const questionComparison = [];
  for (let i = 0; i < maxQ; i++) {
    let vCorrect = 0, nCorrect = 0;
    vortestResults.forEach(r => { if (r.answers?.[i]?.correct) vCorrect++; });
    nachtestResults.forEach(r => { if (r.answers?.[i]?.correct) nCorrect++; });
    const vPct = vortestResults.length > 0 ? Math.round((vCorrect / vortestResults.length) * 100) : 0;
    const nPct = nachtestResults.length > 0 ? Math.round((nCorrect / nachtestResults.length) * 100) : 0;
    questionComparison.push({
      text: vQuestions[i]?.text || nQuestions[i]?.text || `Frage ${i + 1}`,
      vPct,
      nPct,
      delta: nPct - vPct,
    });
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={onClose} style={s.backBtn}>{'\u2190'}</button>
        <h2 style={{ ...s.title, color }}>{'\u{1F4CA}'} Vortest vs Nachtest</h2>
      </div>

      {/* Average comparison */}
      <div style={s.avgSection}>
        <div style={s.avgCard}>
          <div style={s.avgLabel}>Vortest</div>
          <div style={{ ...s.avgValue, color: scoreColor(vAvg) }}>{vAvg}%</div>
          <div style={s.avgCount}>{vortestResults.length} Schüler</div>
        </div>
        <div style={s.avgArrow}>
          <span style={{ ...s.avgDelta, color: deltaColor(avgDelta) }}>
            {deltaArrow(avgDelta)} {avgDelta > 0 ? '+' : ''}{avgDelta}%
          </span>
        </div>
        <div style={s.avgCard}>
          <div style={s.avgLabel}>Nachtest</div>
          <div style={{ ...s.avgValue, color: scoreColor(nAvg) }}>{nAvg}%</div>
          <div style={s.avgCount}>{nachtestResults.length} Schüler</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ ...s.summaryCard, borderColor: deltaColor(avgDelta) }}>
        <p style={s.summaryText}>
          {avgDelta > 0
            ? `Die Klasse hat sich um ${avgDelta}% verbessert!`
            : avgDelta === 0
              ? 'Das Ergebnis ist gleich geblieben.'
              : `Das Ergebnis ist um ${Math.abs(avgDelta)}% gesunken.`}
        </p>
      </div>

      {/* Per-student table */}
      {bothNames.length > 0 && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>{'\u{1F465}'} Vergleich pro Schüler</h3>
          <div style={s.table}>
            {bothNames.map((name, i) => {
              const vr = vMap[name];
              const nr = nMap[name];
              const d = nr.score - vr.score;
              return (
                <div key={name} style={s.tableRow}>
                  <span style={s.rank}>{i + 1}.</span>
                  <span style={s.studentName}>{name}</span>
                  <span style={{ ...s.studentPct, color: scoreColor(vr.score) }}>{vr.score}%</span>
                  <span style={{ ...s.arrow, color: deltaColor(d) }}>{deltaArrow(d)}</span>
                  <span style={{ ...s.studentPct, color: scoreColor(nr.score) }}>{nr.score}%</span>
                  <span style={{ ...s.delta, color: deltaColor(d) }}>
                    {d > 0 ? '+' : ''}{d}%
                  </span>
                </div>
              );
            })}
          </div>
          {bothNames.length < vortestResults.length && (
            <p style={s.note}>
              {vortestResults.length - bothNames.length} Schüler haben nur den Vortest gemacht.
            </p>
          )}
        </div>
      )}

      {/* Per-question comparison */}
      {questionComparison.length > 0 && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>{'\u{1F4CB}'} Vergleich pro Frage</h3>
          {questionComparison.map((qc, i) => (
            <div key={i} style={s.qRow}>
              <div style={s.qHeader}>
                <span style={s.qNum}>{i + 1}.</span>
                <span style={s.qText}>{qc.text}</span>
              </div>
              <div style={s.qBars}>
                <div style={s.barGroup}>
                  <span style={s.barLabel}>V</span>
                  <div style={s.barBg}>
                    <div style={{ ...s.barFill, width: `${qc.vPct}%`, background: '#2980B9' }} />
                  </div>
                  <span style={s.barPct}>{qc.vPct}%</span>
                </div>
                <div style={s.barGroup}>
                  <span style={s.barLabel}>N</span>
                  <div style={s.barBg}>
                    <div style={{ ...s.barFill, width: `${qc.nPct}%`, background: '#27AE60' }} />
                  </div>
                  <span style={s.barPct}>{qc.nPct}%</span>
                </div>
              </div>
              <div style={{ ...s.qDelta, color: deltaColor(qc.delta) }}>
                {deltaArrow(qc.delta)} {qc.delta > 0 ? '+' : ''}{qc.delta}%
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => window.print()} style={{ ...s.printBtn, background: color }} className="no-print">
        {'\u{1F5A8}\uFE0F'} Drucken / PDF
      </button>
    </div>
  );
}

const s = {
  container: { display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' },
  header: { display: 'flex', alignItems: 'center', gap: 10 },
  backBtn: { fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, padding: '4px 10px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#555', lineHeight: 1 },
  title: { fontFamily: "'Lilita One', cursive", fontSize: 20, margin: 0 },
  avgSection: { display: 'flex', alignItems: 'center', gap: 8 },
  avgCard: { flex: 1, background: '#F8F8F8', borderRadius: 14, padding: '16px 12px', textAlign: 'center' },
  avgLabel: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: '#777' },
  avgValue: { fontFamily: "'Baloo 2', cursive", fontSize: 36, fontWeight: 800 },
  avgCount: { fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600, color: '#BBB' },
  avgArrow: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  avgDelta: { fontFamily: "'Baloo 2', cursive", fontSize: 20, fontWeight: 800 },
  summaryCard: { padding: '14px 16px', borderRadius: 12, borderWidth: 2, borderStyle: 'solid', background: '#FAFAFA' },
  summaryText: { fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700, color: '#333', margin: 0, textAlign: 'center' },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionTitle: { fontFamily: "'Lilita One', cursive", fontSize: 18, color: '#333', margin: 0 },
  table: { display: 'flex', flexDirection: 'column', gap: 4 },
  tableRow: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: '#F8F8F8', borderRadius: 8 },
  rank: { fontFamily: "'Baloo 2', cursive", fontSize: 14, fontWeight: 700, color: '#999', width: 24, textAlign: 'center', flexShrink: 0 },
  studentName: { fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: '#333', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  studentPct: { fontFamily: "'Baloo 2', cursive", fontSize: 16, fontWeight: 800, flexShrink: 0, width: 40, textAlign: 'center' },
  arrow: { fontSize: 16, fontWeight: 700, flexShrink: 0, width: 20, textAlign: 'center' },
  delta: { fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, flexShrink: 0, width: 44, textAlign: 'right' },
  note: { fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 500, color: '#999', fontStyle: 'italic', margin: 0 },
  qRow: { padding: '10px 12px', background: '#F8F8F8', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6 },
  qHeader: { display: 'flex', alignItems: 'center', gap: 6 },
  qNum: { fontFamily: "'Baloo 2', cursive", fontSize: 14, fontWeight: 700, color: '#999', flexShrink: 0 },
  qText: { fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  qBars: { display: 'flex', flexDirection: 'column', gap: 4 },
  barGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  barLabel: { fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700, color: '#999', width: 14, flexShrink: 0 },
  barBg: { flex: 1, height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease' },
  barPct: { fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, color: '#555', width: 36, textAlign: 'right', flexShrink: 0 },
  qDelta: { fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700, textAlign: 'right' },
  printBtn: { fontFamily: "'Lilita One', cursive", fontSize: 16, padding: '10px 20px', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'center' },
};
