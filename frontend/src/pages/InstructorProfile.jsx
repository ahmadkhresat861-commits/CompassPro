import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../context/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import CourseCover from '../components/course/CourseCover';

const NAVY = '#003366';

// Public instructor page (/instructors/:id). Shown only when an admin approved the instructor.
const InstructorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAr, t } = useLang();
  const [state, setState] = useState('loading'); // loading | ok | missing
  const [p, setP] = useState(null);
  const [courses, setCourses] = useState([]);

  useSEO({ title: p?.display_name ? `${p.display_name} — Instructor` : 'Instructor', description: p?.headline || 'CompassPro instructor', path: `/instructors/${id}` });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from('instructor_public').select('*').eq('user_id', id).eq('approved', true).maybeSingle();
      if (!alive) return;
      if (error || !data) { setState('missing'); return; }
      const { data: cs } = await supabase.from('courses').select('id, title, category, image_url, price, rating, students, instructor').eq('instructor_id', id).order('created_at', { ascending: false });
      if (!alive) return;
      setP({ ...data, display_name: data.display_name || cs?.find((c) => c.instructor)?.instructor || null });
      setCourses(cs || []);
      setState('ok');
    })();
    return () => { alive = false; };
  }, [id]);

  const wrap = { maxWidth: 1100, margin: '0 auto', padding: '110px 20px 60px' };
  if (state === 'loading') return <div style={wrap} aria-busy="true" />;
  if (state === 'missing') {
    return (
      <div style={{ ...wrap, textAlign: 'center' }}>
        <h1 style={{ color: NAVY }}>{isAr ? 'المدرّب غير موجود' : 'Instructor not found'}</h1>
        <button type="button" style={{ background: '#F0A500', color: NAVY, border: 'none', borderRadius: 999, padding: '10px 26px', fontWeight: 800, cursor: 'pointer' }} onClick={() => navigate('/home')}>{isAr ? 'الصفحة الرئيسية' : 'Back to home'}</button>
      </div>
    );
  }
  const students = courses.reduce((s, c) => s + (Number(c.students) || 0), 0);
  const rated = courses.filter((c) => Number(c.rating) > 0);
  const avg = rated.length ? (rated.reduce((s, c) => s + Number(c.rating), 0) / rated.length).toFixed(1) : null;

  return (
    <main style={wrap}>
      <section className="cp-inst-hero">
        {p.avatar_url
          ? <img src={p.avatar_url} alt={p.display_name} className="cp-inst-avatar big" />
          : <span className="cp-inst-avatar big cp-inst-ph" aria-hidden="true"><i className="fas fa-user-tie" /></span>}
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1>{p.display_name}</h1>
          {p.headline && <p className="cp-inst-headline big">{p.headline}</p>}
          <div className="cp-inst-stats">
            <span><strong>{courses.length}</strong> {isAr ? 'كورس' : (courses.length === 1 ? 'course' : 'courses')}</span>
            {students > 0 && <span><strong>{students}</strong> {isAr ? 'طالب' : 'students'}</span>}
            {avg && <span><strong>★ {avg}</strong></span>}
          </div>
          {p.contact_email && (
            <a href={`mailto:${p.contact_email}`} style={{ display: 'inline-block', marginTop: 14, textDecoration: 'none', background: '#F0A500', color: NAVY, borderRadius: 999, padding: '9px 22px', fontWeight: 800, fontSize: 14 }}>
              <i className="fas fa-envelope" aria-hidden="true" /> {p.contact_email}
            </a>
          )}
        </div>
      </section>

      {(p.bio || p.office_hours) && (
        <section className="cp-inst-box">
          {p.bio && (<><h2>{isAr ? 'نبذة' : 'About'}</h2><p style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{p.bio}</p></>)}
          {p.office_hours && (<><h2 style={{ marginTop: 18 }}>{isAr ? 'ساعات المكتب' : 'Office hours'}</h2><p style={{ whiteSpace: 'pre-line' }}>{p.office_hours}</p></>)}
        </section>
      )}

      <section style={{ marginTop: 28 }}>
        <h2 className="cp-inst-h2">{isAr ? 'كورسات المدرّب' : 'Courses'}</h2>
        {!courses.length && <p style={{ color: 'var(--cp-muted)' }}>{isAr ? 'لا توجد كورسات بعد.' : 'No courses yet.'}</p>}
        <div className="cp-grid-3" style={{ marginTop: 14 }}>
          {courses.map((c) => (
            <article key={c.id} className="cp-course-card" onClick={() => navigate(`/courses/${c.id}`)}>
              <CourseCover src={c.image_url} category={c.category} alt={c.title} height={170} />
              <div className="cp-course-body">
                <h3>{c.title}</h3>
                <div className="cp-course-meta">
                  <span>{c.rating ? `★ ${c.rating}` : ''}</span>
                  <strong>{Number(c.price) > 0 ? `$${Number(c.price).toFixed(2)}` : t.free}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default InstructorProfile;
