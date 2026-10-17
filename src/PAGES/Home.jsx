import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { useHomeSettings } from '../hooks/useHomeSettings';
import CourseCover from '../components/CourseCover';

const Home = ({ variant = 'home' }) => {
  const isLanding = variant === 'landing';
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const { t, isAr } = useLang();
  const { settings: hs } = useHomeSettings(isLanding ? 'landing' : 'none');
  const L = isAr ? 'ar' : 'en';
  const heroT1 = hs.hero[`title1_${L}`] || t.heroTitle1;
  const heroT2 = hs.hero[`title2_${L}`] || t.heroTitle2;
  const heroSub = hs.hero[`sub_${L}`] || t.heroSub;
  const ctaTitle = hs.cta[`title_${L}`] || t.mktTitle;
  const ctaSub = hs.cta[`sub_${L}`] || t.mktSub;

  useSEO({
    title: 'Online Courses & Learning Platform',
    description:
      "CompassPro is Jordan's premier online learning platform. Learn React, JavaScript, Python, HTML & CSS from expert instructors.",
    path: isLanding ? '/' : '/home',
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [totalCourses, setTotalCourses] = useState(null);
  const [totalInstructors, setTotalInstructors] = useState(null);
  const [totalEnrollments, setTotalEnrollments] = useState(null);
  const [avgRating, setAvgRating] = useState(null);
  const [allForHome, setAllForHome] = useState([]);
  const [myCourses, setMyCourses] = useState(null); // null = not loaded / guest
  const popularCourses = hs.popularIds
    .map((id) => allForHome.find((c) => String(c.id) === String(id)))
    .filter(Boolean);
  const availableCourses = allForHome.slice(0, hs.availableCount);
  const [searchText, setSearchText] = useState('');

  const goSearch = (q) => {
    const v = (q ?? searchText).trim();
    navigate(v ? `/courses?q=${encodeURIComponent(v)}` : '/courses');
  };
  const topics = ['React', 'JavaScript', 'Python', 'HTML & CSS'];

  useEffect(() => {
    setFadeIn(true);

    const loadData = async () => {
      try {
        // Available courses: newest first (count set from Admin > Home)
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title, category, image_url, price, rating')
          .order('created_at', { ascending: false })
          .limit(100);
        if (courses) setAllForHome(courses);

        const { data: allCourses } = await supabase
          .from('courses')
          .select('instructor');

        if (allCourses) {
          setTotalCourses(allCourses.length);
          const instructorSet = new Set(
            allCourses.map((c) => c.instructor?.trim()).filter(Boolean)
          );
          setTotalInstructors(instructorSet.size);
        }

        const { count: enrollCount } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true });

        if (typeof enrollCount === 'number') {
          setTotalEnrollments(enrollCount);
        }

        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating');

        if (reviews && reviews.length > 0) {
          const total = reviews.reduce(
            (sum, r) => sum + Number(r.rating || 0),
            0
          );
          setAvgRating((total / reviews.length).toFixed(1));
        }
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadData();
  }, []);

  const renderCourse = (course) => (
    <article
      key={course.id}
      className="cp-course-card"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <CourseCover src={course.image_url} category={course.category} alt={course.title} height={170} />
      <div className="cp-course-body">
        <h3>{course.title}</h3>
        <div className="cp-course-meta">
          <span>{course.rating ? `★ ${course.rating}` : ''}</span>
          <strong>{Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : t.free}</strong>
        </div>
      </div>
    </article>
  );

  // Members: show the courses they enrolled in, with progress
  useEffect(() => {
    if (isLanding) return undefined;
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, course_id, progress, completed, enrolled_at, courses (id, title, category, image_url)')
        .eq('user_id', session.user.id)
        .order('enrolled_at', { ascending: false });
      if (alive && !error) setMyCourses(data || []);
    })();
    return () => { alive = false; };
  }, [isLanding]);

  const stats = [
    totalCourses !== null
      ? { value: totalCourses, label: t.courses, icon: 'fas fa-book' }
      : null,
    totalInstructors !== null && totalInstructors > 0
      ? {
          value: totalInstructors,
          label: t.instructors,
          icon: 'fas fa-chalkboard-teacher',
        }
      : null,
    totalEnrollments !== null && totalEnrollments > 0
      ? { value: totalEnrollments, label: t.enrollments, icon: 'fas fa-users' }
      : null,
    avgRating !== null
      ? { value: `${avgRating} / 5`, label: t.avgRating, icon: 'fas fa-star' }
      : null,
  ].filter(Boolean);

  const features = [
    {
      icon: 'fas fa-laptop',
      title: t.learnOnline,
      desc: t.learnOnlineDesc,
    },
    {
      icon: 'fas fa-certificate',
      title: t.getCertified,
      desc: t.getCertifiedDesc,
    },
    {
      icon: 'fas fa-headset',
      title: t.support,
      desc: t.supportDesc,
    },
  ];

  return (
    <div className={`cp-home ${fadeIn ? 'home-visible' : ''}`}>

      {/* Hero */}
      <section className="cp-hero" aria-labelledby="cp-hero-title">
        <div className="cp-hero-inner">
          <img src="/logo.png" alt="CompassPro" className="cp-hero-logo" />
          <h1 id="cp-hero-title">
            {heroT1} <span>{heroT2}</span>
          </h1>
          <p>{heroSub}</p>

          <form
            className="cp-hero-search"
            role="search"
            onSubmit={(e) => { e.preventDefault(); goSearch(); }}
          >
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t.heroSearch}
              aria-label={t.heroSearch}
            />
            <button type="submit" className="cp-hero-cta" aria-label={t.heroSearchBtn}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
          </form>

          <div className="cp-hero-topics">
            {topics.map((topic) => (
              <button key={topic} type="button" onClick={() => goSearch(topic)}>
                {topic}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Members: my enrolled courses (click -> Courses page) */}
      {!isLanding && myCourses !== null && (
        <section className="cp-section cp-mycourses">
          <div className="cp-section-head">
            <h2>{t.myCourses}</h2>
            <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
              {t.dashboard}
            </a>
          </div>
          {myCourses.length === 0 ? (
            <div className="cp-empty">
              <p>{t.noEnrolled}</p>
              <button type="button" className="cp-mkt-btn primary" onClick={() => navigate('/courses')}>
                {t.browseCourses}
              </button>
            </div>
          ) : (
            <div className="cp-grid-3">
              {myCourses.map((en) => {
                const c = en.courses;
                if (!c) return null;
                const pct = en.completed ? 100 : Math.min(100, Number(en.progress) || 0);
                return (
                  <article key={en.id} className="cp-course-card" onClick={() => navigate('/courses')}>
                    <CourseCover src={c.image_url} category={c.category} alt={c.title} height={150} />
                    <div className="cp-course-body">
                      <h3>{c.title}</h3>
                      <div className="cp-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={c.title}>
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <div className="cp-course-meta">
                        <span>{en.completed ? t.completedLabel : `${pct}%`}</span>
                        <strong>{en.completed ? '✓' : t.continueLearning}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Stats (only real numbers) */}
      {hs.sections.stats && !statsLoading && stats.length > 0 && (
        <section className="cp-stats">
          {stats.map((stat, index) => (
            <div className="cp-stat" key={index}>
              <i className={stat.icon} aria-hidden="true"></i>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>
      )}

      {/* Most requested courses (chosen by admin) */}
      {isLanding && hs.sections.popular && popularCourses.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-head">
            <h2><span className="cp-badge-hot">{t.hot}</span> {t.popularCourses}</h2>
            <a href="/courses" onClick={(e) => { e.preventDefault(); navigate('/courses'); }}>
              {t.viewAllCourses}
            </a>
          </div>
          <div className="cp-grid-3">{popularCourses.map(renderCourse)}</div>
        </section>
      )}

      {/* Available courses */}
      {hs.sections.available && availableCourses.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-head">
            <h2>{isLanding ? t.availableCourses : t.featuredCourses}</h2>
            <a href="/courses" onClick={(e) => { e.preventDefault(); navigate('/courses'); }}>
              {t.viewAllCourses}
            </a>
          </div>
          <div className="cp-grid-3">{availableCourses.map(renderCourse)}</div>
        </section>
      )}

      {/* Why us */}
      {hs.sections.why && (
      <section className="cp-section">
        <div className="cp-section-head">
          <h2>{t.whyUs}</h2>
        </div>
        <div className="cp-grid-3">
          {features.map((item, index) => (
            <div className={`cp-feature cp-feature-${index + 1}`} key={index}>
              <span className="cp-feature-icon"><i className={item.icon} aria-hidden="true"></i></span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Marketing CTA */}
      {isLanding && hs.sections.cta && (
      <section className="cp-section">
        <div className="cp-mkt">
          <div className="cp-mkt-head">
            <h2>{ctaTitle}</h2>
            <p>{ctaSub}</p>
          </div>
          <div className="cp-mkt-steps">
            {[
              { n: 1, to: '/signup' },
              { n: 2, to: '/courses' },
              { n: 3, to: '/contact' },
            ].map((s) => (
              <div className="cp-mkt-step" key={s.n}>
                <span className="cp-mkt-num" aria-hidden="true">{s.n}</span>
                <h3>{t[`mkt${s.n}Title`]}</h3>
                <p>{t[`mkt${s.n}Desc`]}</p>
                <button
                  type="button"
                  className={s.n === 1 ? 'cp-mkt-btn primary' : 'cp-mkt-btn'}
                  onClick={() => navigate(s.to)}
                >
                  {t[`mkt${s.n}Btn`]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}
    </div>
  );
};

export default Home;
