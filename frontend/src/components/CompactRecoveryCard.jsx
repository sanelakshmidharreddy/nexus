import React from 'react';
import { ShieldAlert, Check, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CompactRecoveryCard({ events = [], onViewRecoveryDetails }) {
  const eventTypes = events.map(e => e.event_type);

  const hasRecovered = eventTypes.includes('QA_PASSED') && eventTypes.includes('PATCH_APPLIED');
  const isRecovering = eventTypes.includes('QA_FAILED') && !hasRecovered;
  const isArmed = !eventTypes.includes('QA_FAILED');

  const qaFailEvent = events.find(e => e.event_type === 'QA_FAILED');

  return (
    <div className="panel" style={{ background: '#ffffff', overflow: 'hidden' }}>
      <div className="panel-header" style={{ background: hasRecovered ? 'rgba(16, 185, 129, 0.04)' : 'transparent' }}>
        <div className="panel-title">
          <ShieldAlert
            size={16}
            style={{ color: hasRecovered ? 'var(--state-success)' : isRecovering ? 'var(--state-warning)' : 'var(--text-muted)' }}
          />
          <span>Adaptive Orchestration & Self-Healing</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${hasRecovered ? 'badge-success' : isRecovering ? 'badge-retrying' : 'badge-pending'}`}>
            {hasRecovered ? '✓ RECOVERED' : isRecovering ? '↻ RECOVERING (STEP 4/7)' : '● ARMED / READY'}
          </span>
        </div>
      </div>

      <div className="panel-body" style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          {/* Left: Summary and Metrics Chips */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                background: hasRecovered ? 'var(--state-success-bg)' : isRecovering ? 'var(--state-running-bg)' : 'var(--bg-surface-secondary)',
                color: hasRecovered ? 'var(--state-success-text)' : isRecovering ? 'var(--state-running-text)' : 'var(--text-muted)',
                border: `1px solid ${hasRecovered ? 'var(--state-success-border)' : 'var(--border-subtle)'}`,
              }}>
                1 DEFECT INTERCEPTED
              </span>

              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                background: hasRecovered ? 'var(--state-success-bg)' : isRecovering ? 'var(--state-running-bg)' : 'var(--bg-surface-secondary)',
                color: hasRecovered ? 'var(--state-success-text)' : isRecovering ? 'var(--state-running-text)' : 'var(--text-muted)',
                border: `1px solid ${hasRecovered ? 'var(--state-success-border)' : 'var(--border-subtle)'}`,
              }}>
                1 AUTONOMOUS RETRY
              </span>

              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                background: hasRecovered ? 'var(--state-success-bg)' : isRecovering ? 'var(--state-running-bg)' : 'var(--bg-surface-secondary)',
                color: hasRecovered ? 'var(--state-success-text)' : isRecovering ? 'var(--state-running-text)' : 'var(--text-muted)',
                border: `1px solid ${hasRecovered ? 'var(--state-success-border)' : 'var(--border-subtle)'}`,
              }}>
                1 CODE PATCH APPLIED
              </span>
            </div>

            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
              {hasRecovered ? (
                <span>
                  <strong>Autonomous self-healing completed:</strong> QA intercepted schema coordinate defect. NEXUS performed root cause analysis, dispatched corrective constraints to Developer Agent, patched <code>data.json</code>, and verified clean build.
                </span>
              ) : isRecovering ? (
                <span>
                  <strong>Active Incident Recovery:</strong> Intercepted QA build defect. Orchestrator analyzing error stacktrace and dispatching corrective constraints to developer agent...
                </span>
              ) : (
                <span>
                  <strong>Continuous Incident Interception:</strong> NEXUS monitors all agent build outputs. Any syntactic, schema, or runtime exceptions trigger automatic diagnosis and self-healing.
                </span>
              )}
            </div>
          </div>

          {/* Right: Action CTA to open full Recovery Center */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onViewRecoveryDetails}
              className="btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <span>VIEW RECOVERY CENTER</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
