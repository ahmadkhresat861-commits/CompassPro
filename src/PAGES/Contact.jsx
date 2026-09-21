import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import { useSEO } from '../hooks/useSEO';
import '../App.css';

// ============================================================
// CONTACT
// ============================================================

const Contact = () => {
  const { darkMode, t } = useLang();

  useSEO({
    title: 'Contact & Support',
    description:
      "Get in touch with CompassPro. We're here to help with any questions about our courses or platform.",
    path: '/contact',
  });

  // ============================================================
  // COLORS (same system as Courses.jsx / other pages)
  // ============================================================

  const dm = {
    bg: darkMode ? '#0f1117' : '#f5f7fa',
    card: darkMode ? '#1e2130' : '#ffffff',
    cardBorder: darkMode ? '#2e3250' : '#f0f0f0',
    heading: darkMode ? '#a0b4ff' : '#003366',
    text: darkMode ? '#c8d0e0' : '#555555',
    subtext: darkMode ? '#7a8499' : '#888888',
    input: darkMode ? '#1e2130' : '#ffffff',
    inputBorder: darkMode ? '#3a4060' : '#dddddd',
    inputColor: darkMode ? '#e0e6f0' : '#333333',
    shadow: darkMode
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 4px 15px rgba(0,0,0,0.08)',
    successBg: darkMode ? '#0d2318' : '#f0fff4',
    btnBack: darkMode ? '#2a3580' : '#003366',
  };

  // ============================================================
  // FORM STATE
  // ============================================================

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // ============================================================
  // SUBMIT
  // ============================================================

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus('error:fields');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setStatus('error:email');
      return;
    }

    setSending(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from('messages').insert({
        user_id: user?.id || null,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      if (error) {
        console.error('Error sending message:', error);
        setStatus('error:server');
        return;
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Unexpected contact error:', error);
      setStatus('error:server');
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // CONTACT INFO + SOCIAL (matches Footer.jsx)
  // ============================================================

  const contactInfo = [
    { icon: 'fas fa-envelope', text: 'support@zephyracademy.com' },
    { icon: 'fas fa-phone', text: '+962 7 9999 9999' },
    { icon: 'fas fa-map-marker-alt', text: 'Amman, Jordan' },
  ];

  const socialLinks = [
    { icon: 'fab fa-facebook', color: '#1877F2' },
    { icon: 'fab fa-instagram', color: '#E1306C' },
    { icon: 'fab fa-twitter', color: '#1DA1F2' },
    { icon: 'fab fa-linkedin', color: '#0077b5' },
    { icon: 'fab fa-whatsapp', color: '#25D366' },
  ];

  // ============================================================
  // RENDER
  // ============================================================

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
      <div style={{ textAlign: 'center', marginBottom: '45px' }}>
        <div
          style={{
            marginBottom: '20px',
            animation: 'logoFloat 3s ease-in-out infinite',
          }}
        >
          <img
            src="/logo.png"
            alt="CompassPro"
            style={{
              width: '90px',
              height: 'auto',
              filter: 'drop-shadow(0 0 15px rgba(240,165,0,0.4))',
            }}
          />
        </div>

        <h1 style={{ color: dm.heading, marginBottom: '8px' }}>
          {t?.contactSupport || 'Contact & Support'}
        </h1>

        <p style={{ color: dm.text }}>
          {t?.contactDesc || "We're here to help you 24/7"}
        </p>
      </div>

      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
          gap: '30px',
          alignItems: 'start',
        }}
        className="contact-grid"
      >
        {/* ================================================== */}
        {/* FORM */}
        {/* ================================================== */}

        <div
          style={{
            background: dm.card,
            borderRadius: '16px',
            padding: '35px',
            boxShadow: dm.shadow,
          }}
        >
          {!submitted ? (
            <>
              <h2 style={{ color: dm.heading, marginTop: 0 }}>
                <i className="fas fa-paper-plane" style={{ marginRight: '8px' }} />
                {t?.sendMessage || 'Send us a Message'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '18px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: dm.text,
                      fontWeight: '600',
                      fontSize: '0.9rem',
                    }}
                  >
                    {t?.yourName || 'Your Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t?.yourName || 'Your Name'}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${dm.inputBorder}`,
                      fontSize: '1rem',
                      background: dm.input,
                      color: dm.inputColor,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: dm.text,
                      fontWeight: '600',
                      fontSize: '0.9rem',
                    }}
                  >
                    {t?.yourEmail || 'Your Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t?.yourEmail || 'Your Email'}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${dm.inputBorder}`,
                      fontSize: '1rem',
                      background: dm.input,
                      color: dm.inputColor,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: dm.text,
                      fontWeight: '600',
                      fontSize: '0.9rem',
                    }}
                  >
                    {t?.message || 'Message'}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t?.message || 'Message'}
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${dm.inputBorder}`,
                      fontSize: '1rem',
                      background: dm.input,
                      color: dm.inputColor,
                      boxSizing: 'border-box',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {status === 'error:fields' && (
                  <p style={{ color: '#e11d48', marginBottom: '15px' }}>
                    Please fill in all fields.
                  </p>
                )}

                {status === 'error:email' && (
                  <p style={{ color: '#e11d48', marginBottom: '15px' }}>
                    Please enter a valid email address.
                  </p>
                )}

                {status === 'error:server' && (
                  <p style={{ color: '#e11d48', marginBottom: '15px' }}>
                    Something went wrong. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: sending
                      ? '#888888'
                      : 'linear-gradient(90deg, #003366, #005599)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  <i
                    className={
                      sending ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'
                    }
                    style={{ marginRight: '8px' }}
                  />
                  {sending ? 'Sending...' : t?.send || 'Send Message'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <i
                className="fas fa-check-circle"
                style={{
                  fontSize: '3rem',
                  color: '#10b981',
                  marginBottom: '15px',
                }}
              />
              <h3 style={{ color: dm.heading }}>
                Your message has been sent! 🎉
              </h3>
              <p style={{ color: dm.text, marginTop: '8px' }}>
                We'll get back to you as soon as possible.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  background: dm.btnBack,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Send another message
              </button>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* CONTACT INFO + SOCIAL */}
        {/* ================================================== */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              background: dm.card,
              borderRadius: '16px',
              padding: '30px',
              boxShadow: dm.shadow,
            }}
          >
            <h3 style={{ color: dm.heading, marginTop: 0, marginBottom: '18px' }}>
              Get in Touch
            </h3>

            {contactInfo.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: darkMode ? '#252c52' : '#eef4ff',
                    color: dm.heading,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i className={item.icon} />
                </span>
                <span style={{ color: dm.text }}>{item.text}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: dm.card,
              borderRadius: '16px',
              padding: '30px',
              boxShadow: dm.shadow,
            }}
          >
            <h3 style={{ color: dm.heading, marginTop: 0, marginBottom: '18px' }}>
              {t?.followUs || 'Follow Us'}
            </h3>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: darkMode ? '#252c52' : '#f0f4ff',
                    color: s.color,
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <i className={s.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeInPage {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes logoFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(2deg); }
          }

          @media (max-width: 768px) {
            .contact-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </section>
  );
};

export default Contact;
