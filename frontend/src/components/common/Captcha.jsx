import React, { useEffect, useRef } from 'react';
import { CAPTCHA_SITE_KEY } from '../../utils/captcha';

// Cloudflare Turnstile widget. Active only when VITE_TURNSTILE_SITE_KEY is set;
// otherwise it renders nothing and the auth forms behave exactly as before.
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise;
const loadScript = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SRC;
      s.async = true;
      s.onload = () => resolve(window.turnstile);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
};

// Change `resetKey` after every submit: a token is single-use.
const Captcha = ({ onToken, resetKey = 0 }) => {
  const box = useRef(null);

  useEffect(() => {
    if (!CAPTCHA_SITE_KEY) return undefined;
    let widgetId;
    let cancelled = false;
    onToken('');
    loadScript()
      .then((ts) => {
        if (cancelled || !box.current) return;
        widgetId = ts.render(box.current, {
          sitekey: CAPTCHA_SITE_KEY,
          callback: (token) => onToken(token),
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        });
      })
      .catch(() => onToken(''));
    return () => {
      cancelled = true;
      if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!CAPTCHA_SITE_KEY) return null;
  return <div ref={box} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }} />;
};

export default Captcha;
