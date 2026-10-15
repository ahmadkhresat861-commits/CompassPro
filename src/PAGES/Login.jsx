import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import DualOrbitLoader from '../components/DualOrbitLoader';
import AuthLayout from '../components/AuthLayout';
import { useLang } from '../LanguageContext';

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

const Login = () => {
  const { t } = useLang();
  const [showPw, setShowPw] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      setFadeIn(true);
    }, 100);
  }, []);

  const handleLogin = async () => {
    const lockout = localStorage.getItem('lockout_until');

    if (lockout && Date.now() < parseInt(lockout)) {
      const mins = Math.ceil(
        (parseInt(lockout) - Date.now()) / 60000
      );

      setError(t.errLockedMins.replace('{n}', mins));

      return;
    }

    if (!email || !password) {
      setError(t.errEnterCreds);
      return;
    }

    setLoading(true);
    setError('');

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      const attempts =
        parseInt(
          localStorage.getItem('login_attempts') || '0'
        ) + 1;

      localStorage.setItem(
        'login_attempts',
        attempts
      );

      if (attempts >= MAX_ATTEMPTS) {
        localStorage.setItem(
          'lockout_until',
          Date.now() + LOCKOUT_TIME
        );

        localStorage.removeItem(
          'login_attempts'
        );

        setError(t.errLockedNow);
      } else {
        setError(
          t.errInvalid.replace('{n}', MAX_ATTEMPTS - attempts)
        );
      }
    } else {
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('lockout_until');

      navigate('/home');
    }

    setLoading(false);
  };

  return (
    <div style={{ opacity: fadeIn ? 1 : 0, transition: 'opacity 0.5s ease' }}>
      <AuthLayout mode="login" hero={t.loginHero}>
        <div>
          <h2 className="cp-auth-title">{t.welcomeBack}</h2>
          <p className="cp-auth-sub">{t.loginSub}</p>
        </div>

        <form
          className="cp-auth-form"
          onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
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

          <label className="cp-field">
            <span>{t.password}</span>
            <span className="cp-input">
              <i className="fas fa-lock" aria-hidden="true"></i>
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t.enterPassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="cp-eye"
                aria-label={showPw ? t.hidePassword : t.showPassword}
                onClick={() => setShowPw((v) => !v)}
              >
                <i className={showPw ? 'fas fa-eye-slash' : 'fas fa-eye'} aria-hidden="true"></i>
              </button>
            </span>
          </label>

          <p className="cp-auth-foot" style={{ margin: '-4px 0 0', textAlign: 'end' }}>
            <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}>{t.forgotPassword}</a>
          </p>

          <button type="submit" className="cp-auth-submit" disabled={loading}>
            {loading ? <DualOrbitLoader size={18} /> : null} {loading ? t.loggingIn : t.login}
          </button>
        </form>

        <p className="cp-auth-foot">
          {t.noAccount}{' '}
          <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>{t.signUp}</a>
        </p>
      </AuthLayout>
    </div>
  );
};

export default Login;
