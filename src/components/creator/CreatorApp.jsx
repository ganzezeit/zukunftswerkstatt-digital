import React, { useState, useCallback, useEffect, useRef } from 'react';
import { saveTemplateToFirebase, loadTemplateFromFirebase, listTemplates, deleteTemplateFromFirebase } from '../../utils/templateLoader';
import { validateTemplate } from '../../schema/validateTemplate';
import { useAuth } from '../../contexts/AuthContext';
import DayEditor from './DayEditor';
import MissionPalette from './MissionPalette';
import MissionList from './MissionList';
import MissionConfig from './MissionConfig';
import CreatorPreview from './CreatorPreview';
import IconGenerator from './IconGenerator';

const DAY_COLORS = ['#FF6B35', '#00B4D8', '#9B5DE5', '#2ECC71', '#E74C3C', '#FFD166', '#00897B'];
const DAY_EMOJIS = ['\u{1F4D6}', '\u{1F30D}', '\u{1F3AE}', '\u{1F6E0}\uFE0F', '\u{1F389}', '\u{1F31F}', '\u{1F3A8}'];

const SDG_LIST = [
  { n: 1, label: 'Keine Armut' }, { n: 2, label: 'Kein Hunger' },
  { n: 3, label: 'Gesundheit' }, { n: 4, label: 'Bildung' },
  { n: 5, label: 'Gleichstellung' }, { n: 6, label: 'Sauberes Wasser' },
  { n: 7, label: 'Energie' }, { n: 8, label: 'Gute Arbeit' },
  { n: 9, label: 'Innovation' }, { n: 10, label: 'Weniger Ungleichheit' },
  { n: 11, label: 'Nachhaltige Staedte' }, { n: 12, label: 'Nachhaltiger Konsum' },
  { n: 13, label: 'Klimaschutz' }, { n: 14, label: 'Leben im Wasser' },
  { n: 15, label: 'Leben an Land' }, { n: 16, label: 'Frieden' },
  { n: 17, label: 'Partnerschaften' },
];

function generateId(title) {
  const slug = (title || 'workshop').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  return `${slug}-${Date.now().toString(36)}`;
}

function makeEmptyDay(dayNum) {
  return {
    id: dayNum,
    name: `Tag ${dayNum}`,
    sub: '',
    emoji: DAY_EMOJIS[(dayNum - 1) % DAY_EMOJIS.length],
    color: DAY_COLORS[(dayNum - 1) % DAY_COLORS.length],
    steps: [],
  };
}

function makeEmptyTemplate() {
  return {
    id: '',
    title: '',
    description: '',
    duration: 5,
    targetAge: '9-12',
    languages: ['de'],
    sdgs: [],
    tags: [],
    createdBy: '',
    version: '1.0.0',
    days: [makeEmptyDay(1)],
  };
}

