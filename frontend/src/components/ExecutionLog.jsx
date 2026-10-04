import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Check, AlertTriangle, RefreshCw, Activity, ShieldCheck, ArrowDown, Radio } from 'lucide-react';

export default function ExecutionLog({ events = [], logs = [], isRunning = false }) {
  const containerRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Normalize data: prefer real backend events over client logs
  const displayItems = React.useMemo(() => {
    if (events && events.length > 0) {
      return events.map((e, idx) => {
        let timeStr = '';
        if (e.timestamp) {
          try {
            timeStr = new Date(e.timestamp).toLocaleTimeString();
          } catch {
            timeStr = e.timestamp;
          }
        }
        return {
          id: e.event_id || `evt-${idx}`,
          time: timeStr || '00:00:00',
          agent: e.agent ? e.agent.toUpperCase() : 'ORCHESTRATOR',
          eventType: e.event_type || 'EVENT',
          message: e.message || '',
          status: e.status || 'info',
        };
      });
    }

    if (logs && logs.length > 0) {
      return logs.map((l, idx) => ({
        id: `log-${idx}`,
        time: l.time || new Date().toLocaleTimeString(),
        agent: l.agent || 'SYSTEM',
        eventType: l.type || 'INFO',
        message: l.message || '',
        status: l.type || 'info',
      }));
    }

    return [];
  }, [events, logs]);

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
  }, [displayItems, userScrolledUp]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setUserScrolledUp(false);
    }
  };

  const getItemMeta = (item) => {
    const msg = (item.message || '').toLowerCase();
    const type = (item.eventType || '').toUpperCase();
    const status = (item.status || '').toLowerCase();

    if (status === 'failed' || type.includes('FAIL') || type.includes('ERROR') || msg.includes('defect')) {
      return { color: 'var(--state-failure)', bg: 'var(--state-failure-bg)', border: 'var(--state-failure-border)', tag: 'DEFECT', icon: AlertTriangle };
    }
    if (type.includes('REPAIR') || type.includes('RECOVERY') || type.includes('PATCH') || msg.includes('patch')) {
      return { color: 'var(--state-warning)', bg: 'var(--state-warning-bg)', border: 'var(--state-warning-border)', tag: 'REPAIR', icon: RefreshCw };
    }
    if (status === 'success' || type.includes('COMPLETED') || type.includes('PASSED') || msg.includes('passed') || msg.includes('ready')) {
      return { color: 'var(--state-success)', bg: 'var(--state-success-bg)', border: 'var(--state-success-border)', tag: 'VERIFIED', icon: Check };
    }
    if (type.includes('STARTED') || type.includes('ASSIGNED') || item.agent !== 'SYSTEM') {
      return { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', tag: item.agent, icon: Activity };
    }
    return { color: 'var(--text-muted)', bg: 'var(--bg-surface-secondary)', border: 'var(--border-subtle)', tag: 'SYSTEM', icon: Terminal };
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-surface)', position: 'relative' }}>
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Execution Timeline & Event Feed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isRunning && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--state-success-bg)',
              border: '1px solid var(--state-success-border)',
              fontSize: '0.68rem',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              color: 'var(--state-success-text)',
            }}>
              <span className="status-dot status-dot-running" style={{ width: '6px', height: '6px' }} />
              <span>LIVE</span>
            </div>
          )}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            CHRONOLOGICAL AUDIT ({displayItems.length})
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
          background: 'var(--bg-surface-secondary)',
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.76rem',
          lineHeight: '1.6',
        }}
      >
        {displayItems.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '40px' }}>
            Awaiting mission directive dispatch...
          </div>
        ) : (
          displayItems.map((item) => {
            const meta = getItemMeta(item);
            const Icon = meta.icon;

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '6px',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  background: item.status === 'failed' ? 'var(--state-failure-bg)' : 'transparent',
                  animation: 'fade-in 150ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {/* Timestamp */}
                <span style={{ color: 'var(--text-muted)', userSelect: 'none', fontSize: '0.7rem', flexShrink: 0 }}>
                  [{item.time}]
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
                  {item.message}
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
