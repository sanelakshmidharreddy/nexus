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
      setTimeout(() => {
        setTransitionState('splash');
        runHealthCheckWithRetry();
      }, 350);
    } else if (route === '/' && currentRoute === '/app') {
      setTransitionState('workspace-out');
      setTimeout(() => {
        setCurrentRoute('/');
        if (typeof window !== 'undefined') window.history.pushState(null, '', '/');
        setTransitionState('idle');
      }, 300);
    }
  };

  const forceEnterWorkspace = useCallback(() => {
    setTransitionState('workspace-in');
    setTimeout(() => {
      setCurrentRoute('/app');
      if (typeof window !== 'undefined') window.history.pushState(null, '', '/app');
      setTransitionState('idle');
      setTargetRoute(null);
    }, 400);
  }, []);

  useEffect(() => {
    if (transitionState === 'splash' && healthCheckStatus === 'success') {
      forceEnterWorkspace();
    }
  }, [healthCheckStatus, transitionState, forceEnterWorkspace]);

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
          opacity: isLandingOut || isWorkspaceOut ? 1 : isSplash || isWorkspaceIn ? 1 : 0,
          transform: isLandingOut ? 'scale(1)' : isWorkspaceOut ? 'scale(1)' : isSplash ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1), transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        aria-hidden={!isSplash}
      >
        {isSplash && (
          <div
            style={{
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
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.5rem',
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
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {healthCheckStatus === 'checking' && healthCheckRetries > 0
                  ? `Waking up server... (attempt ${healthCheckRetries})`
                  : healthCheckStatus === 'checking'
                  ? 'Connecting to orchestrator...'
                  : healthCheckStatus === 'failed'
                  ? 'Connection Failed'
                  : 'Connected'}
              </div>

              {healthCheckStatus === 'checking' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Loader2 size={18} className="spin" style={{ color: 'var(--state-running)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {healthCheckRetries > 0 ? `Retry ${healthCheckRetries}/10` : 'Establishing connection...'}
                    </span>
                  </div>
                  {healthCheckRetries >= 2 && (
                    <button
                      onClick={forceEnterWorkspace}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: 'var(--text-secondary)',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        marginTop: '4px',
                      }}
                    >
                      Continue to Workspace →
                    </button>
                  )}
                </div>
              )}

              {healthCheckStatus === 'failed' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <AlertCircle size={20} style={{ color: 'var(--state-failure)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '320px' }}>
                    {healthCheckError}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleRetry}
                      className="btn-primary"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <RotateCcw size={14} /> Retry
                    </button>
                    <button
                      onClick={forceEnterWorkspace}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Enter Offline
                    </button>
                  </div>
                </div>
              )}

              {healthCheckStatus === 'success' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--state-success-text)', fontSize: '0.85rem', fontWeight: 500 }}>
                  <Server size={16} /> Orchestrator online
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blue and purple light sweep beam during transition */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(115deg, transparent 35%, rgba(59, 130, 246, 0.12) 48%, rgba(139, 92, 246, 0.14) 52%, transparent 65%)',
              animation: 'nexus-light-sweep 1.2s cubic-bezier(0.22, 1, 0.36, 1) infinite',
            }}
          />
        </div>

        <style jsx>{`
          @keyframes nexus-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); transform: scale(1); }
            50% { box-shadow: 0 0 0 16px rgba(37, 99, 235, 0); transform: scale(1.02); }
          }
          @keyframes nexus-light-sweep {
            0% { transform: translateY(-30%) rotate(0deg); opacity: 0; }
            40% { opacity: 0.8; }
            100% { transform: translateY(30%) rotate(0deg); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .nexus-pulse, .nexus-light-sweep { animation: none !important; }
          }
        `}</style>
      </div>
    );
  };

  if (currentRoute === '/app') {
    return (
      <>
        <Workspace onBackToLanding={() => navigateTo('/')} />
        {renderTransitionOverlay()}
      </>
    );
  }

  return (
    <>
      <LandingPage onOpenApp={() => navigateTo('/app')} />
      {renderTransitionOverlay()}
    </>
  );
}