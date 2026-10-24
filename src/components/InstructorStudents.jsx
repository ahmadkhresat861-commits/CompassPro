import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const NAVY = '#003366';
const GOLD = '#F0A500';
const card = { background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,51,102,0.08)', marginBottom: 20 };
const input = { width: '100%', padding: '12px 14px', border: '1px solid #CBD7E8', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const th = { textAlign: 'left', padding: '10px 8px', fontSize: 12, color: '#4A5D78', borderBottom: '1px solid #E6F0FB', whiteSpace: 'nowrap' };
const td = { padding: '10px 8px', fontSize: 14, borderBottom: '1px solid #F0F4FA', verticalAlign: 'top' };
const btn = { background: '#fff', color: NAVY, border: '1px solid #CBD7E8', borderRadius: 999, padding: '8px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString([], { dateStyle: 'medium' }) : '—');
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const InstructorStudents = ({ courses, students }) => {
  const [pickedCourse, setCourseId] = useState('');
  const courseId = pickedCourse || String(courses[0]?.id ?? '');
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ lessons: 0, assignments: 0, quizzes: 0 });
  const [open, setOpen] = useState(null);
  const [detail, setDetail] = useState({ assignments: [], quizzes: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [approvals, setApprovals] = useState({});
  const [reqMap, setReqMap] = useState({});
  const [certMsg, setCertMsg] = useState(null);
  const required = (reqMap[courseId] ?? courses.find((c) => String(c.id) === courseId)?.requires_cert_approval) === true;
  const [names, setNames] = useState({});

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true); setErr('');
    const [{ data: en, error: e1 }, { data: ls }, { data: as }, { data: qs }] = await Promise.all([
      supabase.from('enrollments').select('id, user_id, progress, completed, enrolled_at').eq('course_id', courseId),
      supabase.from('lessons').select('id').eq('course_id', courseId),
      supabase.from('assignments').select('id, title, max_score').eq('course_id', courseId),
      supabase.from('quizzes').select('id, title, pass_score').eq('course_id', courseId),
    ]);
    if (e1) { setErr(e1.message); setLoading(false); return; }
    const lids = (ls || []).map((l) => l.id);
    const aids = (as || []).map((a) => a.id);
    const qids = (qs || []).map((q) => q.id);
    const [lp, sb, at] = await Promise.all([
      lids.length ? supabase.from('lesson_progress').select('user_id, lesson_id, completed, completed_at').in('lesson_id', lids) : { data: [] },
      aids.length ? supabase.from('submissions').select('student_id, assignment_id, score, submitted_at, graded_at').in('assignment_id', aids) : { data: [] },
      qids.length ? supabase.from('quiz_attempts').select('student_id, quiz_id, score, passed, needs_grading, submitted_at').in('quiz_id', qids) : { data: [] },
    ]);
    const eids = (en || []).map((e) => e.id);
    const { data: ap } = eids.length ? await supabase.from('certificate_approvals').select('enrollment_id, approved, note').in('enrollment_id', eids) : { data: [] };
    setApprovals(Object.fromEntries((ap || []).map((a) => [a.enrollment_id, a])));
    const uids = (en || []).map((e) => e.user_id);
    const missing = uids.filter((u) => !students[u]);
    if (missing.length) {
      const { data: ps } = await supabase.from('profiles').select('id, username, full_name').in('id', missing);
      setNames(Object.fromEntries((ps || []).map((p) => [p.id, p.full_name || p.username || p.id.slice(0, 8)])));
    }
    const out = (en || []).map((e) => {
      const u = e.user_id;
      const myL = (lp.data || []).filter((x) => x.user_id === u && x.completed);
      const mySub = (sb.data || []).filter((x) => x.student_id === u);
      const myAt = (at.data || []).filter((x) => x.student_id === u);
      const passedIds = new Set(myAt.filter((x) => x.passed).map((x) => x.quiz_id));
      const dates = [...myL.map((x) => x.completed_at), ...mySub.map((x) => x.submitted_at), ...myAt.map((x) => x.submitted_at)].filter(Boolean).sort();
      return {
        id: u, eid: e.id, progress: Math.round(Number(e.progress) || 0), completed: !!e.completed, enrolled_at: e.enrolled_at,
        lessons: myL.length, submitted: mySub.length, graded: mySub.filter((x) => x.score != null).length,
        passed: passedIds.size, pendingQuiz: myAt.filter((x) => x.needs_grading).length,
        last: dates.length ? dates[dates.length - 1] : null,
        subs: mySub, attempts: myAt,
      };
    }).sort((a, b) => b.progress - a.progress);
    setRows(out);
    setTotals({ lessons: lids.length, assignments: aids.length, quizzes: qids.length });
    setDetail({ assignments: as || [], quizzes: qs || [] });
    setLoading(false);
  }, [courseId, students]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const toggleRequired = async (on) => {
    setCertMsg(null);
    const { error } = await supabase.rpc('set_course_cert_approval', { p_course_id: Number(courseId), p_required: on });
    if (error) { setCertMsg({ ok: false, text: `${error.message} (run supabase/sql/instructor_phase5.sql)` }); return; }
    setReqMap((m) => ({ ...m, [courseId]: on }));
    setCertMsg({ ok: true, text: on ? 'Certificates for this course now need your approval.' : 'Certificates are issued automatically again.' });
  };

  const decide = async (r, approve) => {
    let note = null;
    if (!approve) {
      note = window.prompt('Reason / what the student should fix (optional):', '');
      if (note === null) return;
    }
    setCertMsg(null);
    const { error } = await supabase.rpc('decide_certificate', { p_enrollment_id: r.eid, p_approve: approve, p_note: note });
    if (error) { setCertMsg({ ok: false, text: error.message }); return; }
    setApprovals((m) => ({ ...m, [r.eid]: { enrollment_id: r.eid, approved: approve, note } }));
    setCertMsg({ ok: true, text: `${nameOf(r.id)}: certificate ${approve ? 'approved' : 'not approved'}. The student was notified.` });
  };

  const nameOf = (id) => students[id] || names[id] || id.slice(0, 8);

  const exportCsv = () => {
    const head = ['Student', 'Progress %', 'Completed', 'Lessons done', 'Lessons total', 'Assignments submitted', 'Assignments total', 'Quizzes passed', 'Quizzes total', 'Last activity', 'Enrolled'];
    const lines = rows.map((r) => [nameOf(r.id), r.progress, r.completed ? 'yes' : 'no', r.lessons, totals.lessons, r.submitted, totals.assignments, r.passed, totals.quizzes, fmtDate(r.last), fmtDate(r.enrolled_at)].map(csvCell).join(','));
    const blob = new Blob(['﻿' + [head.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `students-course-${courseId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!courses.length) return <div style={card}>You have no assigned courses yet.</div>;

  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.progress, 0) / rows.length) : 0;
  const stat = (label, v) => (
    <div style={{ flex: '1 1 130px', background: '#F3F7FC', borderRadius: 16, padding: '12px 16px' }}>
      <div style={{ fontSize: 12, color: '#4A5D78' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>{v}</div>
    </div>
  );

  return (
    <>
      <div style={card}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4A5D78', marginBottom: 4 }} htmlFor="st-course">Course</label>
        <select id="st-course" style={input} value={courseId} onChange={(e) => { setCourseId(e.target.value); setOpen(null); }}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          {stat('Enrolled students', rows.length)}
          {stat('Average progress', `${avg}%`)}
          {stat('Completed', rows.filter((r) => r.completed).length)}
          {stat('Items in course', totals.lessons + totals.assignments + totals.quizzes)}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={required} onChange={(e) => toggleRequired(e.target.checked)} />
          Require my approval before a student gets the certificate
        </label>
        {certMsg && <div role="status" style={{ color: certMsg.ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14, marginTop: 8 }}>{certMsg.text}</div>}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <h2 style={{ color: NAVY, margin: 0, fontSize: '1.2rem' }}>Student progress</h2>
          <button type="button" style={btn} onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
        </div>
        {err && <div style={{ color: '#b3261e', fontWeight: 600 }}>{err}</div>}
        {loading && <p style={{ color: '#4A5D78' }}>Loading…</p>}
        {!loading && !rows.length && !err && <p style={{ color: '#4A5D78', margin: 0 }}>No students enrolled yet.</p>}
        {!!rows.length && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead><tr>
                <th style={th}>Student</th><th style={th}>Progress</th>
                <th style={th}>Lessons</th><th style={th}>Assignments</th><th style={th}>Quizzes</th><th style={th}>Last activity</th><th style={th}>Certificate</th><th style={th} />
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td style={td}><strong>{nameOf(r.id)}</strong>{r.completed && <span style={{ marginInlineStart: 6, color: '#0a7a43', fontSize: 12, fontWeight: 800 }}>✓ completed</span>}</td>
                      <td style={{ ...td, minWidth: 140 }}>
                        <div style={{ background: '#E6F0FB', borderRadius: 999, height: 8, overflow: 'hidden' }}><div style={{ width: `${r.progress}%`, height: '100%', background: GOLD }} /></div>
                        <span style={{ fontSize: 12, color: '#4A5D78' }}>{r.progress}%</span>
                      </td>
                      <td style={td}>{r.lessons}/{totals.lessons}</td>
                      <td style={td}>{r.submitted}/{totals.assignments}{r.graded > 0 && <span style={{ color: '#4A5D78', fontSize: 12 }}> ({r.graded} graded)</span>}</td>
                      <td style={td}>{r.passed}/{totals.quizzes}{r.pendingQuiz > 0 && <span style={{ color: '#8a5a00', fontSize: 12 }}> ({r.pendingQuiz} to grade)</span>}</td>
                      <td style={td}>{fmtDate(r.last)}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {!r.completed ? <span style={{ color: '#4A5D78', fontSize: 12 }}>—</span>
                          : !required ? <span style={{ color: '#4A5D78', fontSize: 12 }}>automatic</span>
                          : (
                            <>
                              {approvals[r.eid]?.approved === true && <span style={{ color: '#0a7a43', fontWeight: 800, fontSize: 12 }}>✓ approved </span>}
                              {approvals[r.eid]?.approved === false && <span style={{ color: '#b3261e', fontWeight: 800, fontSize: 12 }} title={approvals[r.eid].note || ''}>✗ not approved </span>}
                              {!approvals[r.eid] && <span style={{ color: '#8a5a00', fontWeight: 800, fontSize: 12 }}>⏳ waiting </span>}
                              {approvals[r.eid]?.approved !== true && <button type="button" style={{ ...btn, padding: '3px 10px', fontSize: 12 }} onClick={() => decide(r, true)}>Approve</button>}
                              {approvals[r.eid]?.approved !== false && <button type="button" style={{ ...btn, padding: '3px 10px', fontSize: 12, marginInlineStart: 4, color: '#b3261e' }} onClick={() => decide(r, false)}>Reject</button>}
                            </>
                          )}
                      </td>
                      <td style={td}><button type="button" style={{ ...btn, padding: '4px 12px' }} aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? 'Hide' : 'Details'}</button></td>
                    </tr>
                    {open === r.id && (
                      <tr><td colSpan={8} style={{ ...td, background: '#F8FAFD' }}>
                        <div style={{ fontWeight: 800, color: NAVY, marginBottom: 6 }}>Assignments</div>
                        {!detail.assignments.length && <div style={{ color: '#4A5D78', fontSize: 13 }}>No assignments in this course.</div>}
                        {detail.assignments.map((a) => {
                          const s = r.subs.find((x) => x.assignment_id === a.id);
                          return <div key={a.id} style={{ fontSize: 13, padding: '3px 0' }}>{a.title} — {s ? (s.score != null ? `${s.score}/${a.max_score}` : 'submitted, not graded') : <span style={{ color: '#b3261e' }}>not submitted</span>}</div>;
                        })}
                        <div style={{ fontWeight: 800, color: NAVY, margin: '12px 0 6px' }}>Quizzes</div>
                        {!detail.quizzes.length && <div style={{ color: '#4A5D78', fontSize: 13 }}>No quizzes in this course.</div>}
                        {detail.quizzes.map((q) => {
                          const list = r.attempts.filter((x) => x.quiz_id === q.id);
                          const graded = list.filter((x) => x.score != null);
                          const best = graded.length ? Math.max(...graded.map((x) => Number(x.score))) : null;
                          return <div key={q.id} style={{ fontSize: 13, padding: '3px 0' }}>{q.title} — {list.length ? `${list.length} attempt(s), best ${best != null ? `${Math.round(best)}%` : 'awaiting grading'}${list.some((x) => x.passed) ? ' · passed' : ''}` : <span style={{ color: '#b3261e' }}>not attempted</span>}</div>;
                        })}
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default InstructorStudents;
