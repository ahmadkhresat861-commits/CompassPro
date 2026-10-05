import React from 'react';
import DualOrbitLoader from './DualOrbitLoader';

// ============================================================
// BUTTON — unified button system for CompassPro
// ============================================================
// variant: 'primary' | 'secondary' | 'outline' | 'danger' | 'success'
// size:    'sm' | 'md' | 'lg'  (default 'md')
// loading: shows DualOrbitLoader and disables the button
// fullWidth: stretches to 100% width
// icon: optional Font Awesome class string, e.g. "fas fa-rocket"
// ============================================================

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  children,
  onClick,
  type = 'button',
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const classNames = [
    'cp-btn',
    `cp-btn-${variant}`,
    `cp-btn-${size}`,
    fullWidth ? 'cp-btn-full' : '',
    isDisabled ? 'cp-btn-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={isDisabled}
      onClick={onClick}
      style={style}
      {...rest}
    >
      {loading ? (
        <DualOrbitLoader size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />
      ) : (
        icon && <i className={icon} />
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;
