import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';
import Navbar from './Navbar';
import Footer from './Footer';
import Home from '../PAGES/Home';

// "/" → marketing landing page for visitors; logged-in members go to /home.
const RootRoute = () => {
  const [state, setState] = useState('loading'); // loading | guest | member

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setState(data?.session ? 'member' : 'guest');
    }).catch(() => alive && setState('guest'));
    return () => { alive = false; };
  }, []);

  if (state === 'loading') return <div style={{ minHeight: '100vh' }} />;
  if (state === 'member') return <Navigate to="/home" replace />;
  return (
    <>
      <Navbar />
      <Home variant="landing" />
      <Footer />
    </>
  );
};

export default RootRoute;
