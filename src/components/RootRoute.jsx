import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Navbar from './Navbar';
import Footer from './Footer';
import Home from '../PAGES/Home';

// "/home": marketing page for visitors (editable from Admin); members get their own version (My Courses).
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
      <Home key={state} variant={state === 'member' ? 'home' : 'landing'} />
      <Footer />
    </>
  );
};

export default RootRoute;
