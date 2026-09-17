import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import '../App.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { darkMode } = useLang();

  // =========================
  // STATE
  // =========================

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);

  const [pageVisible, setPageVisible] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // =========================
  // THEME
  // =========================

  const bg = darkMode ? '#0f0f0f' : '#f5f5f5';
  const card = darkMode ? '#1a1a2e' : 'white';
  const text = darkMode ? 'white' : '#003366';
  const text2 = darkMode ? '#a8c8f0' : '#888';
  const progressBg = darkMode ? '#2e2e4e' : '#f0f0f0';

  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate('/login');
        return;
      }

      if (!mounted) return;

      setUser(user);

      // =========================
      // LOAD PROFILE
      // =========================

      const { data: profileData, error: profileError } =
        await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      if (mounted) {
        setProfile(profileData || null);
      }

      // =========================
      // LOAD ENROLLMENTS
      // =========================
      // Get enrollments + related course
      // using the existing Foreign Key
      // =========================

      const {
        data: enrollmentData,
        error: enrollmentError,
      } = await supabase
        .from('enrollments')
        .select(`
          id,
          user_id,
          course_id,
          enrolled_at,
          progress,
          completed,
          courses (
            id,
            title,
            category,
            students,
            rating
          )
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', {
          ascending: false,
        });

      if (enrollmentError) {
        console.error(
          'Enrollment error:',
          enrollmentError
        );

        if (mounted) {
          setError(
            'Unable to load your enrolled courses.'
          );
        }
      } else {
        if (mounted) {
          setEnrollments(enrollmentData || []);
        }
      }

      // =========================
      // PAGE ANIMATIONS
      // =========================

      if (mounted) {
        setLoading(false);

        setTimeout(() => {
          if (mounted) {
            setPageVisible(true);
          }
        }, 100);

        setTimeout(() => {
          if (mounted) {
            setProgressVisible(true);
          }
        }, 700);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================
  // REAL STATISTICS
  // =========================

  const enrolledCoursesCount =
    enrollments.length;

  const completedCoursesCount =
    enrollments.filter(
      (enrollment) =>
        enrollment.completed === true ||
        Number(enrollment.progress) >= 100
    ).length;

  // =========================
  // PLACEHOLDER HOURS
  // =========================
  // We don't have learning-hours
  // data in Supabase yet.
  // =========================

  const hoursLearned = 0;

  // =========================
  // PLACEHOLDER CERTIFICATES
  // =========================
  // Certificates table is not created yet.
  // =========================

  const certificates = 0;

  // =========================
  // STATS
  // =========================

  const stats = [
    {
      icon: 'fas fa-book-open',
      label: 'Enrolled Courses',
      value: enrolledCoursesCount,
      color: '#003366',
    },
    {
      icon: 'fas fa-check-circle',
      label: 'Completed',
      value: completedCoursesCount,
      color: '#10b981',
    },
    {
      icon: 'fas fa-clock',
      label: 'Hours Learned',
      value: hoursLearned,
      color: '#f0a500',
    },
    {
      icon: 'fas fa-certificate',
      label: 'Certificates',
      value: certificates,
      color: '#6366f1',
    },
  ];

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: bg,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <i
            className="fas fa-spinner fa-spin"
            style={{
              fontSize: '3rem',
              color: '#f0a500',
              marginBottom: '15px',
            }}
          ></i>

          <p
            style={{
              color: text,
            }}
          >
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bg,
        padding: '40px 20px',
        opacity: pageVisible ? 1 : 0,
        transform: pageVisible
          ? 'translateY(0)'
          : 'translateY(20px)',
        transitionProperty:
          'opacity, transform, background',
        transitionDuration: '0.7s',
        transitionTimingFunction: 'ease',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >

        {/* =========================
            Welcome Section
        ========================= */}

        <div
          style={{
            background:
              'linear-gradient(135deg, #003366, #005599)',
            borderRadius: '12px',
            padding: '40px',
            color: 'white',
            marginBottom: '30px',
            animation:
              'dashboardWelcome 0.8s ease both',
            boxShadow:
              '0 10px 30px rgba(0,0,0,0.15)',
          }}
        >
          <h1
            style={{
              marginBottom: '10px',
            }}
          >
            <i className="fas fa-graduation-cap"></i>{' '}
            Welcome back,{' '}
            {profile?.username ||
              user?.email ||
              'Student'}!
          </h1>

          <p
            style={{
              color: '#a8c8f0',
            }}
          >
            Continue your learning journey at
            Zephyr Academy
          </p>
        </div>

        {/* =========================
            ERROR MESSAGE
        ========================= */}

        {error && (
          <div
            style={{
              background: darkMode
                ? '#2a1515'
                : '#fff1f2',
              color: '#ef4444',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '25px',
              textAlign: 'center',
            }}
          >
            <i className="fas fa-exclamation-circle"></i>{' '}
            {error}
          </div>
        )}

        {/* =========================
            REAL STATS
        ========================= */}

        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            marginBottom: '30px',
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                flex: '1',
                minWidth: '200px',
                background: card,
                borderRadius: '12px',
                padding: '25px',
                boxShadow:
                  '0 4px 15px rgba(0,0,0,0.08)',
                borderTop:
                  `4px solid ${stat.color}`,
                textAlign: 'center',
                animation:
                  'dashboardCardEnter 0.7s ease both',
                animationDelay:
                  `${0.15 + i * 0.12}s`,
                transition:
                  'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  'translateY(-8px)';

                e.currentTarget.style.boxShadow =
                  '0 12px 30px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  'translateY(0)';

                e.currentTarget.style.boxShadow =
                  '0 4px 15px rgba(0,0,0,0.08)';
              }}
            >
              <i
                className={stat.icon}
                style={{
                  fontSize: '2rem',
                  color: stat.color,
                  marginBottom: '10px',
                  display: 'block',
                }}
              ></i>

              <h2
                style={{
                  color: stat.color,
                  fontSize: '2rem',
                  margin: '0 0 5px',
                }}
              >
                {stat.value}
              </h2>

              <p
                style={{
                  color: text2,
                  fontSize: '0.9rem',
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* =========================
            MY COURSES
        ========================= */}

        <div
          style={{
            background: card,
            borderRadius: '12px',
            padding: '30px',
            boxShadow:
              '0 4px 15px rgba(0,0,0,0.08)',
            marginBottom: '30px',
            animation:
              'dashboardSectionEnter 0.8s 0.5s ease both',
          }}
        >
          <h2
            style={{
              color: text,
              marginBottom: '25px',
            }}
          >
            <i className="fas fa-book"></i>{' '}
            My Courses
          </h2>

          {/* NO COURSES */}

          {enrollments.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
              }}
            >
              <i
                className="fas fa-book-open"
                style={{
                  fontSize: '3rem',
                  color: text2,
                  marginBottom: '15px',
                }}
              ></i>

              <p
                style={{
                  color: text2,
                  marginBottom: '20px',
                }}
              >
                You haven't enrolled in any
                courses yet.
              </p>

              <button
                onClick={() =>
                  navigate('/courses')
                }
                style={{
                  padding: '12px 25px',
                  background: '#003366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                <i className="fas fa-search"></i>{' '}
                Browse Courses
              </button>
            </div>
          ) : (
            enrollments.map(
              (enrollment, i) => {
                const course =
                  enrollment.courses;

                const progress = Math.min(
                  100,
                  Math.max(
                    0,
                    Number(
                      enrollment.progress
                    ) || 0
                  )
                );

                const isCompleted =
                  enrollment.completed ===
                    true ||
                  progress >= 100;

                return (
                  <div
                    key={enrollment.id}
                    style={{
                      marginBottom:
                        i ===
                        enrollments.length - 1
                          ? '0'
                          : '25px',
                      animation:
                        'courseProgressEnter 0.6s ease both',
                      animationDelay:
                        `${0.7 + i * 0.15}s`,
                      cursor: course
                        ? 'pointer'
                        : 'default',
                    }}
                    onClick={() => {
                      if (course) {
                        navigate(
                          `/courses?course=${course.id}`
                        );
                      }
                    }}
                  >

                    {/* COURSE HEADER */}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        marginBottom:
                          '8px',
                        gap: '15px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: '600',
                          color: text,
                        }}
                      >
                        <i
                          className="fas fa-book-open"
                          style={{
                            color:
                              isCompleted
                                ? '#10b981'
                                : '#f0a500',
                            marginRight:
                              '8px',
                          }}
                        ></i>

                        {course?.title ||
                          'Course'}
                      </span>

                      <span
                        style={{
                          color:
                            isCompleted
                              ? '#10b981'
                              : text2,
                          fontWeight: '600',
                          whiteSpace:
                            'nowrap',
                        }}
                      >
                        {isCompleted
                          ? 'Completed'
                          : `${progress}%`}
                      </span>
                    </div>

                    {/* PROGRESS BAR */}

                    <div
                      style={{
                        background:
                          progressBg,
                        borderRadius:
                          '10px',
                        height: '10px',
                        overflow:
                          'hidden',
                      }}
                    >
                      <div
                        style={{
                          background:
                            isCompleted
                              ? '#10b981'
                              : '#003366',
                          width:
                            progressVisible
                              ? `${progress}%`
                              : '0%',
                          height: '10px',
                          borderRadius:
                            '10px',
                          transition:
                            'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                      ></div>
                    </div>

                    {/* COURSE CATEGORY */}

                    {course?.category && (
                      <p
                        style={{
                          color: text2,
                          fontSize:
                            '0.8rem',
                          marginTop:
                            '6px',
                        }}
                      >
                        {course.category}
                      </p>
                    )}
                  </div>
                );
              }
            )
          )}
        </div>

        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            animation:
              'dashboardSectionEnter 0.8s 0.8s ease both',
          }}
        >
          <button
            onClick={() =>
              navigate('/courses')
            }
            style={{
              flex: '1',
              padding: '20px',
              background: '#003366',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition:
                'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                'translateY(-5px)';

              e.currentTarget.style.boxShadow =
                '0 10px 25px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                'translateY(0)';

              e.currentTarget.style.boxShadow =
                'none';
            }}
          >
            <i className="fas fa-plus"></i>{' '}
            Browse Courses
          </button>

          <button
            onClick={() =>
              navigate('/profile')
            }
            style={{
              flex: '1',
              padding: '20px',
              background: '#f0a500',
              color: '#003366',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition:
                'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                'translateY(-5px)';

              e.currentTarget.style.boxShadow =
                '0 10px 25px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                'translateY(0)';

              e.currentTarget.style.boxShadow =
                'none';
            }}
          >
            <i className="fas fa-user"></i>{' '}
            Edit Profile
          </button>
        </div>
      </div>

      {/* =========================
          ANIMATIONS
      ========================= */}

      <style>
        {`
          @keyframes dashboardWelcome {
            from {
              opacity: 0;
              transform: translateY(-25px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes dashboardCardEnter {
            from {
              opacity: 0;
              transform: translateY(35px) scale(0.95);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes dashboardSectionEnter {
            from {
              opacity: 0;
              transform: translateY(30px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes courseProgressEnter {
            from {
              opacity: 0;
              transform: translateX(-25px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;
