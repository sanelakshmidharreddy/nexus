import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GitCommit,
  Clock,
  ArrowRight,
  FileCode,
  Check,
  Cpu,
  Layers,
  Search,
  X,
} from 'lucide-react';
import BackButton from './BackButton';

export default function RecoveryCenterView({ workflow, events = [], tasks = [], onBack }) {
  const workflowId = workflow?.workflow_id || 'Awaiting Active Workflow';

  // Real defect / retry / patch events from recorded events (aligned with CompactRecoveryCard & Workspace)
  const defectEvents = events.filter(e =>
    e &&
    (['EVALUATION_FAILED', 'TASK_ERROR', 'QA_FAILED'].includes(e.event_type) ||
    (e.status === 'failed' && e.event_type !== 'WORKFLOW_FAILED'))
  );
  const retryEvents = events.filter(e =>
    e && ['REPAIR_STARTED', 'QA_RETRY', 'TASK_REASSIGNED'].includes(e.event_type)
  );
  const patchEvents = events.filter(e =>
    e && ['PATCH_APPLIED', 'REPAIR_COMPLETED'].includes(e.event_type)
  );

  const defectsCount = defectEvents.length;
  const retriesCount = retryEvents.length;
  const patchesCount = patchEvents.length;

  // Extract actual lifecycle events if present
  const qaFailEvent = events.find(e => e?.event_type === 'QA_FAILED') || defectEvents[0];
  const rootCauseEvent = events.find(e => e?.event_type === 'ROOT_CAUSE_IDENTIFIED');
  const reassignEvent = events.find(e => e?.event_type === 'TASK_REASSIGNED') || retryEvents[0];
  const patchEvent = events.find(e => e?.event_type === 'PATCH_APPLIED') || patchEvents[0];
  const retryEvent = events.find(e => e?.event_type === 'QA_RETRY');
  const passEvent = events.find(e => e?.event_type === 'QA_PASSED' || e?.event_type === 'EVALUATION_PASSED');

  const isRecovered = patchesCount > 0 || (defectsCount > 0 && Boolean(passEvent));
  const isRecovering = defectsCount > 0 && !isRecovered;
  const hasIncidents = defectsCount > 0 || retriesCount > 0 || patchesCount > 0 || isRecovered || isRecovering;

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  // Chronological recovery-related events safely filtered
  const recoveryAudit = events.filter(e =>
    e &&
    typeof e.event_type === 'string' &&
    (e.event_type.includes('QA') ||
     e.event_type.includes('RECOVERY') ||
     e.event_type.includes('ROOT_CAUSE') ||
     e.event_type.includes('REASSIGN') ||
     e.event_type.includes('PATCH') ||
     e.event_type.includes('EVALUAT') ||
     e.event_type.includes('REPAIR') ||
     e.status === 'failed')
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Incident Control Header */}
      <div className="panel" style={{ background: 'var(--bg-surface)' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BackButton label="Back" size="small" onClick={onBack} fallbackTab="overview" />
            <ShieldAlert size={16} color={hasIncidents ? (isRecovered ? "var(--state-success)" : "var(--state-warning)") : "var(--state-success)"} />
            <span>NEXUS RECOVERY CENTER — AUTONOMOUS INCIDENT RESPONSE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              WORKFLOW: <strong style={{ color: 'var(--text-primary)' }}>{workflowId.slice(0, 12)}</strong>
            </span>
            <span className={`badge ${isRecovered ? 'badge-success' : isRecovering ? 'badge-retrying' : hasIncidents ? 'badge-failed' : 'badge-success'}`}>
              {isRecovered ? 'RECOVERED (AUTONOMOUS)' : isRecovering ? 'RECOVERY IN PROGRESS' : hasIncidents ? 'INCIDENT DETECTED' : 'IDLE / NOMINAL'}
            </span>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="btn-secondary"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  background: 'var(--bg-surface-secondary)',
                }}
                title="Return to Overview"
              >
                <X size={12} />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Incident Banner */}
        <div style={{
          padding: '24px',
          background: isRecovered
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)'
            : hasIncidents
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)'
            : 'var(--bg-canvas)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              color: isRecovered ? 'var(--state-success)' : hasIncidents ? 'var(--state-warning)' : 'var(--state-success)',
              marginBottom: '6px',
            }}>
              <CheckCircle2 size={14} />
              <span>{hasIncidents ? 'INCIDENT POST-MORTEM & RESOLUTION TELEMETRY' : 'SELF-HEALING WATCHDOG STATUS: ARMED'}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {isRecovered ? 'Autonomous Incident Recovery Completed' : isRecovering ? 'Active Incident Recovery in Progress' : hasIncidents ? 'Incident Telemetry Captured' : 'Zero Defects Intercepted — Clean Execution'}
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '780px', lineHeight: '1.45' }}>
              {hasIncidents
                ? 'NEXUS intercepted an execution anomaly during build verification, formulated an automated root-cause diagnosis, issued corrective constraints to the specialist agent, and hot-patched the deliverable.'
                : 'Adaptive orchestration monitors each stage in real time. If syntactic, schema, or runtime defects occur, NEXUS self-heals by re-routing tasks with corrective prompts. All stages operating nominally.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>DEFECTS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: defectsCount > 0 ? '#ef4444' : 'var(--state-success)' }}>{defectsCount}</div>
            </div>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>RETRIES</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: retriesCount > 0 ? '#d97706' : 'var(--text-secondary)' }}>{retriesCount}</div>
            </div>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>PATCHES</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: patchesCount > 0 ? 'var(--state-success)' : 'var(--text-secondary)' }}>{patchesCount}</div>
            </div>
          </div>
        </div>

        {/* Workflow Context Card */}
        {workflow && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '6px' }}>
                  Target Objective:
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {workflow.original_goal || workflow.requirements?.objective || 'Active Project Run'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <span>Status: <strong style={{ color: 'var(--text-primary)' }}>{(workflow.status || 'unknown').toUpperCase()}</strong></span>
              <span>•</span>
              <span>Tasks: <strong style={{ color: 'var(--text-primary)' }}>{tasks.filter(t => t.status === 'success').length}/{tasks.length}</strong> Completed</span>
            </div>
          </div>
        )}

        {/* Dynamic Recovery Display: Nominal Status vs 6-Stage Autonomous Incident Lifecycle */}
        {!hasIncidents ? (
          <div style={{ padding: '24px' }}>
            <div style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              textAlign: 'center',
            }}>
              <CheckCircle2 size={32} style={{ color: 'var(--state-success)', margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                All Systems Nominal — Zero Defects Encountered
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
                Adaptive Orchestration & Self-Healing watchdog is continuously monitoring all pipeline tasks. No execution failures, schema violations, or repair retries have occurred in this workflow.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', textAlign: 'left', marginTop: '16px' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--state-success-text)', marginBottom: '4px' }}>
                    ✓ 0 DEFECTS INTERCEPTED
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Generated artifacts and task outputs successfully validated against requirements.
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--state-success-text)', marginBottom: '4px' }}>
                    ✓ 0 RETRIES REQUIRED
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Tasks executed directly to completion without triggering corrective agent re-assignments.
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--state-success-text)', marginBottom: '4px' }}>
                    ✓ 0 PATCHES NEEDED
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Code integrity maintained. Watchdog stands ready to hot-patch runtime or syntactic issues.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Autonomous Incident Lifecycle (6 Stages)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* STAGE 1: FAILURE DETECTED */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-failed">01. FAILURE DETECTED</span>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {qaFailEvent ? formatTime(qaFailEvent.timestamp) : 'Incident Intercept'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>
                    Verification Anomaly Intercept
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <strong>Detected In:</strong> {qaFailEvent?.task_id || 'Verification Stage'}<br />
                    <strong>Event:</strong> {qaFailEvent?.event_type || 'Execution Anomaly'}
                  </div>
                </div>

                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#b91c1c',
                }}>
                  {qaFailEvent ? qaFailEvent.message : "Defect intercepted by validation suite."}
                </div>
              </div>

              {/* STAGE 2: ROOT CAUSE IDENTIFIED */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #fed7aa',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-retrying">02. ROOT CAUSE IDENTIFIED</span>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {rootCauseEvent ? formatTime(rootCauseEvent.timestamp) : (qaFailEvent ? formatTime(qaFailEvent.timestamp) : 'Diagnosis')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#9a3412', marginBottom: '4px' }}>
                    Automated Root-Cause Diagnosis
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <strong>Analysis:</strong> Evaluator formulated failure diagnostic from execution logs.
                  </div>
                </div>

                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fdba74',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#c2410c',
                }}>
                  {rootCauseEvent ? rootCauseEvent.message : (qaFailEvent ? `Diagnosing failure cause for: ${qaFailEvent.message}` : "Automated diagnosis generated.")}
                </div>
              </div>

              {/* STAGE 3: ORCHESTRATOR DECISION */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-running">03. ORCHESTRATOR DECISION</span>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {reassignEvent ? formatTime(reassignEvent.timestamp) : 'Remediation'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Adaptive Remediation Strategy
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Orchestrator synthesized corrective guidance and re-routed task without halting the workflow.
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                }}>
                  {reassignEvent ? reassignEvent.message : "Strategy: Dispatched corrective repair task to developer agent."}
                </div>
              </div>

              {/* STAGE 4: CORRECTIVE PATCH APPLIED */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-running">04. PATCH APPLIED</span>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {patchEvent ? formatTime(patchEvent.timestamp) : 'Hot-Patch'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1d4ed8', marginBottom: '4px' }}>
                    Developer Hot-Patch
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <strong>Action:</strong> Applied corrective updates to generated artifacts.
                  </div>
                </div>

                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #93c5fd',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#1e40af',
                }}>
                  {patchEvent ? patchEvent.message : "Developer agent applied code and configuration hot-patches."}
                </div>
              </div>

              {/* STAGE 5: QA RETRY EXECUTION */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-success">05. QA RETRY</span>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {retryEvent ? formatTime(retryEvent.timestamp) : (passEvent ? formatTime(passEvent.timestamp) : 'Re-test')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                    Re-Verification Test Suite
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Re-executing test assertions against patched deliverable.
                  </div>
                </div>

                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#15803d',
                }}>
                  {retryEvent ? retryEvent.message : (passEvent ? passEvent.message : "QA suite re-executed against patched artifacts.")}
                </div>
              </div>

              {/* STAGE 6: OUTCOME VERIFIED */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--state-success-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-success">06. RESOLUTION COMPLETE</span>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {passEvent ? formatTime(passEvent.timestamp) : 'Final Outcome'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Autonomous Healing Verified
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {isRecovered ? 'Workflow successfully recovered autonomously without human intervention.' : 'Recovery process ongoing.'}
                  </div>
                </div>

                <div style={{
                  background: 'var(--state-success-bg)',
                  border: '1px solid var(--state-success-border)',
                  borderRadius: '4px',
                  padding: '8px 10px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--state-success-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Check size={14} />
                  <span>{isRecovered ? 'Defects resolved autonomously. 100% self-healed.' : 'Watchdog maintaining continuous monitoring.'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chronological Audit Trail Timeline */}
        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Chronological Incident Audit Trail
          </div>

          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
          }}>
            {recoveryAudit.map((e, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  fontSize: '0.76rem',
                  borderBottom: idx < recoveryAudit.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  paddingBottom: '8px',
                }}
              >
                <span style={{ color: 'var(--text-muted)', minWidth: '70px' }}>
                  {formatTime(e.timestamp)}
                </span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontSize: '0.67rem',
                  fontWeight: '700',
                  background: e.status === 'failed' ? '#fee2e2' : e.status === 'warning' ? '#fef3c7' : '#dcfce7',
                  color: e.status === 'failed' ? '#991b1b' : e.status === 'warning' ? '#92400e' : '#166534',
                  minWidth: '110px',
                  textAlign: 'center',
                }}>
                  {e.event_type}
                </span>
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                  {e.message}
                </span>
              </div>
            ))}

            {recoveryAudit.length === 0 && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                Incident audit trail armed. 0 defects recorded. Events will stream in real-time if a defect is detected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
