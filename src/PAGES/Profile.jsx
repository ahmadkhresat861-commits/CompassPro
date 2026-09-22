import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import Avatar from '../components/Avatar';
import '../App.css';

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    bio: '',
    phone: '',
    country: '',
    avatar_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pageVisible, setPageVisible] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { darkMode } = useLang();

  // ===========================
  // Dark / Light Mode
  // ===========================

  const bg = darkMode ? '#0f0f0f' : '#f5f5f5';
  const card = darkMode ? '#1a1a2e' : 'white';
  const text = darkMode ? 'white' : '#003366';
  const text2 = darkMode ? '#a8c8f0' : '#888';
  const border = darkMode ? '#2e2e4e' : '#ddd';
  const inputBg = darkMode ? '#0f0f0f' : 'white';
  const inputText = darkMode ? 'white' : '#1a1a1a';

  // ===========================
  // Page Animation
  // ===========================

  useEffect(() => {
    setTimeout(() => {
      setPageVisible(true);
    }, 100);
  }, []);

  // ===========================
  // Get User & Profile
  // ===========================

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      setUser(user);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    };

    getUser();
  }, [navigate]);

  // ===========================
  // Save Profile
  // ===========================

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        user_id: user.id,
        ...profile,
      });

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Profile saved successfully! ✅');
    }

    setLoading(false);
  };

  // ===========================
  // Avatar Upload
  // ===========================

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Error: Please select an image file.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setMessage('Error: Image must be smaller than 3MB.');
      return;
    }

    setAvatarUploading(true);
    setMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // cache-bust so the new image shows immediately even with the same filename
      const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          user_id: user.id,
          avatar_url: avatarUrl,
        });

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
      setMessage('Profile photo updated successfully! ✅');
    } catch (error) {
      console.error('Avatar upload error:', error);
      setMessage('Error: Could not upload photo.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    if (!user || !profile.avatar_url) return;

    setAvatarUploading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          user_id: user.id,
          avatar_url: null,
        });

      if (error) throw error;

      setProfile((prev) => ({ ...prev, avatar_url: null }));
      setMessage('Profile photo removed.');
    } catch (error) {
      console.error('Avatar remove error:', error);
      setMessage('Error: Could not remove photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // ===========================
  // Logout
  // ===========================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // ===========================
  // Profile Fields
  // ===========================

  const fields = [
    {
      label: 'Username',
      key: 'username',
      icon: 'fas fa-user',
    },
    {
      label: 'Full Name',
      key: 'full_name',
      icon: 'fas fa-id-card',
    },
    {
      label: 'Bio',
      key: 'bio',
      icon: 'fas fa-pen',
    },
    {
      label: 'Phone',
      key: 'phone',
      icon: 'fas fa-phone',
    },
    {
      label: 'Country',
      key: 'country',
      icon: 'fas fa-globe',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bg,
        padding: '40px 20px',
        transition: 'background 0.4s ease',
        opacity: pageVisible ? 1 : 0,
        transform: pageVisible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: card,
          borderRadius: '18px',
          padding: '40px',
          boxShadow: darkMode
            ? '0 15px 40px rgba(0,0,0,0.45)'
            : '0 15px 40px rgba(0,0,0,0.10)',
          transition:
            'background 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease',
          animation: 'profileCardEnter 0.8s ease both',
        }}
      >

        {/* ===========================
            Profile Header
        =========================== */}

        <div
          style={{
            textAlign: 'center',
            marginBottom: '35px',
            animation: 'profileHeaderEnter 0.8s ease both',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '110px',
              margin: '0 auto 15px',
            }}
          >
            <Avatar
              src={profile.avatar_url}
              name={profile.username}
              email={user?.email}
              size={110}
              onClick={() => fileInputRef.current?.click()}
            />

            {avatarUploading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i
                  className="fas fa-spinner fa-spin"
                  style={{ color: 'white', fontSize: '1.5rem' }}
                ></i>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Change photo"
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#f0a500',
                color: '#003366',
                border: '2px solid white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="fas fa-camera" style={{ fontSize: '0.8rem' }}></i>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              style={{ display: 'none' }}
            />
          </div>

          {profile.avatar_url && (
            <button
              onClick={handleAvatarRemove}
              disabled={avatarUploading}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginBottom: '10px',
              }}
            >
              <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
              Remove Photo
            </button>
          )}

          <h2
            style={{
              color: text,
              marginTop: '10px',
              marginBottom: '8px',
            }}
          >
            My Profile
          </h2>

          <p
            style={{
              color: text2,
              fontSize: '0.95rem',
            }}
          >
            {user?.email}
          </p>
        </div>

        {/* ===========================
            Success / Error Message
        =========================== */}

        {message && (
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '25px',
              textAlign: 'center',
              background: message.includes('Error')
                ? darkMode
                  ? '#3a1717'
                  : '#fff0f0'
                : darkMode
                ? '#12351f'
                : '#f0fff4',
              color: message.includes('Error')
                ? '#ff5555'
                : '#10b981',
              animation: 'profileMessageEnter 0.5s ease both',
            }}
          >
            <i
              className={
                message.includes('Error')
                  ? 'fas fa-exclamation-circle'
                  : 'fas fa-check-circle'
              }
              style={{ marginRight: '8px' }}
            ></i>

            {message}
          </div>
        )}

        {/* ===========================
            Profile Fields
        =========================== */}

        {fields.map((field, index) => (
          <div
            key={field.key}
            style={{
              marginBottom: '20px',
              animation: `profileFieldEnter 0.6s ease ${
                0.1 + index * 0.08
              }s both`,
            }}
          >
            <label
              style={{
                color: text,
                fontWeight: '600',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              <i
                className={field.icon}
                style={{
                  color: '#f0a500',
                  marginRight: '7px',
                }}
              ></i>

              {field.label}
            </label>

            <input
              type="text"
              value={profile[field.key] || ''}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  [field.key]: e.target.value,
                })
              }
              style={{
                width: '100%',
                padding: '13px 15px',
                borderRadius: '10px',
                border: `1px solid ${border}`,
                fontSize: '1rem',
                background: inputBg,
                color: inputText,
                outline: 'none',
                transition:
                  'border 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#f0a500';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px rgba(240,165,0,0.15)';
                e.currentTarget.style.transform =
                  'translateY(-2px)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = border;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform =
                  'translateY(0)';
              }}
            />
          </div>
        ))}

        {/* ===========================
            Save Button
        =========================== */}

        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#555' : '#003366',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '12px',
            fontSize: '1rem',
            transition:
              'transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
            animation:
              'profileButtonEnter 0.7s 0.6s ease both',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform =
                'translateY(-3px)';
              e.currentTarget.style.boxShadow =
                '0 10px 25px rgba(0,51,102,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform =
              'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform =
              'translateY(-3px)';
          }}
        >
          <i
            className={
              loading
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-save'
            }
            style={{ marginRight: '8px' }}
          ></i>

          {loading ? 'Saving...' : 'Save Profile'}
        </button>

        {/* ===========================
            Logout Button
        =========================== */}

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '14px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '1rem',
            transition:
              'transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
            animation:
              'profileButtonEnter 0.7s 0.7s ease both',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e03333';
            e.currentTarget.style.transform =
              'translateY(-3px)';
            e.currentTarget.style.boxShadow =
              '0 10px 25px rgba(255,68,68,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ff4444';
            e.currentTarget.style.transform =
              'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform =
              'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform =
              'translateY(-3px)';
          }}
        >
          <i
            className="fas fa-sign-out-alt"
            style={{ marginRight: '8px' }}
          ></i>

          Logout
        </button>
      </div>

      {/* ===========================
          Profile Animations
      =========================== */}

      <style>
        {`
          @keyframes profileCardEnter {
            0% {
              opacity: 0;
              transform: translateY(40px) scale(0.97);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes profileHeaderEnter {
            0% {
              opacity: 0;
              transform: translateY(-25px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes profileFieldEnter {
            0% {
              opacity: 0;
              transform: translateX(-25px);
            }

            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes profileButtonEnter {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes profileMessageEnter {
            0% {
              opacity: 0;
              transform: translateY(-10px) scale(0.98);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (max-width: 480px) {
            .profile-card {
              padding: 25px !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Profile;
