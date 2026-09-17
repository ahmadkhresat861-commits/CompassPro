import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import '../App.css';

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

const Login = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      setFadeIn(true);
    }, 100);
  }, []);

  const handleLogin = async () => {
    const lockout = localStorage.getItem('lockout_until');

    if (lockout && Date.now() < parseInt(lockout)) {
      const mins = Math.ceil(
        (parseInt(lockout) - Date.now()) / 60000
      );

      setError(
        `Too many attempts. Try again in ${mins} minutes.`
      );

      return;
    }

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      const attempts =
        parseInt(
          localStorage.getItem('login_attempts') || '0'
        ) + 1;

      localStorage.setItem(
        'login_attempts',
        attempts
      );

      if (attempts >= MAX_ATTEMPTS) {
        localStorage.setItem(
          'lockout_until',
          Date.now() + LOCKOUT_TIME
        );

        localStorage.removeItem(
          'login_attempts'
        );

        setError(
          'Too many failed attempts. Account locked for 15 minutes. 🔒'
        );
      } else {
        setError(
          `Invalid credentials. ${
            MAX_ATTEMPTS - attempts
          } attempts remaining.`
        );
      }
    } else {
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('lockout_until');

      navigate('/home');
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0a0a2e 0%, #003366 40%, #005599 70%, #0077b6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 1s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >

      {/* Back to Home (for guests redirected here) */}
      <a
        onClick={() => navigate('/home')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'rgba(255,255,255,0.85)',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '600',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <i className="fas fa-arrow-left"></i> Back to Home
      </a>

      {/* Background Animated Circles */}
      {[
        {
          size: 300,
          top: '-100px',
          left: '-100px',
          color: 'rgba(240,165,0,0.15)',
          animation: 'floatOne 7s ease-in-out infinite',
        },
        {
          size: 400,
          bottom: '-150px',
          right: '-150px',
          color: 'rgba(0,119,182,0.2)',
          animation: 'floatTwo 9s ease-in-out infinite',
        },
        {
          size: 200,
          top: '50%',
          left: '30%',
          color: 'rgba(255,255,255,0.05)',
          animation: 'floatThree 6s ease-in-out infinite',
        },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: c.size,
            height: c.size,
            borderRadius: '50%',
            background: c.color,
            top: c.top,
            bottom: c.bottom,
            left: c.left,
            right: c.right,
            filter: 'blur(40px)',
            animation: c.animation,
          }}
        />
      ))}

      {/* Login Card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '24px',
          padding: '50px 40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow:
            '0 25px 50px rgba(0,0,0,0.3)',
          zIndex: 1,
          textAlign: 'center',

          animation: fadeIn
            ? 'loginCardEnter 0.8s ease forwards'
            : 'none',
        }}
      >

        {/* Logo */}
        <div
          style={{
            marginBottom: '25px',
            animation:
              'logoFloat 3s ease-in-out infinite',
          }}
        >
          <i
            className="fas fa-graduation-cap"
            style={{
              fontSize: '3.5rem',
              color: '#f0a500',
              filter:
                'drop-shadow(0 0 15px rgba(240,165,0,0.4))',
            }}
          ></i>
        </div>

        {/* Title */}
        <h1
          style={{
            color: 'white',
            fontSize: '2rem',
            marginBottom: '5px',
            animation:
              'textSlideUp 0.8s 0.2s ease both',
          }}
        >
          Zephyr Academy
        </h1>

        <p
          style={{
            color:
              'rgba(255,255,255,0.6)',
            fontSize: '0.85rem',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: '30px',
            animation:
              'textSlideUp 0.8s 0.3s ease both',
          }}
        >
          Learn. Grow. Succeed.
        </p>

        {/* Error */}
        {error && (
          <p
            style={{
              color: '#ff6b6b',
              marginBottom: '15px',
              fontSize: '0.9rem',
              background:
                'rgba(255,107,107,0.1)',
              padding: '10px',
              borderRadius: '8px',
              animation:
                'errorShake 0.4s ease',
            }}
          >
            <i
              className="fas fa-exclamation-circle"
              style={{
                marginRight: '6px',
              }}
            ></i>

            {error}
          </p>
        )}

        {/* Email */}
        <div
          style={{
            marginBottom: '15px',
            textAlign: 'left',
            animation:
              'inputEnter 0.7s 0.4s ease both',
          }}
        >
          <label
            style={{
              color:
                'rgba(255,255,255,0.7)',
              fontSize: '0.85rem',
              marginBottom: '6px',
              display: 'block',
            }}
          >
            <i
              className="fas fa-envelope"
              style={{
                marginRight: '6px',
                color: '#f0a500',
              }}
            ></i>

            Email
          </label>

          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '12px',
              border:
                '1px solid rgba(255,255,255,0.2)',
              background:
                'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              transition:
                'all 0.3s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor =
                '#f0a500';

              e.target.style.boxShadow =
                '0 0 0 3px rgba(240,165,0,0.15)';

              e.target.style.transform =
                'translateY(-2px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor =
                'rgba(255,255,255,0.2)';

              e.target.style.boxShadow =
                'none';

              e.target.style.transform =
                'translateY(0)';
            }}
          />
        </div>

        {/* Password */}
        <div
          style={{
            marginBottom: '25px',
            textAlign: 'left',
            animation:
              'inputEnter 0.7s 0.5s ease both',
          }}
        >
          <label
            style={{
              color:
                'rgba(255,255,255,0.7)',
              fontSize: '0.85rem',
              marginBottom: '6px',
              display: 'block',
            }}
          >
            <i
              className="fas fa-lock"
              style={{
                marginRight: '6px',
                color: '#f0a500',
              }}
            ></i>

            Password
          </label>

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '12px',
              border:
                '1px solid rgba(255,255,255,0.2)',
              background:
                'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              transition:
                'all 0.3s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor =
                '#f0a500';

              e.target.style.boxShadow =
                '0 0 0 3px rgba(240,165,0,0.15)';

              e.target.style.transform =
                'translateY(-2px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor =
                'rgba(255,255,255,0.2)';

              e.target.style.boxShadow =
                'none';

              e.target.style.transform =
                'translateY(0)';
            }}
          />
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            background:
              'linear-gradient(90deg, #f0a500, #f7c948)',
            color: '#003366',
            fontWeight: '700',
            fontSize: '1rem',
            border: 'none',
            cursor: loading
              ? 'not-allowed'
              : 'pointer',
            transition:
              'all 0.3s ease',
            marginBottom: '20px',
            boxShadow:
              '0 8px 20px rgba(240,165,0,0.3)',
            animation:
              'buttonEnter 0.8s 0.6s ease both',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform =
                'translateY(-4px) scale(1.02)';

              e.currentTarget.style.boxShadow =
                '0 12px 30px rgba(240,165,0,0.45)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              'translateY(0) scale(1)';

            e.currentTarget.style.boxShadow =
              '0 8px 20px rgba(240,165,0,0.3)';
          }}
        >
          <i
            className={
              loading
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-sign-in-alt'
            }
            style={{
              marginRight: '8px',
            }}
          ></i>

          {loading
            ? 'Loading...'
            : 'Login'}
        </button>

        {/* Signup */}
        <p
          style={{
            color:
              'rgba(255,255,255,0.6)',
            fontSize: '0.9rem',
            animation:
              'fadeUp 0.8s 0.7s ease both',
          }}
        >
          Don't have an account?{' '}

          <a
            onClick={() =>
              navigate('/signup')
            }
            style={{
              color: '#f0a500',
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'none',
              transition:
                'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color =
                '#ffffff';

              e.currentTarget.style.textShadow =
                '0 0 10px rgba(240,165,0,0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color =
                '#f0a500';

              e.currentTarget.style.textShadow =
                'none';
            }}
          >
            Sign Up
          </a>
        </p>

      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes loginCardEnter {
            0% {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes logoFloat {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
            }

            50% {
              transform: translateY(-8px) rotate(2deg);
            }
          }

          @keyframes textSlideUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes inputEnter {
            0% {
              opacity: 0;
              transform: translateX(-20px);
            }

            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes buttonEnter {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeUp {
            0% {
              opacity: 0;
              transform: translateY(15px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes errorShake {
            0%, 100% {
              transform: translateX(0);
            }

            25% {
              transform: translateX(-6px);
            }

            50% {
              transform: translateX(6px);
            }

            75% {
              transform: translateX(-4px);
            }
          }

          @keyframes floatOne {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }

            50% {
              transform: translate(30px, 25px) scale(1.1);
            }
          }

          @keyframes floatTwo {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }

            50% {
              transform: translate(-30px, -25px) scale(1.08);
            }
          }

          @keyframes floatThree {
            0%, 100% {
              transform: translate(0, 0);
            }

            50% {
              transform: translate(20px, -20px);
            }
          }

          @media (max-width: 480px) {
            .login-card {
              padding: 35px 20px;
            }
          }
        `}
      </style>

    </div>
  );
};

export default Login;
