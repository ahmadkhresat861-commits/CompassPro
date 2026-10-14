import React, { useState } from 'react';

// Category -> gradient + icon used when a course has no image (or it fails to load)
const THEMES = [
  { match: /react/i, from: '#0B3D7A', to: '#1E78D6', icon: 'fas fa-layer-group' },
  { match: /java\s*script|^js$/i, from: '#F0A500', to: '#FFD470', icon: 'fas fa-code', dark: true },
  { match: /python/i, from: '#0F7A4C', to: '#37B27C', icon: 'fas fa-terminal' },
  { match: /html|css|web/i, from: '#C8365A', to: '#F28AA6', icon: 'fas fa-palette' },
  { match: /data|sql|analy/i, from: '#2A2E7A', to: '#5B63D6', icon: 'fas fa-chart-simple' },
];

const pickTheme = (category) =>
  THEMES.find((t) => t.match.test(category || '')) || {
    from: '#003366',
    to: '#005599',
    icon: 'fas fa-book-open',
  };

/**
 * Course cover image with a category badge.
 * - Uses the course image when available.
 * - Falls back to a category-coloured gradient with an icon.
 */
const CourseCover = ({ src, category, alt = '', height = 170, showBadge = true, style }) => {
  const [failed, setFailed] = useState(false);
  const theme = pickTheme(category);
  const useImage = src && !failed;

  return (
    <div
      className="cp-cover"
      style={{
        height,
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        ...style,
      }}
    >
      {useImage ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="cp-cover-fallback" aria-hidden="true">
          <i className={theme.icon} style={{ color: theme.dark ? '#003366' : 'rgba(255,255,255,0.92)' }}></i>
        </div>
      )}
      {showBadge && category && <span className="cp-cover-badge">{category}</span>}
    </div>
  );
};

export default CourseCover;
