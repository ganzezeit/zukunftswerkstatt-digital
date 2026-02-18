import React from 'react';
import { MISSION_TYPE_CONFIG } from '../../schema/templateSchema';

export default function CreatorPreview({ template, onClose }) {
  if (!template) return null;

  return (
    <div style={s.container}>
      <div style={s.content}>
        {/* Header */}
        <div style={s.header}>
          <button onClick={onClose} style={s.backBtn}>{'\u2190'} Zurueck zum Editor</button>
          <h1 style={s.title}>{'\u{1F441}\uFE0F'} Vorschau: {template.title}</h1>
          <p style={s.hint}>{template.description}</p>
          <div style={s.metaRow}>
            {template.duration > 0 && <span style={s.metaChip}>{'\u{1F4C5}'} {template.duration} Tage</span>}
            {template.targetAge && <span style={s.metaChip}>{'\u{1F9D2}'} {template.targetAge} Jahre</span>}
            {template.version && <span style={s.metaChip}>v{template.version}</span>}
          </div>
        </div>

        {/* Days */}
        {(template.days || []).map((day, di) => (
          <div key={di} style={s.dayCard}>
            <div style={{ ...s.dayHeader, borderLeftColor: day.color || '#FF6B35' }}>
              <span style={s.dayEmoji}>{day.emoji}</span>
              <div>
                <h2 style={s.dayName}>{day.name}</h2>
                {day.sub && <p style={s.daySub}>{day.sub}</p>}
              </div>
              <span style={s.stepCount}>{day.steps?.length || 0} Missionen</span>
            </div>

            {(day.steps || []).map((step, si) => {
              const meta = MISSION_TYPE_CONFIG.steps[step.type] || {};
              return (
                <div key={si} style={s.stepRow}>
                  <div style={{ ...s.stepDot, background: day.color || '#FF6B35' }} />
                  <div style={s.stepLine} />
                  <div style={s.stepCard}>
                    <div style={s.stepTop}>
                      <span style={s.stepIcon}>{step.icon || meta.icon || '\u{1F4DD}'}</span>
                      <span style={s.stepTitle}>{step.title}</span>
                      <span style={{ ...s.stepBadge, background: (meta.color || '#999') + '18', color: meta.color || '#999' }}>
                        {meta.label || step.type}
                      </span>
                      <span style={s.stepEnergy}>{'\u26A1'} {step.energyCost || 10}</span>
                    </div>
                    {step.desc && <p style={s.stepDesc}>{step.desc}</p>}
                    {step.type === 'multi-step' && step.content?.subSteps && (
                      <div style={s.subStepList}>
                        {step.content.subSteps.map((sub, ssi) => (
                          <span key={ssi} style={s.subStepChip}>
                            {MISSION_TYPE_CONFIG.subSteps[sub.subType]?.icon || '\u{1F4DD}'} {sub.title}
                          </span>
                        ))}
                      </div>
                    )}
                    {step.type === 'activity' && step.content?.text && (
                      <p style={s.stepText}>{step.content.text.slice(0, 100)}{step.content.text.length > 100 ? '...' : ''}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {(!day.steps || day.steps.length === 0) && (
              <p style={s.noMissions}>Keine Missionen in diesem Tag.</p>
            )}
          </div>
        ))}

        <button onClick={onClose} style={s.backBtnBottom}>{'\u2190'} Zurueck zum Editor</button>
      </div>
    </div>
  );
}

const s = {
  container: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    overflowY: 'auto',
    background: 'linear-gradient(160deg, #FFE5D9 0%, #D4E4F7 100%)',
    padding: '30px 20px', boxSizing: 'border-box',
  },
  content: { maxWidth: 700, width: '100%', margin: '0 auto' },
  header: { marginBottom: 24 },
  backBtn: {
    padding: '8px 16px', border: '2px solid #E0D6CC', borderRadius: 12,
    background: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 14,
    fontWeight: 600, color: '#8B5A2B', cursor: 'pointer', marginBottom: 16,
  },
  title: {
    fontFamily: "'Lilita One', cursive", fontSize: 28, color: '#8B5A2B', margin: '0 0 6px',
  },
  hint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, color: '#777', margin: '0 0 10px', fontWeight: 500,
  },
  metaRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  metaChip: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600,
    color: '#8B5A2B', background: 'rgba(255, 107, 53, 0.1)', padding: '3px 10px', borderRadius: 8,
  },
  dayCard: {
    background: '#fff', borderRadius: 20, padding: '20px 24px', marginBottom: 16,
    boxShadow: '0 4px 16px rgba(139, 90, 43, 0.08)',
  },
  dayHeader: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
    borderLeft: '4px solid #FF6B35', paddingLeft: 12,
  },
  dayEmoji: { fontSize: 32 },
  dayName: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, color: '#333', margin: 0,
  },
  daySub: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, color: '#999', margin: '2px 0 0', fontWeight: 500,
  },
  stepCount: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700,
    color: '#999', marginLeft: 'auto',
  },
  stepRow: {
    display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, position: 'relative', paddingLeft: 16,
  },
  stepDot: {
    position: 'absolute', left: 0, top: 12, width: 10, height: 10, borderRadius: '50%',
  },
  stepLine: {
    position: 'absolute', left: 4, top: 24, width: 2, bottom: -10,
    background: '#EEE',
  },
  stepCard: {
    flex: 1, padding: '10px 14px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #EEE',
  },
  stepTop: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stepIcon: { fontSize: 18 },
  stepTitle: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700, color: '#333', flex: 1,
  },
  stepBadge: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
  },
  stepEnergy: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600, color: '#FFB300',
  },
  stepDesc: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, color: '#777', margin: '6px 0 0', fontWeight: 500,
  },
  stepText: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, color: '#999', margin: '6px 0 0',
    fontStyle: 'italic',
  },
  subStepList: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  subStepChip: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 6, background: '#E8F5E9', color: '#2E7D32',
  },
  noMissions: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, color: '#CCC',
    textAlign: 'center', padding: 16, fontStyle: 'italic',
  },
  backBtnBottom: {
    display: 'block', width: '100%', padding: '14px', border: '2px solid #E0D6CC', borderRadius: 14,
    background: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 15,
    fontWeight: 600, color: '#8B5A2B', cursor: 'pointer', textAlign: 'center', marginTop: 8,
  },
};
