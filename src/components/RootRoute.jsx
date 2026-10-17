import React, { useEffect, useState, lazy } from 'react';
import { supabase } from '../supabase';
import Navbar from './Navbar';
import Footer from './Footer';
import Home from '../PAGES/Home';

const Dashboard = lazy(() => import('../PAGES/Dashboard'));

// "/home": marketing page for visitors (editable from Admin); members get their student dashboard
// (welcome, stats, enrolled courses with progress, certificates).
const RootRoute = () => {
  const [state, setState] = useState('loading'); // loading | guest | member

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setState(data?.session ? 'member' : 'guest');
    }).catch(() => alive && setState('guest'));
    // follow login / logout without a reload
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setState(session ? 'member' : 'guest');
    });
    return () => { alive = false; sub?.subscription?.unsubscribe(); };
  }, []);

  if (state === 'loading') return <div style={{ minHeight: '100vh' }} />;
  return (
    <>
      <Navbar />
      {state === 'member' ? <Dashboard key="member" /> : <Home key="guest" variant="landing" />}
      <Footer />
    </>
  );
};

export default RootRoute;
