import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase';

const NAVY = '#003366';
const GOLD = '#F0A500';
const card = { background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,51,102,0.08)', marginBottom: 20 };
const input = { width: '100%', padding: '12px 14px', border: '1px solid #CBD7E8', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const lbl = { display: 'block', fontSize: 12, fontWeight: 700, color: '#4A5D78', margin: '12px 0 4px' };
const btn = (primary) => ({
  background: primary ? GOLD : '#fff', color: NAVY, border: primary ? 'none' : '1px solid #CBD7E8',
  borderRadius: 999, padding: '8px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
});
const chip = (bg, color) => ({ display: 'inline-block', background: bg, color, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 800, marginInlineEnd: 6 });

const emptyForm = { title: '', starts_at: '', duration_min: 60, zoom_link: '', description: '', notify: true };
const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmt = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const endOf = (s) => new Date(s.starts_at).getTime() + (s.duration_min || 60) * 60000;

const InstructorSessions = ({ courses, instructorName }) => {
  const [pickedCourse, setCourseId] = useState('');
  const courseId = pickedCourse || String(courses[0]?.id ?? '');
  const course = courses.find((c) => String(c.id) === courseId);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [recs, setRecs] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) return;
    const { data, error } = await supabase.from('sessions').select('*').eq('course_id', courseId).order('starts_at', { ascending: false });
    if (error) { setMsg({ ok: false, text: `${error.message} (run backend/sql/instructor/instructor_phase4.sql)` }); setItems([]); return; }
    setItems(data || []);
  }, [courseId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(emptyForm); setEditing(null); };

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.title.trim()) { setMsg({ ok: false, text: 'Title is required.' }); return; }
    if (!form.starts_at) { setMsg({ ok: false, text: 'Choose the date and time.' }); return; }
    if (!/^https:\/\//i.test(form.zoom_link.trim())) { setMsg({ ok: false, text: 'The meeting link must start with https:// (Zoom, Google Meet, Teams…).' }); return; }
    const when = new Date(form.starts_at);
    setBusy(true);
    const row = {
      course_id: Number(courseId),
      title: form.title.trim(),
      starts_at: when.toISOString(),
      duration_min: Math.max(1, Math.round(Number(form.duration_min) || 60)),
      zoom_link: form.zoom_link.trim(),
      description: form.description.trim() || null,
      // legacy text columns, so the public "Live Sessions" page keeps working
      course: course?.title || null,
      instructor: instructorName || null,
      data: `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`,
      time: `${pad(when.getHours())}:${pad(when.getMinutes())}`,
    };
    const res = editing
      ? await supabase.from('sessions').update(row).eq('id', editing).select('id').maybeSingle()
      : await supabase.from('sessions').insert(row).select('id').single();
    if (res.error) { setBusy(false); setMsg({ ok: false, text: res.error.message }); return; }
    if (!res.data) { setBusy(false); reset(); load(); setMsg({ ok: false, text: 'This session no longer exists (it was deleted). The form was reset.' }); return; }
    let extra = '';
    if (!editing && form.notify) {
      const { data: n, error: nErr } = await supabase.rpc('notify_course_students', {
        cid: Number(courseId),
        ttl: `New live session: ${row.title}`,
        msg: `${row.title} — ${when.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}. Join from the course page.`,
      });
      extra = nErr ? ` (could not notify students: ${nErr.message})` : ` ${n} student(s) notified.`;
    }
    setBusy(false);
    setMsg({ ok: true, text: `${editing ? 'Session updated.' : 'Session scheduled.'}${extra}` });
    reset(); load();
  };

  const edit = (s) => {
    setEditing(s.id);
    setForm({ title: s.title, starts_at: toLocalInput(s.starts_at), duration_min: s.duration_min || 60, zoom_link: s.zoom_link || '', description: s.description || '', notify: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.title}"?`)) return;
    const { error } = await supabase.from('sessions').delete().eq('id', s.id);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    if (editing === s.id) reset();
    load();
  };

  const saveRecording = async (s) => {
    const url = (recs[s.id] ?? s.recording_url ?? '').trim();
    if (url && !/^https:\/\//i.test(url)) { setMsg({ ok: false, text: 'The recording link must start with https://' }); return; }
    const { error } = await supabase.from('sessions').update({ recording_url: url || null }).eq('id', s.id);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: url ? 'Recording link saved. Students can watch it from the course page.' : 'Recording link removed.' });
    setRecs((p) => { const n = { ...p }; delete n[s.id]; return n; });
    load();
  };

  const note = msg && <div role="status" style={{ color: msg.ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14, margin: '10px 0' }}>{msg.text}</div>;
  if (!courses.length) return <div style={card}>You have no assigned courses yet.</div>;

  const now = new Date().getTime();
  const upcoming = items.filter((s) => s.starts_at && endOf(s) >= now).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const past = items.filter((s) => s.starts_at && endOf(s) < now);

  const row = (s, isPast) => (
    <div key={s.id} style={{ border: '1px solid #E6F0FB', borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ minWidth: 200 }}>
          <strong style={{ color: NAVY, fontSize: 16 }}>{s.title}</strong>
          <div style={{ fontSize: 12, color: '#4A5D78', marginTop: 4 }}>{fmt(s.starts_at)} · {s.duration_min || 60} min</div>
          <div style={{ marginTop: 6 }}>
            {!isPast && new Date(s.starts_at).getTime() <= now && <span style={chip('#FDE7E7', '#b3261e')}>live now</span>}
            {s.recording_url && <span style={chip('#E8F6EE', '#0a7a43')}>recording</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {s.zoom_link && <a href={s.zoom_link} target="_blank" rel="noopener noreferrer" style={{ ...btn(true), textDecoration: 'none', display: 'inline-block' }}>{isPast ? 'Open link' : 'Start / open meeting'}</a>}
          <button type="button" style={btn(false)} onClick={() => edit(s)}>Edit</button>
          <button type="button" style={{ ...btn(false), color: '#b3261e' }} onClick={() => remove(s)}>Delete</button>
        </div>
      </div>
      {isPast && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input aria-label={`Recording link for ${s.title}`} style={{ ...input, flex: 1, minWidth: 220 }} placeholder="Recording link (https://…) — optional"
            value={recs[s.id] ?? s.recording_url ?? ''} onChange={(e) => setRecs({ ...recs, [s.id]: e.target.value })} />
          <button type="button" style={btn(false)} onClick={() => saveRecording(s)}>Save recording</button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div style={card}>
        <label style={{ ...lbl, marginTop: 0 }} htmlFor="ss-course">Course</label>
        <select id="ss-course" style={input} value={courseId} onChange={(e) => { setCourseId(e.target.value); setMsg(null); reset(); }}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <form style={card} onSubmit={save}>
        <h2 style={{ color: NAVY, margin: '0 0 6px', fontSize: '1.2rem' }}>{editing ? 'Edit live session' : 'Schedule a live session'}</h2>
        <p style={{ color: '#4A5D78', fontSize: 13, margin: '0 0 8px' }}>Only students enrolled in this course can see the meeting link.</p>
        <label style={lbl} htmlFor="ss-title">Title</label>
        <input id="ss-title" style={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          <div>
            <label style={lbl} htmlFor="ss-when">Date and time</label>
            <input id="ss-when" type="datetime-local" style={input} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </div>
          <div>
            <label style={lbl} htmlFor="ss-dur">Duration (minutes)</label>
            <input id="ss-dur" type="number" min="1" style={input} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} />
          </div>
        </div>
        <label style={lbl} htmlFor="ss-link">Meeting link (Zoom, Google Meet, Teams…)</label>
        <input id="ss-link" type="url" style={input} value={form.zoom_link} onChange={(e) => setForm({ ...form, zoom_link: e.target.value })} placeholder="https://zoom.us/j/..." />
        <label style={lbl} htmlFor="ss-desc">Topic / notes for students (optional)</label>
        <textarea id="ss-desc" rows={2} style={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {!editing && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 4px', fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.notify} onChange={(e) => setForm({ ...form, notify: e.target.checked })} />
            Send a notification to the enrolled students
          </label>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button type="submit" style={btn(true)} disabled={busy}>{busy ? 'Saving…' : (editing ? 'Save changes' : 'Schedule session')}</button>
          {editing && <button type="button" style={btn(false)} onClick={reset}>Cancel</button>}
        </div>
        {note}
      </form>

      <div style={card}>
        <h2 style={{ color: NAVY, margin: '0 0 12px', fontSize: '1.2rem' }}>Upcoming ({upcoming.length})</h2>
        {!upcoming.length && <p style={{ color: '#4A5D78', margin: 0 }}>No upcoming sessions.</p>}
        {upcoming.map((s) => row(s, false))}
      </div>
      <div style={card}>
        <h2 style={{ color: NAVY, margin: '0 0 12px', fontSize: '1.2rem' }}>Past sessions ({past.length})</h2>
        {!past.length && <p style={{ color: '#4A5D78', margin: 0 }}>No past sessions yet.</p>}
        {past.map((s) => row(s, true))}
      </div>
    </>
  );
};

export default InstructorSessions;
