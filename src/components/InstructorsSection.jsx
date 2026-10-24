import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';

// Home page block: approved instructors only (the admin decides who appears).
const InstructorsSection = () => {
  const navigate = useNavigate();
  const { isAr } = useLang();
  const [list, setList] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('instructor_public')
        .select('user_id, display_name, headline, avatar_url')
        .eq('approved', true)
        .order('updated_at', { ascending: false })
        .limit(8);
      if (!alive || error || !data?.length) return;
      const ids = data.map((d) => d.user_id);
      const { data: cs } = await supabase.from('courses').select('instructor_id').in('instructor_id', ids);
      const count = {};
      (cs || []).forEach((c) => { count[c.instructor_id] = (count[c.instructor_id] || 0) + 1; });
      setList(data.filter((d) => d.display_name).map((d) => ({ ...d, courses: count[d.user_id] || 0 })));
    })();
    return () => { alive = false; };
  }, []);

  if (!list.length) return null;
  const go = (id) => navigate(`/instructors/${id}`);

  return (
    <section className="cp-section" aria-labelledby="cp-instructors-title">
      <div className="cp-section-head">
        <h2 id="cp-instructors-title">{isAr ? 'تعرّف على مدرّبينا' : 'Meet our instructors'}</h2>
      </div>
      <div className="cp-grid-4">
        {list.map((i) => (
          <article key={i.user_id} className="cp-inst-card" role="link" tabIndex={0}
            onClick={() => go(i.user_id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i.user_id); } }}>
            {i.avatar_url
              ? <img src={i.avatar_url} alt={i.display_name} className="cp-inst-avatar" />
              : <span className="cp-inst-avatar cp-inst-ph" aria-hidden="true"><i className="fas fa-user-tie" /></span>}
            <h3>{i.display_name}</h3>
            {i.headline && <p className="cp-inst-headline">{i.headline}</p>}
            <span className="cp-inst-count">
              <i className="fas fa-book" aria-hidden="true" /> {i.courses} {isAr ? 'كورس' : (i.courses === 1 ? 'course' : 'courses')}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
};

export default InstructorsSection;