export default function CreatorApp({ onBack, templateId }) {
  const { user } = useAuth();
  const [template, setTemplate] = useState(makeEmptyTemplate);
  const [view, setView] = useState(templateId ? 'loading' : 'projects'); // projects | metadata | editor | preview | loading
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [editingMissionIdx, setEditingMissionIdx] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [errors, setErrors] = useState([]);
  const [loadingTemplate, setLoadingTemplate] = useState(!!templateId);
  const saveTimerRef = useRef(null);

  // Projects view state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // template id

  // Icon generator state
  const [iconGenTarget, setIconGenTarget] = useState(null); // mission index or null

  // Load existing template for editing (when opened with templateId prop)
  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    (async () => {
      try {
        const t = await loadTemplateFromFirebase(templateId);
        if (!cancelled && t) {
          setTemplate(t);
          setView('editor');
        } else if (!cancelled) {
          setView('projects');
        }
      } catch (e) {
        console.error('[Creator] Load error:', e);
        if (!cancelled) setView('projects');
      } finally {
        if (!cancelled) setLoadingTemplate(false);
      }
    })();
    return () => { cancelled = true; };
  }, [templateId]);

  // Fetch templates when projects view is active
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const list = await listTemplates();
      setTemplates(list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'projects') fetchTemplates();
  }, [view, fetchTemplates]);

  const handleEditTemplate = async (id) => {
    setLoadingTemplate(true);
    try {
      const t = await loadTemplateFromFirebase(id);
      if (t) { setTemplate(t); setView('editor'); }
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    await deleteTemplateFromFirebase(id);
    setDeleteConfirm(null);
    fetchTemplates();
  };

  const handleNewTemplate = () => {
    setTemplate(makeEmptyTemplate());
    setSelectedDayIdx(0);
    setEditingMissionIdx(null);
    setSaveStatus('idle');
    setErrors([]);
    setView('metadata');
  };

  const updateTemplate = useCallback((updater) => {
    setTemplate(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
    setSaveStatus('idle');
  }, []);

  const updateDay = useCallback((dayIdx, updates) => {
    updateTemplate(prev => {
      const days = [...prev.days];
      days[dayIdx] = { ...days[dayIdx], ...updates };
      return { ...prev, days };
    });
  }, [updateTemplate]);

  const addDay = useCallback(() => {
    updateTemplate(prev => {
      const newNum = prev.days.length + 1;
      return { ...prev, days: [...prev.days, makeEmptyDay(newNum)], duration: newNum };
    });
  }, [updateTemplate]);

  const deleteDay = useCallback((dayIdx) => {
    updateTemplate(prev => {
      if (prev.days.length <= 1) return prev;
      const days = prev.days.filter((_, i) => i !== dayIdx).map((d, i) => ({ ...d, id: i + 1 }));
      return { ...prev, days, duration: days.length };
    });
    setSelectedDayIdx(i => Math.min(i, template.days.length - 2));
  }, [updateTemplate, template.days.length]);

  const reorderDays = useCallback((fromIdx, toIdx) => {
    updateTemplate(prev => {
      const days = [...prev.days];
      const [moved] = days.splice(fromIdx, 1);
      days.splice(toIdx, 0, moved);
      return { ...prev, days: days.map((d, i) => ({ ...d, id: i + 1 })) };
    });
    setSelectedDayIdx(toIdx);
  }, [updateTemplate]);

  const addMission = useCallback((missionType, defaultContent) => {
    updateTemplate(prev => {
      const days = [...prev.days];
      const day = { ...days[selectedDayIdx] };
      const steps = [...day.steps];
      const stepNum = steps.length + 1;
      steps.push({
        id: `t${day.id}-${stepNum}`,
        title: defaultContent.title || missionType,
        icon: defaultContent.icon || '\u{1F4DD}',
        type: missionType,
        energyCost: 10,
        content: defaultContent.content || {},
      });
      day.steps = steps;
      days[selectedDayIdx] = day;
      return { ...prev, days };
    });
  }, [updateTemplate, selectedDayIdx]);

  const updateMission = useCallback((missionIdx, updates) => {
    updateTemplate(prev => {
      const days = [...prev.days];
      const day = { ...days[selectedDayIdx] };
      const steps = [...day.steps];
      steps[missionIdx] = { ...steps[missionIdx], ...updates };
      day.steps = steps;
      days[selectedDayIdx] = day;
      return { ...prev, days };
    });
  }, [updateTemplate, selectedDayIdx]);

  const deleteMission = useCallback((missionIdx) => {
    updateTemplate(prev => {
      const days = [...prev.days];
      const day = { ...days[selectedDayIdx] };
      day.steps = day.steps.filter((_, i) => i !== missionIdx);
      days[selectedDayIdx] = day;
      return { ...prev, days };
    });
    if (editingMissionIdx === missionIdx) setEditingMissionIdx(null);
  }, [updateTemplate, selectedDayIdx, editingMissionIdx]);

  const reorderMissions = useCallback((fromIdx, toIdx) => {
    updateTemplate(prev => {
      const days = [...prev.days];
      const day = { ...days[selectedDayIdx] };
      const steps = [...day.steps];
      const [moved] = steps.splice(fromIdx, 1);
      steps.splice(toIdx, 0, moved);
      day.steps = steps;
      days[selectedDayIdx] = day;
      return { ...prev, days };
    });
  }, [updateTemplate, selectedDayIdx]);

  const handleSave = useCallback(async () => {
    const t = { ...template };
    if (!t.id) t.id = generateId(t.title);
    if (!t.createdBy && user?.displayName) t.createdBy = user.displayName;
    t.updatedAt = new Date().toISOString();
    if (!t.createdAt) t.createdAt = t.updatedAt;

    const result = validateTemplate(t);
    if (!result.valid) {
      setErrors(result.errors);
      setSaveStatus('error');
      return;
    }

    setErrors([]);
    setSaveStatus('saving');
    try {
      await saveTemplateToFirebase(t);
      setTemplate(t);
      setSaveStatus('saved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('[Creator] Save error:', e);
      setErrors([e.message]);
      setSaveStatus('error');
    }
  }, [template, user]);

  const handleMetadataNext = () => {
    if (!template.title.trim()) return;
    // Sync duration with actual days count
    const dur = template.duration || 5;
    if (template.days.length < dur) {
      updateTemplate(prev => {
        const days = [...prev.days];
        for (let i = days.length; i < dur; i++) days.push(makeEmptyDay(i + 1));
        return { ...prev, days };
      });
    }
    setView('editor');
  };

  const currentDay = template.days[selectedDayIdx];
  const missions = currentDay?.steps || [];
  const editingMission = editingMissionIdx !== null ? missions[editingMissionIdx] : null;

  // ─── Loading ───
  if (loadingTemplate || view === 'loading') {
    return (
      <div style={s.fullscreen}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, color: '#8B5A2B' }}>Vorlage laden...</div>
      </div>
    );
  }

  // ─── Projects List (Landing Page) ───
  if (view === 'projects') {
    return (
      <div style={s.fullscreen}>
        <div style={s.projectsContainer}>
          <button onClick={onBack} style={s.backBtn}>{'\u2190'} Zurueck</button>
          <h1 style={s.metaTitle}>{'\u{1F3A8}'} Workshop Creator</h1>
          <p style={s.metaHint}>Erstelle und verwalte deine Workshop-Vorlagen.</p>

          {/* New template button */}
          <button onClick={handleNewTemplate} style={s.newTemplateBtn}>
            <span style={{ fontSize: 24 }}>+</span>
            <span>Neu erstellen</span>
          </button>

          {/* Template list */}
          {templatesLoading ? (
            <div style={s.projectsLoading}>Vorlagen laden...</div>
          ) : templates.length === 0 ? (
            <div style={s.projectsEmpty}>
              <span style={{ fontSize: 40 }}>{'\u{1F4C2}'}</span>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 600, color: '#999', margin: '12px 0 0' }}>
                Noch keine Vorlagen gespeichert.
              </p>
            </div>
          ) : (
            <div style={s.templateList}>
              {templates.map(t => (
                <div key={t.id} style={s.templateCard}>
                  <div style={s.templateInfo}>
                    <span style={s.templateTitle}>{t.title}</span>
                    {t.description && (
                      <span style={s.templateDesc}>
                        {t.description.length > 80 ? t.description.slice(0, 80) + '...' : t.description}
                      </span>
                    )}
                    <div style={s.templateMeta}>
                      {t.duration > 0 && <span style={s.templateChip}>{t.duration} Tage</span>}
                      {t.createdBy && <span style={s.templateChip}>{t.createdBy}</span>}
                      {t.updatedAt && (
                        <span style={s.templateDate}>
                          {new Date(t.updatedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={s.templateActions}>
                    <button
                      onClick={() => handleEditTemplate(t.id)}
                      style={s.templateEditBtn}
                    >
                      Bearbeiten
                    </button>
                    {deleteConfirm === t.id ? (
                      <div style={s.deleteConfirmRow}>
                        <button onClick={() => handleDeleteTemplate(t.id)} style={s.deleteConfirmYes}>Ja</button>
                        <button onClick={() => setDeleteConfirm(null)} style={s.deleteConfirmNo}>Nein</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        style={s.templateDeleteBtn}
                      >
                        Loeschen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Preview ───
  if (view === 'preview') {
    return <CreatorPreview template={template} onClose={() => setView('editor')} />;
  }

  // ─── Metadata Form (Step 1) ───
  if (view === 'metadata') {
    return (
      <div style={s.fullscreen}>
        <div style={s.metaContainer}>
          <button onClick={() => setView('projects')} style={s.backBtn}>{'\u2190'} Zurueck</button>
          <h1 style={s.metaTitle}>{'\u{1F3A8}'} Workshop erstellen</h1>
          <p style={s.metaHint}>Gib deinem Workshop einen Namen und beschreibe ihn.</p>

          <div style={s.metaCard}>
            <label style={s.label}>Titel *</label>
            <input
              value={template.title}
              onChange={e => updateTemplate({ title: e.target.value })}
              placeholder="z.B. Projektwoche Kinderrechte"
              style={s.input}
              autoFocus
            />

            <label style={s.label}>Beschreibung</label>
            <textarea
              value={template.description}
              onChange={e => updateTemplate({ description: e.target.value })}
              placeholder="Worum geht es in diesem Workshop?"
              style={s.textarea}
              rows={3}
            />

            <div style={s.row}>
              <div style={s.halfCol}>
                <label style={s.label}>Dauer (Tage)</label>
                <input
                  type="number" min={1} max={10}
                  value={template.duration}
                  onChange={e => updateTemplate({ duration: parseInt(e.target.value) || 1 })}
                  style={s.input}
                />
              </div>
              <div style={s.halfCol}>
                <label style={s.label}>Zielgruppe (Alter)</label>
                <input
                  value={template.targetAge}
                  onChange={e => updateTemplate({ targetAge: e.target.value })}
                  placeholder="z.B. 9-12"
                  style={s.input}
                />
              </div>
            </div>

            <label style={s.label}>SDGs (Nachhaltigkeitsziele)</label>
            <div style={s.sdgGrid}>
              {SDG_LIST.map(({ n, label }) => {
                const active = template.sdgs.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => updateTemplate(prev => ({
                      ...prev,
                      sdgs: active ? prev.sdgs.filter(x => x !== n) : [...prev.sdgs, n].sort((a, b) => a - b),
                    }))}
                    style={{ ...s.sdgChip, background: active ? '#E3F2FD' : '#F5F5F5', color: active ? '#1565C0' : '#999', borderColor: active ? '#90CAF9' : '#E0E0E0' }}
                  >
                    {n}. {label}
                  </button>
                );
              })}
            </div>

            <label style={s.label}>Tags (durch Komma getrennt)</label>
            <input
              value={template.tags.join(', ')}
              onChange={e => updateTemplate({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="z.B. Kinderrechte, Grundschule, Kreativ"
              style={s.input}
            />

            <label style={s.label}>Sprachen</label>
            <div style={s.langRow}>
              {[['de', 'Deutsch'], ['en', 'English'], ['tr', 'Tuerkce']].map(([code, name]) => {
                const active = template.languages.includes(code);
                return (
                  <button
                    key={code}
                    onClick={() => updateTemplate(prev => ({
                      ...prev,
                      languages: active ? prev.languages.filter(l => l !== code) : [...prev.languages, code],
                    }))}
                    style={{ ...s.langChip, background: active ? '#E8F5E9' : '#F5F5F5', color: active ? '#2E7D32' : '#999', borderColor: active ? '#C8E6C9' : '#E0E0E0' }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            <div style={s.row}>
              <div style={s.halfCol}>
                <label style={s.label}>Erstellt von</label>
                <input
                  value={template.createdBy}
                  onChange={e => updateTemplate({ createdBy: e.target.value })}
                  placeholder={user?.displayName || ''}
                  style={s.input}
                />
              </div>
              <div style={s.halfCol}>
                <label style={s.label}>Version</label>
                <input
                  value={template.version}
                  onChange={e => updateTemplate({ version: e.target.value })}
                  style={s.input}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleMetadataNext}
            disabled={!template.title.trim()}
            style={{ ...s.primaryBtn, opacity: template.title.trim() ? 1 : 0.5 }}
          >
            Weiter zum Editor {'\u2192'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Editor (Step 2) ───
  return (
    <div style={s.editorRoot}>
      {/* Top Bar */}
      <div style={s.topBar}>
        <div style={s.topLeft}>
          <button onClick={() => setView('projects')} style={s.topBtn}>{'\u2190'}</button>
          <span style={s.topTitle}>{template.title || 'Neuer Workshop'}</span>
          <button onClick={() => setView('metadata')} style={s.topBtnSmall}>Metadaten</button>
        </div>
        <div style={s.topRight}>
          <span style={s.saveIndicator}>
            {saveStatus === 'saving' && 'Speichern...'}
            {saveStatus === 'saved' && '\u2705 Gespeichert'}
            {saveStatus === 'error' && '\u26A0\uFE0F Fehler'}
          </span>
          <button onClick={() => setView('preview')} style={s.topBtn}>{'\u{1F441}\uFE0F'} Vorschau</button>
          <button onClick={handleSave} style={s.saveBtn}>
            {saveStatus === 'saving' ? '...' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div style={s.errorBar}>
          {errors.map((e, i) => <div key={i}>{e}</div>)}
          <button onClick={() => setErrors([])} style={s.errorClose}>{'\u2715'}</button>
        </div>
      )}

      {/* Day tabs */}
      <DayEditor
        days={template.days}
        selectedDayIdx={selectedDayIdx}
        onSelectDay={setSelectedDayIdx}
        onAddDay={addDay}
        onDeleteDay={deleteDay}
        onUpdateDay={updateDay}
        onReorderDays={reorderDays}
      />

      {/* Main content area */}
      <div style={s.editorBody}>
        {/* Mission list */}
        <div style={s.editorMain}>
          <MissionList
            missions={missions}
            dayColor={currentDay?.color || '#FF6B35'}
            onEdit={setEditingMissionIdx}
            onDelete={deleteMission}
            onReorder={reorderMissions}
            editingIdx={editingMissionIdx}
            onIconGen={(idx) => setIconGenTarget(idx)}
          />
        </div>

        {/* Palette sidebar */}
        <div style={s.editorSidebar}>
          <MissionPalette onAdd={addMission} />
        </div>
      </div>

      {/* Config panel */}
      {editingMission && (
        <MissionConfig
          mission={editingMission}
          missionIdx={editingMissionIdx}
          onUpdate={(updates) => updateMission(editingMissionIdx, updates)}
          onClose={() => setEditingMissionIdx(null)}
        />
      )}

      {/* Icon Generator modal */}
      {iconGenTarget !== null && (
        <div style={s.iconGenOverlay}>
          <div style={s.iconGenModal}>
            <IconGenerator
              onSelect={(url) => {
                updateMission(iconGenTarget, { iconImage: url });
                setIconGenTarget(null);
              }}
              onClose={() => setIconGenTarget(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  fullscreen: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    overflowY: 'auto',
    background: 'linear-gradient(160deg, #FFE5D9 0%, #D4E4F7 100%)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '40px 20px', boxSizing: 'border-box',
  },
  // Projects view
  projectsContainer: { maxWidth: 700, width: '100%' },
  newTemplateBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '18px 24px', marginBottom: 20,
    border: '2px dashed #E0D6CC', borderRadius: 16,
    background: '#fff', cursor: 'pointer',
    fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700,
    color: '#FF6B35',
  },
  projectsLoading: {
    textAlign: 'center', padding: '40px 20px',
    fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 500, color: '#999',
  },
  projectsEmpty: {
    textAlign: 'center', padding: '48px 20px',
    background: '#fff', borderRadius: 20,
    boxShadow: '0 4px 16px rgba(139, 90, 43, 0.08)',
  },
  templateList: { display: 'flex', flexDirection: 'column', gap: 12 },
  templateCard: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '18px 22px', borderRadius: 18,
    background: '#fff', border: '1px solid rgba(255, 166, 107, 0.12)',
    boxShadow: '0 4px 16px rgba(139, 90, 43, 0.08)',
  },
  templateInfo: { flex: 1, minWidth: 0 },
  templateTitle: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 17, fontWeight: 700, color: '#333',
    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  templateDesc: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 500, color: '#999',
    display: 'block', marginTop: 4,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  templateMeta: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap',
  },
  templateChip: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 6, background: '#F0E6DD', color: '#8B5A2B',
  },
  templateDate: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 500, color: '#BBB',
  },
  templateActions: {
    display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0,
  },
  templateEditBtn: {
    padding: '8px 16px', border: 'none', borderRadius: 10,
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 13,
    fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  templateDeleteBtn: {
    padding: '6px 16px', border: '1.5px solid #E0D6CC', borderRadius: 10,
    background: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 12,
    fontWeight: 600, color: '#999', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  deleteConfirmRow: {
    display: 'flex', gap: 4,
  },
  deleteConfirmYes: {
    padding: '6px 12px', border: 'none', borderRadius: 8,
    background: '#E74C3C', color: '#fff', fontFamily: "'Fredoka', sans-serif",
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  deleteConfirmNo: {
    padding: '6px 12px', border: '1.5px solid #E0D6CC', borderRadius: 8,
    background: '#fff', color: '#999', fontFamily: "'Fredoka', sans-serif",
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  // Metadata view
  metaContainer: { maxWidth: 600, width: '100%' },
  backBtn: {
    padding: '8px 16px', border: '2px solid #E0D6CC', borderRadius: 12,
    background: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 14,
    fontWeight: 600, color: '#8B5A2B', cursor: 'pointer', marginBottom: 20,
  },
  metaTitle: {
    fontFamily: "'Lilita One', cursive", fontSize: 32, color: '#8B5A2B', margin: '0 0 8px',
  },
  metaHint: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 15, color: '#999', margin: '0 0 24px', fontWeight: 500,
  },
  metaCard: {
    background: '#fff', borderRadius: 20, padding: '28px', marginBottom: 20,
    boxShadow: '0 4px 16px rgba(139, 90, 43, 0.08)', border: '1px solid rgba(255, 166, 107, 0.12)',
  },
  label: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 14, fontWeight: 600,
    color: '#666', display: 'block', margin: '14px 0 6px',
  },
  input: {
    width: '100%', padding: '12px 16px', border: '2px solid #E0D6CC', borderRadius: 14,
    fontFamily: "'Fredoka', sans-serif", fontSize: 16, color: '#333', outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '12px 16px', border: '2px solid #E0D6CC', borderRadius: 14,
    fontFamily: "'Fredoka', sans-serif", fontSize: 16, color: '#333', outline: 'none',
    boxSizing: 'border-box', resize: 'vertical', minHeight: 60,
  },
  row: { display: 'flex', gap: 12 },
  halfCol: { flex: 1 },
  sdgGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  sdgChip: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 600,
    padding: '4px 10px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer',
  },
  langRow: { display: 'flex', gap: 8 },
  langChip: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 13, fontWeight: 600,
    padding: '6px 14px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer',
  },
  primaryBtn: {
    width: '100%', padding: '16px', border: 'none', borderRadius: 16,
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 4px 14px rgba(255, 107, 53, 0.3)',
  },
  // Editor layout
  editorRoot: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', flexDirection: 'column',
    background: '#F5F0EB',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px', background: '#fff',
    borderBottom: '1px solid #E0D6CC', flexShrink: 0, gap: 8,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  topRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  topBtn: {
    padding: '8px 12px', border: '2px solid #E0D6CC', borderRadius: 10,
    background: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 13,
    fontWeight: 600, color: '#8B5A2B', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  topBtnSmall: {
    padding: '4px 10px', border: '1.5px solid #E0D6CC', borderRadius: 8,
    background: '#FAFAFA', fontFamily: "'Fredoka', sans-serif", fontSize: 11,
    fontWeight: 600, color: '#999', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  topTitle: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700,
    color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  saveIndicator: {
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 500, color: '#999',
  },
  saveBtn: {
    padding: '8px 18px', border: 'none', borderRadius: 10,
    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    color: '#fff', fontFamily: "'Fredoka', sans-serif", fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
  },
  errorBar: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
    background: '#FFF3E0', fontFamily: "'Fredoka', sans-serif", fontSize: 13,
    color: '#E65100', fontWeight: 500, flexShrink: 0,
  },
  errorClose: {
    marginLeft: 'auto', border: 'none', background: 'none',
    fontSize: 16, cursor: 'pointer', color: '#E65100',
  },
  editorBody: {
    display: 'flex', flex: 1, overflow: 'hidden',
  },
  editorMain: {
    flex: 1, overflowY: 'auto', padding: '16px',
  },
  editorSidebar: {
    width: 260, flexShrink: 0, overflowY: 'auto',
    borderLeft: '1px solid #E0D6CC', background: '#fff',
  },
  // Icon generator overlay
  iconGenOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  iconGenModal: {
    background: '#fff', borderRadius: 20, padding: 0,
    maxWidth: 520, width: '95%', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
};
