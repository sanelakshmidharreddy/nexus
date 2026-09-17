import React, { useRef, useEffect } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export default function ExecutionLog({ logs }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'success':
        return { color: 'var(--state-success)', label: 'OK' };
      case 'warn':
        return { color: 'var(--state-warning)', label: 'WARN' };
      case 'error':
        return { color: 'var(--state-failure)', label: 'ERR' };
      case 'agent':
        return { color: 'var(--state-running)', label: 'AGENT' };
      default:
        return { color: 'var(--text-muted)', label: 'INFO' };
    }
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Terminal size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Execution Timeline & Audit Feed</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          CHRONOLOGICAL AUDIT
        </span>
      </div>

      <div
        className="panel-body"
        style={{
          flex: 1,
          maxHeight: '280px',
          overflowY: 'auto',
          background: 'var(--bg-canvas)',
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          lineHeight: '1.6',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '20px' }}>
            Awaiting mission workflow initialization...
          </div>
        ) : (
          logs.map((log, idx) => {
            const { color, label } = getTypeStyle(log.type);
            return (
              <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '4px', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--text-muted)', userSelect: 'none', fontSize: '0.72rem', flexShrink: 0 }}>
                  {log.time}
                </span>
                <span style={{
                  color,
                  fontWeight: '700',
                  fontSize: '0.68rem',
                  minWidth: '42px',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}>
                  [{label}]
                </span>
                <span style={{ color: 'var(--text-primary)', flex: 1, wordBreak: 'break-word' }}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
