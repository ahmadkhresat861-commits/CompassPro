import { Component } from 'react';

// Last line of defence: if a page throws while rendering, show a friendly message
// instead of a blank white screen. Language is read from <html lang>, which
// LanguageContext keeps in sync.
const TEXT = {
  en: {
    title: 'Something went wrong',
    body: 'An unexpected error happened. Reloading the page usually fixes it.',
    reload: 'Reload page',
    home: 'Go to home',
  },
  ar: {
    title: 'حدث خطأ ما',
    body: 'صار خطأ غير متوقع. إعادة تحميل الصفحة بتحل المشكلة غالباً.',
    reload: 'إعادة تحميل الصفحة',
    home: 'الصفحة الرئيسية',
  },
};

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // Hook for an error-monitoring service (e.g. Sentry) later on.
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    const t = TEXT[lang];
    const btn = {
      padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer',
      textDecoration: 'none', minHeight: 48, display: 'inline-flex', alignItems: 'center',
    };
    return (
      <main
        role="alert"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center',
          background: '#f1f6fc', color: '#0f2340', fontFamily: 'inherit',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 32, color: '#003366' }}>{t.title}</h1>
        <p style={{ margin: 0, maxWidth: 460, lineHeight: 1.7, color: '#44566f' }}>{t.body}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={() => window.location.reload()}
            style={{ ...btn, background: '#003366', color: '#fff', border: '2px solid #003366' }}>
            {t.reload}
          </button>
          <a href="/home" style={{ ...btn, background: 'transparent', color: '#003366', border: '2px solid #003366' }}>
            {t.home}
          </a>
        </div>
      </main>
    );
  }
}
