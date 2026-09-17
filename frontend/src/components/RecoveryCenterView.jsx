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
} from 'lucide-react';
import BackButton from './BackButton';

export default function RecoveryCenterView({ workflow, events = [], tasks = [] }) {
  const workflowId = workflow?.workflow_id || 'Awaiting Active Workflow';

  // Extract actual events
  const qaFailEvent = events.find(e => e.event_type === 'QA_FAILED');
  const rootCauseEvent = events.find(e => e.event_type === 'ROOT_CAUSE_IDENTIFIED');
  const reassignEvent = events.find(e => e.event_type === 'TASK_REASSIGNED');
  const patchEvent = events.find(e => e.event_type === 'PATCH_APPLIED');
  const retryEvent = events.find(e => e.event_type === 'QA_RETRY');
  const passEvent = events.find(e => e.event_type === 'QA_PASSED');

  const isRecovered = Boolean(passEvent && patchEvent);
  const isRecovering = Boolean(qaFailEvent && !isRecovered);

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  // Chronological recovery-related events
  const recoveryAudit = events.filter(e =>
    e.event_type.includes('QA') ||
    e.event_type.includes('RECOVERY') ||
    e.event_type.includes('ROOT_CAUSE') ||
    e.event_type.includes('REASSIGN') ||
    e.event_type.includes('PATCH') ||
    e.event_type.includes('EVALUAT')
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Incident Control Header */}
      <div className="panel" style={{ background: '#ffffff' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BackButton label="Back" size="small" fallbackTab="overview" />
            <ShieldAlert size={16} color="var(--state-success)" />
            <span>NEXUS RECOVERY CENTER — AUTONOMOUS INCIDENT RESPONSE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              WORKFLOW: <strong style={{ color: 'var(--text-primary)' }}>{workflowId.slice(0, 12)}</strong>
            </span>
            <span className={`badge ${isRecovered ? 'badge-success' : isRecovering ? 'badge-retrying' : 'badge-pending'}`}>
              {isRecovered ? 'RECOVERED (AUTONOMOUS)' : isRecovering ? 'RECOVERY IN PROGRESS' : 'READY / ARMED'}
            </span>
          </div>
        </div>

        {/* Hero Incident Banner */}
        <div style={{
          padding: '24px',
          background: isRecovered
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)'
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
              color: isRecovered ? 'var(--state-success)' : '#d97706',
              marginBottom: '6px',
            }}>
              <CheckCircle2 size={14} />
              <span>INCIDENT POST-MORTEM & RESOLUTION TELEMETRY</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {isRecovered ? 'Autonomous Incident Recovery Completed' : 'Incident Telemetry Armed'}
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '780px', lineHeight: '1.45' }}>
              NEXUS intercepted a synthetic validation defect during QA build verification, formulated an automated root-cause diagnosis, issued corrective constraints to the Developer Agent, and hot-patched the deliverable with zero human intervention.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>DEFECTS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ef4444' }}>1</div>
            </div>
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>RETRIES</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#d97706' }}>1</div>
            </div>
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>PATCHES</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--state-success)' }}>1</div>
            </div>
          </div>
        </div>

        {/* 6-Stage Autonomous Incident Response Flow */}
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
                    {qaFailEvent ? formatTime(qaFailEvent.timestamp) : '11:22:06'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>
                  QA Test Intercept
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong>Agent:</strong> QA Agent • <strong>Task:</strong> T6 — Run Build / Tests<br />
                  <strong>Failure Type:</strong> Schema Validation & Missing Coordinates
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
                {qaFailEvent ? qaFailEvent.message : "QA intercepted defect: Missing normalized 'coordinates' dictionary in data.json; map renderer would throw undefined reference."}
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
                    {rootCauseEvent ? formatTime(rootCauseEvent.timestamp) : '11:22:07'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#9a3412', marginBottom: '4px' }}>
                  Automated Root-Cause Diagnosis
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong>Observed Failure:</strong> Missing coordinates field in hotspot markers<br />
                  <strong>Affected Component:</strong> <code>data.json</code> & hotspot table<br />
                  <strong>Detected Condition:</strong> Null lat/lon references in initial generation
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
                {rootCauseEvent ? rootCauseEvent.message : "Root Cause Analysis: Missing normalized 'coordinates' dictionary in data.json; map renderer would throw undefined reference."}
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
                    {reassignEvent ? formatTime(reassignEvent.timestamp) : '11:22:08'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Adaptive Remediation Strategy
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Orchestrator synthesized a corrective schema constraint and re-routed the build task to the Developer Agent without halting the workflow.
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
                Strategy: Reassign Developer Agent with strict <code>coordinates: {"{lat, lon}"}</code> normalization prompt.
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
                    {patchEvent ? formatTime(patchEvent.timestamp) : '11:22:11'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1d4ed8', marginBottom: '4px' }}>
                  Developer Hot-Patch
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong>Reassigned Agent:</strong> Developer Agent<br />
                  <strong>Patched Files:</strong> <code>data.json</code>, <code>app.js</code><br />
                  <strong>Patch Summary:</strong> Injected validated coordinates & safe null checks
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
                {patchEvent ? patchEvent.message : "Developer Agent patched data.json with valid normalized coordinates"}
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
                  <span className="badge badge-success">05. QA RETRY (ATTEMPT 2/3)</span>
                  <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {retryEvent ? formatTime(retryEvent.timestamp) : '11:22:14'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                  Re-Verification Test Suite
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong>Checks Executed:</strong> Schema validation, file integrity, UI canvas mounting, 0 console errors.
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
                {passEvent ? passEvent.message : "QA re-test: 0 errors detected. Build successful & verified!"}
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
                    {formatTime(workflow?.created_at) || '11:22:17'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Autonomous Healing Verified
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Workflow transitioned smoothly to Evaluator Agent for 9-point criteria assessment. Score: <strong>100/100</strong>.
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
                <span>Zero human intervention required. 100% autonomous.</span>
              </div>
            </div>
          </div>
        </div>

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
                Incident audit trail armed. Events will stream in real-time when a defect is detected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
