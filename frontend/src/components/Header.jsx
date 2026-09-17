import React from 'react';
import { ExternalLink, Terminal, Cpu } from 'lucide-react';

export default function Header({ isOnline, modelName, latency, apiUrl }) {
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
    }}>
      {/* Brand typographic identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}>
              NEXUS
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '600',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}>
              AI AGENT ORCHESTRATOR
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry & System Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Backend Online Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-xs)',
          background: isOnline ? 'var(--state-success-bg)' : 'var(--state-failure-bg)',
          border: `1px solid ${isOnline ? 'var(--state-success-border)' : 'var(--state-failure-border)'}`,
        }}>
          <span className={`status-dot ${isOnline ? 'status-dot-success' : 'status-dot-failure'}`} />
          <span style={{
            fontSize: '0.72rem',
            fontWeight: '700',
            fontFamily: 'var(--font-mono)',
            color: isOnline ? 'var(--state-success-text)' : 'var(--state-failure-text)',
            letterSpacing: '0.04em',
          }}>
            {isOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
          </span>
          {latency !== null && isOnline && (
            <span style={{ fontSize: '0.7rem', color: 'var(--state-success-text)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
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
