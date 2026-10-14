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
      "Learn about CompassPro's mission to make quality, practical education accessible to every learner in Jordan and beyond.",
    path: '/about',
  });

  const dm = {
    bg: darkMode ? '#0f0f0f' : '#F3F7FC',
    card: darkMode ? '#1a1a2e' : '#ffffff',
    cardBorder: darkMode ? '#2e3250' : '#f0f0f0',
    heading: darkMode ? '#ffffff' : '#003366',
    text: darkMode ? '#a8c8f0' : '#4A5D78',
    subtext: darkMode ? '#7a8499' : '#4A5D78',
    shadow: darkMode
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 4px 20px rgba(0,51,102,0.08)',
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
      <div style={{ maxWidth: '1344px', margin: '0 auto 36px', padding: '0 8px' }}>
        <h1 style={{ color: dm.heading, fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, marginBottom: '10px' }}>
          {t.aboutTitle}
        </h1>

        <p style={{ color: dm.text, maxWidth: '760px', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
          {t.aboutIntro}
        </p>
      </div>

      {/* MISSION / VISION / VALUES */}
      <div
        style={{
          maxWidth: '1344px',
          margin: '0 auto 40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '25px',
        }}
      >
        {values.map((item, i) => (
          <div
            key={i}
            style={{
              background: darkMode ? dm.card : ['#E6F0FB', '#FFF3D6', '#E3F5EC'][i % 3],
              borderRadius: '20px',
              padding: '28px',
              boxShadow: darkMode ? dm.shadow : 'none',
            }}
          >
            <span
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: ['#003366', '#F0A500', '#0F7A4C'][i % 3],
                color: i % 3 === 1 ? '#002347' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                marginBottom: '16px',
              }}
            >
              <i className={item.icon} />
            </span>
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
            maxWidth: '1344px',
            margin: '0 auto',
            background: dm.card,
            borderRadius: '24px',
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
