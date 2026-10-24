import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useLang } from '../../context/LanguageContext';

const TXT = {
  en: { title: 'Live sessions', none: 'No live sessions scheduled yet.', join: 'Join live session', liveNow: 'Live now', startsIn: 'Starts in', past: 'Past sessions', recording: 'Watch recording', min: 'min', soon: 'Starting soon',
    d: 'd', h: 'h', m: 'm' },
  ar: { title: 'الجلسات المباشرة', none: 'لا توجد جلسات مباشرة مجدولة بعد.', join: 'انضم للجلسة المباشرة', liveNow: 'مباشر الآن', startsIn: 'تبدأ بعد', past: 'الجلسات السابقة', recording: 'شاهد التسجيل', min: 'دقيقة', soon: 'تبدأ قريباً',
    d: 'ي', h: 'س', m: 'د' },
};

const CourseSessions = ({ courseId, dm }) => {
  const { lang } = useLang();
  const x = TXT[lang] || TXT.en;
  const [items, setItems] = useState([]);
  const [broken, setBroken] = useState(false);
  const [now, setNow] = useState(() => new Date().getTime());

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('sessions').select('*').eq('course_id', courseId).order('starts_at', { ascending: true });
    if (error) { setBroken(true); return; }
    setItems((data || []).filter((s) => s.starts_at));
  }, [courseId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().getTime()), 30000);
    return () => clearInterval(id);
  }, []);

  if (broken) return null;
  const end = (s) => new Date(s.starts_at).getTime() + (s.duration_min || 60) * 60000;
  const upcoming = items.filter((s) => end(s) >= now);
  const past = items.filter((s) => end(s) < now).reverse();
  const when = (s) => new Date(s.starts_at).toLocaleString(lang === 'ar' ? 'ar' : [], { dateStyle: 'full', timeStyle: 'short' });
  const eta = (s) => {
    const mins = Math.max(0, Math.round((new Date(s.starts_at).getTime() - now) / 60000));
    if (mins >= 1440) return `${Math.floor(mins / 1440)}${x.d} ${Math.floor((mins % 1440) / 60)}${x.h}`;
    if (mins >= 60) return `${Math.floor(mins / 60)}${x.h} ${mins % 60}${x.m}`;
    return `${mins}${x.m}`;
  };
  const chip = (bg, color) => ({ display: 'inline-block', background: bg, color, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 800, marginInlineEnd: 6 });

  return (
    <section aria-label={x.title} style={{ background: dm.reviewBg, borderRadius: 15, padding: 22, boxShadow: dm.shadow, marginBottom: 40, color: dm.text }}>
      <h2 style={{ color: dm.heading, margin: '0 0 14px', fontSize: '1.3rem' }}><i className="fas fa-video" /> {x.title}</h2>
      {!upcoming.length && !past.length && <p style={{ color: dm.subtext, margin: 0 }}>{x.none}</p>}
      {upcoming.map((s) => {
        const live = new Date(s.starts_at).getTime() <= now;
        const soon = !live && new Date(s.starts_at).getTime() - now <= 15 * 60000;
        return (
          <div key={s.id} style={{ border: '1px solid rgba(0,51,102,0.12)', borderTop: `3px solid ${live ? '#b3261e' : '#F0A500'}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <strong style={{ color: dm.heading, fontSize: '1.05rem' }}>{s.title}</strong>
            <div style={{ fontSize: 13, color: dm.subtext, marginTop: 4 }}>{when(s)} · {s.duration_min || 60} {x.min}</div>
            <div style={{ margin: '8px 0' }}>
              {live ? <span style={chip('#FDE7E7', '#b3261e')}>{x.liveNow}</span>
                : soon ? <span style={chip('#FFF2D6', '#8a5a00')}>{x.soon} · {eta(s)}</span>
                  : <span style={chip('#E6F0FB', '#003366')}>{x.startsIn} {eta(s)}</span>}
            </div>
            {s.description && <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7, margin: '8px 0' }}>{s.description}</p>}
            {s.zoom_link && (
              <a href={s.zoom_link} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 6, background: live || soon ? '#F0A500' : 'transparent', color: '#003366', border: live || soon ? 'none' : '1px solid #CBD7E8', borderRadius: 999, padding: '9px 22px', fontWeight: 800, textDecoration: 'none' }}>
                <i className="fas fa-video" /> {x.join}
              </a>
            )}
          </div>
        );
      })}
      {past.length > 0 && (
        <>
          <h3 style={{ color: dm.heading, margin: '18px 0 10px', fontSize: '1.05rem' }}>{x.past}</h3>
          {past.map((s) => (
            <div key={s.id} style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(0,51,102,0.10)' }}>
              <div><strong>{s.title}</strong><div style={{ fontSize: 13, color: dm.subtext }}>{when(s)}</div></div>
              {s.recording_url && (
                <a href={s.recording_url} target="_blank" rel="noopener noreferrer" style={{ color: dm.heading, fontWeight: 700 }}><i className="fas fa-play-circle" /> {x.recording}</a>
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
};

export default CourseSessions;
