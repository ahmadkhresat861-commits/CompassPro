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

const emptyQuiz = { title: '', description: '', pass_score: 60, max_attempts: '', time_limit_min: '', show_answers: true, published: true, anti_cheat: true, password: '', clear_password: false, has_password: false };
const emptyQ = { kind: 'mcq', prompt: '', options: ['', ''], correct: 0, points: 1 };
const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const InstructorQuizzes = ({ courses, students }) => {
  const [pickedCourse, setCourseId] = useState('');
  const courseId = pickedCourse || String(courses[0]?.id ?? '');
  const [quizzes, setQuizzes] = useState([]);
  const [counts, setCounts] = useState({});
  const [form, setForm] = useState(emptyQuiz);
  const [editing, setEditing] = useState(null);
  const [panel, setPanel] = useState(null); // { id, mode: 'questions' | 'results' }
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [qForm, setQForm] = useState(emptyQ);
  const [qEditing, setQEditing] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [marks, setMarks] = useState({}); // attemptId -> { qid: points, fb: text }

  const load = useCallback(async () => {
    if (!courseId) return;
    const { data, error } = await supabase.from('quizzes').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    if (error) { setMsg({ ok: false, text: `${error.message} (run supabase/sql/instructor_phase3.sql)` }); setQuizzes([]); return; }
    setQuizzes(data || []);
    const ids = (data || []).map((q) => q.id);
    if (!ids.length) { setCounts({}); return; }
    const [{ data: qs }, { data: at }] = await Promise.all([
      supabase.from('quiz_questions').select('quiz_id').in('quiz_id', ids),
      supabase.from('quiz_attempts').select('quiz_id, needs_grading').in('quiz_id', ids),
    ]);
    const c = {};
    ids.forEach((id) => { c[id] = { q: 0, a: 0, g: 0 }; });
    (qs || []).forEach((r) => { c[r.quiz_id].q += 1; });
    (at || []).forEach((r) => { c[r.quiz_id].a += 1; if (r.needs_grading) c[r.quiz_id].g += 1; });
    setCounts(c);
  }, [courseId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const loadPanel = useCallback(async (p) => {
    if (!p) return;
    const { data: qs } = await supabase.from('quiz_questions').select('*').eq('quiz_id', p.id).order('position').order('id');
    setQuestions(qs || []);
    if (p.mode === 'results') {
      const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', p.id).order('submitted_at', { ascending: false });
      setAttempts(data || []);
    }
  }, []);

  const openPanel = (id, mode) => {
    const same = panel && panel.id === id && panel.mode === mode;
    const next = same ? null : { id, mode };
    setPanel(next); setQEditing(null); setQForm(emptyQ);
    if (next) loadPanel(next);
  };

  const resetQuiz = () => { setForm(emptyQuiz); setEditing(null); };

  const saveQuiz = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.title.trim()) { setMsg({ ok: false, text: 'Title is required.' }); return; }
    setBusy(true);
    const row = {
      course_id: Number(courseId),
      title: form.title.trim(),
      description: form.description.trim() || null,
      pass_score: Math.min(100, Math.max(0, Number(form.pass_score) || 0)),
      max_attempts: form.max_attempts === '' ? null : Math.max(1, Number(form.max_attempts)),
      time_limit_min: form.time_limit_min === '' ? null : Math.max(1, Math.round(Number(form.time_limit_min))),
      show_answers: !!form.show_answers,
      published: !!form.published,
      anti_cheat: !!form.anti_cheat,
    };
    const res = editing
      ? await supabase.from('quizzes').update(row).eq('id', editing).select('id').maybeSingle()
      : await supabase.from('quizzes').insert(row).select('id').single();
    if (res.error) { setBusy(false); setMsg({ ok: false, text: res.error.message }); return; }
    if (!res.data) {
      setBusy(false); resetQuiz(); load();
      setMsg({ ok: false, text: 'This quiz no longer exists (it was deleted). The form was reset — create it again.' });
      return;
    }
    if (form.password.trim() || form.clear_password) {
      const { error: pwErr } = await supabase.rpc('set_quiz_password', { qid: res.data.id, pwd: form.clear_password ? '' : form.password.trim() });
      if (pwErr) { setBusy(false); setMsg({ ok: false, text: `Quiz saved, but the password failed: ${pwErr.message}` }); load(); return; }
    }
    setBusy(false);
    setMsg({ ok: true, text: editing ? 'Quiz updated.' : 'Quiz created. Now add questions.' });
    resetQuiz(); load();
  };

  const editQuiz = (q) => {
    setEditing(q.id);
    setForm({ title: q.title, description: q.description || '', pass_score: q.pass_score, max_attempts: q.max_attempts ?? '', time_limit_min: q.time_limit_min ?? '', show_answers: q.show_answers, published: q.published, anti_cheat: q.anti_cheat !== false, password: '', clear_password: false, has_password: !!q.has_password });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeQuiz = async (q) => {
    if (!window.confirm(`Delete "${q.title}", its questions and all student attempts?`)) return;
    const { error } = await supabase.from('quizzes').delete().eq('id', q.id);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    if (panel?.id === q.id) setPanel(null);
    if (editing === q.id) resetQuiz();
    load();
  };

  const setOpt = (i, v) => setQForm((f) => ({ ...f, options: f.options.map((o, k) => (k === i ? v : o)) }));
  const addOpt = () => setQForm((f) => (f.options.length < 6 ? { ...f, options: [...f.options, ''] } : f));
  const delOpt = (i) => setQForm((f) => {
    if (f.options.length <= 2) return f;
    const options = f.options.filter((_, k) => k !== i);
    const correct = f.correct === i ? 0 : (f.correct > i ? f.correct - 1 : f.correct);
    return { ...f, options, correct };
  });

  const saveQuestion = async (e) => {
    e.preventDefault();
    setMsg(null);
    const written = qForm.kind === 'written';
    const options = qForm.options.map((o) => o.trim());
    if (!qForm.prompt.trim()) { setMsg({ ok: false, text: 'Write the question.' }); return; }
    if (!written && options.some((o) => !o)) { setMsg({ ok: false, text: 'Fill in every option (or remove the empty ones).' }); return; }
    const points = Number(qForm.points);
    if (!(points > 0)) { setMsg({ ok: false, text: 'Points must be greater than 0.' }); return; }
    setBusy(true);
    const row = { quiz_id: panel.id, kind: qForm.kind, prompt: qForm.prompt.trim(), points, options: written ? null : options, correct_index: written ? null : qForm.correct };
    const { error } = qEditing
      ? await supabase.from('quiz_questions').update(row).eq('id', qEditing)
      : await supabase.from('quiz_questions').insert({ ...row, position: questions.length + 1 });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: qEditing ? 'Question updated.' : 'Question added.' });
    setQForm(emptyQ); setQEditing(null);
    loadPanel(panel); load();
  };

  const editQuestion = (q) => {
    setQEditing(q.id);
    setQForm({ kind: q.kind, prompt: q.prompt, options: q.options ? [...q.options] : ['', ''], correct: q.correct_index ?? 0, points: q.points });
  };

  const removeQuestion = async (q) => {
    if (!window.confirm('Delete this question?')) return;
    const { error } = await supabase.from('quiz_questions').delete().eq('id', q.id);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    loadPanel(panel); load();
  };

  const saveGrade = async (a) => {
    const m = marks[a.id] || {};
    const written = questions.filter((k) => k.kind === 'written');
    const grades = {};
    for (const k of written) {
      const v = m[k.id] !== undefined ? m[k.id] : (a.grades?.[k.id] ?? '');
      if (v === '' || Number.isNaN(Number(v))) continue;
      if (Number(v) < 0 || Number(v) > Number(k.points)) { setMsg({ ok: false, text: `A mark must be between 0 and ${k.points}.` }); return; }
      grades[k.id] = Number(v);
    }
    const { error } = await supabase.rpc('grade_quiz_attempt', { aid: a.id, grades, fb: (m.fb !== undefined ? m.fb : (a.feedback || '')) });
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: 'Grade saved.' });
    setMarks((p) => { const n = { ...p }; delete n[a.id]; return n; });
    loadPanel(panel); load();
  };

  const resetAttempt = async (a) => {
    if (!window.confirm('Reset this attempt? The student will be able to retake the quiz.')) return;
    const { error } = await supabase.from('quiz_attempts').delete().eq('id', a.id);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    loadPanel(panel); load();
  };

  const note = msg && <div role="status" style={{ color: msg.ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14, margin: '10px 0' }}>{msg.text}</div>;

  if (!courses.length) return <div style={card}>You have no assigned courses yet.</div>;

  return (
    <>
      <div style={card}>
        <label style={{ ...lbl, marginTop: 0 }} htmlFor="qz-course">Course</label>
        <select id="qz-course" style={input} value={courseId} onChange={(e) => { setCourseId(e.target.value); setPanel(null); setMsg(null); resetQuiz(); }}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <form style={card} onSubmit={saveQuiz}>
        <h2 style={{ color: NAVY, margin: '0 0 6px', fontSize: '1.2rem' }}>{editing ? 'Edit quiz' : 'New quiz'}</h2>
        <label style={lbl} htmlFor="qz-title">Title</label>
        <input id="qz-title" style={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label style={lbl} htmlFor="qz-desc">Instructions (optional)</label>
        <textarea id="qz-desc" rows={2} style={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          <div>
            <label style={lbl} htmlFor="qz-pass">Pass mark (%)</label>
            <input id="qz-pass" type="number" min="0" max="100" style={input} value={form.pass_score} onChange={(e) => setForm({ ...form, pass_score: e.target.value })} />
          </div>
          <div>
            <label style={lbl} htmlFor="qz-att">Max attempts (empty = unlimited)</label>
            <input id="qz-att" type="number" min="1" style={input} value={form.max_attempts} onChange={(e) => setForm({ ...form, max_attempts: e.target.value })} />
          </div>
          <div>
            <label style={lbl} htmlFor="qz-time">Time limit in minutes (empty = no timer)</label>
            <input id="qz-time" type="number" min="1" style={input} value={form.time_limit_min} onChange={(e) => setForm({ ...form, time_limit_min: e.target.value })} placeholder="e.g. 30" />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 4px', fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.show_answers} onChange={(e) => setForm({ ...form, show_answers: e.target.checked })} />
          Show the correct answers to students after they submit
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px', fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.anti_cheat} onChange={(e) => setForm({ ...form, anti_cheat: e.target.checked })} />
          Anti-cheat mode: block copy / paste / right-click, shuffle question order, and record when the student leaves the page
        </label>
        <label style={lbl} htmlFor="qz-pw">Quiz password {form.has_password ? '(a password is set — type a new one to replace it)' : '(optional — students must enter it to start)'}</label>
        <input id="qz-pw" type="text" autoComplete="off" style={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value, clear_password: false })} placeholder={form.has_password ? '••••••••' : 'e.g. midterm2026'} />
        {form.has_password && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px', fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.clear_password} onChange={(e) => setForm({ ...form, clear_password: e.target.checked, password: '' })} />
            Remove the password
          </label>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px', fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
          Published (visible to students)
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button type="submit" style={btn(true)} disabled={busy}>{busy ? 'Saving…' : (editing ? 'Save changes' : 'Create quiz')}</button>
          {editing && <button type="button" style={btn(false)} onClick={resetQuiz}>Cancel</button>}
        </div>
        {note}
      </form>

      <div style={card}>
        <h2 style={{ color: NAVY, margin: '0 0 12px', fontSize: '1.2rem' }}>Quizzes ({quizzes.length})</h2>
        {!quizzes.length && <p style={{ color: '#4A5D78' }}>No quizzes for this course yet.</p>}
        {quizzes.map((q) => {
          const c = counts[q.id] || { q: 0, a: 0 };
          const open = panel?.id === q.id;
          return (
            <div key={q.id} style={{ border: '1px solid #E6F0FB', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ minWidth: 200 }}>
                  <strong style={{ color: NAVY, fontSize: 16 }}>{q.title}</strong>
                  <div style={{ fontSize: 12, color: '#4A5D78', marginTop: 4 }}>
                    Pass: {q.pass_score}% · Attempts: {q.max_attempts ?? 'unlimited'} · Time: {q.time_limit_min ? `${q.time_limit_min} min` : 'no limit'}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={chip('#E6F0FB', NAVY)}>{c.q} question(s)</span>
                    <span style={chip('#FFF2D6', '#8a5a00')}>{c.a} attempt(s)</span>
                    {c.g > 0 && <span style={chip('#FFF2D6', '#b35c00')}>{c.g} to grade</span>}
                    {q.has_password && <span style={chip('#F0E8FA', '#5b2d91')}>password</span>}
                    {!q.published && <span style={chip('#FDE7E7', '#b3261e')}>draft</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" style={btn(true)} onClick={() => openPanel(q.id, 'questions')}>{open && panel.mode === 'questions' ? 'Hide questions' : 'Questions'}</button>
                  <button type="button" style={btn(false)} onClick={() => openPanel(q.id, 'results')}>{open && panel.mode === 'results' ? 'Hide results' : 'Results'}</button>
                  <button type="button" style={btn(false)} onClick={() => editQuiz(q)}>Edit</button>
                  <button type="button" style={{ ...btn(false), color: '#b3261e' }} onClick={() => removeQuiz(q)}>Delete</button>
                </div>
              </div>

              {open && panel.mode === 'questions' && (
                <div style={{ marginTop: 14 }}>
                  {questions.map((qq, n) => (
                    <div key={qq.id} style={{ background: '#F7FAFE', borderRadius: 14, padding: 12, marginBottom: 8 }}>
                      <strong>{n + 1}. {qq.prompt}</strong> <span style={chip(qq.kind === 'written' ? '#F0E8FA' : '#E6F0FB', qq.kind === 'written' ? '#5b2d91' : NAVY)}>{qq.kind === 'written' ? 'written' : 'multiple choice'} · {qq.points} pt</span>
                      {qq.kind === 'written' && <div style={{ fontSize: 13, color: '#4A5D78', margin: '6px 0' }}>Graded manually by you.</div>}
                      <ul style={{ margin: '6px 0', paddingInlineStart: 20, fontSize: 14 }}>
                        {(qq.options || []).map((o, i) => (
                          <li key={i} style={{ color: i === qq.correct_index ? '#0a7a43' : 'inherit', fontWeight: i === qq.correct_index ? 700 : 400 }}>
                            {o}{i === qq.correct_index ? ' ✓' : ''}
                          </li>
                        ))}
                      </ul>
                      <button type="button" style={btn(false)} onClick={() => editQuestion(qq)}>Edit</button>{' '}
                      <button type="button" style={{ ...btn(false), color: '#b3261e' }} onClick={() => removeQuestion(qq)}>Delete</button>
                    </div>
                  ))}
                  <form onSubmit={saveQuestion} style={{ border: '1px dashed #CBD7E8', borderRadius: 14, padding: 14, marginTop: 10 }}>
                    <strong style={{ color: NAVY }}>{qEditing ? 'Edit question' : 'Add a question'}</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
                      <div>
                        <label style={lbl} htmlFor="qq-kind">Type</label>
                        <select id="qq-kind" style={input} value={qForm.kind} onChange={(e) => setQForm({ ...qForm, kind: e.target.value })}>
                          <option value="mcq">Multiple choice (auto-graded)</option>
                          <option value="written">Written answer (you grade it)</option>
                        </select>
                      </div>
                      <div>
                        <label style={lbl} htmlFor="qq-points">Points</label>
                        <input id="qq-points" type="number" min="0.5" step="0.5" style={input} value={qForm.points} onChange={(e) => setQForm({ ...qForm, points: e.target.value })} />
                      </div>
                    </div>
                    <label style={lbl} htmlFor="qq-prompt">Question</label>
                    <textarea id="qq-prompt" rows={2} style={input} value={qForm.prompt} onChange={(e) => setQForm({ ...qForm, prompt: e.target.value })} />
                    {qForm.kind === 'mcq' && <div style={{ ...lbl, marginTop: 14 }}>Options — select the correct one</div>}
                    {qForm.kind === 'mcq' && qForm.options.map((o, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <input type="radio" name="qq-correct" aria-label={`Option ${i + 1} is correct`} checked={qForm.correct === i} onChange={() => setQForm({ ...qForm, correct: i })} />
                        <input style={input} aria-label={`Option ${i + 1}`} value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                        {qForm.options.length > 2 && <button type="button" style={btn(false)} onClick={() => delOpt(i)} aria-label={`Remove option ${i + 1}`}>✕</button>}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      {qForm.kind === 'mcq' && qForm.options.length < 6 && <button type="button" style={btn(false)} onClick={addOpt}>+ Add option</button>}
                      <button type="submit" style={btn(true)} disabled={busy}>{qEditing ? 'Save question' : 'Add question'}</button>
                      {qEditing && <button type="button" style={btn(false)} onClick={() => { setQEditing(null); setQForm(emptyQ); }}>Cancel</button>}
                    </div>
                  </form>
                </div>
              )}

              {open && panel.mode === 'results' && (
                <div style={{ marginTop: 14 }}>
                  {!attempts.length && <p style={{ color: '#4A5D78', margin: 0 }}>No attempts yet.</p>}
                  {attempts.map((a) => {
                    const written = questions.filter((k) => k.kind === 'written');
                    const m = marks[a.id] || {};
                    return (
                      <div key={a.id} style={{ background: '#F7FAFE', borderRadius: 14, padding: 12, marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
                          <div>
                            <strong>{students[a.student_id] || a.student_id.slice(0, 8)}</strong>
                            <div style={{ fontSize: 12, color: '#4A5D78' }}>{fmt(a.submitted_at)}</div>
                            {a.focus_lost > 0 && <div style={{ fontSize: 12, color: '#b3261e', fontWeight: 700 }}>⚠ Left the page {a.focus_lost} time(s)</div>}
                          </div>
                          <div>
                            {a.needs_grading
                              ? <span style={chip('#FFF2D6', '#b35c00')}>waiting for your grading</span>
                              : <span style={chip(a.passed ? '#E8F6EE' : '#FDE7E7', a.passed ? '#0a7a43' : '#b3261e')}>{a.score}% · {a.passed ? 'passed' : 'not passed'}</span>}
                            <button type="button" style={btn(false)} onClick={() => resetAttempt(a)}>Reset</button>
                          </div>
                        </div>
                        {written.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            {written.map((k) => (
                              <div key={k.id} style={{ borderTop: '1px solid #E6F0FB', paddingTop: 8, marginTop: 8 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{k.prompt}</div>
                                <div style={{ whiteSpace: 'pre-wrap', background: '#fff', border: '1px solid #E6F0FB', borderRadius: 10, padding: 10, margin: '6px 0', fontSize: 14 }}>
                                  {a.answers?.[k.id] || <em style={{ color: '#4A5D78' }}>No answer</em>}
                                </div>
                                <label style={{ ...lbl, marginTop: 0 }} htmlFor={`mk-${a.id}-${k.id}`}>Mark / {k.points}</label>
                                <input id={`mk-${a.id}-${k.id}`} type="number" min="0" max={k.points} step="0.5" style={{ ...input, maxWidth: 140 }}
                                  value={m[k.id] !== undefined ? m[k.id] : (a.grades?.[k.id] ?? '')}
                                  onChange={(e) => setMarks({ ...marks, [a.id]: { ...m, [k.id]: e.target.value } })} />
                              </div>
                            ))}
                            <label style={lbl} htmlFor={`fb-${a.id}`}>Notes for the student (optional)</label>
                            <input id={`fb-${a.id}`} style={input} value={m.fb !== undefined ? m.fb : (a.feedback || '')} onChange={(e) => setMarks({ ...marks, [a.id]: { ...m, fb: e.target.value } })} />
                            <button type="button" style={{ ...btn(true), marginTop: 10 }} onClick={() => saveGrade(a)}>{a.graded_at ? 'Update grade' : 'Save grade'}</button>
                          </div>
                        )}
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

export default InstructorQuizzes;
