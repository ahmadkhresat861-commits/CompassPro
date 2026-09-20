import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import { useSEO } from '../hooks/useSEO';
import '../App.css';

const Home = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const { darkMode, t } = useLang();

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
    <div className={`home-page ${fadeIn ? 'home-visible' : ''}`}>

      {/* ===========================
          Hero Section
      =========================== */}

      <section className="home-hero">
        <div className="home-hero-bg-shape home-hero-bg-shape-1"></div>
        <div className="home-hero-bg-shape home-hero-bg-shape-2"></div>

        <div className="home-hero-content">

          <div className="home-hero-icon">
            <img
              src="/logo.png"
              alt="CompassPro"
              className="hero-logo-animated"
              style={{
                width: '110px',
                height: '110px',
                marginBottom: '20px',
                display: 'inline-block',
              }}
            />
          </div>

          <h1>{t.welcome}</h1>

          <p>{t.tagline}</p>

          <div className="home-hero-actions">
            <button
              className="home-start-button"
              onClick={() => navigate('/courses')}
            >
              <i className="fas fa-rocket"></i>
              {t.startLearning}
            </button>

            <button
              className="home-secondary-button"
              onClick={() => navigate('/about')}
            >
              <i className="fas fa-info-circle"></i>
              {t.learnMore}
            </button>
          </div>

          {!statsLoading && (totalCourses !== null || avgRating !== null) && (
            <div className="home-hero-badges">
              {totalCourses !== null && (
                <span className="home-hero-badge">
                  <i className="fas fa-book"></i> {totalCourses} {t.courses}
                </span>
              )}
              {avgRating !== null && (
                <span className="home-hero-badge">
                  <i className="fas fa-star"></i> {avgRating} / 5 {t.avgRating}
                </span>
              )}
            </div>
          )}

        </div>
      </section>

      {/* ===========================
          Stats Section
      =========================== */}

      {!statsLoading && stats.length > 0 && (
      <section
        className="home-stats"
        style={{
          background: darkMode ? '#1a1a2e' : 'white',
        }}
      >
        <div className="home-stats-container">

          {stats.map((stat, index) => (
            <div
              className="home-stat-card"
              key={index}
            >
              <i className={`${stat.icon} home-stat-icon`}></i>

              <h2>{stat.value}</h2>

              <p
                style={{
                  color: darkMode ? '#a8c8f0' : '#555',
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}

        </div>
      </section>
      )}

      {/* ===========================
          Featured Courses Section
      =========================== */}

      {featuredCourses.length > 0 && (
        <section
          style={{
            padding: '60px 20px',
            background: darkMode ? '#0f1117' : '#f5f7fa',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              color: darkMode ? 'white' : '#003366',
              marginBottom: '40px',
            }}
          >
            {t.featuredCourses}
          </h2>

          <div
            style={{
              display: 'flex',
              gap: '25px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            {featuredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate('/courses')}
                style={{
                  width: '300px',
                  background: darkMode ? '#1e2130' : 'white',
                  borderRadius: '14px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={course.title}
                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div
                    style={{
                      height: '150px',
                      background: 'linear-gradient(135deg, #003366, #005599)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className="fas fa-book-open" style={{ fontSize: '2.5rem', color: '#f0a500' }}></i>
                  </div>
                )}

                <div style={{ padding: '20px' }}>
                  {course.category && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: darkMode ? '#a0b4ff' : '#003366',
                        background: darkMode ? '#2a3050' : '#f0f0f0',
                        padding: '4px 10px',
                        borderRadius: '12px',
                      }}
                    >
                      {course.category}
                    </span>
                  )}
                  <h3 style={{ color: darkMode ? 'white' : '#003366', margin: '10px 0 5px' }}>
                    {course.title}
                  </h3>
                  <p style={{ color: darkMode ? '#a8c8f0' : '#888', fontSize: '0.9rem', margin: 0 }}>
                    {Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : t.free}
                    {course.rating ? ` · ⭐ ${course.rating}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="home-start-button"
            onClick={() => navigate('/courses')}
            style={{ marginTop: '40px' }}
          >
            {t.viewAllCourses} <i className="fas fa-arrow-right"></i>
          </button>
        </section>
      )}

      {/* ===========================
          Why Us Section
      =========================== */}

      <section
        className="home-why-us"
        style={{
          background: darkMode ? '#0f0f0f' : '#f5f5f5',
        }}
      >

        <h2
          style={{
            color: darkMode ? 'white' : '#003366',
            marginBottom: '50px',
          }}
        >
          {t.whyUs}
        </h2>

        <div className="home-features-container">

          {features.map((item, index) => (
            <div
              className="home-feature-card"
              key={index}
              style={{
                background: darkMode ? '#1a1a2e' : 'white',
                padding: '40px 30px',
                borderRadius: '12px',
                width: '250px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                borderTop: '4px solid #f0a500',
                animationDelay: `${0.1 + index * 0.15}s`,
              }}
            >

              <i
                className={`${item.icon} home-feature-icon`}
                style={{
                  fontSize: '2.5rem',
                  color: '#f0a500',
                  marginBottom: '15px',
                  display: 'block',
                }}
              ></i>

              <h3
                style={{
                  color: darkMode ? 'white' : '#003366',
                  marginBottom: '10px',
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  color: darkMode ? '#a8c8f0' : '#555',
                  fontSize: '0.9rem',
                }}
              >
                {item.desc}
              </p>

            </div>
          ))}

        </div>

      </section>

    </div>
  );
};

export default Home;
