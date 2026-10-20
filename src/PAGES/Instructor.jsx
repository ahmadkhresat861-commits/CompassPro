import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import DualOrbitLoader from '../components/DualOrbitLoader';

const NAVY = '#003366';
const GOLD = '#F0A500';
const card = { background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,51,102,0.08)', marginBottom: 20 };
const input = { width: '100%', padding: '12px 14px', border: '1px solid #CBD7E8', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const lbl = { display: 'block', fontSize: 12, fontWeight: 700, color: '#4A5D78', margin: '12px 0 4px' };
const btn = (primary) => ({
  background: primary ? GOLD : '#fff', color: NAVY, border: primary ? 'none' : '1px solid #CBD7E8',
  borderRadius: 999, padding: '10px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
});
const th = { padding: '12px 14px', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: 13 };
const td = { padding: '12px 14px', borderBottom: '1px solid #E6F0FB', fontSize: 14 };

const emptyLesson = { title: '', chapter: '', description: '', content: '', video_url: '', lesson_order: 1 };
const emptyCard = { display_name: '', headline: '', bio: '', avatar_url: '', contact_email: '' };

const Kpi = ({ label, value, bg }) => (
  <div style={{ background: bg, borderRadius: 20, padding: '18px 22px' }}>
    <div style={{ fontSize: 28, fontWeight: 800, color: NAVY }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#4A5D78' }}>{label}</div>
  </div>
);

const Instructor = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [students, setStudents] = useState({});
  const [error, setError] = useState('');

  // lessons
  const [courseId, setCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [lForm, setLForm] = useState(emptyLesson);
  const [lEditing, setLEditing] = useState(null);
  const [lFile, setLFile] = useState(null);
  const [lMsg, setLMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  // public instructor card
  const [card_, setCard] = useState(emptyCard);
  const [showEmail, setShowEmail] = useState(false);
  const [pMsg, setPMsg] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    const { data: prof } = await supabase.from('profiles').select('id, username, full_name, type').eq('id', user.id).maybeSingle();
    setMe({ id: user.id, email: user.email || '', name: prof?.full_name || prof?.username || user.email, type: prof?.type, username: prof?.username || '' });

    const { data: cs, error: cErr } = await supabase
      .from('courses').select('*').eq('instructor_id', user.id).order('created_at', { ascending: false });
    if (cErr) { setError(cErr.message); setLoading(false); return; }
    setCourses(cs || []);

    const ids = (cs || []).map((c) => c.id);
    if (ids.length) {
      const [{ data: en }, { data: rv }] = await Promise.all([
        supabase.from('enrollments').select('user_id, course_id, progress, completed, enrolled_at').in('course_id', ids),
        supabase.from('reviews').select('course_id, rating').in('course_id', ids),
      ]);
      setEnrollments(en || []);
      setReviews(rv || []);
      const uids = [...new Set((en || []).map((e) => e.user_id))];
      if (uids.length) {
        const { data: ps } = await supabase.from('profiles').select('id, username, full_name').in('id', uids);
        setStudents(Object.fromEntries((ps || []).map((p) => [p.id, p.full_name || p.username || p.id.slice(0, 8)])));
      }
    }
    const { data: cardRow } = await supabase.from('instructor_public').select('*').eq('user_id', user.id).maybeSingle();
    if (cardRow) {
      setCard({ display_name: cardRow.display_name || '', headline: cardRow.headline || '', bio: cardRow.bio || '', avatar_url: cardRow.avatar_url || '', contact_email: cardRow.contact_email || '' });
      setShowEmail(!!cardRow.contact_email);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const loadLessons = async (id) => {
    if (!id) { setLessons([]); return; }
    const { data } = await supabase.from('lessons').select('*').eq('course_id', id).order('lesson_order', { ascending: true });
    setLessons(data || []);
    setLForm((f) => ({ ...f, lesson_order: (data || []).length + 1 }));
  };
  useEffect(() => { loadLessons(courseId); }, [courseId]);

  const perCourse = useMemo(() => courses.map((c) => {
    const en = enrollments.filter((e) => e.course_id === c.id);
    const rv = reviews.filter((r) => r.course_id === c.id);
    return {
      ...c,
      enrolled: en.length,
      avgProgress: en.length ? Math.round(en.reduce((a, e) => a + (e.progress || 0), 0) / en.length) : 0,
      completed: en.filter((e) => e.completed).length,
      avgRating: rv.length ? (rv.reduce((a, r) => a + (r.rating || 0), 0) / rv.length).toFixed(1) : '–',
    };
  }), [courses, enrollments, reviews]);

  const totalStudents = new Set(enrollments.map((e) => e.user_id)).size;
  const allRatings = reviews.map((r) => r.rating).filter(Boolean);
  const overallRating = allRatings.length ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1) : '–';
  const completionRate = enrollments.length ? Math.round((enrollments.filter((e) => e.completed).length / enrollments.length) * 100) : 0;

  // ---------- public profile card ----------
  const saveCard = async (e) => {
    e.preventDefault();
    setPMsg(null);
    setBusy(true);
    let avatar_url = card_.avatar_url;
    if (avatarFile) {
      if (!/^image\//.test(avatarFile.type) || avatarFile.size > 2 * 1024 * 1024) {
        setBusy(false); setPMsg({ ok: false, text: 'Photo must be an image up to 2MB.' }); return;
      }
      const ext = avatarFile.name.split('.').pop();
      const path = `${me.id}/instructor-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile);
      if (upErr) { setBusy(false); setPMsg({ ok: false, text: 'Upload failed: ' + upErr.message }); return; }
      avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data?.publicUrl || '';
    }
    const row = {
      user_id: me.id,
      display_name: card_.display_name.trim() || null,
      headline: card_.headline.trim() || null,
      bio: card_.bio.trim() || null,
      avatar_url: avatar_url || null,
      contact_email: showEmail ? (card_.contact_email.trim() || me.email || null) : null,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = await supabase.from('instructor_public').upsert(row);
    setBusy(false);
    if (err) { setPMsg({ ok: false, text: err.message + ' (run supabase/sql/instructor_phase1.sql)' }); return; }
    setCard((c) => ({ ...c, avatar_url: avatar_url || '', contact_email: row.contact_email || '' }));
    setAvatarFile(null);
    setPMsg({ ok: true, text: 'Saved. Students now see this on your courses.' });
  };

  // ---------- lessons ----------
  const saveLesson = async (e) => {
    e.preventDefault();
    setLMsg(null);
    if (!courseId) { setLMsg({ ok: false, text: 'Choose a course first.' }); return; }
    if (!lForm.title.trim()) { setLMsg({ ok: false, text: 'Lesson title is required.' }); return; }
    setBusy(true);
    let pdf_url;
    if (lFile) {
      if (lFile.size > 10 * 1024 * 1024) { setBusy(false); setLMsg({ ok: false, text: 'PDF must be 10MB or less.' }); return; }
      const ext = lFile.name.split('.').pop();
      const path = `${courseId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('lesson-files').upload(path, lFile);
      if (upErr) { setBusy(false); setLMsg({ ok: false, text: 'Upload failed: ' + upErr.message }); return; }
      pdf_url = supabase.storage.from('lesson-files').getPublicUrl(path).data?.publicUrl;
    }
    const payload = {
      course_id: Number(courseId), title: lForm.title.trim(), description: lForm.description.trim(),
      content: lForm.content.trim(), video_url: lForm.video_url.trim(), lesson_order: Number(lForm.lesson_order) || 1,
      ...(pdf_url ? { pdf_url } : {}),
      ...((lForm.chapter.trim() || lessons.find((x) => x.id === lEditing)?.chapter) ? { chapter: lForm.chapter.trim() || null } : {}),
    };
    const { error: err } = lEditing
      ? await supabase.from('lessons').update(payload).eq('id', lEditing)
      : await supabase.from('lessons').insert([payload]);
    setBusy(false);
    if (err) { setLMsg({ ok: false, text: err.message }); return; }
    setLMsg({ ok: true, text: lEditing ? 'Lesson updated.' : 'Lesson added.' });
    setLForm({ ...emptyLesson, lesson_order: lessons.length + 2 }); setLEditing(null); setLFile(null);
    loadLessons(courseId);
  };
  const editLesson = (l) => {
    setLEditing(l.id);
    setLForm({ title: l.title || '', chapter: l.chapter || '', description: l.description || '', content: l.content || '', video_url: l.video_url || '', lesson_order: l.lesson_order || 1 });
    setLMsg(null);
  };
  const deleteLesson = async (id) => {
    if (!window.confirm('Delete this lesson?')) return;
    const { error: err } = await supabase.from('lessons').delete().eq('id', id);
    if (err) { setLMsg({ ok: false, text: err.message }); return; }
    loadLessons(courseId);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: NAVY }}>
      <DualOrbitLoader size={48} />
    </div>
  );

  const tabs = [['overview', 'Overview'], ['courses', 'My Courses'], ['lessons', 'Lessons'], ['profile', 'My Profile']];
  const chapters = [...new Set(lessons.map((l) => l.chapter).filter(Boolean))];
  const note = (m) => m && <span role="status" style={{ color: m.ok ? '#0a7a43' : '#b3261e', fontWeight: 600, fontSize: 14 }}>{m.text}</span>;

  return (
    <div style={{ minHeight: '100vh', background: '#F3F7FC', padding: '24px 16px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ background: NAVY, borderRadius: 24, padding: '28px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 600 }}>Instructor Dashboard</div>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.7rem', fontWeight: 800 }}>Welcome, {me?.name}</h1>
          </div>
          <button type="button" style={btn(true)} onClick={() => navigate('/home')}>Back to site</button>
        </div>

        <div role="tablist" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              style={{ ...btn(tab === k), background: tab === k ? GOLD : '#fff' }}>{label}</button>
          ))}
        </div>

        {error && <div style={{ ...card, color: '#b3261e' }}>Could not load your courses: {error}. Make sure supabase/sql/instructor_role.sql was run.</div>}

        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
              <Kpi label="My courses" value={courses.length} bg="#E6F0FB" />
              <Kpi label="Students" value={totalStudents} bg="#FFF3D6" />
              <Kpi label="Average rating" value={overallRating} bg="#E3F5EC" />
              <Kpi label="Completion rate" value={`${completionRate}%`} bg="#E6F0FB" />
            </div>
            <div style={{ ...card, overflowX: 'auto' }}>
              <h2 style={{ color: NAVY, margin: '0 0 16px', fontSize: '1.2rem' }}>Courses</h2>
              {perCourse.length === 0 ? <p style={{ color: '#4A5D78' }}>No courses assigned to you yet. The admin will assign courses to you.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead><tr style={{ background: NAVY }}>
                    {['Course', 'Students', 'Avg progress', 'Completed', 'Rating'].map((h) => <th key={h} style={th}>{h}</th>)}
                  </tr></thead>
                  <tbody>{perCourse.map((c) => (
                    <tr key={c.id}><td style={td}>{c.title}</td><td style={td}>{c.enrolled}</td><td style={td}>{c.avgProgress}%</td><td style={td}>{c.completed}</td><td style={td}>{c.avgRating}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </div>
            <div style={{ ...card, overflowX: 'auto' }}>
              <h2 style={{ color: NAVY, margin: '0 0 16px', fontSize: '1.2rem' }}>Recent students</h2>
              {enrollments.length === 0 ? <p style={{ color: '#4A5D78' }}>No enrollments yet.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead><tr style={{ background: NAVY }}>{['Student', 'Course', 'Progress', 'Enrolled'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>{[...enrollments].sort((a, b) => new Date(b.enrolled_at) - new Date(a.enrolled_at)).slice(0, 10).map((e, i) => (
                    <tr key={i}>
                      <td style={td}>{students[e.user_id] || e.user_id.slice(0, 8)}</td>
                      <td style={td}>{courses.find((c) => c.id === e.course_id)?.title}</td>
                      <td style={td}>{e.completed ? 'Completed' : `${e.progress || 0}%`}</td>
                      <td style={td}>{e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '–'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </>
        )}

        {tab === 'courses' && (
          <div style={card}>
            <h2 style={{ color: NAVY, margin: '0 0 4px', fontSize: '1.2rem' }}>My courses</h2>
            <p style={{ color: '#4A5D78', fontSize: 13, margin: '0 0 16px' }}>Courses are created and assigned to you by the admin. You manage their lessons and follow your students.</p>
            {perCourse.length === 0 ? <p style={{ color: '#4A5D78' }}>No course has been assigned to you yet.</p> : perCourse.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #E6F0FB', flexWrap: 'wrap' }}>
                <strong style={{ flex: 1, minWidth: 160, color: NAVY }}>{c.title}</strong>
                <span style={{ color: '#4A5D78', fontSize: 13 }}>{c.category}</span>
                <span style={{ color: '#4A5D78', fontSize: 13 }}>{c.enrolled} students</span>
                <button type="button" style={btn(true)} onClick={() => { setCourseId(String(c.id)); setTab('lessons'); }}>Manage lessons</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'profile' && (
          <form style={card} onSubmit={saveCard}>
            <h2 style={{ color: NAVY, margin: '0 0 4px', fontSize: '1.2rem' }}>My public profile</h2>
            <p style={{ color: '#4A5D78', fontSize: 13, margin: '0 0 8px' }}>Students see this card on the page of every course assigned to you.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 0' }}>
              {card_.avatar_url
                ? <img src={card_.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ width: 72, height: 72, borderRadius: '50%', background: '#E6F0FB', display: 'grid', placeItems: 'center', color: NAVY, fontWeight: 800 }}>{(card_.display_name || me?.name || '?').slice(0, 1).toUpperCase()}</span>}
              <div>
                <label style={{ ...lbl, margin: '0 0 4px' }} htmlFor="p-photo">Photo (image, max 2MB)</label>
                <input id="p-photo" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <label style={lbl} htmlFor="p-name">Display name</label>
            <input id="p-name" style={input} value={card_.display_name} onChange={(e) => setCard({ ...card_, display_name: e.target.value })} placeholder={me?.name} />
            <label style={lbl} htmlFor="p-head">Headline</label>
            <input id="p-head" style={input} value={card_.headline} onChange={(e) => setCard({ ...card_, headline: e.target.value })} placeholder="e.g. Senior software engineer" />
            <label style={lbl} htmlFor="p-bio">About me</label>
            <textarea id="p-bio" rows={4} style={input} value={card_.bio} onChange={(e) => setCard({ ...card_, bio: e.target.value })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 4px', fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />
              Show my email to students
            </label>
            {showEmail && (
              <input aria-label="Contact email" type="email" style={input} value={card_.contact_email} onChange={(e) => setCard({ ...card_, contact_email: e.target.value })} placeholder={me?.email} />
            )}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <button type="submit" style={btn(true)} disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
              {note(pMsg)}
            </div>
          </form>
        )}

        {tab === 'lessons' && (
          <>
            <div style={card}>
              <label style={{ ...lbl, marginTop: 0 }} htmlFor="l-course">Course</label>
              <select id="l-course" style={input} value={courseId} onChange={(e) => { setCourseId(e.target.value); setLEditing(null); setLForm(emptyLesson); }}>
                <option value="">Select a course…</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            {courseId && (
              <>
                <form style={card} onSubmit={saveLesson}>
                  <h2 style={{ color: NAVY, margin: '0 0 4px', fontSize: '1.2rem' }}>{lEditing ? 'Edit lesson' : 'New lesson'}</h2>
                  <label style={lbl} htmlFor="l-title">Title</label>
                  <input id="l-title" style={input} value={lForm.title} onChange={(e) => setLForm({ ...lForm, title: e.target.value })} />
                  <label style={lbl} htmlFor="l-chapter">Chapter (lessons with the same chapter are grouped)</label>
                  <input id="l-chapter" list="l-chapters" style={input} value={lForm.chapter} onChange={(e) => setLForm({ ...lForm, chapter: e.target.value })} placeholder="e.g. Chapter 1: Basics" />
                  <datalist id="l-chapters">{chapters.map((c) => <option key={c} value={c} />)}</datalist>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div><label style={lbl} htmlFor="l-video">Video URL</label>
                      <input id="l-video" style={input} value={lForm.video_url} onChange={(e) => setLForm({ ...lForm, video_url: e.target.value })} placeholder="https://…" /></div>
                    <div><label style={lbl} htmlFor="l-order">Order</label>
                      <input id="l-order" type="number" min="1" style={input} value={lForm.lesson_order} onChange={(e) => setLForm({ ...lForm, lesson_order: e.target.value })} /></div>
                  </div>
                  <label style={lbl} htmlFor="l-desc">Short description</label>
                  <input id="l-desc" style={input} value={lForm.description} onChange={(e) => setLForm({ ...lForm, description: e.target.value })} />
                  <label style={lbl} htmlFor="l-content">Content</label>
                  <textarea id="l-content" rows={5} style={input} value={lForm.content} onChange={(e) => setLForm({ ...lForm, content: e.target.value })} />
                  <label style={lbl} htmlFor="l-pdf">PDF file (optional, max 10MB)</label>
                  <input id="l-pdf" type="file" accept="application/pdf" onChange={(e) => setLFile(e.target.files?.[0] || null)} />
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                    <button type="submit" style={btn(true)} disabled={busy}>{busy ? 'Saving…' : lEditing ? 'Save changes' : 'Add lesson'}</button>
                    {lEditing && <button type="button" style={btn(false)} onClick={() => { setLEditing(null); setLForm(emptyLesson); setLFile(null); }}>Cancel</button>}
                    {note(lMsg)}
                  </div>
                </form>
                <div style={card}>
                  <h2 style={{ color: NAVY, margin: '0 0 16px', fontSize: '1.2rem' }}>Lessons ({lessons.length})</h2>
                  {lessons.length === 0 ? <p style={{ color: '#4A5D78' }}>No lessons yet.</p> : lessons.map((l) => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #E6F0FB', flexWrap: 'wrap' }}>
                      <span style={{ width: 28, fontWeight: 800, color: NAVY }}>{l.lesson_order}</span>
                      <strong style={{ flex: 1, minWidth: 160 }}>{l.title}{l.chapter && <span style={{ display: 'block', fontWeight: 600, fontSize: 12, color: '#4A5D78' }}>{l.chapter}</span>}</strong>
                      {l.pdf_url && <a href={l.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: NAVY, fontSize: 13 }}>PDF</a>}
                      <button type="button" style={btn(false)} onClick={() => editLesson(l)}>Edit</button>
                      <button type="button" style={{ ...btn(false), color: '#b3261e' }} onClick={() => deleteLesson(l.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Instructor;
