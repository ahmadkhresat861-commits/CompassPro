import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="cp-footer" style={{ background: '#003366', color: 'white', padding: '48px 40px 28px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Top */}
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', marginBottom: '40px' }}>
          
          {/* Logo */}
          <div style={{ flex: '2', minWidth: '200px' }}>
            <h2 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="CompassPro" style={{ height: '36px', width: 'auto', marginRight: '10px' }} />
              CompassPro
            </h2>
            <p style={{ color: '#a8c8f0', lineHeight: '1.8' }}>
              Jordan's premier online learning platform. Learn from expert instructors and grow your career.
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
            <h3 style={{ color: '#f0a500', marginBottom: '15px' }}>Quick Links</h3>
            {[
              { label: 'Home', path: '/home' },
              { label: 'Courses', path: '/courses' },
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Contact', path: '/contact' },
            ].map((link, i) => (
              <p key={i} style={{ marginBottom: '10px' }}>
                <a onClick={() => navigate(link.path)} style={{ color: '#a8c8f0', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.3s' }}
                  onMouseOver={e => e.currentTarget.style.color = '#f0a500'}
                  onMouseOut={e => e.currentTarget.style.color = '#a8c8f0'}>
                  <i className="fas fa-chevron-right" style={{ marginRight: '8px', fontSize: '0.8rem' }}></i>
                  {link.label}
                </a>
              </p>
            ))}
          </div>

          {/* Contact */}
          <div style={{ flex: '1', minWidth: '150px' }}>
            <h3 style={{ color: '#f0a500', marginBottom: '15px' }}>Contact Us</h3>
            {[
              { icon: 'fas fa-envelope', text: 'support@compasspro.com' },
              { icon: 'fas fa-phone', text: '+962 7 9999 9999' },
              { icon: 'fas fa-map-marker-alt', text: 'Amman, Jordan' },
            ].map((item, i) => (
              <p key={i} style={{ color: '#a8c8f0', marginBottom: '10px' }}>
                <i className={item.icon} style={{ color: '#f0a500', marginRight: '8px' }}></i>
                {item.text}
              </p>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '10px' }}>
            {[{ label: 'Privacy Policy', path: '/privacy' }, { label: 'Terms of Use', path: '/terms' }].map((l, i) => (
              <a key={i} href={l.path} onClick={e => { e.preventDefault(); navigate(l.path); }} style={{ color: '#a8c8f0', textDecoration: 'none', margin: '0 12px', fontSize: '0.9rem' }}>{l.label}</a>
            ))}
          </p>
          <p style={{ color: '#a8c8f0', fontSize: '0.9rem' }}>
            © 2026 CompassPro. All rights reserved. Made with <i className="fas fa-heart" style={{ color: '#f0a500' }}></i> in Jordan
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
