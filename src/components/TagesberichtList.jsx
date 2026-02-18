import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';
import { DAYS } from '../data/days';
import TagesberichtModal from './TagesberichtModal';

export default function TagesberichtList({ className, teacherName, onClose }) {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);

  const loadReports = () => {
    if (!className) { setLoading(false); return; }
    get(ref(db, `classes/${className}/dailyReports`)).then(snap => {
      setReports(snap.val() || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, [className]);

  if (editingDay) {
    return (
      <TagesberichtModal
        dayNumber={editingDay}
        className={className}
        teacherName={teacherName}
        onClose={() => setEditingDay(null)}
        onSaved={() => { setEditingDay(null); loadReports(); }}
      />
    );
  }

  return (
    <div style={s.overlay}>
      <div style={s.content}>
        <div style={s.header}>
          <h2 style={s.title}>{'\u{1F4DD}'} Tagesberichte</h2>
          <button onClick={onClose} style={s.closeBtn}>Schliessen</button>
        </div>

        {loading ? (
          <p style={s.loadingText}>Laden...</p>
        ) : (
          <div style={s.list}>
            {DAYS.map(day => {
              const report = reports[day.id];
              const hasReport = !!report;
              return (
                <div
                  key={day.id}
                  style={{ ...s.dayCard, borderLeft: `4px solid ${day.color}` }}
                  onClick={() => setEditingDay(day.id)}
                >
                  <div style={s.dayHeader}>
                    <span style={{ ...s.dayBadge, background: day.color }}>
                      {day.emoji} {day.name}
                    </span>
                    <span style={s.daySub}>{day.sub}</span>
                    <span style={{
                      ...s.statusBadge,
                      background: hasReport ? '#E8F5E9' : '#FFF3E0',
                      color: hasReport ? '#2E7D32' : '#E65100',
                    }}>
                      {hasReport ? '\u2705 Eingereicht' : '\u26A0\uFE0F Ausstehend'}
                    </span>
                  </div>

                  {hasReport && (
                    <div style={s.previewText}>
                      {report.whatWasDone?.slice(0, 120)}{report.whatWasDone?.length > 120 ? '...' : ''}
                    </div>
                  )}

                  {hasReport && report.completedAt && (
                    <div style={s.dateMeta}>
                      {new Date(report.completedAt).toLocaleString('de-DE', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                      {report.completedBy ? ` — ${report.completedBy}` : ''}
                    </div>
                  )}

                  <div style={s.editHint}>
                    {hasReport ? 'Bearbeiten' : 'Jetzt ausfuellen'} {'\u2192'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9700,
    background: 'rgba(255, 250, 245, 0.98)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    overflowY: 'auto',
  },
  content: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 26,
    color: '#333',
    margin: 0,
  },
  closeBtn: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    padding: '10px 20px',
    background: 'rgba(0,0,0,0.06)',
    color: '#666',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
  },
  loadingText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 16,
    color: '#999',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  dayCard: {
    background: 'white',
    borderRadius: 14,
    padding: '16px 20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
  dayHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  dayBadge: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 15,
    color: 'white',
    padding: '3px 12px',
    borderRadius: 10,
  },
  daySub: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: '#666',
    flex: 1,
  },
  statusBadge: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 8,
  },
  previewText: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 13,
    color: '#777',
    fontWeight: 500,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  dateMeta: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 11,
    color: '#BBB',
    fontWeight: 500,
  },
  editHint: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: 12,
    color: '#2980B9',
    fontWeight: 600,
    marginTop: 6,
  },
};
