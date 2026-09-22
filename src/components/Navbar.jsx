import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import Avatar from './Avatar';
import '../App.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { t, toggleLang, lang, darkMode, toggleDark } = useLang();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const notifRef = useRef(null);

  // ── تتبع حالة تسجيل الدخول ──────────────────────────────────────
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser || null);
      setAuthLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ── جلب بيانات البروفايل (الصورة والاسم) ────────────────────────
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (data) setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/home');
  };

  // ── جلب الإشعارات (للمسجلين دخول فقط) ──────────────────────────
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setNotifications([]);
      setUnread(0);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // جلب جميع الإشعارات العامة
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        if (data) {
          setNotifications(data);

          // احسب عدد غير المقروءة بناءً على وقت آخر قراءة
          const lastRead = localStorage.getItem('notif_last_read');

          const unreadCount = lastRead
            ? data.filter(
                (n) =>
                  new Date(n.created_at) > new Date(lastRead)
              ).length
            : data.length;

          setUnread(unreadCount);
        }
      } catch (err) {
        setError('تعذّر تحميل الإشعارات');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, authLoading]);

  // ── Realtime Notifications (للمسجلين دخول فقط) ──────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log(
            'New notification received:',
            payload.new
          );

          // إضافة الإشعار الجديد مباشرة في أعلى القائمة
          setNotifications((current) => [
            payload.new,
            ...current,
          ]);

          // زيادة عدد الإشعارات غير المقروءة
          setUnread((current) => current + 1);
        }
      )
      .subscribe((status) => {
        console.log(
          'Notifications Realtime status:',
          status
        );
      });

    // تنظيف الاتصال عند مغادرة الصفحة
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  useEffect(() => {
    if (!showNotif) return;

    const handleClickOutside = (e) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target)
      ) {
        setShowNotif(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
  }, [showNotif]);

  // ── فتح / إغلاق قائمة الإشعارات ────────────────────────────────
  const handleNotif = () => {
    const next = !showNotif;

    setShowNotif(next);

    if (next) {
      // عند فتح القائمة: تصفير العداد
      setUnread(0);

      localStorage.setItem(
        'notif_last_read',
        new Date().toISOString()
      );
    }
  };

  // ── تعليم الكل كمقروء ───────────────────────────────────────────
  const markAllRead = (e) => {
    e.stopPropagation();

    setUnread(0);

    localStorage.setItem(
      'notif_last_read',
      new Date().toISOString()
    );
  };

  // ── تنسيق التاريخ ────────────────────────────────────────────────
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(
      lang === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );

  // ── الواجهة ──────────────────────────────────────────────────────
  return (
    <nav style={{ position: 'relative' }}>

      {/* اللوجو */}
      <h2
        onClick={() => navigate('/home')}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <img
          src="/logo.png"
          alt="CompassPro"
          style={{
            height: '58px',
            width: 'auto',
          }}
        />
      </h2>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          flexWrap: 'wrap',
        }}
      >

        <Link to="/home">
          <i className="fas fa-home"></i>{' '}
          {t.home}
        </Link>

        <Link to="/courses">
          <i className="fas fa-book"></i>{' '}
          {t.courses}
        </Link>

        <Link to="/about">
          <i className="fas fa-info-circle"></i>{' '}
          {t.about}
        </Link>

        <Link to="/services">
          <i className="fas fa-concierge-bell"></i>{' '}
          {t.services}
        </Link>

        {user && (
          <Link to="/dashboard">
            <i className="fas fa-chart-bar"></i>{' '}
            {t.dashboard}
          </Link>
        )}

        <Link to="/sessions">
          <i className="fas fa-video"></i>{' '}
          {t.sessions}
        </Link>

        <Link to="/contact">
          <i className="fas fa-headset"></i>{' '}
          {t.contact}
        </Link>

        {user && (
          <Link
            to="/profile"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Avatar
              src={profile?.avatar_url}
              name={profile?.username}
              email={user.email}
              size={26}
            />
            {t.profile}
          </Link>
        )}

        {!authLoading && !user && (
          <>
            <Link to="/login">
              <i className="fas fa-sign-in-alt"></i>{' '}
              {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Link>

            <button
              onClick={() => navigate('/signup')}
              style={{
                background: '#f0a500',
                border: 'none',
                color: '#003366',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
              }}
            >
              <i className="fas fa-user-plus"></i>{' '}
              {lang === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
            </button>
          </>
        )}

        {!authLoading && user && (
          <a
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          >
            <i className="fas fa-sign-out-alt"></i>{' '}
            {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </a>
        )}

        {/* زر الوضع الليلي */}
        <button
          onClick={toggleDark}
          style={{
            background:
              'rgba(255,255,255,0.15)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.85rem',
            marginLeft: '5px',
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* زر اللغة */}
        <button
          onClick={toggleLang}
          style={{
            background:
              'rgba(255,255,255,0.15)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.85rem',
            marginLeft: '5px',
          }}
        >
          {lang === 'en'
            ? '🌐 العربية'
            : '🌐 English'}
        </button>

        {/* جرس الإشعارات (للمسجلين دخول فقط) */}
        {user && (
        <div
          ref={notifRef}
          style={{
            position: 'relative',
            marginLeft: '5px',
          }}
        >

          {/* أيقونة الجرس */}
          <div
            onClick={handleNotif}
            style={{
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background:
                'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <i
              className="fas fa-bell"
              style={{
                fontSize: '1.1rem',
                color: 'white',
              }}
            ></i>

            {unread > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#ff4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                }}
              >
                {unread}
              </span>
            )}
          </div>

          {/* قائمة الإشعارات */}
          {showNotif && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                background: darkMode
                  ? '#1e1e2e'
                  : 'white',
                borderRadius: '12px',
                boxShadow:
                  '0 10px 40px rgba(0,0,0,0.2)',
                width: '320px',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >

              {/* رأس القائمة */}
              <div
                style={{
                  padding: '15px 20px',
                  background: '#003366',
                  color: 'white',
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1rem',
                  }}
                >
                  <i className="fas fa-bell"></i>{' '}
                  {lang === 'ar'
                    ? 'الإشعارات'
                    : 'Notifications'}
                </h3>

                {unread > 0 && (
                  <span
                    onClick={markAllRead}
                    style={{
                      fontSize: '0.8rem',
                      color: '#f0a500',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    {lang === 'ar'
                      ? 'تعليم الكل كمقروء ✓'
                      : 'Mark all read ✓'}
                  </span>
                )}
              </div>

              {/* حالة التحميل */}
              {loading && (
                <div
                  style={{
                    padding: '30px',
                    textAlign: 'center',
                    color: '#888',
                  }}
                >
                  <i
                    className="fas fa-spinner fa-spin"
                    style={{
                      fontSize: '1.5rem',
                      marginBottom: '10px',
                      display: 'block',
                    }}
                  ></i>

                  {lang === 'ar'
                    ? 'جاري التحميل...'
                    : 'Loading...'}
                </div>
              )}

              {/* حالة الخطأ */}
              {!loading && error && (
                <div
                  style={{
                    padding: '30px',
                    textAlign: 'center',
                    color: '#ff4444',
                  }}
                >
                  <i
                    className="fas fa-exclamation-circle"
                    style={{
                      fontSize: '1.5rem',
                      marginBottom: '10px',
                      display: 'block',
                    }}
                  ></i>

                  {error}
                </div>
              )}

              {/* لا توجد إشعارات */}
              {!loading &&
                !error &&
                notifications.length === 0 && (
                  <div
                    style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#888',
                    }}
                  >
                    <i
                      className="fas fa-bell-slash"
                      style={{
                        fontSize: '2rem',
                        marginBottom: '10px',
                        display: 'block',
                      }}
                    ></i>

                    {lang === 'ar'
                      ? 'لا توجد إشعارات'
                      : 'No notifications yet'}
                  </div>
                )}

              {/* قائمة الإشعارات */}
              {!loading &&
                !error &&
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '15px 20px',
                      borderBottom: `1px solid ${
                        darkMode
                          ? '#2e2e3e'
                          : '#f0f0f0'
                      }`,
                      cursor: 'pointer',
                      transition:
                        'background 0.15s',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background =
                        darkMode
                          ? '#2a2a3a'
                          : '#f9f9f9')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background =
                        'transparent')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems:
                          'flex-start',
                      }}
                    >

                      <div
                        style={{
                          width: '35px',
                          height: '35px',
                          borderRadius: '50%',
                          background: '#003366',
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          flexShrink: 0,
                        }}
                      >
                        <i
                          className="fas fa-bell"
                          style={{
                            color: '#f0a500',
                            fontSize:
                              '0.9rem',
                          }}
                        ></i>
                      </div>

                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            color: darkMode
                              ? '#eee'
                              : '#333',
                            fontWeight: '600',
                          }}
                        >
                          {notif.title}
                        </p>

                        <p
                          style={{
                            margin:
                              '4px 0 0',
                            fontSize:
                              '0.85rem',
                            color: darkMode
                              ? '#aaa'
                              : '#555',
                          }}
                        >
                          {notif.message}
                        </p>

                        <p
                          style={{
                            margin:
                              '4px 0 0',
                            fontSize:
                              '0.75rem',
                            color: '#888',
                          }}
                        >
                          {formatDate(
                            notif.created_at
                          )}
                        </p>
                      </div>

                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
