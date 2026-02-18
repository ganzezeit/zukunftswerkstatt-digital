import React, { useState } from 'react';
import { MISSION_TYPE_CONFIG } from '../../schema/templateSchema';
import ArtStudioConfig from './ArtStudioConfig';
import VideoConfig from './VideoConfig';
import SlidesConfig from './SlidesConfig';
import IconGenerator from './IconGenerator';

const ICON_OPTIONS = [
  '\u{1F4DD}', '\u{1F4CA}', '\u{1F4FA}', '\u{1F4CB}', '\u{1F3AF}',
  '\u{1F4F9}', '\u{1F30D}', '\u{1F3AE}', '\u{1F4DA}', '\u26BD',
  '\u{1F4F7}', '\u{1F5FA}\uFE0F', '\u{1F31F}', '\u{1F4AC}', '\u{1F4AD}',
  '\u{1F465}', '\u{1F6E0}\uFE0F', '\u{1F4BB}', '\u{1F3A4}', '\u{1F3A8}',
  '\u{1F389}', '\u{1F3B2}', '\u{1F3B5}', '\u2764\uFE0F', '\u{1F680}',
];

const SUB_STEP_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'slides', label: 'Praesentation' },
  { value: 'video', label: 'Video' },
  { value: 'kahoot', label: 'Kahoot' },
  { value: 'lernkarten', label: 'Lernkarten' },
  { value: 'einzelquiz', label: 'Einzelquiz' },
  { value: 'landeskunde', label: 'Landeskunde' },
  { value: 'matching-game', label: 'Zuordnungsspiel' },
];

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function setNestedValue(obj, path, value) {
  const clone = JSON.parse(JSON.stringify(obj));
  const keys = path.split('.');
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]]) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

export default function MissionConfig({ mission, missionIdx, onUpdate, onClose }) {
  const [showIconGen, setShowIconGen] = useState(false);
  const typeConfig = MISSION_TYPE_CONFIG.steps[mission.type];
  const uiFields = typeConfig?.uiFields || [];

  const handleFieldChange = (fieldKey, value) => {
    // Build updated mission
    const updated = { ...mission };
    if (fieldKey.startsWith('content.')) {
      const contentKey = fieldKey.slice(8);
      updated.content = setNestedValue(mission.content || {}, contentKey, value);
    } else {
      updated[fieldKey] = value;
    }
    onUpdate(updated);
  };

  const handleTopChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.panel}>
        <div style={s.panelHeader}>
          <h3 style={s.panelTitle}>Mission bearbeiten</h3>
          <button onClick={onClose} style={s.closeBtn}>{'\u2715'}</button>
        </div>

        <div style={s.panelBody}>
          {/* Common fields */}
          <label style={s.label}>Titel</label>
          <input
            value={mission.title || ''}
            onChange={e => handleTopChange('title', e.target.value)}
            style={s.input}
          />

          <label style={s.label}>Icon</label>
          {mission.iconImage && (
            <div style={s.iconImagePreview}>
              <img src={mission.iconImage} alt="Icon" style={s.iconImageImg} />
              <button onClick={() => handleTopChange('iconImage', null)} style={s.iconImageClear}>{'\u2715'}</button>
            </div>
          )}
          <div style={s.iconGrid}>
            {ICON_OPTIONS.map(ic => (
              <button
                key={ic}
                onClick={() => { handleTopChange('icon', ic); handleTopChange('iconImage', null); }}
                style={{
                  ...s.iconBtn,
                  outline: !mission.iconImage && mission.icon === ic ? '2px solid #FF6B35' : 'none',
                }}
              >
                {ic}
              </button>
            ))}
            <button onClick={() => setShowIconGen(true)} style={s.aiIconBtn} title="KI-Icon generieren">
              {'\u{1F3A8}'}
            </button>
          </div>

          <label style={s.label}>Energiekosten</label>
          <div style={s.sliderRow}>
            <input
              type="range" min={0} max={20} step={5}
              value={mission.energyCost || 10}
              onChange={e => handleTopChange('energyCost', parseInt(e.target.value))}
              style={s.slider}
            />
            <span style={s.sliderVal}>{'\u26A1'} {mission.energyCost || 10}</span>
          </div>

          <label style={s.label}>Beschreibung (Timeline)</label>
          <input
            value={mission.desc || ''}
            onChange={e => handleTopChange('desc', e.target.value)}
            placeholder="Optional: kurze Beschreibung"
            style={s.input}
          />

          {/* Divider */}
          <div style={s.divider} />
          <h4 style={s.sectionTitle}>{typeConfig?.label || mission.type} - Inhalt</h4>

          {/* Type-specific fields */}
          {mission.type === 'multi-step' ? (
            <SubStepEditor
              subSteps={mission.content?.subSteps || []}
              onChange={(subSteps) => handleFieldChange('content.subSteps', subSteps)}
            />
          ) : mission.type === 'art-studio' ? (
            <ArtStudioConfig
              content={mission.content || {}}
              onChange={(content) => onUpdate({ content })}
            />
          ) : mission.type === 'video' ? (
            <VideoConfig
              content={mission.content || {}}
              onChange={(content) => onUpdate({ content })}
            />
          ) : mission.type === 'slides' ? (
            <SlidesConfig
              content={mission.content || {}}
              onChange={(content) => onUpdate({ content })}
            />
          ) : (
            uiFields.map(field => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={getNestedValue(mission, field.key)}
                mission={mission}
                onChange={(val) => handleFieldChange(field.key, val)}
              />
            ))
          )}
        </div>

        <div style={s.panelFooter}>
          <button onClick={onClose} style={s.doneBtn}>Fertig</button>
        </div>
      </div>

      {showIconGen && (
        <IconGenerator
          onSelect={(url) => { handleTopChange('iconImage', url); setShowIconGen(false); }}
          onClose={() => setShowIconGen(false)}
        />
      )}
    </div>
  );
}

