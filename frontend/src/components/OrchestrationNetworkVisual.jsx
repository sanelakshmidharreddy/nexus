import React from 'react';
import { Search, Database, Layout, Code2, CheckSquare, Award, Check, AlertTriangle, RefreshCw } from 'lucide-react';

export default function OrchestrationNetworkVisual({ tasks = [], events = [], isVerified = false, isExecuting = false }) {
  // Derive status of each of the 6 agents from real tasks and events
  const getAgentStatus = (agentId) => {
    const agentTasks = tasks.filter(t => t.assigned_agent === agentId);
    if (agentTasks.length === 0) return 'idle';

    if (agentTasks.some(t => t.status === 'running')) return 'running';
    if (agentTasks.some(t => t.status === 'retrying')) return 'retrying';
    if (agentTasks.some(t => t.status === 'failed')) return 'failed';
    if (agentTasks.every(t => t.status === 'success')) return 'success';
    return 'assigned';
  };

  const researchStatus = getAgentStatus('research');
  const dataStatus = getAgentStatus('data');
  const uiStatus = getAgentStatus('ui');
  const devStatus = getAgentStatus('developer');
  const qaStatus = getAgentStatus('qa');
  const evalStatus = getAgentStatus('evaluator');

  // Check if recovery is currently happening (QA retry or developer patch in progress)
  const isRecovering = events.some(e => ['QA_FAILED', 'ROOT_CAUSE_IDENTIFIED', 'TASK_REASSIGNED', 'PATCH_APPLIED', 'QA_RETRY'].includes(e.event_type)) &&
                       !events.some(e => e.event_type === 'QA_PASSED');

  const nodes = [
    { id: 'research', label: 'RESEARCH', x: 175, y: 35, status: researchStatus, icon: Search },
    { id: 'data', label: 'DATA', x: 285, y: 70, status: dataStatus, icon: Database },
    { id: 'ui', label: 'UI', x: 285, y: 150, status: uiStatus, icon: Layout },
    { id: 'developer', label: 'DEVELOPER', x: 175, y: 185, status: devStatus, icon: Code2 },
    { id: 'qa', label: 'QA', x: 65, y: 150, status: qaStatus, icon: CheckSquare },
    { id: 'evaluator', label: 'EVALUATOR', x: 65, y: 70, status: evalStatus, icon: Award },
  ];

  const getNodeColor = (status) => {
    switch (status) {
      case 'success': return { bg: '#ecfdf5', border: '#10b981', text: '#065f46', fill: '#059669' };
      case 'running': return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', fill: '#2563eb' };
      case 'retrying': return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', fill: '#d97706' };
      case 'failed': return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', fill: '#dc2626' };
      default: return { bg: '#ffffff', border: '#cbd5e1', text: '#64748b', fill: '#94a3b8' };
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 16px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xs)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Header bar of visual */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: '700', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          AI ORCHESTRATION TOPOLOGY
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isRecovering && (
            <span className="badge badge-retrying" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
              <RefreshCw size={9} className="status-dot-running" /> RECOVERY ROUTE
            </span>
          )}
          {isVerified ? (
            <span className="badge badge-success" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
              <Check size={9} /> ORCHESTRATION VERIFIED
            </span>
          ) : isExecuting ? (
            <span className="badge badge-running" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
              <span className="status-dot status-dot-running" style={{ width: '5px', height: '5px' }} /> LIVE ACTIVE
            </span>
          ) : (
            <span className="badge badge-pending" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
              READY
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas representing Central NEXUS + 6 Specialists */}
      <div style={{ position: 'relative', width: '100%', height: '210px' }}>
        <svg
          viewBox="0 0 350 220"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            {/* Glow filters */}
            <filter id="nexus-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="line-grad-running" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="line-grad-verified" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="line-grad-recovery" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Background constellation orbit line */}
          <polygon
            points="175,35 285,70 285,150 175,185 65,150 65,70"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="4 4"
            fill="none"
          />

          {/* Connection Lines from Center (175, 110) to Nodes */}
          {nodes.map((node) => {
            const isNodeActive = node.status === 'running';
            const isNodeSuccess = node.status === 'success';
            const strokeColor = isVerified || isNodeSuccess ? '#10b981' : isNodeActive ? '#3b82f6' : '#cbd5e1';
            const strokeWidth = isNodeActive || isVerified ? 2 : 1.2;

            return (
              <line
                key={`line-${node.id}`}
                x1="175"
                y1="110"
                x2={node.x}
                y2={node.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={isNodeActive ? "4 4" : "none"}
                style={isNodeActive ? { animation: 'dash-pulse 1s linear infinite' } : {}}
              />
            );
          })}

          {/* Special Recovery Loop Path (QA [65, 150] -> Developer [175, 185]) */}
          {isRecovering && (
            <path
              d="M 65 150 Q 110 190 175 185"
              fill="none"
              stroke="url(#line-grad-recovery)"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              style={{ animation: 'reverse-dash-pulse 1s linear infinite' }}
            />
          )}

          {/* Satellite Agent Nodes */}
          {nodes.map((node) => {
            const colors = getNodeColor(node.status);
            const isRunning = node.status === 'running';

            return (
              <g key={`node-${node.id}`} transform={`translate(${node.x}, ${node.y})`}>
                {/* Pulsing ring for active agent */}
                {isRunning && (
                  <circle
                    cx="0"
                    cy="0"
                    r="19"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    style={{ animation: 'node-pulse 1.4s infinite ease-in-out' }}
                  />
                )}

                {/* Node Outer Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r="13"
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={isRunning ? "2" : "1.5"}
                  filter={isRunning || node.status === 'success' ? 'url(#nexus-glow)' : 'none'}
                />

                {/* Inner status dot / icon representation */}
                <circle cx="0" cy="0" r="4.5" fill={colors.fill} />

                {/* Label below node */}
                <text
                  x="0"
                  y="23"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="7.5"
                  fontWeight="700"
                  letterSpacing="0.04em"
                  fill={node.status !== 'idle' ? 'var(--text-primary)' : 'var(--text-muted)'}
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          {/* Central NEXUS Orchestrator Node at (175, 110) */}
          <g transform="translate(175, 110)">
            {/* Outer halo when verified or executing */}
            {isVerified ? (
              <circle
                cx="0"
                cy="0"
                r="30"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                style={{ animation: 'dash-pulse 2s linear infinite' }}
              />
            ) : isExecuting && (
              <circle
                cx="0"
                cy="0"
                r="28"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                style={{ animation: 'dash-pulse 2s linear infinite' }}
              />
            )}

            {/* Main Central Sphere */}
            <circle
              cx="0"
              cy="0"
              r="22"
              fill={isVerified ? '#065f46' : isExecuting ? '#0f172a' : '#0f172a'}
              stroke={isVerified ? '#10b981' : isExecuting ? '#3b82f6' : '#334155'}
              strokeWidth="2.5"
              filter={isVerified ? 'url(#nexus-glow)' : 'none'}
            />

            {/* Inner Core */}
            <circle
              cx="0"
              cy="0"
              r="9"
              fill={isVerified ? '#10b981' : isExecuting ? '#3b82f6' : '#ffffff'}
            />

            {/* Text on Central Node */}
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize="8"
              fontWeight="900"
              letterSpacing="0.06em"
              fill={isVerified || isExecuting ? '#ffffff' : '#0f172a'}
            >
              {isVerified ? 'VERIFIED' : 'NEXUS'}
            </text>
          </g>
        </svg>
      </div>

      {/* Mini Architecture Flow legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        paddingTop: '6px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        flexWrap: 'wrap',
      }}>
        <span>PLAN</span>
        <span style={{ color: 'var(--text-faint)' }}>→</span>
        <span>DELEGATE</span>
        <span style={{ color: 'var(--text-faint)' }}>→</span>
        <span>EXECUTE</span>
        <span style={{ color: 'var(--text-faint)' }}>→</span>
        <span style={{ color: isRecovering ? 'var(--state-warning)' : 'inherit', fontWeight: isRecovering ? '700' : 'normal' }}>
          RECOVER
        </span>
        <span style={{ color: 'var(--text-faint)' }}>→</span>
        <span style={{ color: isVerified ? 'var(--state-success)' : 'inherit', fontWeight: isVerified ? '700' : 'normal' }}>
          VERIFY
        </span>
      </div>
    </div>
  );
}
