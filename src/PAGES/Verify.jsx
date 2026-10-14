import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLang } from '../LanguageContext';
import { useSEO } from '../hooks/useSEO';
import DualOrbitLoader from '../components/DualOrbitLoader';
import Button from '../components/Button';
import '../App.css';

// ============================================================
// VERIFY CERTIFICATE — public page: /verify/:code
// ============================================================

const Verify = () => {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useLang();
  const [input, setInput] = useState(urlCode || '');
  const [state, setState] = useState({ status: 'idle', cert: null });

  useSEO({
    title: 'Verify Certificate',
    description: 'Verify a CompassPro certificate of completion.',
    path: '/verify',
  });

  const bg = darkMode ? '#0f172a' : '#f4f7fb';
  const card = darkMode ? '#1e293b' : '#ffffff';
  const text = darkMode ? '#f1f5f9' : '#1a1a2e';
  const muted = darkMode ? '#94a3b8' : '#666';

  const verify = async (value) => {
    const code = (value || '').trim();
    if (!code) return;
    setState({ status: 'loading', cert: null });
    const { data, error } = await supabase.rpc('verify_certificate', { p_code: code });
    if (error) {
      setState({ status: 'error', cert: null });
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setState(row ? { status: 'valid', cert: row } : { status: 'invalid', cert: null });
  };

  useEffect(() => {
    if (urlCode) verify(urlCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode]);

  const submit = (e) => {
    e.preventDefault();
    const c = input.trim();
    if (!c) return;
    if (c === urlCode) verify(c);
    else navigate(`/verify/${encodeURIComponent(c)}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '100px 16px 60px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <i className="fas fa-certificate" style={{ fontSize: '2.4rem', color: '#f0a500' }}></i>
          <h1 style={{ color: darkMode ? '#fff' : '#003366', margin: '10px 0 4px' }}>Verify Certificate</h1>
          <p style={{ color: muted, margin: 0 }}>Enter the certificate number printed on the certificate.</p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="CP-00009-A1B2"
            aria-label="Certificate number"
            style={{
              flex: '1 1 220px', padding: '13px 14px', borderRadius: 999, fontSize: '1rem',
              border: '1px solid #d8dee6', background: card, color: text, boxSizing: 'border-box',
            }}
          />
          <Button type="submit" variant="primary" icon="fas fa-magnifying-glass" loading={state.status === 'loading'}>
            Verify
          </Button>
        </form>

        {state.status === 'loading' && (
          <div style={{ padding: 30 }}><DualOrbitLoader size={36} inline={false} /></div>
        )}

        {state.status === 'valid' && (
          <div style={{ background: card, color: text, borderRadius: 24, padding: 26, borderTop: '5px solid #2e7d32', boxShadow: '0 4px 15px rgba(0,51,102,0.08)' }}>
            <div style={{ color: '#2e7d32', fontWeight: 800, marginBottom: 14 }}>
              <i className="fas fa-circle-check"></i> Valid certificate
            </div>
            <p style={{ margin: '0 0 4px', color: muted, fontSize: 13 }}>Awarded to</p>
            <h2 style={{ margin: '0 0 14px' }}>{state.cert.holder}</h2>
            <p style={{ margin: '0 0 4px', color: muted, fontSize: 13 }}>Course</p>
            <h3 style={{ margin: '0 0 14px' }}>{state.cert.course_title}</h3>
            <p style={{ margin: 0, color: muted, fontSize: 13 }}>
              Issued on {state.cert.issued_on ? new Date(state.cert.issued_on).toLocaleDateString() : '—'}
            </p>
          </div>
        )}

        {state.status === 'invalid' && (
          <div style={{ background: card, color: text, borderRadius: 24, padding: 24, borderTop: '5px solid #c62828', textAlign: 'center' }}>
            <div style={{ color: '#c62828', fontWeight: 800 }}>
              <i className="fas fa-circle-xmark"></i> Certificate not found
            </div>
            <p style={{ color: muted, marginBottom: 0 }}>Check the number and try again.</p>
          </div>
        )}

        {state.status === 'error' && (
          <p style={{ textAlign: 'center', color: '#c62828' }}>Could not verify right now. Please try again later.</p>
        )}
      </div>
    </div>
  );
};

export default Verify;
