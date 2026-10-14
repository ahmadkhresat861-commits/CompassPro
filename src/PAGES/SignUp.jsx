import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import DualOrbitLoader from '../components/DualOrbitLoader';
import AuthLayout from '../components/AuthLayout';
import { useLang } from '../LanguageContext';

// Checks a password against HaveIBeenPwned using k-anonymity:
// only the first 5 chars of the SHA-1 hash leave the browser.
// Fails open (returns false) if the service is unreachable.
async function isPwned(password) {
  try {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hex.slice(0, 5);
    const suffix = hex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return false;
    const text = await res.text();
    return text.split('\n').some((line) => {
      const [h, count] = line.trim().split(':');
      return h === suffix && parseInt(count, 10) > 0;
    });
  } catch {
    return false;
  }
}

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
    if (password.length < 8 || !/[A-Za-z\u0600-\u06FF]/.test(password) || !/\d/.test(password)) {
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
