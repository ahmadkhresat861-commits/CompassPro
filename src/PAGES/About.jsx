import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import { useSEO } from '../hooks/useSEO';
import '../App.css';

const About = () => {
  const { darkMode, t } = useLang();

  useSEO({
    title: 'About Us',
    description:
      "Learn about Zephyr Academy's mission to make quality, practical education accessible to every learner in Jordan and beyond.",
    path: '/about',
  });

  const dm = {
    bg: darkMode ? '#0f1117' : '#f5f7fa',
    card: darkMode ? '#1e2130' : '#ffffff',
    cardBorder: darkMode ? '#2e3250' : '#f0f0f0',
    heading: darkMode ? '#a0b4ff' : '#003366',
    text: darkMode ? '#c8d0e0' : '#555555',
    subtext: darkMode ? '#7a8499' : '#888888',
    shadow: darkMode
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 4px 15px rgba(0,0,0,0.08)',
  };

  // ============================================================
  // REAL STATS — fetched live, never hardcoded
  // ============================================================
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalCourses, setTotalCourses] = useState(null);
  const [totalInstructors, setTotalInstructors] = useState(null);
  const [totalEnrollments, setTotalEnrollments] = useState(null);
  const [avgRating, setAvgRating] = useState(null);
  const [totalReviews, setTotalReviews] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Courses + instructors
        const { data: courses } = await supabase
          .from('courses')
          .select('instructor');

        if (courses) {
          setTotalCourses(courses.length);

          const instructorSet = new Set(
            courses
              .map((c) => c.instructor?.trim())
              .filter((name) => !!name)
          );
          setTotalInstructors(instructorSet.size);
        }

        // Enrollments (students)
        const { count: enrollCount } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true });

        if (typeof enrollCount === 'number') {
          setTotalEnrollments(enrollCount);
        }

        // Reviews / rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating');

        if (reviews && reviews.length > 0) {
          const total = reviews.reduce(
            (sum, r) => sum + Number(r.rating || 0),
            0
          );
          setAvgRating((total / reviews.length).toFixed(1));
          setTotalReviews(reviews.length);
        }
      } catch (error) {
        console.error('Error loading About stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  // Only show a stat card when we actually have real data for it
  const stats = [
    totalEnrollments !== null && totalEnrollments > 0
      ? {
          value: totalEnrollments,
          label: t.enrollments,
          icon: 'fas fa-users',
        }
      : null,
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
    avgRating !== null
      ? {
          value: `${avgRating} / 5`,
          label: `${t.basedOn} ${totalReviews} ${t.reviewsWord}`,
          icon: 'fas fa-star',
        }
      : null,
  ].filter(Boolean);

  const values = [
    {
      icon: 'fas fa-bullseye',
      title: t.ourMission,
      desc: t.ourMissionDesc,
    },
    {
      icon: 'fas fa-eye',
      title: t.ourVision,
      desc: t.ourVisionDesc,
    },
    {
      icon: 'fas fa-heart',
      title: t.ourValues,
      desc: t.ourValuesDesc,
    },
  ];

  return (
    <section
      style={{
        background: dm.bg,
        minHeight: '100vh',
        padding: '50px 20px 70px',
        animation: 'fadeInPage 0.6s ease both',
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #003366, #005599)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0,51,102,0.25)',
          }}
        >
          <i
            className="fas fa-graduation-cap"
            style={{ fontSize: '2.2rem', color: '#f0a500' }}
          />
        </div>

        <h1 style={{ color: dm.heading, marginBottom: '10px' }}>
          {t.aboutTitle}
        </h1>

        <p style={{ color: dm.text, maxWidth: '650px', margin: '0 auto' }}>
          {t.aboutIntro}
        </p>
      </div>

      {/* MISSION / VISION / VALUES */}
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto 50px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '25px',
        }}
      >
        {values.map((item, i) => (
          <div
            key={i}
            style={{
              background: dm.card,
              borderRadius: '16px',
              padding: '30px',
              boxShadow: dm.shadow,
              borderTop: '4px solid #f0a500',
            }}
          >
            <i
              className={item.icon}
              style={{
                fontSize: '2rem',
                color: '#f0a500',
                marginBottom: '15px',
                display: 'block',
              }}
            />
            <h3 style={{ color: dm.heading, marginBottom: '10px' }}>
              {item.title}
            </h3>
            <p style={{ color: dm.text, lineHeight: '1.7', margin: 0 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* STATS — only rendered once real numbers are loaded */}
      {!statsLoading && stats.length > 0 && (
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            background: dm.card,
            borderRadius: '16px',
            padding: '35px',
            boxShadow: dm.shadow,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '25px',
            textAlign: 'center',
          }}
        >
          {stats.map((stat, i) => (
            <div key={i}>
              <i
                className={stat.icon}
                style={{
                  fontSize: '1.8rem',
                  color: dm.heading,
                  marginBottom: '10px',
                  display: 'block',
                }}
              />
              <h2 style={{ color: dm.heading, margin: '0 0 5px' }}>
                {stat.value}
              </h2>
              <p style={{ color: dm.subtext, margin: 0, fontSize: '0.9rem' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <style>
        {`
          @keyframes fadeInPage {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </section>
  );
};

export default About;
