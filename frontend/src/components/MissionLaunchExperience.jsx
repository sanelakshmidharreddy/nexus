import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Zap, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';

export default function MissionLaunchExperience({
  isOpen,
  onComplete,
  goal = '',
  isBenchmark = false,
  workflow = null,
}) {
  const [percent, setPercent] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const stages = [
    { pct: 0, label: 'INITIALIZING NEXUS', desc: 'Starting autonomous orchestrator runtime...' },
    { pct: 12, label: 'RECEIVING GOAL', desc: isBenchmark ? 'Parsing RoadSafe benchmark mission directive...' : 'Parsing operational mission goal...' },
    { pct: 24, label: 'UNDERSTANDING INTENT', desc: 'Extracting semantic objective & domain constraints...' },
    { pct: 38, label: 'EXTRACTING REQUIREMENTS', desc: 'Synthesizing target features and data requirements...' },
    { pct: 52, label: 'CONSTRUCTING DAG', desc: 'Formulating dependency-aware task graph (T1..T8)...' },
    { pct: 64, label: 'SELECTING SPECIALIST AGENTS', desc: 'Assigning Research, Data, UI, Developer, QA, Evaluator...' },
    { pct: 76, label: 'DISPATCHING EXECUTION', desc: 'Transmitting execution contexts to agent swarm...' },
    { pct: 100, label: 'WORKFLOW LIVE', desc: 'Autonomous DAG execution active in command center.' },
  ];

  const agents = [
    { id: 'research', name: 'Research', role: 'Domain Scoping', icon: '🔍' },
    { id: 'data', name: 'Data', role: 'Metrics Mining', icon: '📊' },
    { id: 'ui', name: 'UI', role: 'Topology & Layout', icon: '🎨' },
    { id: 'developer', name: 'Developer', role: 'Code & Patches', icon: '💻' },
    { id: 'qa', name: 'QA', role: 'Defect Interception', icon: '🛡️' },
    { id: 'evaluator', name: 'Evaluator', role: '9-Point Audit', icon: '🎯' },
  ];

  // Progressive stage progression
  useEffect(() => {
    if (!isOpen) {
      setPercent(0);
      setStageIndex(0);
      setIsFadingOut(false);
      return;
    }

    // Step through the percentages deliberately
    const stageTimeouts = [
      setTimeout(() => { setPercent(12); setStageIndex(1); }, 220),
      setTimeout(() => { setPercent(24); setStageIndex(2); }, 480),
      setTimeout(() => { setPercent(38); setStageIndex(3); }, 780),
      setTimeout(() => { setPercent(52); setStageIndex(4); }, 1120),
      setTimeout(() => { setPercent(64); setStageIndex(5); }, 1450),
      setTimeout(() => { setPercent(76); setStageIndex(6); }, 1780),
      setTimeout(() => { setPercent(100); setStageIndex(7); }, 2150),
      setTimeout(() => {
        setIsFadingOut(true);
      }, 2600),
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2950),
    ];

    return () => stageTimeouts.forEach(clearTimeout);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStage = stages[stageIndex] || stages[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.97) 0%, rgba(2, 6, 23, 0.99) 100%)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
        fontFamily: 'var(--font-sans)',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      {/* Background Animated Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />

      {/* Main Glassmorphic Modal Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '720px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '36px 40px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            borderRadius: '999px',
            background: isBenchmark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            border: `1px solid ${isBenchmark ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
            marginBottom: '16px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            letterSpacing: '0.08em',
            color: isBenchmark ? '#fbbf24' : '#60a5fa',
          }}
        >
          {isBenchmark ? <Sparkles size={13} color="#fbbf24" /> : <Zap size={13} color="#60a5fa" />}
          <span>{isBenchmark ? 'NEXUS BENCHMARK MISSION' : 'NEXUS MISSION LAUNCH'}</span>
        </div>

        {/* Title */}
        <div style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          N E X U S
        </div>
        <div style={{ fontSize: '0.84rem', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '24px' }}>
          Autonomous AI Agent Orchestrator
        </div>

        {/* Goal Directive Snippet */}
        <div
          style={{
            width: '100%',
            background: 'rgba(2, 6, 23, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '0.86rem',
            color: '#e2e8f0',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span style={{ color: '#38bdf8', fontWeight: '700' }}>DIRECTIVE:</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '480px' }}>
            "{goal || 'Build RoadSafe accident analytics dashboard'}"
          </span>
        </div>

        {/* Central Orchestration Radial Network */}
        <div style={{ position: 'relative', width: '380px', height: '170px', marginBottom: '28px' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {/* Lines from center (190, 85) to agent nodes */}
            {agents.map((agent, i) => {
              const angle = (i / agents.length) * 2 * Math.PI - Math.PI / 2;
              const radiusX = 145;
              const radiusY = 62;
              const x = 190 + radiusX * Math.cos(angle);
              const y = 85 + radiusY * Math.sin(angle);
              const isDispatched = stageIndex >= i + 1;

              return (
                <g key={agent.id}>
                  <line
                    x1="190"
                    y1="85"
                    x2={x}
                    y2={y}
                    stroke={isDispatched ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={isDispatched ? '2' : '1'}
                    strokeDasharray={isDispatched ? 'none' : '4 3'}
                    style={{ transition: 'stroke 0.3s ease' }}
                  />
                  {isDispatched && (
                    <circle cx={(190 + x) / 2} cy={(85 + y) / 2} r="2.5" fill="#38bdf8">
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Central Nexus Core Node */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)',
              border: '2px solid #38bdf8',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
            }}
          >
            <Cpu size={24} color="#ffffff" />
          </div>

          {/* 6 Peripheral Agent Nodes */}
          {agents.map((agent, i) => {
            const angle = (i / agents.length) * 2 * Math.PI - Math.PI / 2;
            const radiusX = 145;
            const radiusY = 62;
            const x = 190 + radiusX * Math.cos(angle);
            const y = 85 + radiusY * Math.sin(angle);
            const isDispatched = stageIndex >= i + 1;

            return (
              <div
                key={agent.id}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: isDispatched ? 'rgba(30, 58, 138, 0.9)' : 'rgba(15, 23, 42, 0.75)',
                  border: `1px solid ${isDispatched ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  fontFamily: 'var(--font-mono)',
                  color: isDispatched ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: isDispatched ? '0 0 12px rgba(56, 189, 248, 0.35)' : 'none',
                  transition: 'all 0.3s ease',
                  zIndex: 2,
                }}
              >
                <span>{agent.icon}</span>
                <span>{agent.name}</span>
                {isDispatched && <Check size={11} color="#34d399" />}
              </div>
            );
          })}
        </div>

        {/* Progress Bar & Sequence Telemetry */}
        <div style={{ width: '100%', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  boxShadow: '0 0 8px #38bdf8',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '0.82rem', fontWeight: '700', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: '#f8fafc' }}>
                {currentStage.label}
              </span>
            </div>
            <span style={{ fontSize: '0.94rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {percent}%
            </span>
          </div>

          {/* Progress track */}
          <div
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                borderRadius: '999px',
                transition: 'width 0.28s ease',
                boxShadow: '0 0 12px #38bdf8',
              }}
            />
          </div>
        </div>

        {/* Current Stage Description */}
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', minHeight: '22px' }}>
          {currentStage.desc}
        </div>

        {/* 6 Specialist Checklist Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '8px',
            width: '100%',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {agents.map((agent, i) => {
            const isDone = stageIndex >= i + 1;
            const isCurrent = stageIndex === i;

            return (
              <div
                key={agent.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: isDone ? 1 : isCurrent ? 0.9 : 0.4,
                  transition: 'opacity 0.2s',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isDone ? '#059669' : isCurrent ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    color: '#ffffff',
                    fontWeight: '700',
                  }}
                >
                  {isDone ? '✓' : isCurrent ? '●' : '○'}
                </div>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                  {agent.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
