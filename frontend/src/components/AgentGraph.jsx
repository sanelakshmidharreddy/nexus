import React, { useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCode,
  ShieldCheck,
  Rocket,
  GitPullRequest,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';

const STAGES = [
  {
    key: 'create',
    label: 'CREATE',
    sub: 'Requirements → Architecture → Code',
    icon: FileCode,
    accentColor: '#3b82f6',
    accentBg: 'rgba(37,99,235,0.18)',
    accentBorder: 'rgba(37,99,235,0.4)',
    floatClass: 'animate-float',
  },
  {
    key: 'test',
    label: 'TEST',
    sub: 'Validation → Testing → Verification',
    icon: ShieldCheck,
    accentColor: '#10b981',
    accentBg: 'rgba(5,150,105,0.18)',
    accentBorder: 'rgba(5,150,105,0.4)',
    floatClass: 'animate-float animate-float-delay-1',
  },
  {
    key: 'deploy',
    label: 'DEPLOY',
    sub: 'Build → Configure → Deployment Ready',
    icon: Rocket,
    accentColor: '#f59e0b',
    accentBg: 'rgba(217,119,6,0.18)',
    accentBorder: 'rgba(217,119,6,0.4)',
    floatClass: 'animate-float animate-float-delay-2',
  },
  {
    key: 'collaborate',
    label: 'COLLABORATE',
    sub: 'Documentation → Change Summary → Handoff',
    icon: GitPullRequest,
    accentColor: '#8b5cf6',
    accentBg: 'rgba(124,58,237,0.18)',
    accentBorder: 'rgba(124,58,237,0.4)',
    floatClass: 'animate-float animate-float-delay-3',
  },
];

function statusConfig(status) {
  switch (status) {
    case 'running':
      return { label: 'RUNNING', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.6)', bgAlpha: 'rgba(37,99,235,0.12)' };
    case 'success':
      return { label: 'SUCCESS', color: '#34d399', borderColor: 'rgba(52,211,153,0.6)', bgAlpha: 'rgba(5,150,105,0.12)' };
    case 'failed':
      return { label: 'FAILED', color: '#f87171', borderColor: 'rgba(248,113,113,0.6)', bgAlpha: 'rgba(220,38,38,0.12)' };
    default:
      return { label: 'WAITING', color: '#475569', borderColor: 'rgba(71,85,105,0.3)', bgAlpha: 'transparent' };
  }
}

function StageNode({ stage, status, isLast, requirements, evaluation, artifacts, onSelectFile }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sc = statusConfig(status);
  const Icon = stage.icon;
  const isRunning = status === 'running';
  const isDone = status === 'success';
  const isFailed = status === 'failed';

  // Extract stage-specific details
  const renderStageDetail = () => {
    if (stage.key === 'create') {
      const srcFiles = (artifacts || []).filter(
        a => (a.path || a.name || '').startsWith('frontend/') ||
             (a.path || a.name || '').startsWith('backend/') ||
             (a.path || a.name || '') === 'index.html'
      );
      return (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(71,85,105,0.25)', fontSize: '0.74rem', color: '#94a3b8' }}>
          {requirements?.project_name && (
            <div style={{ marginBottom: '6px', color: '#cbd5e1' }}>
              <span style={{ color: '#64748b' }}>Project: </span>
              <strong>{requirements.project_name}</strong>
            </div>
          )}
          {requirements?.requested_features?.length > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Scoped Features: </span>
              {requirements.requested_features.slice(0, 3).join(', ')}
              {requirements.requested_features.length > 3 && ` +${requirements.requested_features.length - 3} more`}
            </div>
          )}
          {srcFiles.length > 0 ? (
            <div>
              <span style={{ color: '#64748b' }}>Generated Assets ({srcFiles.length}): </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {srcFiles.slice(0, 5).map((f) => {
                  const fname = f.path || f.name;
                  return (
                    <span
                      key={fname}
                      onClick={() => onSelectFile && onSelectFile(fname)}
                      style={{
                        padding: '1px 6px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(148,163,184,0.2)',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.66rem',
                        color: '#93c5fd',
                        cursor: 'pointer',
                      }}
                    >
                      {fname.split('/').pop()}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <span style={{ fontStyle: 'italic', color: '#64748b' }}>
              {isRunning ? 'Synthesizing client and API codebase...' : 'Awaiting prompt dispatch'}
            </span>
          )}
        </div>
      );
    }

    if (stage.key === 'test') {
      const checks = evaluation?.checks || [];
      const score = evaluation?.score;
      return (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(71,85,105,0.25)', fontSize: '0.74rem', color: '#94a3b8' }}>
          {evaluation ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Integrity Audit Score:</span>
                <span style={{ color: score === 100 ? '#34d399' : '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {score}% ({evaluation.passed_checks}/{evaluation.total_checks} checks)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {checks.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem' }}>
                    {c.passed ? (
                      <CheckCircle2 size={11} style={{ color: '#34d399', flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={11} style={{ color: '#f87171', flexShrink: 0 }} />
                    )}
                    <span style={{ color: c.passed ? '#cbd5e1' : '#fca5a5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <span style={{ fontStyle: 'italic', color: '#64748b' }}>
              {isRunning ? 'Running syntax check & API contract validation...' : 'Validation triggers after code generation'}
            </span>
          )}
        </div>
      );
    }

    if (stage.key === 'deploy') {
      return (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(71,85,105,0.25)', fontSize: '0.74rem', color: '#94a3b8' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Runtime: </span>
              <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>FastAPI Uvicorn + Vite React</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Deployment Blueprints: </span>
              <span style={{ color: '#e2e8f0' }}>Render (Backend) + Vercel (Frontend)</span>
            </div>
            {isDone && (
              <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <CheckCircle2 size={11} /> Standalone interactive web preview ready
              </div>
            )}
          </div>
        </div>
      );
    }

    if (stage.key === 'collaborate') {
      return (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(71,85,105,0.25)', fontSize: '0.74rem', color: '#94a3b8' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Documentation: </span>
              <span style={{ color: '#e2e8f0' }}>Project README.md + API Contract Docs</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Handoff Package: </span>
              <span style={{ color: '#e2e8f0' }}>Full-Stack ZIP Archive with setup instructions</span>
            </div>
            {isDone && (
              <div style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Sparkles size={11} /> Ready for review & PR handoff
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Node Card */}
      <div
        style={{
          width: '100%',
          background: isDone
            ? 'rgba(5,150,105,0.08)'
            : isFailed
            ? 'rgba(220,38,38,0.08)'
            : isRunning
            ? 'rgba(37,99,235,0.12)'
            : 'rgba(15,23,42,0.6)',
          border: `1px solid ${sc.borderColor}`,
          borderRadius: '10px',
          padding: '12px 14px',
          position: 'relative',
          transition: 'all 250ms cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: isRunning
            ? '0 0 18px rgba(59, 130, 246, 0.35)'
            : isDone
            ? '0 2px 10px rgba(5, 150, 105, 0.15)'
            : 'none',
        }}
        className={isDone ? 'animate-scale-pop' : ''}
      >
        {/* Top row: icon + label + status badge */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              className={stage.floatClass}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: stage.accentBg,
                border: `1px solid ${stage.accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {isRunning && <span className="animate-pulse-ring" />}
              <Icon size={16} style={{ color: stage.accentColor }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    color: '#f1f5f9',
                    letterSpacing: '0.04em',
                  }}
                >
                  {stage.label}
                </span>
                {isExpanded ? (
                  <ChevronDown size={13} style={{ color: '#64748b' }} />
                ) : (
                  <ChevronRight size={13} style={{ color: '#64748b' }} />
                )}
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: '#64748b',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.01em',
                }}
              >
                {stage.sub}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.64rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: sc.color,
              background: `${sc.color}18`,
              border: `1px solid ${sc.borderColor}`,
              borderRadius: '4px',
              padding: '2px 7px',
            }}
          >
            {isRunning && <Loader2 size={10} className="spin" />}
            {isDone && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'check-draw 400ms ease forwards' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {isFailed && <AlertCircle size={10} />}
            {!isRunning && !isDone && !isFailed && <Clock size={10} />}
            <span>{sc.label}</span>
          </div>
        </div>

        {/* Collapsible detail */}
        {isExpanded && renderStageDetail()}

        {/* Running pulse line */}
        {isRunning && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${sc.color}, transparent)`,
              borderRadius: '0 0 10px 10px',
              animation: 'nexus-progress-bar 1.8s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Connector line between stages */}
      {!isLast && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '3px 0',
            height: '18px',
            position: 'relative',
          }}
        >
          <svg width="12" height="18" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line
              x1="6"
              y1="0"
              x2="6"
              y2="14"
              stroke={isDone ? '#34d399' : isRunning ? '#60a5fa' : 'rgba(71,85,105,0.4)'}
              strokeWidth="2"
              className={isRunning ? 'animate-flow-dash' : ''}
              strokeDasharray={isRunning ? '4 3' : 'none'}
            />
            <polygon
              points="3,12 9,12 6,17"
              fill={isDone ? '#34d399' : isRunning ? '#60a5fa' : 'rgba(71,85,105,0.4)'}
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function AgentGraph({
  stageStatuses = {},
  activeWorkflow = null,
  evaluation = null,
  artifacts = [],
  requirements = null,
  tasks = [],
  onSelectFile = null,
}) {
  const wfStatus = activeWorkflow?.status;
  const isCompleted = wfStatus === 'completed';
  const isFailed = wfStatus === 'failed';
  const isRunning = wfStatus === 'running' || wfStatus === 'planned';

  const completedStages = Object.values(stageStatuses).filter(s => s === 'success').length;

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: '12px',
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Ambient drifting background shapes */}
      <div
        className="animate-drift animate-drift-1"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(30px)',
        }}
      />
      <div
        className="animate-drift animate-drift-2"
        style={{
          position: 'absolute',
          bottom: '-30px',
          right: '-30px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(35px)',
        }}
      />
      <div
        className="animate-drift animate-drift-3"
        style={{
          position: 'absolute',
          top: '40%',
          right: '20%',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(28px)',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(71,85,105,0.25)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              color: '#64748b',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={11} style={{ color: '#38bdf8' }} />
            <span>NEXUS AGENT PIPELINE</span>
          </div>
          <div
            style={{
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: isCompleted ? '#34d399' : isRunning ? '#60a5fa' : isFailed ? '#f87171' : '#94a3b8',
              letterSpacing: '0.03em',
            }}
          >
            {isCompleted
              ? 'PROJECT READY — ALL STAGES VERIFIED'
              : isRunning
              ? 'ORCHESTRATING PIPELINE...'
              : isFailed
              ? 'EXECUTION FAILED'
              : 'PIPELINE STANDBY'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              color: '#38bdf8',
              fontWeight: 700,
              background: 'rgba(56,189,248,0.12)',
              border: '1px solid rgba(56,189,248,0.25)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {completedStages}/4 STAGES
          </div>
        </div>
      </div>

      {/* 4 Stage Nodes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', zIndex: 2 }}>
        {STAGES.map((stage, idx) => (
          <StageNode
            key={stage.key}
            stage={stage}
            status={stageStatuses[stage.key] || 'pending'}
            isLast={idx === STAGES.length - 1}
            requirements={requirements}
            evaluation={evaluation}
            artifacts={artifacts}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(71,85,105,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          color: '#64748b',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span>Agents: 4 specialists</span>
        <span style={{ color: completedStages === 4 ? '#34d399' : '#94a3b8', fontWeight: 700 }}>
          Completed: {completedStages}/4 stages
        </span>
      </div>
    </div>
  );
}
