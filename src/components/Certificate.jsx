import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const NAVY = '#003366';
const DEEP = '#0b1f3a';
const GOLD = '#F0A500';
const GOLD_SOFT = '#d9a441';
const SERIF = "Georgia, 'Times New Roman', 'Noto Naskh Arabic', serif";

// Landscape A4 certificate. All sizes use cqw (1cqw = 1% of the certificate width) so it scales
// from a phone screen to a printed page without changing proportions.
const Certificate = ({ name, course, instructor, issuedOn, code, origin }) => {
  const date = (issuedOn ? new Date(issuedOn) : new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const verifyUrl = `${origin || window.location.origin}/verify/${code || ''}`;

  const corner = (pos) => {
    const s = { position: 'absolute', width: '6cqw', height: '6cqw', borderColor: GOLD, borderStyle: 'solid', borderWidth: 0 };
    if (pos.includes('t')) { s.top = '2.2cqw'; s.borderTopWidth = '0.35cqw'; } else { s.bottom = '2.2cqw'; s.borderBottomWidth = '0.35cqw'; }
    if (pos.includes('l')) { s.left = '2.2cqw'; s.borderLeftWidth = '0.35cqw'; } else { s.right = '2.2cqw'; s.borderRightWidth = '0.35cqw'; }
    return <span key={pos} style={s} />;
  };

  return (
    <div className="cp-cert" style={{ containerType: 'inline-size', width: '100%' }}>
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '297 / 210', background: '#FFFDF7', color: DEEP,
        boxSizing: 'border-box', border: `1.2cqw solid ${NAVY}`, fontFamily: SERIF, overflow: 'hidden',
        WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
      }}>
        {/* inner gold frame */}
        <div style={{ position: 'absolute', inset: '1.2cqw', border: `0.25cqw solid ${GOLD}` }} />
        {['tl', 'tr', 'bl', 'br'].map(corner)}

        {/* faint compass watermark */}
        <img src="/logo.png" alt="" aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '52%', width: '46cqw', transform: 'translate(-50%,-50%)', opacity: 0.03, filter: 'grayscale(1)' }} />

        <div style={{ position: 'absolute', inset: '3cqw 6cqw', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* header */}
          <img src="/logo.png" alt="CompassPro" style={{ width: '8.5cqw', height: '8.5cqw', borderRadius: '1.6cqw', marginTop: '0.6cqw' }} />
          <div style={{ fontSize: '1.45cqw', letterSpacing: '0.55cqw', color: NAVY, fontWeight: 700, marginTop: '0.6cqw' }}>COMPASSPRO ACADEMY</div>

          <div style={{ fontSize: '4.3cqw', fontWeight: 700, color: NAVY, letterSpacing: '0.25cqw', marginTop: '1.2cqw', lineHeight: 1.1 }}>
            CERTIFICATE OF COMPLETION
          </div>
          <div dir="rtl" style={{ fontSize: '1.9cqw', color: GOLD_SOFT, marginTop: '0.4cqw' }}>شهادة إتمام</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1cqw', margin: '1.3cqw 0 1cqw', width: '38cqw' }}>
            <span style={{ flex: 1, height: '0.15cqw', background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <span style={{ width: '0.9cqw', height: '0.9cqw', background: GOLD, transform: 'rotate(45deg)' }} />
            <span style={{ flex: 1, height: '0.15cqw', background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
          </div>

          <div style={{ fontSize: '1.55cqw', color: '#5a6b82', fontStyle: 'italic' }}>This is to certify that</div>

          <div style={{ fontSize: '4.6cqw', color: NAVY, fontWeight: 700, margin: '0.9cqw 0 0.5cqw', maxWidth: '78cqw', lineHeight: 1.15, overflowWrap: 'anywhere' }}>
            {name || 'Student'}
          </div>
          <div style={{ width: '46cqw', height: '0.2cqw', background: GOLD, marginBottom: '1cqw' }} />

          <div style={{ fontSize: '1.55cqw', color: '#5a6b82', fontStyle: 'italic' }}>has successfully completed the course</div>
          <div style={{ fontSize: '3cqw', color: DEEP, fontWeight: 700, margin: '0.7cqw 0 0', maxWidth: '76cqw', lineHeight: 1.2, overflowWrap: 'anywhere' }}>
            {course}
          </div>

          {/* footer */}
          <div style={{ marginTop: 'auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', gap: '2cqw' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.7cqw', fontWeight: 700, color: NAVY }}>{date}</div>
              <div style={{ borderTop: `0.15cqw solid ${NAVY}`, margin: '0.5cqw auto 0', width: '22cqw', paddingTop: '0.4cqw', fontSize: '1.2cqw', color: '#5a6b82', letterSpacing: '0.2cqw' }}>DATE OF ISSUE</div>
            </div>

            {/* gold seal + QR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2cqw' }}>
              <div style={{ width: '10cqw', height: '10cqw', borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #ffd978, ${GOLD} 55%, #b87900)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 0.35cqw #FFFDF7, 0 0 0 0.6cqw ' + GOLD }}>
                <div style={{ width: '8cqw', height: '8cqw', borderRadius: '50%', border: `0.2cqw dashed ${NAVY}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: NAVY }}>
                  <div style={{ fontSize: '2.6cqw', lineHeight: 1 }}>★</div>
                  <div style={{ fontSize: '0.95cqw', fontWeight: 800, letterSpacing: '0.15cqw', marginTop: '0.3cqw' }}>VERIFIED</div>
                </div>
              </div>
              {code && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: '#fff', padding: '0.6cqw', border: `0.15cqw solid ${NAVY}` }}>
                    <QRCodeSVG value={verifyUrl} style={{ width: '8.4cqw', height: '8.4cqw', display: 'block' }} level="M" />
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.7cqw', fontWeight: 700, color: NAVY, minHeight: '2cqw', fontStyle: 'italic' }}>{instructor || 'CompassPro Academy'}</div>
              <div style={{ borderTop: `0.15cqw solid ${NAVY}`, margin: '0.5cqw auto 0', width: '22cqw', paddingTop: '0.4cqw', fontSize: '1.2cqw', color: '#5a6b82', letterSpacing: '0.2cqw' }}>
                {instructor ? 'COURSE INSTRUCTOR' : 'ISSUED BY'}
              </div>
            </div>
          </div>

          {code && (
            <div style={{ marginTop: '1.4cqw', fontSize: '1.1cqw', color: '#5a6b82', letterSpacing: '0.1cqw' }}>
              Certificate No. <strong style={{ color: NAVY }}>{code}</strong> &nbsp;·&nbsp; Verify at {verifyUrl.replace(/^https?:\/\//, '')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certificate;
