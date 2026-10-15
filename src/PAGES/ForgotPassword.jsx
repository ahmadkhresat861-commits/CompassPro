import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import DualOrbitLoader from '../components/DualOrbitLoader';
import AuthLayout from '../components/AuthLayout';
import { useLang } from '../LanguageContext';

const ForgotPassword = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { setError(t.errEnterEmail); return; }
    setLoading(true);
    setError('');
    // Always show the same message so the form never reveals which emails have accounts.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <AuthLayout mode="login" hero={t.loginHero}>
      <div>
        <h2 className="cp-auth-title">{t.forgotTitle}</h2>
        <p className="cp-auth-sub">{t.forgotSub}</p>
      </div>

      {sent ? (
        <div className="cp-auth-form">
          <div className="cp-auth-error" role="status" style={{ background: '#E3F5EC', color: '#0F7A4C' }}>
            {t.resetSent}
          </div>
        </div>
      ) : (
        <form
          className="cp-auth-form"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          noValidate
        >
          {error && <div className="cp-auth-error" role="alert">{error}</div>}

          <label className="cp-field">
            <span>{t.email}</span>
            <span className="cp-input">
              <i className="fas fa-envelope" aria-hidden="true"></i>
              <input
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </span>
          </label>

          <button type="submit" className="cp-auth-submit" disabled={loading}>
            {loading ? <DualOrbitLoader size={18} /> : null} {loading ? t.sendingLink : t.sendResetLink}
          </button>
        </form>
      )}

      <p className="cp-auth-foot">
        <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>{t.backToLogin}</a>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
