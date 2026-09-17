import React from 'react';
import { ExternalLink, Terminal, Cpu, Server, Wifi, WifiOff, AlertCircle } from 'lucide-react';

export function NexusLogoMark({ size = 26, isExecuting = false, isVerified = false }) {
  const strokeColor = isVerified ? '#059669' : isExecuting ? '#2563eb' : '#0f172a';
  const centerFill = isVerified ? '#059669' : isExecuting ? '#2563eb' : '#0f172a';
  const nodeFill = isVerified ? '#10b981' : isExecuting ? '#3b82f6' : '#64748b';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        flexShrink: 0,
        filter: isVerified ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))' : isExecuting ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))' : 'none',
        transition: 'all 0.3s ease'
      }}
      aria-hidden="true"
    >
      {/* Dynamic connection lines */}
      <line x1="16" y1="16" x2="16" y2="4" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.7" strokeDasharray={isExecuting ? "3 3" : "none"} style={isExecuting ? { animation: 'dash-pulse 1s linear infinite' } : {}} />
      <line x1="16" y1="16" x2="26.4" y2="10" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.7" strokeDasharray={isExecuting ? "3 3" : "none"} style={isExecuting ? { animation: 'dash-pulse 1s linear infinite' } : {}} />
      <line x1="16" y1="16" x2="26.4" y2="22" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.7" strokeDasharray={isExecuting ? "3 3" : "none"} style={isExecuting ? { animation: 'dash-pulse 1s linear infinite' } : {}} />
      <line x1="16" y1="16" x2="16" y2="28" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.7" strokeDasharray={isExecuting ? "3 3" : "none"} style={isExecuting ? { animation: 'dash-pulse 1s linear infinite' } : {}} />
      <line x1="16" y1="16" x2="5.6" y2="22" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.7" strokeDasharray={isExecuting ? "3 3" : "none"} style={isExecuting ? { animation: 'dash-pulse 1s linear infinite' } : {}} />
      <line x1="16" y1="16" x2="5.6" y2="10" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.7" strokeDasharray={isExecuting ? "3 3" : "none"} style={isExecuting ? { animation: 'dash-pulse 1s linear infinite' } : {}} />

      {/* Hexagonal Outer Perimeter */}
      <polygon
        points="16,4 26.4,10 26.4,22 16,28 5.6,22 5.6,10"
        stroke={strokeColor}
        strokeWidth="1"
        strokeOpacity="0.3"
        fill="none"
      />

      {/* 6 Satellite Specialist Nodes */}
      <circle cx="16" cy="4" r="2.2" fill={nodeFill} />
      <circle cx="26.4" cy="10" r="2.2" fill={nodeFill} />
      <circle cx="26.4" cy="22" r="2.2" fill={nodeFill} />
      <circle cx="16" cy="28" r="2.2" fill={nodeFill} />
      <circle cx="5.6" cy="22" r="2.2" fill={nodeFill} />
      <circle cx="5.6" cy="10" r="2.2" fill={nodeFill} />

      {/* Central NEXUS Orchestrator Node */}
      <circle cx="16" cy="16" r="4.2" fill={centerFill} />
      <circle cx="16" cy="16" r="6.2" stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.8" />
    </svg>
  );
}

export default function Header({ isOnline, connectionStatus = 'ONLINE', modelName, latency, apiUrl, isExecuting = false, isVerified = false }) {
  const getStatusDisplay = () => {
    if (!isOnline || connectionStatus === 'OFFLINE') {
      return {
        label: 'BACKEND OFFLINE',
        dotClass: 'status-dot-failure',
        bg: 'var(--state-failure-bg)',
        border: 'var(--state-failure-border)',
        text: 'var(--state-failure-text)',
        icon: WifiOff
      };
    }
    if (connectionStatus === 'DEGRADED') {
      return {
        label: 'DEMO MODE (FALLBACK)',
        dotClass: 'status-dot-running',
        bg: 'var(--state-warning-bg)',
        border: 'var(--state-warning-border)',
        text: 'var(--state-warning-text)',
        icon: AlertCircle
      };
    }
    return {
      label: 'SYSTEM ONLINE',
      dotClass: 'status-dot-success',
      bg: 'var(--state-success-bg)',
      border: 'var(--state-success-border)',
      text: 'var(--state-success-text)',
      icon: Wifi
    };
  };

  const status = getStatusDisplay();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 28px',
      background: '#ffffff',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-xs)',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      {/* Brand Identity & Core Value Statement */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <NexusLogoMark size={28} isExecuting={isExecuting} isVerified={isVerified} />

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}>
              NEXUS
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}>
              AI AGENT ORCHESTRATOR
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              From one goal to a verified outcome.
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'none', lgDisplay: 'inline' }}>
              • Autonomous planning, multi-agent execution, adaptive recovery & verification.
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry & System Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Backend Online Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-xs)',
          background: status.bg,
          border: `1px solid ${status.border}`,
        }}>
          <span className={`status-dot ${status.dotClass}`} />
          <span style={{
            fontSize: '0.72rem',
            fontWeight: '700',
            fontFamily: 'var(--font-mono)',
            color: status.text,
            letterSpacing: '0.04em',
          }}>
            {status.label}
          </span>
          {latency !== null && isOnline && (
            <span style={{ fontSize: '0.7rem', color: status.text, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
              • {latency}ms
            </span>
          )}
        </div>

        {/* Model Spec Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--bg-surface-secondary)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
        }}>
          <Cpu size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>MODEL:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
            {modelName || 'qwen2.5:7b-instruct'}
          </span>
        </div>

        {/* API Host Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--bg-surface-secondary)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
        }}>
          <Server size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>API:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '600', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {apiUrl ? apiUrl.replace(/^https?:\/\//, '') : 'localhost:8000'}
          </span>
        </div>

        {/* FastAPI Docs Link */}
        <a
          href={`${apiUrl}/docs`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.72rem' }}
          title="Open FastAPI Swagger Interactive Documentation"
        >
          <Terminal size={12} style={{ color: 'var(--text-muted)' }} />
          <span>API Docs</span>
          <ExternalLink size={11} style={{ color: 'var(--text-faint)' }} />
        </a>
      </div>
    </header>
  );
}
