import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import DualOrbitLoader from '../common/DualOrbitLoader';
import { defaultsFor, mergeHome } from '../../hooks/useHomeSettings';

const NAVY = '#003366';
const card = { background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,51,102,0.08)', marginBottom: 20 };
const h3 = { color: NAVY, fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px' };
const hint = { color: '#4A5D78', fontSize: 13, margin: '0 0 16px' };
const input = { width: '100%', padding: '10px 14px', border: '1px solid #CBD7E8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' };
const label = { display: 'block', fontSize: 12, fontWeight: 700, color: '#4A5D78', margin: '10px 0 4px' };
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 };

const SECTION_LABELS = {
  stats: 'Stats (courses, instructors, enrollments, rating)',
  popular: 'Most requested courses',
  available: 'Available courses',
  why: 'Why CompassPro?',
  instructors: 'Meet our instructors',
  cta: 'Call to action (3 steps)',
};

const Field = ({ lbl, value, onChange, dir, placeholder }) => (
  <div>
    <label style={label}>{lbl}</label>
    <input style={input} dir={dir} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const AdminHome = ({ settingsKey = 'home' }) => {
  const isLanding = settingsKey === 'landing';
  const [s, setS] = useState(() => defaultsFor(settingsKey));
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);
  const [instMsg, setInstMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      const [{ data: cfg }, { data: cs }] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', settingsKey).maybeSingle(),
        supabase.from('courses').select('id, title, category').order('created_at', { ascending: false }),
      ]);
      if (cfg?.value) setS(mergeHome(cfg.value, settingsKey));
      setCourses(cs || []);
      const { data: ins } = await supabase.from('instructor_public').select('user_id, display_name, headline, avatar_url, approved').order('updated_at', { ascending: false });
      setInstructors(ins || []);
      setLoading(false);
    })();
  }, []);

  const setApproved = async (userId, approved) => {
    setInstMsg(null);
    const { data, error } = await supabase.from('instructor_public').update({ approved }).eq('user_id', userId).select('user_id').maybeSingle();
    if (error || !data) { setInstMsg({ ok: false, text: error?.message || 'Could not update (run backend/sql/instructor/instructor_phase6.sql first).' }); return; }
    setInstructors((list) => list.map((i) => (i.user_id === userId ? { ...i, approved } : i)));
    setInstMsg({ ok: true, text: approved ? 'Instructor is now public.' : 'Instructor hidden from the public.' });
  };

  const setHero = (k, v) => setS((p) => ({ ...p, hero: { ...p.hero, [k]: v } }));
  const setCta = (k, v) => setS((p) => ({ ...p, cta: { ...p.cta, [k]: v } }));
  const setSec = (k, v) => setS((p) => ({ ...p, sections: { ...p.sections, [k]: v } }));

  const ids = s.popularIds.map(String);
  const togglePopular = (id) => {
    const sid = String(id);
    setS((p) => ({
      ...p,
      popularIds: ids.includes(sid) ? p.popularIds.filter((x) => String(x) !== sid) : [...p.popularIds, id],
    }));
  };
  const move = (idx, dir) => {
    setS((p) => {
      const a = [...p.popularIds];
      const j = idx + dir;
      if (j < 0 || j >= a.length) return p;
      [a[idx], a[j]] = [a[j], a[idx]];
      return { ...p, popularIds: a };
    });
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: settingsKey, value: s, updated_at: new Date().toISOString() });
    setSaving(false);
    setMsg(error
      ? { ok: false, text: `Could not save: ${error.message}. Did you run backend/sql/features/home_settings.sql?` }
      : { ok: true, text: 'Saved. The Home page is updated.' });
  };

  if (loading) return <DualOrbitLoader />;

  const byId = (id) => courses.find((c) => String(c.id) === String(id));

  return (
    <div>
      <div style={card}>
        <h3 style={h3}>{isLanding ? 'Hero (top banner)' : 'Hero (home page for members)'}</h3>
        <p style={hint}>Leave a field empty to keep the default text.</p>
        <div style={grid2}>
          <div>
            <Field lbl="Title line 1 (EN)" value={s.hero.title1_en} onChange={(v) => setHero('title1_en', v)} placeholder="Know your direction," />
            <Field lbl="Title line 2 — highlighted (EN)" value={s.hero.title2_en} onChange={(v) => setHero('title2_en', v)} />
            <Field lbl="Subtitle (EN)" value={s.hero.sub_en} onChange={(v) => setHero('sub_en', v)} />
          </div>
          <div>
            <Field dir="rtl" lbl="السطر الأول من العنوان (AR)" value={s.hero.title1_ar} onChange={(v) => setHero('title1_ar', v)} placeholder="اعرف وجهتك،" />
            <Field dir="rtl" lbl="السطر الثاني (AR)" value={s.hero.title2_ar} onChange={(v) => setHero('title2_ar', v)} />
            <Field dir="rtl" lbl="العنوان الفرعي (AR)" value={s.hero.sub_ar} onChange={(v) => setHero('sub_ar', v)} />
          </div>
        </div>
      </div>

      {isLanding && (
      <div style={card}>
        <h3 style={h3}>Most requested courses</h3>
        <p style={hint}>Tick the courses to feature. Order below is the order shown on Home.</p>
        {s.popularIds.length > 0 && (
          <ol style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
            {s.popularIds.map((id, i) => (
              <li key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E6F0FB', borderRadius: 12, padding: '8px 12px' }}>
                <strong style={{ color: NAVY, width: 22 }}>{i + 1}</strong>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{byId(id)?.title || `(deleted course ${id})`}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" style={miniBtn}>↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === s.popularIds.length - 1} aria-label="Move down" style={miniBtn}>↓</button>
                <button type="button" onClick={() => togglePopular(id)} aria-label="Remove" style={{ ...miniBtn, color: '#b3261e' }}>✕</button>
              </li>
            ))}
          </ol>
        )}
        <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #CBD7E8', borderRadius: 12, padding: 8 }}>
          {courses.length === 0 && <div style={{ padding: 12, color: '#4A5D78' }}>No courses yet.</div>}
          {courses.map((c) => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={ids.includes(String(c.id))} onChange={() => togglePopular(c.id)} />
              <span style={{ flex: 1 }}>{c.title}</span>
              <span style={{ color: '#4A5D78', fontSize: 12 }}>{c.category}</span>
            </label>
          ))}
        </div>
      </div>
      )}

      <div style={card}>
        <h3 style={h3}>Sections</h3>
        <p style={hint}>Show or hide each block of the Home page.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {Object.keys(SECTION_LABELS).filter((k) => isLanding || ['stats', 'available', 'why'].includes(k)).map((k) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!s.sections[k]} onChange={(e) => setSec(k, e.target.checked)} />
              {!isLanding && k === 'available' ? 'Newest courses' : SECTION_LABELS[k]}
            </label>
          ))}
        </div>
        <label style={{ ...label, marginTop: 18 }}>How many courses to show</label>
        <select style={{ ...input, maxWidth: 160 }} value={s.availableCount} onChange={(e) => setS((p) => ({ ...p, availableCount: Number(e.target.value) }))}>
          {[3, 6, 9, 12].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {isLanding && (
      <div style={card}>
        <h3 style={h3}>Instructors on the public pages</h3>
        <p style={hint}>Only approved instructors appear in "Meet our instructors" on Home and get a public profile page. An instructor appears here after saving their profile card from their dashboard.</p>
        {instructors.length === 0 && <div style={{ color: '#4A5D78', fontSize: 14 }}>No instructor has filled in a profile yet.</div>}
        {instructors.map((i) => (
          <label key={i.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px', borderTop: '1px solid #E6F0FB', cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={!!i.approved} onChange={(e) => setApproved(i.user_id, e.target.checked)} />
            <span style={{ flex: 1 }}><strong>{i.display_name || '(no name)'}</strong>{i.headline && <span style={{ color: '#4A5D78' }}> — {i.headline}</span>}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: i.approved ? '#0a7a43' : '#8a5a00' }}>{i.approved ? 'Public' : 'Hidden'}</span>
            {i.approved && <a href={`/instructors/${i.user_id}`} target="_blank" rel="noopener noreferrer" style={{ color: NAVY, fontSize: 12, fontWeight: 700 }}>View ↗</a>}
          </label>
        ))}
        {instMsg && <div role="status" style={{ color: instMsg.ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14, marginTop: 10 }}>{instMsg.text}</div>}
      </div>
      )}

      {isLanding && (
      <div style={card}>
        <h3 style={h3}>Call to action (bottom banner)</h3>
        <p style={hint}>Leave empty to keep the default text.</p>
        <div style={grid2}>
          <div>
            <Field lbl="Title (EN)" value={s.cta.title_en} onChange={(v) => setCta('title_en', v)} />
            <Field lbl="Subtitle (EN)" value={s.cta.sub_en} onChange={(v) => setCta('sub_en', v)} />
          </div>
          <div>
            <Field dir="rtl" lbl="العنوان (AR)" value={s.cta.title_ar} onChange={(v) => setCta('title_ar', v)} />
            <Field dir="rtl" lbl="العنوان الفرعي (AR)" value={s.cta.sub_ar} onChange={(v) => setCta('sub_ar', v)} />
          </div>
        </div>
      </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={save} disabled={saving}
          style={{ background: '#F0A500', color: NAVY, border: 'none', borderRadius: 999, padding: '12px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <a href={isLanding ? '/' : '/home'} target="_blank" rel="noopener noreferrer" style={{ color: NAVY, fontWeight: 700, fontSize: 14 }}>Preview page ↗</a>
        {msg && <span role="status" style={{ color: msg.ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14 }}>{msg.text}</span>}
      </div>
    </div>
  );
};

const miniBtn = { border: '1px solid #CBD7E8', background: '#fff', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14 };

export default AdminHome;
