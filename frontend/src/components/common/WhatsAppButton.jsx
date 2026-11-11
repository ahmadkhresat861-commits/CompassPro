import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import { WHATSAPP_NUMBER } from '../../utils/whatsapp';

// Floating WhatsApp button, shown only on the marketing pages.
const MARKETING_PATHS = ['/home', '/about', '/services', '/contact'];

const WhatsAppButton = () => {
  const { pathname } = useLocation();
  const { isAr } = useLang();

  if (!MARKETING_PATHS.includes(pathname.replace(/\/+$/, '') || '/')) return null;

  const text = isAr ? 'مرحباً، بدي أستفسر عن CompassPro' : 'Hello, I would like to ask about CompassPro';
  const href = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
    : 'https://wa.me/';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isAr ? 'تواصل معنا عبر واتساب' : 'Chat with us on WhatsApp'}
      title={isAr ? 'تواصل معنا عبر واتساب' : 'Chat with us on WhatsApp'}
      style={{
        position: 'fixed',
        bottom: 24,
        [isAr ? 'left' : 'right']: 24,
        width: 58,
        height: 58,
        borderRadius: '50%',
        background: '#25D366',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 30,
        boxShadow: '0 8px 24px rgba(37,211,102,0.45)',
        zIndex: 9999,
        textDecoration: 'none',
      }}
    >
      <i className="fab fa-whatsapp" />
    </a>
  );
};

export default WhatsAppButton;
