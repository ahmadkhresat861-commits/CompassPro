import React from 'react';

/**
 * Dual Orbit loader: two counter-rotating rings (blue outer, coral inner).
 * Styles live in App.css (.dual-orbit-*).
 *
 * Props:
 *  - size   : diameter in px (default 22)
 *  - inline : inline-block (true) or block-level centered (false)
 */
const DualOrbitLoader = ({ size = 22, inline = true }) => (
  <span
    className="dual-orbit-loader"
    role="status"
    aria-label="Loading"
    style={{
      display: inline ? 'inline-block' : 'block',
      width: size,
      height: size,
      margin: inline ? 0 : '0 auto',
    }}
  >
    <span className="dual-orbit-ring dual-orbit-ring-a" />
    <span className="dual-orbit-ring dual-orbit-ring-b" />
  </span>
);

export default DualOrbitLoader;
