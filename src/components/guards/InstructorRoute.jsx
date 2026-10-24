import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import DualOrbitLoader from '../common/DualOrbitLoader';

// Allows instructors (and admins, to preview) only.
const InstructorRoute = ({ children }) => {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAllowed(false); return; }
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', user.id)
        .maybeSingle();
      setAllowed(!error && (profile?.type === 'instructor' || profile?.type === 'admin'));
    })();
  }, []);

  if (allowed === null) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#003366' }}>
      <DualOrbitLoader size={48} />
    </div>
  );
  return allowed ? children : <Navigate to="/home" />;
};

export default InstructorRoute;
