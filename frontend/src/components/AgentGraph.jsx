import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock, FileCode, ShieldCheck, Rocket, GitPullRequest } from 'lucide-react';

const STAGES = [
  {
    key: 'create',
    label: 'CREATE',
    sub: 'Requirements → Architecture → Code',
    icon: FileCode,
    accentColor: '#2563eb',
    accentBg: 'rgba(37,99,235,0.12)',
    accentBorder: 'rgba(37,99,235,0.35)',
  },
  {
    key: 'test',
    label: 'TEST',
    sub: 'Validation → Testing → Verification',
    icon: ShieldCheck,
    accentColor: '#059669',
    accentBg: 'rgba(5,150,105,0.12)',
    accentBorder: 'rgba(5,150,105,0.35)',
  },
  {
    key: 'deploy',
    label: 'DEPLOY',
    sub: 'Build → Configure → Deployment Ready',
    icon: Rocket,
    accentColor: '#d97706',
    accentBg: 'rgba(217,119,6,0.12)',
    accentBorder: 'rgba(217,119,6,0.35)',
  },
  {
    key: 'collaborate',
    label: 'COLLABORATE',
    sub: 'Documentation → Change Summary → Handoff',
    icon: GitPullRequest,
    accentColor: '#7c3aed',
    accentBg: 'rgba(124,58,237,0.12)',
    accentBorder: 'rgba(124,58,237,0.35)',
  },
];

function statusConfig(status) {
  switch (status) {
    case 'running':
      return { label: 'RUNNING', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.6)', bgAlpha: 'rgba(37,99,235,0.08)' };
    case 'success':
      return { label: 'SUCCESS', color: '#34d399', borderColor: 'rgba(52,211,153,0.6)', bgAlpha: 'rgba(5,150,105,0.08)' };
    case 'failed':
      return { label: 'FAILED', color: '#f87171', borderColor: 'rgba(248,113,113,0.6)', bgAlpha: 'rgba(220,38,38,0.08)' };
    default:
      return { label: 'WAITING', color: '#475569', borderColor: 'rgba(71,85,105,0.25)', bgAlpha: 'transparent' };
  }
}

function StageNode({ stage, status, isLast }) {
  const sc = statusConfig(status);
  const Icon = stage.icon;
  const isRunning = status === 'running';
  const isDone = status === 'success';
  const isFailed = status === 'failed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Node Card */}
      <div
        style={{
          width: '100%',
          background: isDone
            ? 'rgba(5,150,105,0.06)'
            : isFailed
            ? 'rgba(220,38,38,0.06)'
            : isRunning
            ? 'rgba(37,99,235,0.07)'
            : 'rgba(15,23,42,0.04)',
          border: `1px solid ${sc.borderColor}`,
          borderRadius: '8px',
          padding: '14px 16px',
          position: 'relative',
          transition: 'all 200ms ease',
          boxShadow: isRunning ? `0 0 14px ${sc.borderColor}` : 'none',
        }}
      >
        {/* Top row: icon + label + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                background: stage.accentBg,
                border: `1px solid ${stage.accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={15} style={{ color: stage.accentColor }} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: '0.88rem',
                color: '#e2e8f0',
                letterSpacing: '0.04em',
              }}
            >
              {stage.label}
            </span>
          </div>

          {/* Status badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: sc.color,
              background: `${sc.color}18`,
              border: `1px solid ${sc.borderColor}`,
              borderRadius: '4px',
              padding: '2px 7px',
            }}
          >
            {isRunning && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />}
            {isDone && <CheckCircle2 size={10} />}
            {isFailed && <AlertCircle size={10} />}
            {!isRunning && !isDone && !isFailed && <Clock size={10} />}
            {sc.label}
          </div>
        </div>

        {/* Sub-label */}
        <div
          style={{
            fontSize: '0.7rem',
            color: '#64748b',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.01em',
          }}
        >
          {stage.sub}
        </div>

        {/* Running pulse line */}
        {isRunning && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${sc.color}, transparent)`,
              borderRadius: '0 0 8px 8px',
              animation: 'nexus-progress-bar 1.8s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Connector arrow (all but last) */}
      {!isLast && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0',
            margin: '4px 0',
          }}
        >
          <div
            style={{
              width: '1px',
              height: '16px',
              background: isDone ? 'rgba(52,211,153,0.5)' : 'rgba(71,85,105,0.35)',
              transition: 'background 300ms ease',
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `5px solid ${isDone ? 'rgba(52,211,153,0.5)' : 'rgba(71,85,105,0.35)'}`,
              transition: 'border-color 300ms ease',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function AgentGraph({ stageStatuses, activeWorkflow, evaluation, artifacts, tasks }) {
  const wfStatus = activeWorkflow?.status;
  const isCompleted = wfStatus === 'completed';
  const isFailed = wfStatus === 'failed';
  const isRunning = wfStatus === 'running' || wfStatus === 'planned';

  // Execution metrics
  const fileCount = artifacts?.length ?? 0;
  const evalScore = evaluation?.score ?? null;
  const testsPassed = evaluation?.passed_checks ?? null;
  const testsTotal = evaluation?.total_checks ?? null;

  const overallStatusLabel = isCompleted
    ? 'PROJECT READY'
    : isFailed
    ? 'EXECUTION FAILED'
    : isRunning
    ? 'EXECUTING...'
    : activeWorkflow
    ? 'INITIALIZING'
    : 'IDLE';

  const overallStatusColor = isCompleted
    ? '#34d399'
    : isFailed
    ? '#f87171'
    : isRunning
    ? '#60a5fa'
    : '#475569';

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: '10px',
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        border: '1px solid rgba(71,85,105,0.3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(71,85,105,0.2)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: '#475569',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              marginBottom: '3px',
            }}
          >
            NEXUS ORCHESTRATOR
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: overallStatusColor,
              letterSpacing: '0.04em',
            }}
          >
            {overallStatusLabel}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '3px',
          }}
        >
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>
            4 SPECIALISTS
          </div>
          {activeWorkflow?.workflow_id && (
            <div
              style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                color: '#334155',
                background: 'rgba(71,85,105,0.15)',
                padding: '1px 6px',
                borderRadius: '3px',
              }}
            >
              WF-{activeWorkflow.workflow_id.slice(0, 8).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Four-stage node graph */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {STAGES.map((stage, idx) => (
          <StageNode
            key={stage.key}
            stage={stage}
            status={stageStatuses[stage.key] || 'pending'}
            isLast={idx === STAGES.length - 1}
          />
        ))}
      </div>

      {/* Execution Metrics Footer */}
      <div
        style={{
          marginTop: '18px',
          paddingTop: '14px',
          borderTop: '1px solid rgba(71,85,105,0.2)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        {[
          { label: 'FILES', value: fileCount > 0 ? fileCount : 'N/A' },
          {
            label: 'TESTS',
            value: testsPassed !== null ? `${testsPassed}/${testsTotal} PASS` : 'N/A',
          },
          {
            label: 'VALIDATION',
            value: evalScore !== null ? `${evalScore}%` : 'N/A',
          },
          {
            label: 'DEPLOYMENT',
            value: isCompleted ? 'READY' : stageStatuses['deploy'] === 'success' ? 'READY' : 'N/A',
          },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: 'rgba(71,85,105,0.08)',
              borderRadius: '6px',
              padding: '8px 10px',
              border: '1px solid rgba(71,85,105,0.18)',
            }}
          >
            <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: '#475569', letterSpacing: '0.07em' }}>
              {m.label}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: m.value !== 'N/A' ? '#94a3b8' : '#334155',
                marginTop: '2px',
              }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