// ─── Sub-step editor for multi-step type ───
function SubStepEditor({ subSteps, onChange }) {
  const [editingIdx, setEditingIdx] = useState(null);

  const addSubStep = () => {
    onChange([...subSteps, { title: `Schritt ${subSteps.length + 1}`, subType: 'text', text: '' }]);
  };

  const removeSubStep = (idx) => {
    onChange(subSteps.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const updateSubStep = (idx, updates) => {
    const updated = [...subSteps];
    updated[idx] = { ...updated[idx], ...updates };
    onChange(updated);
  };

  const moveSubStep = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= subSteps.length) return;
    const updated = [...subSteps];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onChange(updated);
    if (editingIdx === fromIdx) setEditingIdx(toIdx);
  };

  const editingSub = editingIdx !== null ? subSteps[editingIdx] : null;
  const subConfig = editingSub ? MISSION_TYPE_CONFIG.subSteps[editingSub.subType] : null;

  return (
    <div>
      <div style={s.subList}>
        {subSteps.map((sub, i) => (
          <div
            key={i}
            onClick={() => setEditingIdx(i)}
            style={{
              ...s.subCard,
              background: editingIdx === i ? '#FFF8F0' : '#FAFAFA',
              borderColor: editingIdx === i ? '#FF6B35' : '#EEE',
            }}
          >
            <span style={s.subIcon}>{MISSION_TYPE_CONFIG.subSteps[sub.subType]?.icon || '\u{1F4DD}'}</span>
            <span style={s.subTitle}>{sub.title}</span>
            <span style={s.subType}>{MISSION_TYPE_CONFIG.subSteps[sub.subType]?.label || sub.subType}</span>
            <div style={s.subActions}>
              <button onClick={(e) => { e.stopPropagation(); moveSubStep(i, i - 1); }} style={s.miniBtn} disabled={i === 0}>{'\u25B2'}</button>
              <button onClick={(e) => { e.stopPropagation(); moveSubStep(i, i + 1); }} style={s.miniBtn} disabled={i === subSteps.length - 1}>{'\u25BC'}</button>
              <button onClick={(e) => { e.stopPropagation(); removeSubStep(i); }} style={s.miniBtn}>{'\u{1F5D1}\uFE0F'}</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addSubStep} style={s.addSubBtn}>+ Teilschritt</button>

      {/* Inline sub-step editor */}
      {editingSub && subConfig && (
        <div style={s.subEditor}>
          <h4 style={s.subEditorTitle}>Teilschritt bearbeiten</h4>

          <label style={s.label}>Titel</label>
          <input
            value={editingSub.title || ''}
            onChange={e => updateSubStep(editingIdx, { title: e.target.value })}
            style={s.input}
          />

          <label style={s.label}>Typ</label>
          <select
            value={editingSub.subType}
            onChange={e => updateSubStep(editingIdx, { subType: e.target.value })}
            style={s.select}
          >
            {SUB_STEP_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {editingSub.subType === 'video' ? (
            <VideoConfig
              content={editingSub.content || {}}
              onChange={(content) => updateSubStep(editingIdx, { content })}
            />
          ) : editingSub.subType === 'slides' ? (
            <SlidesConfig
              content={editingSub.content || {}}
              onChange={(content) => updateSubStep(editingIdx, { content })}
            />
          ) : (
            subConfig.uiFields
              .filter(f => f.key !== 'title') // already shown above
              .map(field => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={getNestedValue(editingSub, field.key)}
                  mission={editingSub}
                  onChange={(val) => {
                    const updated = setNestedValue(editingSub, field.key, val);
                    updateSubStep(editingIdx, updated);
                  }}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Generic field renderer ───
function FieldRenderer({ field, value, mission, onChange }) {
  // Check showWhen condition
  if (field.showWhen) {
    const condValue = getNestedValue(mission, field.showWhen.field);
    if (condValue !== field.showWhen.value) return null;
  }

  const label = field.label;

  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <div>
          <label style={s.label}>{label}{field.required && ' *'}</label>
          <input
            type={field.type === 'url' ? 'url' : 'text'}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            style={s.input}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label style={s.label}>{label}</label>
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={s.textarea}
            rows={3}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          <label style={s.label}>{label}</label>
          <input
            type="number"
            value={value ?? ''}
            onChange={e => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
            min={field.min}
            style={s.input}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <label style={s.label}>{label}</label>
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={s.select}
          >
            {(field.options || []).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );

    case 'checkbox':
      return (
        <div style={s.checkRow}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
            style={s.checkbox}
          />
          <label style={s.checkLabel}>{label}</label>
        </div>
      );

    case 'file':
      return (
        <div>
          <label style={s.label}>{label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="Dateipfad (z.B. tag1-rechte.pdf)"
            style={s.input}
          />
        </div>
      );

    case 'string-list':
      return <StringListField label={label} value={value || []} onChange={onChange} />;

    case 'group-list':
      return <GroupListField label={label} value={value || []} onChange={onChange} />;

    case 'pair-list':
      return <PairListField label={label} value={value || []} onChange={onChange} pairFields={field.pairFields} />;

    case 'board-config':
      return <BoardConfigField label={label} value={value || {}} onChange={onChange} />;

    case 'substep-list':
      // Handled separately in SubStepEditor
      return null;

    default:
      return (
        <div>
          <label style={s.label}>{label} ({field.type})</label>
          <input value={value || ''} onChange={e => onChange(e.target.value)} style={s.input} />
        </div>
      );
  }
}

// ─── String list field ───
function StringListField({ label, value, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    if (!draft.trim()) return;
    onChange([...value, draft.trim()]);
    setDraft('');
  };
  return (
    <div>
      <label style={s.label}>{label}</label>
      <div style={s.chipList}>
        {value.map((v, i) => (
          <span key={i} style={s.chip}>
            {v}
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={s.chipX}>{'\u2715'}</button>
          </span>
        ))}
      </div>
      <div style={s.addRow}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Eintrag hinzufuegen..."
          style={{ ...s.input, flex: 1 }}
        />
        <button onClick={add} style={s.addItemBtn}>+</button>
      </div>
    </div>
  );
}

// ─── Group list field ───
function GroupListField({ label, value, onChange }) {
  const addGroup = () => onChange([...value, { name: `Gruppe ${value.length + 1}`, icon: '\u{1F465}', task: '' }]);
  return (
    <div>
      <label style={s.label}>{label}</label>
      {value.map((g, i) => (
        <div key={i} style={s.groupCard}>
          <input
            value={g.name || ''}
            onChange={e => { const up = [...value]; up[i] = { ...g, name: e.target.value }; onChange(up); }}
            placeholder="Gruppenname"
            style={{ ...s.input, marginBottom: 4 }}
          />
          <input
            value={g.task || ''}
            onChange={e => { const up = [...value]; up[i] = { ...g, task: e.target.value }; onChange(up); }}
            placeholder="Aufgabe"
            style={s.input}
          />
          <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={s.removeGroupBtn}>{'\u{1F5D1}\uFE0F'}</button>
        </div>
      ))}
      <button onClick={addGroup} style={s.addSubBtn}>+ Gruppe</button>
    </div>
  );
}

// ─── Pair list field ───
function PairListField({ label, value, onChange, pairFields }) {
  const addPair = () => onChange([...value, { term: '', definition: '' }]);
  const termLabel = pairFields?.term || 'Begriff';
  const defLabel = pairFields?.definition || 'Definition';
  return (
    <div>
      <label style={s.label}>{label}</label>
      {value.map((p, i) => (
        <div key={i} style={s.pairRow}>
          <input
            value={p.term || ''}
            onChange={e => { const up = [...value]; up[i] = { ...p, term: e.target.value }; onChange(up); }}
            placeholder={termLabel}
            style={{ ...s.input, flex: 1 }}
          />
          <span style={s.pairArrow}>{'\u2194\uFE0F'}</span>
          <input
            value={p.definition || ''}
            onChange={e => { const up = [...value]; up[i] = { ...p, definition: e.target.value }; onChange(up); }}
            placeholder={defLabel}
            style={{ ...s.input, flex: 1 }}
          />
          <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={s.miniBtn}>{'\u{1F5D1}\uFE0F'}</button>
        </div>
      ))}
      <button onClick={addPair} style={s.addSubBtn}>+ Paar</button>
    </div>
  );
}

// ─── Board config field ───
function BoardConfigField({ label, value, onChange }) {
  const update = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div style={s.boardSection}>
      <label style={s.label}>{label}</label>
      <div style={s.boardToggle}>
        <input
          type="checkbox"
          checked={!!value.taskId || !!value.referenceTaskId}
          onChange={e => {
            if (e.target.checked) {
              onChange({ ...value, taskId: value.taskId || `board-${Date.now().toString(36)}` });
            } else {
              onChange({});
            }
          }}
          style={s.checkbox}
        />
        <span style={s.checkLabel}>Board aktivieren</span>
      </div>
      {(value.taskId || value.referenceTaskId) && (
        <>
          <input value={value.title || ''} onChange={e => update('title', e.target.value)} placeholder="Board-Titel" style={{ ...s.input, marginTop: 6 }} />
          <select value={value.mode || ''} onChange={e => update('mode', e.target.value || undefined)} style={{ ...s.select, marginTop: 6 }}>
            <option value="">Spalten-Modus</option>
            <option value="gallery">Galerie-Modus</option>
          </select>
          <input value={value.buttonLabel || ''} onChange={e => update('buttonLabel', e.target.value)} placeholder="Button-Text" style={{ ...s.input, marginTop: 6 }} />
        </>
      )}
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.3)', zIndex: 9000,
    display: 'flex', justifyContent: 'flex-end',
  },
  panel: {
    width: 400, maxWidth: '90%', height: '100%',
    background: '#fff', display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
  },
  panelHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #EEE', flexShrink: 0,
  },
  panelTitle: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 700, color: '#333', margin: 0,
  },
  closeBtn: {
    width: 32, height: 32, border: 'none', borderRadius: 8,
    background: '#F5F5F5', fontSize: 16, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  panelBody: {
    flex: 1, overflowY: 'auto', padding: '16px 20px',
  },
  panelFooter: {
    padding: '12px 20px', borderTop: '1px solid #EEE', flexShrink: 0,
  },
  doneBtn: {
    width: '100%', padding: '12px', border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 16,
    fontWeight: 700, cursor: 'pointer',
  },
  label: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600,
    color: '#666', display: 'block', margin: '12px 0 4px',
  },
  input: {
    width: '100%', padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: '#333', outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: '#333', outline: 'none',
    boxSizing: 'border-box', resize: 'vertical', minHeight: 60,
  },
  select: {
    width: '100%', padding: '10px 14px', border: '2px solid #E0D6CC', borderRadius: 12,
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: '#333', outline: 'none',
    boxSizing: 'border-box', background: '#fff',
  },
  iconGrid: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  iconBtn: {
    width: 34, height: 34, border: 'none', borderRadius: 8,
    background: '#F5F5F5', fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  aiIconBtn: {
    width: 34, height: 34, border: '2px dashed #FF6B35', borderRadius: 8,
    background: '#FFF3E0', fontSize: 16, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  iconImagePreview: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
    padding: '6px 8px', background: '#F5F5F5', borderRadius: 10,
  },
  iconImageImg: {
    width: 40, height: 40, borderRadius: 8, objectFit: 'cover',
  },
  iconImageClear: {
    width: 24, height: 24, border: 'none', borderRadius: 6,
    background: '#FFCDD2', fontSize: 11, cursor: 'pointer', color: '#D32F2F',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 10 },
  slider: { flex: 1 },
  sliderVal: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
    color: '#FFB300', minWidth: 50, textAlign: 'center',
  },
  divider: {
    height: 1, background: '#EEE', margin: '16px 0',
  },
  sectionTitle: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700,
    color: '#8B5A2B', margin: '0 0 8px',
  },
  // Sub-step editor
  subList: { display: 'flex', flexDirection: 'column', gap: 6 },
  subCard: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px', borderRadius: 10,
    border: '1.5px solid #EEE', cursor: 'pointer',
  },
  subIcon: { fontSize: 16, flexShrink: 0 },
  subTitle: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 700,
    color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  subType: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600,
    color: '#999', flexShrink: 0,
  },
  subActions: { display: 'flex', gap: 2, flexShrink: 0 },
  miniBtn: {
    width: 24, height: 24, border: 'none', borderRadius: 4,
    background: 'none', fontSize: 12, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999',
  },
  addSubBtn: {
    padding: '8px 14px', border: '2px dashed #DDD', borderRadius: 10,
    background: 'none', fontFamily: "'Fredoka', sans-serif", fontSize: 13,
    fontWeight: 600, color: '#999', cursor: 'pointer', marginTop: 8, width: '100%',
  },
  subEditor: {
    marginTop: 12, padding: '12px', background: '#FFF8F0',
    borderRadius: 12, border: '1.5px solid #FFE0CC',
  },
  subEditorTitle: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 700,
    color: '#E65100', margin: '0 0 8px',
  },
  // Chip list
  chipList: { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  chip: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 600,
    padding: '3px 8px', borderRadius: 6, background: '#E3F2FD', color: '#1565C0',
    display: 'flex', alignItems: 'center', gap: 4,
  },
  chipX: {
    border: 'none', background: 'none', fontSize: 10, cursor: 'pointer',
    color: '#1565C0', padding: 0,
  },
  addRow: { display: 'flex', gap: 6 },
  addItemBtn: {
    width: 36, height: 36, border: '2px solid #E0D6CC', borderRadius: 10,
    background: '#fff', fontSize: 18, cursor: 'pointer', color: '#999', flexShrink: 0,
  },
  // Group card
  groupCard: {
    padding: '8px', background: '#FAFAFA', borderRadius: 10,
    border: '1px solid #EEE', marginBottom: 6, position: 'relative',
  },
  removeGroupBtn: {
    position: 'absolute', top: 4, right: 4,
    border: 'none', background: 'none', fontSize: 14, cursor: 'pointer',
  },
  // Pair row
  pairRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  pairArrow: { fontSize: 14, flexShrink: 0 },
  // Checkbox
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' },
  checkbox: { width: 18, height: 18, cursor: 'pointer' },
  checkLabel: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600, color: '#555',
  },
  // Board config
  boardSection: {
    padding: '10px', background: '#F5F5F5', borderRadius: 10, marginTop: 8,
  },
  boardToggle: { display: 'flex', alignItems: 'center', gap: 8 },
};
