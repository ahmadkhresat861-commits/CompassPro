import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import '../App.css';

const Services = () => {
  const navigate = useNavigate();
  const { darkMode } = useLang();

  const dm = {
    bg: darkMode ? '#0f1117' : '#f5f7fa',
    card: darkMode ? '#1e2130' : '#ffffff',
    heading: darkMode ? '#a0b4ff' : '#003366',
    text: darkMode ? '#c8d0e0' : '#555555',
    subtext: darkMode ? '#7a8499' : '#888888',
    shadow: darkMode
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 4px 15px rgba(0,0,0,0.08)',
  };

  const services = [
    {
      icon: 'fas fa-laptop-code',
      title: 'Self-Paced Online Courses',
      desc: 'Browse our full course catalog and learn at your own pace, with video lessons, downloadable materials, and progress tracking.',
      action: () => navigate('/courses'),
      actionLabel: 'Browse Courses',
    },
    {
      icon: 'fas fa-video',
      title: 'Live Training Sessions',
      desc: 'Join scheduled live sessions with instructors for real-time Q&A, deeper dives into course topics, and hands-on practice.',
      action: () => navigate('/sessions'),
      actionLabel: 'View Sessions',
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Progress Tracking & Dashboard',
      desc: 'Keep track of every course you enroll in, lessons completed, and your overall learning progress in one place.',
      action: () => navigate('/dashboard'),
      actionLabel: 'Go to Dashboard',
    },
    {
      icon: 'fas fa-robot',
      title: 'Zephyr AI Assistant',
      desc: 'Get instant help navigating the platform and understanding course content with our built-in AI assistant.',
    },
    {
      icon: 'fas fa-star',
      title: 'Course Reviews & Ratings',
      desc: 'Read honest reviews from other students before enrolling, and share your own experience after completing a course.',
    },
    {
      icon: 'fas fa-headset',
      title: '24/7 Support',
      desc: "Have a question or an issue? Our support team is always available — reach out anytime through our contact page.",
      action: () => navigate('/contact'),
      actionLabel: 'Contact Support',
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
            className="fas fa-concierge-bell"
            style={{ fontSize: '2.2rem', color: '#f0a500' }}
          />
        </div>

        <h1 style={{ color: dm.heading, marginBottom: '10px' }}>
          Our Services
        </h1>

        <p style={{ color: dm.text, maxWidth: '650px', margin: '0 auto' }}>
          Everything Zephyr Academy offers to help you learn, practice, and
          grow — all in one platform.
        </p>
      </div>

      {/* SERVICES GRID */}
      <div
        style={{
          maxWidth: '1100px',
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
              borderRadius: '16px',
              padding: '30px',
              boxShadow: dm.shadow,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <i
              className={service.icon}
              style={{
                fontSize: '2rem',
                color: '#f0a500',
                marginBottom: '15px',
              }}
            />

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
                  background: darkMode ? '#2a3580' : '#003366',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
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
