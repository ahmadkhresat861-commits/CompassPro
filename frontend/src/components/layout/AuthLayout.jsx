import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import CourseCover from '../course/CourseCover';

/**
 * Shared shell for Login / SignUp (Direction B+).
 * Left: light brand panel with course covers. Right: form card.
 * Direction + language come from LanguageContext (EN / AR with RTL).
 */
const AuthLayout = ({ mode, hero, children }) => {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLang();
  const bullets = [t.learnOnlineDesc, t.getCertifiedDesc, t.supportDesc];

  return (
    <div className="cp-auth">
      <section className="cp-auth-panel">
        <a
          className="cp-auth-back"
          href="/home"
          onClick={(e) => { e.preventDefault(); navigate('/home'); }}
        >
          <i className="fas fa-arrow-left" aria-hidden="true"></i> {t.backHome}
        </a>

        <div>
          <h1>{hero}</h1>
          <div className="cp-auth-tag">{t.loginTagline.toUpperCase()}</div>
        </div>

        <div className="cp-auth-collage" aria-hidden="true">
          <CourseCover category="React" height={150} showBadge={false} style={{ borderRadius: 20 }} />
          <CourseCover category="JavaScript" height={150} showBadge={false} style={{ borderRadius: 20 }} />
          <CourseCover category="Python" height={150} showBadge={false} style={{ borderRadius: 20 }} />
        </div>

        <ul className="cp-auth-bullets">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      </section>

      <section className="cp-auth-main">
        <div className="cp-auth-top">
          <button type="button" className="cp-auth-lang" onClick={toggleLang}>
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        <div className="cp-auth-card">
          <div className="cp-auth-brand">
            <img src="/logo.png" alt="CompassPro" />
            <span>CompassPro</span>
          </div>

          <div className="cp-auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'on' : ''}
              onClick={() => navigate('/login')}
            >
              {t.login}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'on' : ''}
              onClick={() => navigate('/signup')}
            >
              {t.signUp}
            </button>
          </div>

          {children}
        </div>
      </section>
    </div>
  );
};

export default AuthLayout;
