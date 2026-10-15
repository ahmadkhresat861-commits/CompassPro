import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import DualOrbitLoader from '../components/DualOrbitLoader';
import AuthLayout from '../components/AuthLayout';
import { useLang } from '../LanguageContext';
import { isPwned, isStrongEnough } from '../utils/password';

const ResetPassword = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // The recovery link signs the user in temporarily; wait for that session.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
        setChecked(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const timer = setTimeout(() => setChecked(true), 2500);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async () => {
    if (password !== confirm) { setError(t.errMismatch); return; }
    if (!isStrongEnough(password)) { setError(t.errShort); return; }
    setLoading(true);
    setError('');
    if (await isPwned(password)) {
      setError(t.errPwned);
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate('/login'), 1800);
  };

  const field = (label, value, setValue, auto) => (
    <label className="cp-field">
      <span>{label}</span>
      <span className="cp-input">
        <i className="fas fa-lock" aria-hidden="true"></i>
        <input
          type={showPw ? 'text' : 'password'}
          autoComplete={auto}
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
  );

  return (
    <AuthLayout mode="login" hero={t.loginHero}>
      <div>
        <h2 className="cp-auth-title">{t.resetTitle}</h2>
        <p className="cp-auth-sub">{t.resetSub}</p>
      </div>

      {done ? (
        <div className="cp-auth-form">
          <div className="cp-auth-error" role="status" style={{ background: '#E3F5EC', color: '#0F7A4C' }}>
            {t.resetDone}
          </div>
        </div>
      ) : ready ? (
        <form
          className="cp-auth-form"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          noValidate
        >
          {error && <div className="cp-auth-error" role="alert">{error}</div>}
          {field(t.newPassword, password, setPassword, 'new-password')}
          {field(t.confirmPassword, confirm, setConfirm, 'new-password')}
          <button type="submit" className="cp-auth-submit" disabled={loading}>
            {loading ? <DualOrbitLoader size={18} /> : null} {loading ? t.updatingPassword : t.updatePassword}
          </button>
        </form>
      ) : checked ? (
        <div className="cp-auth-form">
          <div className="cp-auth-error" role="alert">{t.resetInvalid}</div>
          <p className="cp-auth-foot">
            <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}>{t.forgotPassword}</a>
          </p>
        </div>
      ) : (
        <div className="cp-auth-form" style={{ alignItems: 'center' }}>
          <DualOrbitLoader size={28} />
        </div>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
