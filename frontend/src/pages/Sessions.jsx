import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useLang } from '../context/LanguageContext';

const Sessions = () => {
  const { darkMode } = useLang();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageVisible, setPageVisible] = useState(false);

  const dm = {
    pageBg: darkMode ? '#0f0f0f' : '#F3F7FC',
    card: darkMode ? '#1a1a2e' : 'white',
    shadow: darkMode
      ? '0 10px 35px rgba(0,0,0,0.35)'
      : '0 4px 20px rgba(0,51,102,0.08)',
    border: darkMode ? '#ffffff' : '#003366',
    heading: darkMode ? '#ffffff' : '#003366',
    text: darkMode ? '#a8c8f0' : '#4A5D78',
    subtext: darkMode ? '#7a8499' : '#4A5D78',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*');

      if (!error && data) {
        setSessions(data);
      }

      setLoading(false);
    };

    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: dm.pageBg,
          color: dm.heading,
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            color: '#f0a500',
            animation: 'pulse 1.5s infinite',
          }}
        >
          <i className="fas fa-video"></i>
        </div>

        <p
          style={{
            marginTop: '20px',
            color: dm.subtext,
            fontWeight: '600',
          }}
        >
          Loading Live Sessions...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: dm.pageBg,
        opacity: pageVisible ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}
    >

      {/* Hero */}
      <div
        style={{
          background: '#003366',
          margin: '100px 32px 0',
          borderRadius: '24px',
          padding: '48px 40px',
          textAlign: 'left',
          color: 'white',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            animation: 'slideUp 0.8s ease both',
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              color: '#f0a500',
              marginBottom: '10px',
            }}
          >
            <i className="fas fa-video"></i>
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              marginBottom: '10px',
            }}
          >
            Live Sessions
          </h1>

          <p
            style={{
              color: '#a8c8f0',
              fontSize: '1.1rem',
            }}
          >
            Join our live Zoom sessions with expert instructors
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '20px',
              padding: '8px 18px',
              borderRadius: '30px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.8rem',
              fontWeight: '700',
              letterSpacing: '1px',
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'pulse 1.5s infinite',
              }}
            ></span>

            LIVE LEARNING
          </div>
        </div>
      </div>

      {/* Sessions Content */}
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '60px 20px',
        }}
      >

        {/* Counter */}
        {sessions.length > 0 && (
          <div
            style={{
              textAlign: 'center',
              marginBottom: '30px',
              color: dm.subtext,
              animation: 'fadeIn 0.8s ease both',
            }}
          >
            <i
              className="fas fa-calendar-check"
              style={{
                color: '#f0a500',
                marginRight: '8px',
              }}
            ></i>

            {sessions.length} Upcoming Session
            {sessions.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 30px',
              background: dm.card,
              borderRadius: '24px',
              boxShadow: dm.shadow,
              animation: 'slideUp 0.8s ease both',
            }}
          >
            <i
              className="fas fa-calendar-times"
              style={{
                fontSize: '4rem',
                color: dm.heading,
                marginBottom: '20px',
                display: 'block',
                animation: 'float 3s ease-in-out infinite',
              }}
            ></i>

            <h2
              style={{
                color: dm.heading,
                marginBottom: '10px',
              }}
            >
              No Sessions Yet
            </h2>

            <p style={{ color: dm.subtext }}>
              Check back soon for upcoming live sessions!
            </p>
          </div>
        ) : (

          /* Sessions List */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {sessions.map((session, index) => (
              <div
                key={session.id}
                style={{
                  background: dm.card,
                  borderRadius: '24px',
                  padding: '25px',
                  boxShadow: dm.shadow,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '20px',
                  border: `1px solid ${darkMode ? '#2e3250' : '#CBD7E8'}`,
                  animation: 'sessionCardEnter 0.7s ease both',
                  animationDelay: `${index * 0.15}s`,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow =
                    darkMode
                      ? '0 15px 40px rgba(0,0,0,0.5)'
                      : '0 15px 35px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = dm.shadow;
                }}
              >

                {/* Session Info */}
                <div>
                  <h3
                    style={{
                      color: dm.heading,
                      marginBottom: '12px',
                      fontSize: '1.3rem',
                    }}
                  >
                    <i
                      className="fas fa-video"
                      style={{
                        color: '#f0a500',
                        marginRight: '8px',
                      }}
                    ></i>

                    {session.title}
                  </h3>

                  <p
                    style={{
                      color: dm.text,
                      marginBottom: '7px',
                    }}
                  >
                    <i
                      className="fas fa-book"
                      style={{
                        marginRight: '8px',
                        color: dm.heading,
                      }}
                    ></i>

                    {session.course}
                  </p>

                  <p
                    style={{
                      color: dm.text,
                      marginBottom: '7px',
                    }}
                  >
                    <i
                      className="fas fa-chalkboard-teacher"
                      style={{
                        marginRight: '8px',
                        color: dm.heading,
                      }}
                    ></i>

                    {session.instructor}
                  </p>

                  <p style={{ color: dm.text }}>
                    <i
                      className="fas fa-calendar"
                      style={{
                        marginRight: '8px',
                        color: '#f0a500',
                      }}
                    ></i>

                    {session.data || session.date} — {session.time}
                  </p>
                </div>

                {/* Zoom Button */}
                <a
                  href={String(session.zoom_link || '').replace(/^[:\s]+/, '')}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '13px 25px',
                    background: '#2D8CFF',
                    color: 'white',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition:
                      'transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      'translateY(-3px) scale(1.03)';
                    e.currentTarget.style.boxShadow =
                      '0 8px 20px rgba(45,140,255,0.4)';
                    e.currentTarget.style.background = '#1677e8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = '#2D8CFF';
                  }}
                >
                  <i className="fas fa-video"></i>
                  Join Zoom
                  <i className="fas fa-arrow-right"></i>
                </a>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Animation Styles */}
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.15);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes sessionCardEnter {
            from {
              opacity: 0;
              transform: translateX(-40px) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0) translateY(0);
            }
          }

          @media (max-width: 600px) {
            .session-card-wow {
              flex-direction: column;
              align-items: stretch;
            }
          }
        `}
      </style>

    </div>
  );
};

export default Sessions;
