import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import { useSEO } from '../hooks/useSEO';
import CourseCover from '../components/CourseCover';
import '../App.css';

const Home = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const { t } = useLang();

  useSEO({
    title: 'Online Courses & Learning Platform',
    description:
      "CompassPro is Jordan's premier online learning platform. Learn React, JavaScript, Python, HTML & CSS from expert instructors.",
    path: '/home',
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [totalCourses, setTotalCourses] = useState(null);
  const [totalInstructors, setTotalInstructors] = useState(null);
  const [totalEnrollments, setTotalEnrollments] = useState(null);
  const [avgRating, setAvgRating] = useState(null);
  const [featuredCourses, setFeaturedCourses] = useState([]);
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
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title, category, image_url, price, rating')
          .order('created_at', { ascending: false })
          .limit(3);

        if (courses) {
          setFeaturedCourses(courses);
        }

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
      <section className="cp-hero">
        <img src="/logo.png" alt="CompassPro" className="cp-hero-logo" />
        <h1>{t.welcome}</h1>
        <p>{t.tagline}</p>

        <form
          className="cp-hero-search"
          role="search"
          onSubmit={(e) => { e.preventDefault(); goSearch(); }}
        >
          <i className="fas fa-search" aria-hidden="true"></i>
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t.searchCourses}
            aria-label={t.searchCourses}
          />
          <button type="submit" className="cp-hero-cta">{t.startLearning}</button>
        </form>

        <div className="cp-hero-topics">
          {topics.map((topic) => (
            <button key={topic} type="button" onClick={() => goSearch(topic)}>
              {topic}
            </button>
          ))}
        </div>
      </section>

      {/* Stats (only real numbers) */}
      {!statsLoading && stats.length > 0 && (
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

      {/* Popular / featured courses */}
      {featuredCourses.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-head">
            <h2>{t.featuredCourses}</h2>
            <a
              href="/courses"
              onClick={(e) => { e.preventDefault(); navigate('/courses'); }}
            >
              {t.viewAllCourses}
            </a>
          </div>

          <div className="cp-grid-3">
            {featuredCourses.map((course) => (
              <article
                key={course.id}
                className="cp-course-card"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <CourseCover
                  src={course.image_url}
                  category={course.category}
                  alt={course.title}
                  height={170}
                />
                <div className="cp-course-body">
                  <h3>{course.title}</h3>
                  <div className="cp-course-meta">
                    <span>{course.rating ? `★ ${course.rating}` : ''}</span>
                    <strong>
                      {Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : t.free}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Why us */}
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
    </div>
  );
};

export default Home;
