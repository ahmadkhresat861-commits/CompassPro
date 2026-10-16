import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import DualOrbitLoader from '../components/DualOrbitLoader';
import AuthLayout from '../components/AuthLayout';
import { useLang } from '../LanguageContext';
import { isPwned, isStrongEnough } from '../utils/password';

const SignUp = () => {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (password !== confirm) { setError(t.errMismatch); return; }
    if (!isStrongEnough(password)) {
      setError(t.errShort); return;
    }
    setLoading(true);
    setError('');
    if (await isPwned(password)) {
      setError(t.errPwned);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else if (data.user) {
      navigate('/home');
    }
    setLoading(false);
  };

  const pwField = (label, value, setValue, placeholder, auto) => (
    <label className="cp-field">
      <span>{label}</span>
      <span className="cp-input">
        <i className="fas fa-lock" aria-hidden="true"></i>
        <input
          type={showPw ? 'text' : 'password'}
          autoComplete={auto}
          placeholder={placeholder}
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
    <div>
      <AuthLayout mode="signup" hero={t.signupHero}>
        <div>
          <h2 className="cp-auth-title">{t.createAccount}</h2>
          <p className="cp-auth-sub">{t.createSub}</p>
        </div>

        <form
          className="cp-auth-form"
          onSubmit={(e) => { e.preventDefault(); handleSignUp(); }}
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

          {pwField(t.password, password, setPassword, t.enterPassword, 'new-password')}
          {pwField(t.confirmPassword, confirm, setConfirm, t.confirmYourPassword, 'new-password')}

          <button type="submit" className="cp-auth-submit" disabled={loading}>
            {loading ? <DualOrbitLoader size={18} /> : null} {loading ? t.creatingAccount : t.signUp}
          </button>
          <p className="cp-auth-foot" style={{ margin: 0, fontSize: '0.8rem' }}>
            {t.agreePre}{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">{t.termsLink}</a>{' '}
            {t.agreeAnd}{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">{t.privacyLink}</a>
          </p>
        </form>

        <p className="cp-auth-foot">
          {t.haveAccount}{' '}
          <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>{t.login}</a>
        </p>
      </AuthLayout>
    </div>
  );
};

export default SignUp;
