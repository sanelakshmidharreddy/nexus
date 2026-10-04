import React from 'react';
import { ShieldAlert, Check, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CompactRecoveryCard({ events = [], onViewRecoveryDetails }) {
  const defectEvents = events.filter(e =>
    ['EVALUATION_FAILED', 'TASK_ERROR', 'QA_FAILED'].includes(e.event_type) ||
    (e.status === 'failed' && e.event_type !== 'WORKFLOW_FAILED')
  );
  const retryEvents = events.filter(e =>
    ['REPAIR_STARTED', 'QA_RETRY', 'TASK_REASSIGNED'].includes(e.event_type)
  );
  const patchEvents = events.filter(e =>
    ['PATCH_APPLIED', 'REPAIR_COMPLETED'].includes(e.event_type)
  );

  const defectsCount = defectEvents.length;
  const retriesCount = retryEvents.length;
  const patchesCount = patchEvents.length;

  const hasRecovered = patchesCount > 0 || (defectsCount > 0 && events.some(e => e.event_type === 'EVALUATION_PASSED'));
  const isRecovering = defectsCount > 0 && !hasRecovered;
  const isIdle = defectsCount === 0;

  return (
    <div className="panel" style={{ background: 'var(--bg-surface)', overflow: 'hidden' }}>
      <div className="panel-header" style={{ background: hasRecovered ? 'var(--state-success-bg)' : isRecovering ? 'var(--state-warning-bg)' : 'transparent' }}>
        <div className="panel-title">
          <ShieldAlert
            size={16}
            style={{ color: hasRecovered ? 'var(--state-success)' : isRecovering ? 'var(--state-warning)' : 'var(--text-muted)' }}
          />
          <span>Adaptive Orchestration & Self-Healing</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${hasRecovered ? 'badge-success' : isRecovering ? 'badge-retrying' : 'badge-pending'}`}>
            {hasRecovered ? '✓ RECOVERED' : isRecovering ? '↻ RECOVERING' : '● IDLE / NOMINAL'}
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
          {/* Left: Summary and Real Metrics Chips */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                background: hasRecovered ? 'var(--state-success-bg)' : isRecovering ? 'var(--state-failure-bg)' : 'var(--bg-surface-secondary)',
                color: hasRecovered ? 'var(--state-success-text)' : isRecovering ? 'var(--state-failure-text)' : 'var(--text-muted)',
                border: `1px solid ${hasRecovered ? 'var(--state-success-border)' : isRecovering ? 'var(--state-failure-border)' : 'var(--border-subtle)'}`,
              }}>
                {defectsCount} {defectsCount === 1 ? 'DEFECT' : 'DEFECTS'} INTERCEPTED
              </span>

              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                background: hasRecovered ? 'var(--state-success-bg)' : isRecovering ? 'var(--state-warning-bg)' : 'var(--bg-surface-secondary)',
                color: hasRecovered ? 'var(--state-success-text)' : isRecovering ? 'var(--state-warning-text)' : 'var(--text-muted)',
                border: `1px solid ${hasRecovered ? 'var(--state-success-border)' : isRecovering ? 'var(--state-warning-border)' : 'var(--border-subtle)'}`,
              }}>
                {retriesCount} AUTONOMOUS {retriesCount === 1 ? 'RETRY' : 'RETRIES'}
              </span>

              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                background: hasRecovered ? 'var(--state-success-bg)' : isRecovering ? 'var(--state-running-bg)' : 'var(--bg-surface-secondary)',
                color: hasRecovered ? 'var(--state-success-text)' : isRecovering ? 'var(--state-running-text)' : 'var(--text-muted)',
                border: `1px solid ${hasRecovered ? 'var(--state-success-border)' : isRecovering ? 'var(--state-running-border)' : 'var(--border-subtle)'}`,
              }}>
                {patchesCount} CODE {patchesCount === 1 ? 'PATCH' : 'PATCHES'} APPLIED
              </span>
            </div>

            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
              {hasRecovered ? (
                <span>
                  <strong>Autonomous self-healing completed:</strong> Evaluator detected missing artifact or contract defect. NEXUS formulated diagnosis, triggered Code Generator repair, and re-verified deliverable.
                </span>
              ) : isRecovering ? (
                <span>
                  <strong>Active Incident Recovery:</strong> Intercepted defect. Orchestrator analyzing error and dispatching corrective constraints to developer agent...
                </span>
              ) : (
                <span>
                  <strong>Continuous Incident Interception:</strong> NEXUS monitors all pipeline stages (Create, Test, Deploy, Collaborate). System operating nominally — 0 defects encountered.
                </span>
              )}
            </div>
          </div>

          {/* Right: Action CTA to open full Recovery Center */}
          {onViewRecoveryDetails && (
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
          )}
        </div>
      </div>
    </div>
  );
}
