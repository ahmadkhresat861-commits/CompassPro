import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useSEO } from '../hooks/useSEO';

const Services = () => {
  const navigate = useNavigate();
  const { darkMode, t } = useLang();

  useSEO({
    title: 'Our Services',
    description:
      'Explore what CompassPro offers: self-paced online courses, live training sessions, progress tracking, and dedicated support.',
    path: '/services',
  });

  const dm = {
    bg: darkMode ? '#0f0f0f' : '#F3F7FC',
    card: darkMode ? '#1a1a2e' : '#ffffff',
    heading: darkMode ? '#ffffff' : '#003366',
    text: darkMode ? '#a8c8f0' : '#4A5D78',
    subtext: darkMode ? '#7a8499' : '#4A5D78',
    shadow: darkMode
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 4px 20px rgba(0,51,102,0.08)',
  };

  const services = [
    {
      icon: 'fas fa-laptop-code',
      title: t.serviceCoursesTitle,
      desc: t.serviceCoursesDesc,
      action: () => navigate('/courses'),
      actionLabel: t.browseCourses,
    },
    {
      icon: 'fas fa-video',
      title: t.serviceSessionsTitle,
      desc: t.serviceSessionsDesc,
      action: () => navigate('/sessions'),
      actionLabel: t.viewSessions,
    },
    {
      icon: 'fas fa-chart-line',
      title: t.serviceDashboardTitle,
      desc: t.serviceDashboardDesc,
      action: () => navigate('/dashboard'),
      actionLabel: t.goToDashboard,
    },
    {
      icon: 'fas fa-robot',
      title: t.serviceAiTitle,
      desc: t.serviceAiDesc,
    },
    {
      icon: 'fas fa-star',
      title: t.serviceReviewsTitle,
      desc: t.serviceReviewsDesc,
    },
    {
      icon: 'fas fa-headset',
      title: t.serviceSupportTitle,
      desc: t.serviceSupportDesc,
      action: () => navigate('/contact'),
      actionLabel: t.contactSupportBtn,
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
          {t.servicesTitle}
        </h1>

        <p style={{ color: dm.text, maxWidth: '760px', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
          {t.servicesIntro}
        </p>
      </div>

      {/* SERVICES GRID */}
      <div
        style={{
          maxWidth: '1344px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px',
        }}
      >
        {services.map((service, i) => (
          <div
            key={i}
            style={{
              background: dm.card,
              borderRadius: '24px',
              padding: '28px',
              boxShadow: dm.shadow,
              display: 'flex',
              flexDirection: 'column',
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
              <i className={service.icon} />
            </span>

            <h3 style={{ color: dm.heading, marginBottom: '10px' }}>
              {service.title}
            </h3>

            <p
              style={{
                color: dm.text,
                lineHeight: '1.7',
                marginBottom: '20px',
                flex: 1,
              }}
            >
              {service.desc}
            </p>

            {service.action && (
              <button
                onClick={service.action}
                style={{
                  alignSelf: 'flex-start',
                  background: '#003366',
                  color: '#ffffff',
                  border: 'none',
                  padding: '11px 22px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                }}
              >
                {service.actionLabel}{' '}
                <i className="fas fa-arrow-right" />
              </button>
            )}
          </div>
        ))}
      </div>

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

export default Services;
