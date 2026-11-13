import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';

const Footer = () => {
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <footer className="cp-footer" style={{ background: '#003366', color: 'white', padding: '48px 40px 28px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Top */}
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', marginBottom: '40px' }}>
          
          {/* Logo */}
          <div style={{ flex: '2', minWidth: '200px' }}>
            <h2 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <img src="/logo-72.webp" width="36" height="36" alt="CompassPro" style={{ height: '36px', width: 'auto', marginInlineEnd: '10px' }} />
              CompassPro
            </h2>
            <p style={{ color: '#a8c8f0', lineHeight: '1.8' }}>
              {t.footerTagline}
            </p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              {[
                { icon: 'fab fa-facebook', color: '#1877F2', url: 'https://www.facebook.com/share/1Dn2UCTUfP/', label: 'Facebook' },
                { icon: 'fab fa-instagram', color: '#E1306C', url: 'https://www.instagram.com/compasspro.academy', label: 'Instagram' },
      { icon: 'fab fa-linkedin', color: '#0A66C2', url: 'https://www.linkedin.com/company/compasspro-learning/', label: 'LinkedIn' },
              ].map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, textDecoration: 'none', fontSize: '1.1rem', transition: 'all 0.3s' }}
                  onMouseOver={e => e.currentTarget.style.background = s.color}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  <i className={s.icon}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ flex: '1', minWidth: '150px' }}>
            <h3 style={{ color: '#f0a500', marginBottom: '15px' }}>{t.quickLinks}</h3>
            {[
              { label: t.home, path: '/home' },
              { label: t.courses, path: '/courses' },
              { label: t.about, path: '/about' },
              { label: t.services, path: '/services' },
              { label: t.contact, path: '/contact' },
            ].map((link, i) => (
              <p key={i} style={{ marginBottom: '10px' }}>
                <a href={link.path} onClick={(e) => { e.preventDefault(); navigate(link.path); }} style={{ color: '#a8c8f0', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.3s' }}
                  onMouseOver={e => e.currentTarget.style.color = '#f0a500'}
                  onMouseOut={e => e.currentTarget.style.color = '#a8c8f0'}>
                  <i className="fas fa-chevron-right" style={{ marginInlineEnd: '8px', fontSize: '0.8rem' }}></i>
                  {link.label}
                </a>
              </p>
            ))}
          </div>

          {/* Contact */}
          <div style={{ flex: '1', minWidth: '150px' }}>
            <h3 style={{ color: '#f0a500', marginBottom: '15px' }}>{t.contactUsTitle}</h3>
            {[
              { icon: 'fas fa-envelope', text: 'support@compasspro.com' },
              { icon: 'fas fa-phone', text: '+962 7 9999 9999' },
              { icon: 'fas fa-map-marker-alt', text: t.addressLine },
            ].map((item, i) => (
              <p key={i} style={{ color: '#a8c8f0', marginBottom: '10px' }}>
                <i className={item.icon} style={{ color: '#f0a500', marginInlineEnd: '8px' }}></i>
                <bdi>{item.text}</bdi>
              </p>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '10px' }}>
            {[{ label: t.privacyPolicy, path: '/privacy' }, { label: t.termsOfUse, path: '/terms' }].map((l, i) => (
              <a key={i} href={l.path} onClick={e => { e.preventDefault(); navigate(l.path); }} style={{ color: '#a8c8f0', textDecoration: 'none', margin: '0 12px', fontSize: '0.9rem' }}>{l.label}</a>
            ))}
          </p>
          <p style={{ color: '#a8c8f0', fontSize: '0.9rem' }}>
            © 2026 CompassPro. {t.footerRights} <i className="fas fa-heart" style={{ color: '#f0a500' }} aria-hidden="true"></i> {t.footerMadeIn}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
