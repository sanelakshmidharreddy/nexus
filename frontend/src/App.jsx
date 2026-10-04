import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './pages/LandingPage';
import Workspace from './pages/Workspace';
import { API_BASE } from './config';
import { Sparkles, Loader2, AlertCircle, RotateCcw, Server } from 'lucide-react';

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

  const [transitionState, setTransitionState] = useState('idle');
  const [healthCheckStatus, setHealthCheckStatus] = useState('checking');
  const [healthCheckRetries, setHealthCheckRetries] = useState(0);
  const [healthCheckError, setHealthCheckError] = useState(null);
  const [targetRoute, setTargetRoute] = useState(null);

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

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' || data.backend === 'online') {
          setHealthCheckStatus('success');
          return true;
        }
      }
      throw new Error('Health check failed');
    } catch (err) {
      return false;
    }
  }, []);

  const runHealthCheckWithRetry = useCallback(async () => {
    setHealthCheckStatus('checking');
    setHealthCheckRetries(0);
    setHealthCheckError(null);

    let success = await checkHealth();
    while (!success && healthCheckRetries < 10) {
      setHealthCheckRetries(r => r + 1);
      await new Promise(r => setTimeout(r, 1500));
      success = await checkHealth();
    }

    if (!success) {
      setHealthCheckStatus('failed');
      setHealthCheckError('Unable to connect to orchestrator. The server may be waking up from cold start.');
    }
  }, [checkHealth, healthCheckRetries]);

  const navigateTo = (route) => {
    if (route === currentRoute) return;

    if (route === '/app' && currentRoute === '/') {
      setTargetRoute('/app');
      setTransitionState('landing-out');
      if (typeof window !== 'undefined') window.history.pushState(null, '', '/app');
      setTimeout(() => {
        setTransitionState('splash');
        runHealthCheckWithRetry();
      }, 400);
    } else if (route === '/' && currentRoute === '/app') {
      setTransitionState('workspace-out');
      if (typeof window !== 'undefined') window.history.pushState(null, '', '/');
      setTimeout(() => {
        setCurrentRoute('/');
        setTransitionState('idle');
      }, 300);
    }
  };

  useEffect(() => {
    if (transitionState === 'splash' && healthCheckStatus === 'success') {
      setTransitionState('workspace-in');
      setTimeout(() => {
        setCurrentRoute('/app');
        setTransitionState('idle');
        setTargetRoute(null);
      }, 400);
    }
  }, [healthCheckStatus, transitionState]);

  const handleRetry = () => {
    runHealthCheckWithRetry();
  };

  const renderTransitionOverlay = () => {
    if (transitionState === 'idle') return null;

    const isLandingOut = transitionState === 'landing-out';
    const isSplash = transitionState === 'splash';
    const isWorkspaceIn = transitionState === 'workspace-in';
    const isWorkspaceOut = transitionState === 'workspace-out';

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'var(--bg-canvas)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLandingOut || isWorkspaceOut ? 0.95 : isSplash || isWorkspaceIn ? 1 : 0,
          transform: isLandingOut ? 'scale(1)' : isWorkspaceOut ? 'scale(1)' : isSplash ? 'scale(1)' : 'scale(0.98)',
          transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1), transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
          overflow: 'hidden',
        }}
        aria-hidden={!isSplash}
      >
        {/* Blue and purple light sweep glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '600px',
              height: '600px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(139, 92, 246, 0.2) 45%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'nexus-glow-pulse 2s ease-in-out infinite alternate',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '300%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 20%, rgba(59, 130, 246, 0.15) 45%, rgba(139, 92, 246, 0.2) 50%, rgba(6, 182, 212, 0.15) 55%, transparent 80%)',
              animation: 'nexus-light-sweep 1.6s ease-in-out infinite',
            }}
          />
        </div>

        {isSplash && (
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              opacity: isSplash ? 1 : 0,
              transform: isSplash ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            role="status"
            aria-live="polite"
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                boxShadow: '0 0 24px rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.6rem',
                fontFamily: 'var(--font-mono)',
                color: '#ffffff',
                animation: 'nexus-pulse 2s ease-in-out infinite',
              }}
            >
              N
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {healthCheckStatus === 'checking' && healthCheckRetries > 0
                  ? `Waking up server... (attempt ${healthCheckRetries})`
                  : healthCheckStatus === 'checking'
                  ? 'Connecting to orchestrator...'
                  : healthCheckStatus === 'failed'
                  ? 'Connection Failed'
                  : 'Orchestrator Online'}
              </div>

              {healthCheckStatus === 'checking' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Loader2 size={18} className="spin" style={{ color: 'var(--state-running)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {healthCheckRetries > 0 ? `Retry ${healthCheckRetries}/10` : 'Establishing connection...'}
                  </span>
                </div>
              )}

              {healthCheckStatus === 'failed' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <AlertCircle size={20} style={{ color: 'var(--state-failure)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '320px' }}>
                    {healthCheckError}
                  </span>
                  <button
                    onClick={handleRetry}
                    className="btn-primary"
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <RotateCcw size={14} /> Retry Connection
                  </button>
                </div>
              )}

              {healthCheckStatus === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--state-success-text)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Server size={16} /> Orchestrator online · Launching workspace
                </div>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes nexus-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45); transform: scale(1); }
            50% { box-shadow: 0 0 0 18px rgba(37, 99, 235, 0); transform: scale(1.02); }
          }
          @keyframes nexus-light-sweep {
            0% { transform: translateX(-40%); }
            100% { transform: translateX(40%); }
          }
          @keyframes nexus-glow-pulse {
            0% { opacity: 0.55; transform: translate(-50%, -50%) scale(0.92); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
          }
          @media (prefers-reduced-motion: reduce) {
            .nexus-pulse, .nexus-light-sweep, .nexus-glow-pulse { animation: none !important; }
          }
        `}</style>
      </div>
    );
  };

  if (currentRoute === '/app') {
    return (
      <div style={{
        opacity: transitionState === 'workspace-out' ? 0.4 : 1,
        transform: transitionState === 'workspace-out' ? 'scale(0.98)' : 'scale(1)',
        transition: 'opacity 300ms ease, transform 300ms ease',
        height: '100vh',
        overflow: 'hidden',
      }}>
        <Workspace onBackToLanding={() => navigateTo('/')} />
        {renderTransitionOverlay()}
      </div>
    );
  }

  return (
    <div style={{
      opacity: transitionState === 'landing-out' ? 0.4 : 1,
      transform: transitionState === 'landing-out' ? 'scale(0.98)' : 'scale(1)',
      transition: 'opacity 400ms ease, transform 400ms ease',
      minHeight: '100vh',
    }}>
      <LandingPage onOpenApp={() => navigateTo('/app')} />
      {renderTransitionOverlay()}
    </div>
  );
}