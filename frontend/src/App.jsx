import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Workspace from './pages/Workspace';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/app' || path.startsWith('/app/')) {
        return '/app';
      }
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/app' || path.startsWith('/app/')) {
        setCurrentRoute('/app');
      } else {
        setCurrentRoute('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route) => {
    setCurrentRoute(route);
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', route);
    }
  };

  if (currentRoute === '/app') {
    return <Workspace onBackToLanding={() => navigateTo('/')} />;
  }

  return <LandingPage onOpenApp={() => navigateTo('/app')} />;
}
