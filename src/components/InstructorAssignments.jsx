import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

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

const emptyForm = { title: '', description: '', due_at: '', max_score: 100, allow_video: false };
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
const sizeLabel = (b) => (b ? (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`) : '');

const InstructorAssignments = ({ courses, students }) => {
  const [pickedCourse, setCourseId] = useState('');
  const courseId = pickedCourse || String(courses[0]?.id ?? '');
  const [items, setItems] = useState([]);
  const [subs, setSubs] = useState([]);
  const [filesBy, setFilesBy] = useState({});
  const [newFiles, setNewFiles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [grades, setGrades] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) return;
    const { data: a, error } = await supabase.from('assignments').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    if (error) { setMsg({ ok: false, text: `${error.message} (run supabase/sql/instructor_phase2.sql)` }); setItems([]); return; }
    setItems(a || []);
    const ids = (a || []).map((x) => x.id);
    if (ids.length) {
      const { data: s } = await supabase.from('submissions').select('*').in('assignment_id', ids).order('submitted_at', { ascending: false });
      setSubs(s || []);
      const { data: af } = await supabase.from('assignment_files').select('*').in('assignment_id', ids).order('created_at');
      const by = {};
      (af || []).forEach((f) => { (by[f.assignment_id] = by[f.assignment_id] || []).push(f); });
      setFilesBy(by);
    } else { setSubs([]); setFilesBy({}); }
  }, [courseId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(emptyForm); setEditing(null); setNewFiles([]); };

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.title.trim()) { setMsg({ ok: false, text: 'Title is required.' }); return; }
    setBusy(true);
    const row = {
      course_id: Number(courseId),
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      max_score: Number(form.max_score) || 100,
      allow_video: !!form.allow_video,
    };
    for (const f of newFiles) {
      if (f.size > 50 * 1048576) { setBusy(false); setMsg({ ok: false, text: `"${f.name}" is larger than 50MB.` }); return; }
    }
    const res = editing
      ? await supabase.from('assignments').update(row).eq('id', editing).select('id').maybeSingle()
      : await supabase.from('assignments').insert(row).select('id').single();
    if (res.error) { setBusy(false); setMsg({ ok: false, text: res.error.message }); return; }
    if (!res.data) { setBusy(false); reset(); load(); setMsg({ ok: false, text: 'This assignment no longer exists (it was deleted). The form was reset — create it again.' }); return; }
    const aid = res.data.id;
    const failed = [];
    for (const f of newFiles) {
      const path = `${aid}/${new Date().getTime()}-${f.name.replace(/[^\w.-]+/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('assignment-files').upload(path, f, { contentType: f.type || undefined });
      if (upErr) { failed.push(f.name); continue; }
      const { error: rowErr } = await supabase.from('assignment_files').insert({ assignment_id: aid, file_path: path, file_name: f.name, file_type: f.type || null, file_size: f.size });
      if (rowErr) { failed.push(f.name); await supabase.storage.from('assignment-files').remove([path]); }
    }
    setBusy(false);
    if (failed.length) {
      setMsg({ ok: false, text: `Saved, but these files failed: ${failed.join(', ')} (run supabase/sql/instructor_phase2b.sql)` });
      setNewFiles([]); load(); return;
    }
    setMsg({ ok: true, text: editing ? 'Assignment updated.' : 'Assignment published.' });
    reset();
    load();
  };

  const edit = (a) => {
    setEditing(a.id);
    setForm({ title: a.title, description: a.description || '', due_at: toLocalInput(a.due_at), max_score: a.max_score, allow_video: a.allow_video });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}" and all its submissions?`)) return;
    const paths = (filesBy[a.id] || []).map((f) => f.file_path);
    const { error } = await supabase.from('assignments').delete().eq('id', a.id);
    if (!error && paths.length) await supabase.storage.from('assignment-files').remove(paths);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    if (editing === a.id) reset();
    load();
  };

  const removeAttachment = async (f) => {
    if (!window.confirm(`Remove "${f.file_name}"?`)) return;
    const { error } = await supabase.from('assignment_files').delete().eq('id', f.id);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    await supabase.storage.from('assignment-files').remove([f.file_path]);
    load();
  };

  const openAttachment = async (f) => {
    const { data, error } = await supabase.storage.from('assignment-files').createSignedUrl(f.file_path, 3600, { download: f.file_name || true });
    if (error) { setMsg({ ok: false, text: `Could not open file: ${error.message}` }); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const download = async (s) => {
    const { data, error } = await supabase.storage.from('submissions').createSignedUrl(s.file_path, 3600, { download: s.file_name || true });
    if (error) { setMsg({ ok: false, text: `Could not open file: ${error.message}` }); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const grade = async (s, max) => {
    const g = grades[s.id] || {};
    const score = g.score !== undefined ? g.score : (s.score ?? '');
    if (score === '' || Number.isNaN(Number(score))) { setMsg({ ok: false, text: 'Enter a mark first.' }); return; }
    if (Number(score) < 0 || Number(score) > max) { setMsg({ ok: false, text: `Mark must be between 0 and ${max}.` }); return; }
    const { error } = await supabase.from('submissions').update({
      score: Number(score), feedback: (g.feedback !== undefined ? g.feedback : (s.feedback || '')).trim() || null,
    }).eq('id', s.id);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: 'Grade saved. The student can see it now.' });
    setGrades((p) => { const n = { ...p }; delete n[s.id]; return n; });
    load();
  };

  const note = msg && <div role="status" style={{ color: msg.ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14, margin: '10px 0' }}>{msg.text}</div>;

  if (!courses.length) return <div style={card}>You have no assigned courses yet.</div>;

  return (
    <>
      <div style={card}>
        <label style={{ ...lbl, marginTop: 0 }} htmlFor="as-course">Course</label>
        <select id="as-course" style={input} value={courseId} onChange={(e) => { setCourseId(e.target.value); setMsg(null); reset(); }}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <form style={card} onSubmit={save}>
        <h2 style={{ color: NAVY, margin: '0 0 6px', fontSize: '1.2rem' }}>{editing ? 'Edit assignment' : 'New assignment'}</h2>
        <label style={lbl} htmlFor="as-title">Title</label>
        <input id="as-title" style={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label style={lbl} htmlFor="as-desc">Instructions</label>
        <textarea id="as-desc" rows={4} style={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          <div>
            <label style={lbl} htmlFor="as-due">Due date (optional)</label>
            <input id="as-due" type="datetime-local" style={input} value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
          </div>
          <div>
            <label style={lbl} htmlFor="as-max">Maximum mark</label>
            <input id="as-max" type="number" min="1" style={input} value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} />
          </div>
        </div>
        <label style={lbl} htmlFor="as-files">Attach files for students (instructions, templates, data — up to 50MB each)</label>
        <input id="as-files" type="file" multiple onChange={(e) => setNewFiles(Array.from(e.target.files || []))} key={`${editing}-${items.length}-${busy}`} />
        {editing && (filesBy[editing] || []).length > 0 && (
          <ul style={{ margin: '10px 0 0', paddingInlineStart: 18, fontSize: 13 }}>
            {filesBy[editing].map((f) => (
              <li key={f.id}><button type="button" onClick={() => openAttachment(f)} style={{ background: 'none', border: 'none', color: NAVY, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>{f.file_name}</button> <button type="button" onClick={() => removeAttachment(f)} style={{ background: 'none', border: 'none', color: '#b3261e', cursor: 'pointer', fontWeight: 700 }}>Remove</button></li>
            ))}
          </ul>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 4px', fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.allow_video} onChange={(e) => setForm({ ...form, allow_video: e.target.checked })} />
          Students may upload a video (up to 50MB). Other files: up to 10MB.
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button type="submit" style={btn(true)} disabled={busy}>{busy ? 'Saving…' : (editing ? 'Save changes' : 'Publish assignment')}</button>
          {editing && <button type="button" style={btn(false)} onClick={reset}>Cancel</button>}
        </div>
        {note}
      </form>

      <div style={card}>
        <h2 style={{ color: NAVY, margin: '0 0 12px', fontSize: '1.2rem' }}>Assignments ({items.length})</h2>
        {!items.length && <p style={{ color: '#4A5D78' }}>No assignments for this course yet.</p>}
        {items.map((a) => {
          const list = subs.filter((s) => s.assignment_id === a.id);
          const pending = list.filter((s) => !s.graded_at).length;
          const open = openId === a.id;
          return (
            <div key={a.id} style={{ border: '1px solid #E6F0FB', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ minWidth: 200 }}>
                  <strong style={{ color: NAVY, fontSize: 16 }}>{a.title}</strong>
                  <div style={{ fontSize: 12, color: '#4A5D78', marginTop: 4 }}>
                    Due: {fmt(a.due_at)} · Max: {a.max_score}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={chip('#E6F0FB', NAVY)}>{list.length} submitted</span>
                    {pending > 0 && <span style={chip('#FFF2D6', '#8a5a00')}>{pending} to grade</span>}
                    {a.allow_video && <span style={chip('#E8F6EE', '#0a7a43')}>video allowed</span>}
                    {(filesBy[a.id] || []).length > 0 && <span style={chip('#F0E8FA', '#5b2d91')}>{filesBy[a.id].length} file(s) attached</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" style={btn(true)} onClick={() => setOpenId(open ? null : a.id)}>{open ? 'Hide submissions' : 'Submissions'}</button>
                  <button type="button" style={btn(false)} onClick={() => edit(a)}>Edit</button>
                  <button type="button" style={{ ...btn(false), color: '#b3261e' }} onClick={() => remove(a)}>Delete</button>
                </div>
              </div>
              {open && (
                <div style={{ marginTop: 14 }}>
                  {!list.length && <p style={{ color: '#4A5D78', margin: 0 }}>No submissions yet.</p>}
                  {list.map((s) => {
                    const late = a.due_at && new Date(s.submitted_at) > new Date(a.due_at);
                    const g = grades[s.id] || {};
                    return (
                      <div key={s.id} style={{ background: '#F7FAFE', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
                          <div>
                            <strong>{students[s.student_id] || s.student_id.slice(0, 8)}</strong>
                            <div style={{ fontSize: 12, color: '#4A5D78' }}>
                              {fmt(s.submitted_at)} {late && <span style={chip('#FDE7E7', '#b3261e')}>late</span>}
                              {s.graded_at && <span style={chip('#E8F6EE', '#0a7a43')}>graded {s.score}/{a.max_score}</span>}
                            </div>
                          </div>
                          <button type="button" style={btn(false)} onClick={() => download(s)}>
                            Open file{s.file_name ? `: ${s.file_name}` : ''} {sizeLabel(s.file_size)}
                          </button>
                        </div>
                        {s.comment && <p style={{ margin: '8px 0 0', fontSize: 13 }}>Student note: {s.comment}</p>}
                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 10, marginTop: 10, alignItems: 'end' }}>
                          <div>
                            <label style={{ ...lbl, marginTop: 0 }} htmlFor={`sc-${s.id}`}>Mark / {a.max_score}</label>
                            <input id={`sc-${s.id}`} type="number" min="0" max={a.max_score} style={input}
                              value={g.score !== undefined ? g.score : (s.score ?? '')}
                              onChange={(e) => setGrades({ ...grades, [s.id]: { ...g, score: e.target.value } })} />
                          </div>
                          <div>
                            <label style={{ ...lbl, marginTop: 0 }} htmlFor={`fb-${s.id}`}>Notes for the student</label>
                            <input id={`fb-${s.id}`} style={input}
                              value={g.feedback !== undefined ? g.feedback : (s.feedback || '')}
                              onChange={(e) => setGrades({ ...grades, [s.id]: { ...g, feedback: e.target.value } })} />
                          </div>
                          <button type="button" style={btn(true)} onClick={() => grade(s, a.max_score)}>{s.graded_at ? 'Update' : 'Save grade'}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default InstructorAssignments;
