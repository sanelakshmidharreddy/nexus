import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Database,
  Layout,
  Code2,
  CheckSquare,
  Award,
  Check,
  RefreshCw,
  Zap,
  Activity,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Layers,
  Cpu,
} from 'lucide-react';

export default function OrchestrationNetworkVisual({
  tasks = [],
  events = [],
  isVerified = false,
  isExecuting = false,
  workflow = null,
  requirements = null,
  onSelectAgent = null,
}) {
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isCoreModalOpen, setIsCoreModalOpen] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Handle subtle pointer parallax
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setParallax({ x, y });
  };

  const handleMouseLeave = () => {
    setParallax({ x: 0, y: 0 });
    setHoveredNode(null);
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCoreModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Derive status of each agent from real tasks and events
  const getAgentStatus = (agentId) => {
    const agentTasks = tasks.filter(t => t.assigned_agent === agentId);
    if (agentTasks.length === 0) return 'standby';

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

  // Recovery detection from real backend events
  const recoveryEvents = events.filter(e =>
    ['QA_FAILED', 'ROOT_CAUSE_IDENTIFIED', 'TASK_REASSIGNED', 'PATCH_APPLIED', 'QA_RETRY'].includes(e.event_type)
  );
  const hasQaPassed = events.some(e => e.event_type === 'QA_PASSED');
  const hasQaFailed = events.some(e => e.event_type === 'QA_FAILED');
  const isRecovering = recoveryEvents.length > 0 && !hasQaPassed && !isVerified;
  const isRecovered = (hasQaPassed && hasQaFailed) || (recoveryEvents.length > 0 && isVerified);

  // Latest recovery phase text
  const getRecoveryLabel = () => {
    if (isRecovered) return '✓ RECOVERED';
    if (!isRecovering) return null;
    const latest = recoveryEvents[recoveryEvents.length - 1]?.event_type;
    switch (latest) {
      case 'QA_FAILED': return 'DEFECT INTERCEPTED';
      case 'ROOT_CAUSE_IDENTIFIED': return 'ROOT CAUSE ISOLATED';
      case 'TASK_REASSIGNED': return 'REASSIGNED TO DEVELOPER';
      case 'PATCH_APPLIED': return 'PATCH APPLIED';
      case 'QA_RETRY': return 'QA RETRY IN PROGRESS';
      default: return 'AUTONOMOUS RECOVERY';
    }
  };

  // Node coordinates (ViewBox 540 x 360, Center at 270, 175, Radius 125)
  const nodes = [
    {
      id: 'research',
      label: 'RESEARCH',
      role: 'Research Agent',
      desc: 'Requirements scoping & benchmark synthesis',
      x: 270,
      y: 50,
      status: researchStatus,
      icon: Search,
      color: '#38bdf8',
    },
    {
      id: 'data',
      label: 'DATA',
      role: 'Data Agent',
      desc: 'Dataset profiling, schema & geospatial hotspots',
      x: 378,
      y: 112,
      status: dataStatus,
      icon: Database,
      color: '#60a5fa',
    },
    {
      id: 'ui',
      label: 'UI',
      role: 'UI Agent',
      desc: 'Interactive component architecture & design tokens',
      x: 378,
      y: 238,
      status: uiStatus,
      icon: Layout,
      color: '#a78bfa',
    },
    {
      id: 'developer',
      label: 'DEVELOPER',
      role: 'Developer Agent',
      desc: 'Full-stack artifact generation & self-healing patches',
      x: 270,
      y: 300,
      status: devStatus,
      icon: Code2,
      color: '#34d399',
    },
    {
      id: 'qa',
      label: 'QA',
      role: 'QA Agent',
      desc: 'Defect interception, schema validation & lint audits',
      x: 162,
      y: 238,
      status: isRecovering ? 'failed' : qaStatus,
      icon: CheckSquare,
      color: isRecovering ? '#f59e0b' : '#fb7185',
    },
    {
      id: 'evaluator',
      label: 'EVALUATOR',
      role: 'Evaluator Agent',
      desc: '9-point objective evidence verification & scoring',
      x: 162,
      y: 112,
      status: evalStatus,
      icon: Award,
      color: '#facc15',
    },
  ];

  // Active running task and telemetry
  const runningTask = tasks.find(t => t.status === 'running') || tasks.find(t => t.status === 'retrying');
  const completedTasksCount = tasks.filter(t => t.status === 'success').length;
  const totalTasksCount = tasks.length > 0 ? tasks.length : 8;
  const activeAgentCount = isVerified
    ? 6
    : isExecuting
    ? Math.max(1, nodes.filter(n => n.status === 'running' || n.status === 'retrying').length)
    : 0;

  // Real verification points count
  const verifiedPointsCount = isVerified
    ? 9
    : Math.min(8, Math.floor((completedTasksCount / totalTasksCount) * 9));

  // Determine active orchestrator stage for footer
  const getCurrentStage = () => {
    if (isVerified) return 'VERIFY';
    if (isRecovering) return 'RECOVER';
    if (isExecuting) {
      if (completedTasksCount >= 1) return 'EXECUTE';
      return 'DELEGATE';
    }
    return 'PLAN';
  };
  const activeStage = getCurrentStage();

  // Central Core State
  const coreState = isVerified
    ? 'VERIFIED'
    : isRecovering
    ? 'RECOVERING'
    : isExecuting
    ? 'ORCHESTRATING'
    : 'READY';

  const getNodeVisuals = (status) => {
    switch (status) {
      case 'success':
        return { fill: '#064e3b', border: '#10b981', text: '#34d399', dot: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' };
      case 'running':
        return { fill: '#1e3a8a', border: '#3b82f6', text: '#93c5fd', dot: '#60a5fa', glow: 'rgba(59, 130, 246, 0.6)' };
      case 'retrying':
        return { fill: '#78350f', border: '#f59e0b', text: '#fde68a', dot: '#fbbf24', glow: 'rgba(245, 158, 11, 0.6)' };
      case 'failed':
        return { fill: '#7f1d1d', border: '#ef4444', text: '#fca5a5', dot: '#f87171', glow: 'rgba(239, 68, 68, 0.6)' };
      default:
        return { fill: '#0f172a', border: '#334155', text: '#94a3b8', dot: '#64748b', glow: 'none' };
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="panel"
      style={{
        background: 'linear-gradient(180deg, #070b14 0%, #0c1427 100%)',
        border: '1px solid #1e293b',
        borderRadius: 'var(--radius-sm)',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 30px -4px rgba(2, 6, 23, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '440px',
        color: '#ffffff',
      }}
    >
      {/* CONTROL PLANE HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isVerified ? '#10b981' : isRecovering ? '#f59e0b' : isExecuting ? '#3b82f6' : '#64748b',
                boxShadow: isVerified
                  ? '0 0 8px #10b981'
                  : isRecovering
                  ? '0 0 8px #f59e0b'
                  : isExecuting
                  ? '0 0 8px #3b82f6'
                  : 'none',
              }}
            />
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
                color: '#f8fafc',
              }}
            >
              NEXUS CONTROL PLANE
            </span>
          </div>

          <span
            style={{
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
              padding: '2px 7px',
              borderRadius: '3px',
              background: isVerified
                ? 'rgba(16, 185, 129, 0.15)'
                : isRecovering
                ? 'rgba(245, 158, 11, 0.2)'
                : isExecuting
                ? 'rgba(59, 130, 246, 0.2)'
                : 'rgba(100, 116, 139, 0.2)',
              color: isVerified ? '#34d399' : isRecovering ? '#fbbf24' : isExecuting ? '#60a5fa' : '#94a3b8',
              border: `1px solid ${
                isVerified
                  ? 'rgba(16, 185, 129, 0.3)'
                  : isRecovering
                  ? 'rgba(245, 158, 11, 0.4)'
                  : isExecuting
                  ? 'rgba(59, 130, 246, 0.4)'
                  : 'rgba(100, 116, 139, 0.3)'
              }`,
            }}
          >
            {isVerified ? '✓ VERIFIED' : isRecovering ? '● RECOVERING' : isExecuting ? '● LIVE' : '○ STANDBY'}
          </span>
        </div>

        {/* Right Header Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>AGENTS:</span>
            <span style={{ color: '#f8fafc', fontWeight: '700' }}>6 SPECIALISTS</span>
          </div>
          <span style={{ color: '#334155' }}>|</span>
          <div
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>DAG TASKS:</span>
            <span style={{ color: '#f8fafc', fontWeight: '700' }}>
              {`${completedTasksCount} / ${totalTasksCount}`}
            </span>
          </div>
        </div>
      </div>

      {/* SVG INTERACTIVE ORCHESTRATION NETWORK */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: '290px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <svg
          viewBox="0 0 540 360"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
          aria-label="NEXUS Live Control Plane AI Agent Topology"
        >
          <defs>
            {/* Background Grid Pattern */}
            <pattern id="cp-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="0.8" fill="rgba(255, 255, 255, 0.08)" />
            </pattern>

            {/* Radial Core Glow */}
            <radialGradient id="ambient-core-glow" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor={isVerified ? '#10b981' : isRecovering ? '#f59e0b' : '#2563eb'}
                stopOpacity="0.16"
              />
              <stop offset="100%" stopColor="#070b14" stopOpacity="0" />
            </radialGradient>

            {/* Core Glow Filter */}
            <filter id="core-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="node-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Signal Particle Glow */}
            <filter id="particle-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Recovery Route Gradient */}
            <linearGradient id="recovery-route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Layer 1: Ambient Parallax Grid */}
          <rect
            x="-20"
            y="-20"
            width="580"
            height="400"
            fill="url(#cp-grid)"
            transform={`translate(${parallax.x * 1}, ${parallax.y * 1})`}
          />

          {/* Layer 2: Ambient Central Glow */}
          <circle
            cx="270"
            cy="175"
            r="160"
            fill="url(#ambient-core-glow)"
            transform={`translate(${parallax.x * 1.5}, ${parallax.y * 1.5})`}
          />

          {/* Layer 3: Concentric Orbital Depth Rings */}
          <g transform={`translate(${parallax.x * 2.5}, ${parallax.y * 2.5})`}>
            {/* Outer Hexagon Constellation Line */}
            <polygon
              points="270,50 378,112 378,238 270,300 162,238 162,112"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              strokeDasharray="4 4"
              fill="none"
            />

            {/* Outer Concentric Orbit (radius 125) - Slow Subtle Rotation (36s) */}
            <circle
              cx="270"
              cy="175"
              r="125"
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="1"
              strokeDasharray="3 8"
              className="control-plane-orbit-ring"
              style={{
                transformOrigin: '270px 175px',
                animation: 'control-plane-orbit-slow 36s linear infinite',
              }}
            />

            {/* Middle Concentric Orbit (radius 82) - Slow Reverse Rotation (48s) */}
            <circle
              cx="270"
              cy="175"
              r="82"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="0.8"
              strokeDasharray="2 6"
              className="control-plane-orbit-ring"
              style={{
                transformOrigin: '270px 175px',
                animation: 'control-plane-orbit-reverse 48s linear infinite',
              }}
            />

            {/* Subtle Crosshairs */}
            <line x1="270" y1="20" x2="270" y2="330" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" strokeDasharray="2 4" />
            <line x1="120" y1="175" x2="420" y2="175" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" strokeDasharray="2 4" />
          </g>

          {/* Layer 4: Real State-Driven Connection Lines */}
          <g transform={`translate(${parallax.x * 2}, ${parallax.y * 2})`}>
            {nodes.map((node) => {
              const isNodeRunning = node.status === 'running';
              const isNodeRetrying = node.status === 'retrying';
              const isNodeSuccess = node.status === 'success';
              const isHovered = hoveredNode === node.id;

              // Line styling based on real execution status
              let lineColor = 'rgba(255, 255, 255, 0.1)';
              let lineWidth = 1;
              let lineDash = 'none';

              if (isVerified || isNodeSuccess) {
                lineColor = 'rgba(16, 185, 129, 0.45)';
                lineWidth = 1.4;
              } else if (isNodeRunning) {
                lineColor = '#3b82f6';
                lineWidth = 2.2;
                lineDash = '4 4';
              } else if (isNodeRetrying) {
                lineColor = '#f59e0b';
                lineWidth = 2.2;
                lineDash = '4 4';
              }

              if (isHovered) {
                lineColor = '#60a5fa';
                lineWidth = 2.4;
              }

              return (
                <g key={`conn-${node.id}`}>
                  <line
                    x1="270"
                    y1="175"
                    x2={node.x}
                    y2={node.y}
                    stroke={lineColor}
                    strokeWidth={lineWidth}
                    strokeDasharray={lineDash}
                    style={isNodeRunning || isNodeRetrying ? { animation: 'dash-pulse 1s linear infinite' } : {}}
                  />

                  {/* LIVE MOVING SIGNAL PARTICLES on active connections */}
                  {isNodeRunning && (
                    <circle r="3.5" fill="#60a5fa" filter="url(#particle-glow)">
                      <animateMotion
                        path={`M 270 175 L ${node.x} ${node.y}`}
                        dur="1.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {isNodeRetrying && (
                    <circle r="3.5" fill="#f59e0b" filter="url(#particle-glow)">
                      <animateMotion
                        path={`M 270 175 L ${node.x} ${node.y}`}
                        dur="1.0s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* SPECIAL AUTONOMOUS RECOVERY ROUTE: QA -> NEXUS -> DEVELOPER */}
            {isRecovering && (
              <g>
                <path
                  d="M 162 238 Q 210 200 270 175 Q 270 240 270 300"
                  fill="none"
                  stroke="url(#recovery-route-grad)"
                  strokeWidth="2.8"
                  strokeDasharray="5 3"
                  style={{ animation: 'reverse-dash-pulse 1.2s linear infinite' }}
                />
                {/* Traveling amber recovery particle */}
                <circle r="4.2" fill="#f59e0b" filter="url(#particle-glow)">
                  <animateMotion
                    path="M 162 238 Q 210 200 270 175 Q 270 240 270 300"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}
          </g>

          {/* Layer 5: Satellite Specialist Agent Nodes */}
          <g transform={`translate(${parallax.x * 2.2}, ${parallax.y * 2.2})`}>
            {nodes.map((node) => {
              const colors = getNodeVisuals(node.status);
              const isRunning = node.status === 'running';
              const isRetrying = node.status === 'retrying';
              const isHovered = hoveredNode === node.id;
              const IconComp = node.icon;

              return (
                <g
                  key={`agent-node-${node.id}`}
                  transform={`translate(${node.x}, ${node.y}) scale(${isHovered ? 1.08 : 1})`}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onSelectAgent?.(node.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${node.label} Agent Workstation`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectAgent?.(node.id);
                    }
                  }}
                >
                  {/* Pulsing ring for active agent */}
                  {(isRunning || isRetrying) && (
                    <circle
                      cx="0"
                      cy="0"
                      r="26"
                      fill="none"
                      stroke={isRetrying ? '#f59e0b' : '#3b82f6'}
                      strokeWidth="1.6"
                      strokeOpacity="0.5"
                      style={{ animation: 'node-pulse 1.4s infinite ease-in-out' }}
                    />
                  )}

                  {/* Ambient Glow for hovered / active node */}
                  {(isHovered || isRunning || node.status === 'success') && (
                    <circle
                      cx="0"
                      cy="0"
                      r="20"
                      fill={colors.glow}
                      filter="url(#node-soft-glow)"
                    />
                  )}

                  {/* Node Outer Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="17"
                    fill={colors.fill}
                    stroke={isHovered ? '#60a5fa' : colors.border}
                    strokeWidth={isRunning || isHovered ? '2.2' : '1.5'}
                  />

                  {/* Inner Node Icon */}
                  <g transform="translate(-7, -7)">
                    <IconComp size={14} color={isHovered ? '#ffffff' : colors.text} />
                  </g>

                  {/* Status Indicator Dot on top right */}
                  <circle
                    cx="11"
                    cy="-11"
                    r="3.5"
                    fill={colors.dot}
                    stroke="#0b1329"
                    strokeWidth="1"
                  />

                  {/* Agent Label */}
                  <text
                    x="0"
                    y="27"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="8"
                    fontWeight="800"
                    letterSpacing="0.06em"
                    fill={isHovered ? '#ffffff' : '#cbd5e1'}
                  >
                    {node.label}
                  </text>

                  {/* Status Sub-badge */}
                  <text
                    x="0"
                    y="36"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="6"
                    fontWeight="700"
                    letterSpacing="0.05em"
                    fill={colors.text}
                  >
                    {node.status.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Layer 6: Central NEXUS Orchestrator Node at (270, 175) */}
          <g
            transform={`translate(270, 175) translate(${parallax.x * 1.8}, ${parallax.y * 1.8})`}
            style={{ cursor: 'pointer' }}
            onClick={() => setIsCoreModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="View Orchestrator Details"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsCoreModalOpen(true);
              }
            }}
          >
            {/* Outer Halo Breathing Ring */}
            <circle
              cx="0"
              cy="0"
              r="48"
              fill="none"
              stroke={
                isVerified
                  ? 'rgba(16, 185, 129, 0.4)'
                  : isRecovering
                  ? 'rgba(245, 158, 11, 0.4)'
                  : isExecuting
                  ? 'rgba(59, 130, 246, 0.4)'
                  : 'rgba(255, 255, 255, 0.1)'
              }
              strokeWidth="1.2"
              strokeDasharray="4 4"
              style={{
                transformOrigin: '0 0',
                animation: 'control-plane-orbit-slow 24s linear infinite',
              }}
            />

            {/* Core Ambient Glow */}
            <circle
              cx="0"
              cy="0"
              r="40"
              fill={
                isVerified
                  ? 'rgba(16, 185, 129, 0.15)'
                  : isRecovering
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)'
              }
              filter="url(#core-glow)"
            />

            {/* Main Central Orchestrator Circle (Radius 36) */}
            <circle
              cx="0"
              cy="0"
              r="36"
              fill={isVerified ? '#064e3b' : isRecovering ? '#451a03' : '#0a1128'}
              stroke={isVerified ? '#10b981' : isRecovering ? '#f59e0b' : isExecuting ? '#3b82f6' : '#475569'}
              strokeWidth="2.4"
            />

            {/* Concentric Inner Ring */}
            <circle
              cx="0"
              cy="0"
              r="30"
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />

            {/* Center Core Brand Text & Icon */}
            <text
              x="0"
              y="-8"
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize="10"
              fontWeight="900"
              letterSpacing="0.08em"
              fill="#ffffff"
            >
              NEXUS
            </text>

            <text
              x="0"
              y="2"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="6"
              fontWeight="700"
              letterSpacing="0.08em"
              fill={isVerified ? '#34d399' : isRecovering ? '#fde68a' : '#93c5fd'}
            >
              ORCHESTRATOR
            </text>

            {/* State Pill inside Center Node */}
            <g transform="translate(0, 14)">
              <rect
                x="-26"
                y="-6"
                width="52"
                height="12"
                rx="6"
                fill={
                  isVerified
                    ? '#059669'
                    : isRecovering
                    ? '#d97706'
                    : isExecuting
                    ? '#2563eb'
                    : '#334155'
                }
              />
              <text
                x="0"
                y="2.5"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="5.5"
                fontWeight="800"
                letterSpacing="0.06em"
                fill="#ffffff"
              >
                {coreState}
              </text>
            </g>
          </g>

          {/* Layer 7: Hover Tooltip Overlay for Agent Node */}
          {hoveredNode && (
            (() => {
              const node = nodes.find(n => n.id === hoveredNode);
              if (!node) return null;
              const tooltipX = Math.max(90, Math.min(450, node.x));
              const tooltipY = node.y > 180 ? node.y - 48 : node.y + 48;
              const agentTasks = tasks.filter(t => t.assigned_agent === node.id);

              return (
                <g transform={`translate(${tooltipX}, ${tooltipY})`} style={{ pointerEvents: 'none' }}>
                  <rect
                    x="-85"
                    y="-24"
                    width="170"
                    height="48"
                    rx="5"
                    fill="#0f172a"
                    stroke="#3b82f6"
                    strokeWidth="1.2"
                    filter="url(#node-soft-glow)"
                  />
                  <text
                    x="0"
                    y="-10"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="7.5"
                    fontWeight="800"
                    fill="#ffffff"
                  >
                    {node.role.toUpperCase()}
                  </text>
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fontFamily="var(--font-sans)"
                    fontSize="6"
                    fill="#94a3b8"
                  >
                    {node.desc.length > 34 ? node.desc.slice(0, 32) + '...' : node.desc}
                  </text>
                  <text
                    x="0"
                    y="12"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="6.5"
                    fontWeight="700"
                    fill={node.status === 'success' ? '#34d399' : '#60a5fa'}
                  >
                    STATUS: {node.status.toUpperCase()} • {agentTasks.length} TASK{agentTasks.length !== 1 ? 'S' : ''}
                  </text>
                </g>
              );
            })()
          )}
        </svg>

        {/* Autonomous Recovery Alert Banner overlay inside canvas */}
        {isRecovering && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '4px',
              padding: '3px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(6px)',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <RefreshCw size={11} color="#f59e0b" className="status-dot-running" />
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                color: '#fbbf24',
                letterSpacing: '0.04em',
              }}
            >
              AUTONOMOUS RECOVERY: {getRecoveryLabel()}
            </span>
          </div>
        )}
      </div>

      {/* LIVE ORCHESTRATION ACTIVITY TICKER */}
      <div
        style={{
          padding: '8px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          color: '#94a3b8',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
          <Activity size={13} color={isVerified ? '#10b981' : isExecuting ? '#3b82f6' : '#64748b'} />
          <span style={{ color: '#64748b', fontWeight: '700' }}>CURRENT ACTIVITY:</span>
          <span style={{ color: '#f8fafc', fontWeight: '600', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {runningTask
              ? `${runningTask.assigned_agent?.toUpperCase()} AGENT: ${runningTask.task_name || runningTask.description}`
              : isVerified
              ? 'NEXUS: Autonomous orchestration & 9-point verification complete'
              : 'NEXUS: Standby awaiting mission directive'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCoreModalOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            textDecoration: 'underline',
            padding: '0',
          }}
        >
          View Telemetry Details
        </button>
      </div>

      {/* REAL-TIME METRICS STRIP */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#070c18',
        }}
      >
        <div style={{ padding: '8px 14px', borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
            ACTIVE AGENTS
          </div>
          <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#f8fafc', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
            {`${activeAgentCount} / 6`}
          </div>
        </div>

        <div style={{ padding: '8px 14px', borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
            DAG TASKS
          </div>
          <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#f8fafc', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
            {`${completedTasksCount} / ${totalTasksCount}`}
          </div>
        </div>

        <div style={{ padding: '8px 14px', borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
            RECOVERIES
          </div>
          <div style={{ fontSize: '0.94rem', fontWeight: '800', color: isRecovering || isRecovered ? '#f59e0b' : '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
            {recoveryEvents.length > 0 ? '1' : '0'}
          </div>
        </div>

        <div style={{ padding: '8px 14px' }}>
          <div style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
            VERIFICATION
          </div>
          <div style={{ fontSize: '0.94rem', fontWeight: '800', color: isVerified ? '#34d399' : '#f8fafc', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
            {isVerified ? '100%' : `${verifiedPointsCount} / 9`}
          </div>
        </div>
      </div>

      {/* CONTROL PLANE FOOTER (Stage Progression) */}
      <div
        style={{
          padding: '8px 18px',
          background: '#050811',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          color: '#64748b',
          flexWrap: 'wrap',
        }}
      >
        {['PLAN', 'DELEGATE', 'EXECUTE', 'RECOVER', 'VERIFY'].map((stage, idx, arr) => {
          const isCurrent = stage === activeStage;
          let stageColor = '#64748b';
          let stageBg = 'transparent';

          if (isCurrent) {
            if (stage === 'VERIFY') {
              stageColor = '#34d399';
              stageBg = 'rgba(16, 185, 129, 0.15)';
            } else if (stage === 'RECOVER') {
              stageColor = '#fbbf24';
              stageBg = 'rgba(245, 158, 11, 0.15)';
            } else {
              stageColor = '#60a5fa';
              stageBg = 'rgba(59, 130, 246, 0.15)';
            }
          }

          return (
            <React.Fragment key={stage}>
              <span
                style={{
                  fontWeight: isCurrent ? '800' : '600',
                  color: stageColor,
                  padding: isCurrent ? '2px 7px' : '2px 4px',
                  borderRadius: '3px',
                  background: stageBg,
                  border: isCurrent ? `1px solid ${stageColor}44` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {stage}
              </span>
              {idx < arr.length - 1 && <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>→</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* ORCHESTRATOR DETAILS MODAL (Opens when clicking central NEXUS node) */}
      {isCoreModalOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(7, 11, 20, 0.92)',
            backdropFilter: 'blur(10px)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="#60a5fa" />
              <span style={{ fontSize: '0.86rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
                NEXUS ORCHESTRATOR CORE TELEMETRY
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCoreModalOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#cbd5e1',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Close Details (ESC)"
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '4px', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.64rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                DIRECTIVE GOAL
              </div>
              <div style={{ fontSize: '0.84rem', color: '#f8fafc', fontWeight: '600', marginTop: '2px' }}>
                {workflow?.original_goal || "Build a RoadSafe-style accident analytics dashboard from this dataset."}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '4px', padding: '10px 14px' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                  CURRENT STAGE
                </div>
                <div style={{ fontSize: '0.84rem', color: isVerified ? '#34d399' : '#60a5fa', fontWeight: '800', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {coreState}
                </div>
              </div>

              <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '4px', padding: '10px 14px' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                  ACTIVE AGENT
                </div>
                <div style={{ fontSize: '0.84rem', color: '#f8fafc', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {runningTask ? runningTask.assigned_agent?.toUpperCase() : isVerified ? 'ALL AGENTS COMPLETE' : 'STANDBY'}
                </div>
              </div>
            </div>

            <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '4px', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.64rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                DEPENDENCY GRAPH ARCHITECTURE
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '3px', lineHeight: '1.4' }}>
                Topological DAG: {totalTasksCount} tasks dispatched sequentially across Research, Data, UI, Developer, QA, and Evaluator. Self-healing loop triggers autonomously upon QA defect detection.
              </div>
            </div>

            {events.length > 0 && (
              <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: '4px', padding: '10px 14px' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                  LATEST ORCHESTRATION EVENT
                </div>
                <div style={{ fontSize: '0.76rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                  [{events[events.length - 1].event_type}] {events[events.length - 1].payload?.message || events[events.length - 1].description || 'Event processed'}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCoreModalOpen(false)}
            className="btn-secondary"
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              fontSize: '0.74rem',
              alignSelf: 'flex-end',
              background: '#1e293b',
              color: '#f8fafc',
              borderColor: '#334155',
            }}
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  );
}
