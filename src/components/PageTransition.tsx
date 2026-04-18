import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Fades the page in on each route change. Respects prefers-reduced-motion.
 * Wrap public routes with this component to get a global page transition.
 */
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(true);
      return;
    }
    setShown(false);
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  return (
    <div className={`page-transition ${shown ? 'page-transition-in' : ''}`}>
      {children}
    </div>
  );
};

export default PageTransition;
