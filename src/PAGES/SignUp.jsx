import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import DualOrbitLoader from '../components/DualOrbitLoader';
import '../App.css';

const SignUp = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setFadeIn(true); }, []);

  const handleSignUp = async () => {
    if (password !== confirm) { setError('Passwords do not match!'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters!'); return; }
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else if (data.user) {
      navigate('/home');
    }
    setLoading(false);
  };

  return (
    <div id="login" style={{ opacity: fadeIn ? 1 : 0, transition: 'opacity 1s' }}>
      <div className="login-logo">
        <i className="fas fa-user-plus"></i>
      </div>
      <h1>CompassPro</h1>
      <p className="login-tagline">Start Your Journey Today</p>
      <h2>Create Account</h2>
      {error && <p style={{ color: '#ff4444', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</p>}
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <input type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} />
      <button onClick={handleSignUp} disabled={loading}>
        {loading ? <DualOrbitLoader size={18} /> : <i className="fas fa-user-plus"></i>} {loading ? ' Creating Account...' : 'Sign Up'}
      </button>
      <p className="login-signup">
        Already have an account? <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Login</a>
      </p>
    </div>
  );
};

export default SignUp;
