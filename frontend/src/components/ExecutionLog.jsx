import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Check, AlertTriangle, RefreshCw, Activity, ShieldCheck, ArrowDown } from 'lucide-react';

export default function ExecutionLog({ logs = [] }) {
  const containerRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Check scroll position to determine if we should auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
    setUserScrolledUp(!isNearBottom);
  };

  useEffect(() => {
    if (!userScrolledUp && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, userScrolledUp]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setUserScrolledUp(false);
    }
  };

  const getLogMeta = (log) => {
    const msg = log.message || '';
    const type = log.type;

    if (msg.includes('QA') && (msg.includes('failed') || msg.includes('Defect') || msg.includes('Error'))) {
      return { color: 'var(--state-failure)', bg: 'var(--state-failure-bg)', border: 'var(--state-failure-border)', tag: 'QA DEFECT', icon: AlertTriangle };
    }
    if (msg.includes('RECOVERY') || msg.includes('re-assigned') || msg.includes('patch') || msg.includes('diagnos')) {
      return { color: 'var(--state-warning)', bg: 'var(--state-warning-bg)', border: 'var(--state-warning-border)', tag: 'RECOVERY', icon: RefreshCw };
    }
    if (type === 'success' || msg.includes('passed') || msg.includes('verified') || msg.includes('SUCCESS') || msg.includes('completed')) {
      return { color: 'var(--state-success)', bg: 'var(--state-success-bg)', border: 'var(--state-success-border)', tag: 'VERIFIED', icon: Check };
    }
    if (type === 'agent' || msg.includes('assigned') || msg.includes('Agent')) {
      return { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', tag: 'DISPATCH', icon: Activity };
    }
    return { color: 'var(--text-muted)', bg: 'var(--bg-surface-secondary)', border: 'var(--border-subtle)', tag: 'SYSTEM', icon: Terminal };
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', position: 'relative' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Terminal size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Infrastructure Execution Timeline & Event Feed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            CHRONOLOGICAL AUDIT ({logs.length})
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          height: '280px',
          maxHeight: '280px',
          overflowY: 'auto',
          background: '#f8fafc',
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.76rem',
          lineHeight: '1.6',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '30px' }}>
            Awaiting mission directive dispatch...
          </div>
        ) : (
          logs.map((log, idx) => {
            const meta = getLogMeta(log);
            const Icon = meta.icon;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '6px',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  background: log.type === 'error' ? 'var(--state-failure-bg)' : 'transparent',
                }}
              >
                {/* Timestamp */}
                <span style={{ color: 'var(--text-muted)', userSelect: 'none', fontSize: '0.7rem', flexShrink: 0 }}>
                  [{log.time}]
                </span>

                {/* Tag badge */}
                <span style={{
                  color: meta.color,
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  fontSize: '0.62rem',
                  fontWeight: '800',
                  padding: '1px 5px',
                  borderRadius: '2px',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}>
                  <Icon size={9} />
                  <span>{meta.tag}</span>
                </span>

                {/* Message */}
                <span style={{ color: 'var(--text-primary)', flex: 1, wordBreak: 'break-word', fontSize: '0.75rem' }}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Auto-scroll button if user scrolled up */}
      {userScrolledUp && (
        <button
          onClick={scrollToBottom}
          className="btn-secondary"
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '18px',
            padding: '4px 8px',
            fontSize: '0.7rem',
            boxShadow: 'var(--shadow-md)',
            zIndex: 10,
          }}
        >
          <ArrowDown size={12} />
          <span>New events below</span>
        </button>
      )}
    </div>
  );
}
