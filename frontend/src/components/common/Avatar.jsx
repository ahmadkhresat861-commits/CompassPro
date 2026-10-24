import React from 'react';

// ============================================================
// AVATAR — reusable across Navbar, Profile, Dashboard, etc.
// ============================================================
// Props:
//   src        — avatar_url (or null/undefined for fallback)
//   name       — username or full name (used for initials)
//   email      — fallback source for initials if no name
//   size       — pixel size (default 40)
//   showStatus — show a small green "online" dot
//   onClick    — optional click handler
// ============================================================

const getInitials = (name, email) => {
  const source = (name || '').trim() || (email || '').trim();
  if (!source) return '?';

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // single word (username or email) — use first two letters
  return source.slice(0, 2).toUpperCase();
};

// Deterministic gradient based on the initials, so the same
// person always gets the same colors.
const GRADIENTS = [
  ['#003366', '#005599'],
  ['#6d28d9', '#a855f7'],
  ['#0f766e', '#14b8a6'],
  ['#b45309', '#f59e0b'],
  ['#be123c', '#f43f5e'],
  ['#1d4ed8', '#38bdf8'],
];

const pickGradient = (key) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

const Avatar = ({
  src,
  name,
  email,
  size = 40,
  showStatus = false,
  onClick,
}) => {
  const initials = getInitials(name, email);
  const [from, to] = pickGradient(initials + (email || ''));

  const wrapperStyle = {
    position: 'relative',
    width: size,
    height: size,
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
  };

  return (
    <div style={wrapperStyle} onClick={onClick} className="cp-avatar">
      {src ? (
        <img
          src={src}
          alt={name || email || 'Avatar'}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(240,165,0,0.6)',
          }}
        />
      ) : (
        <div
          className="cp-avatar-fallback"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${from}, ${to})`,
            color: 'white',
            fontWeight: 700,
            fontSize: size * 0.38,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>
            {initials}
          </span>
          <span className="cp-avatar-glow" />
        </div>
      )}

      {showStatus && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: '50%',
            background: '#10b981',
            border: '2px solid white',
          }}
        />
      )}
    </div>
  );
};

export default Avatar;
