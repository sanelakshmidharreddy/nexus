import React, { useState, useEffect } from 'react';
import { Terminal, Users, Clock, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';

export default function PersistentExecutionHeader({
  workflow,
  tasks = [],
  events = [],
  isExecuting,
  isVerified,
  onNavigateToExecution,
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Compute elapsed execution time
  useEffect(() => {
    if (!isExecuting) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isExecuting]);

  // Reset timer on new workflow
  useEffect(() => {
    if (workflow?.status === 'running') {
      setElapsedSeconds(0);
    }
  }, [workflow?.workflow_id]);

  if (!workflow && tasks.length === 0) return null;

  // Find currently running task or last completed task
  const runningTask = tasks.find(t => t.status === 'running' || t.status === 'retrying');
  const lastCompletedTask = [...tasks].reverse().find(t => t.status === 'success');
  const activeTask = runningTask || lastCompletedTask || tasks[0];

  const totalTasks = tasks.length || 8;
  const completedTasks = tasks.filter(t => t.status === 'success').length;
  const percentComplete = Math.round((completedTasks / totalTasks) * 100);

  const isRecovering = Boolean(runningTask?.status === 'retrying' || events.some(e => e.event_type.includes('REASSIGN') || e.event_type.includes('RECOVERY')));

  const formatElapsed = (sec) => {
    const mins = Math.floor(sec / 60).toString().padStart(2, '0');
    const remSec = (sec % 60).toString().padStart(2, '0');
    return `${mins}:${remSec}`;
  };

  return (
    <div
      style={{
        background: isRecovering
          ? 'linear-gradient(90deg, #451a03 0%, #1e293b 100%)'
          : isExecuting
          ? 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 100%)'
          : '#ffffff',
        borderBottom: `1px solid ${isExecuting ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-subtle)'}`,
        padding: '10px 28px',
        color: isExecuting || isRecovering ? '#ffffff' : 'var(--text-primary)',
        boxShadow: isExecuting ? '0 4px 20px rgba(15, 23, 42, 0.15)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        transition: 'all 0.3s ease',
        zIndex: 35,
      }}
    >
      {/* Left: Execution Status & Current Task/Agent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Status Chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className={`status-dot ${
              isRecovering
                ? 'status-dot-warning'
                : isExecuting
                ? 'status-dot-running'
                : 'status-dot-success'
            }`}
            style={{ width: '8px', height: '8px' }}
          />
          <span style={{
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '800',
            letterSpacing: '0.08em',
            color: isRecovering ? '#fbbf24' : isExecuting ? '#60a5fa' : 'var(--state-success)',
            textTransform: 'uppercase',
          }}>
            {isRecovering ? 'ADAPTIVE RECOVERY ACTIVE' : isExecuting ? 'LIVE EXECUTION' : 'ORCHESTRATION VERIFIED'}
          </span>
        </div>

        <div style={{ height: '18px', width: '1px', background: isExecuting ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)' }} />

        {/* Task Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: '700' }}>
          <span style={{ color: isExecuting ? '#38bdf8' : 'var(--text-primary)' }}>
            {activeTask?.task_id || 'T1'}
          </span>
          <span style={{ color: isExecuting ? 'rgba(255,255,255,0.4)' : 'var(--text-muted)' }}>/</span>
          <span style={{ color: isExecuting ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
            {totalTasks}
          </span>
        </div>

        {/* Current Specialist Agent */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px',
          borderRadius: '4px',
          background: isExecuting ? 'rgba(255, 255, 255, 0.12)' : 'var(--bg-surface-secondary)',
          border: `1px solid ${isExecuting ? 'rgba(255, 255, 255, 0.2)' : 'var(--border-subtle)'}`,
          fontSize: '0.74rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: '700',
          color: isExecuting ? '#ffffff' : 'var(--text-primary)',
        }}>
          <Users size={12} />
          <span>{activeTask?.assigned_agent?.toUpperCase() || 'ORCHESTRATOR'} AGENT</span>
        </div>

        {/* Current Activity Message */}
        <div style={{
          fontSize: '0.82rem',
          fontWeight: '500',
          color: isExecuting ? '#e2e8f0' : 'var(--text-secondary)',
          maxWidth: '380px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {activeTask?.title || 'Initializing mission plan...'}
        </div>
      </div>

      {/* Right: Telemetry + Progress + Switch to Execution View Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
        {/* Elapsed Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
          <Clock size={13} style={{ color: isExecuting ? '#94a3b8' : 'var(--text-muted)' }} />
          <span style={{ color: isExecuting ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>Elapsed:</span>
          <span style={{ fontWeight: '700', color: isExecuting ? '#ffffff' : 'var(--text-primary)' }}>
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>

        {/* Mini Progress Track */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '80px',
            height: '6px',
            background: isExecuting ? 'rgba(255,255,255,0.15)' : 'var(--bg-surface-secondary)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${percentComplete}%`,
              height: '100%',
              background: isVerified ? 'var(--state-success)' : '#38bdf8',
              borderRadius: '999px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: isExecuting ? '#38bdf8' : 'var(--text-secondary)' }}>
            {percentComplete}%
          </span>
        </div>

        {/* View Execution Details CTA */}
        {onNavigateToExecution && (
          <button
            type="button"
            onClick={onNavigateToExecution}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isExecuting ? 'rgba(255, 255, 255, 0.15)' : 'var(--bg-surface-secondary)',
              border: `1px solid ${isExecuting ? 'rgba(255, 255, 255, 0.25)' : 'var(--border-subtle)'}`,
              color: isExecuting ? '#ffffff' : 'var(--text-primary)',
              borderRadius: 'var(--radius-xs)',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isExecuting ? 'rgba(255, 255, 255, 0.25)' : 'var(--border-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isExecuting ? 'rgba(255, 255, 255, 0.15)' : 'var(--bg-surface-secondary)';
            }}
          >
            <span>Execution View</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
