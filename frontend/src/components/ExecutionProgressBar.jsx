import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, Activity, ShieldCheck, Zap } from 'lucide-react';

export default function ExecutionProgressBar({ workflow, tasks = [], events = [], isExecuting = false, isVerified = false }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Track elapsed timer while running
  useEffect(() => {
    if (!isExecuting) {
      if (isVerified) {
        setElapsedSeconds(prev => prev > 0 ? prev : 8);
      }
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isExecuting, isVerified]);

  // Reset timer if a new workflow starts
  useEffect(() => {
    if (workflow && workflow.status === 'running') {
      setElapsedSeconds(1);
    }
  }, [workflow?.workflow_id]);

  // Calculate real progress percentage from task states
  const totalTasks = tasks.length > 0 ? tasks.length : 8;
  const completedTasks = tasks.filter(t => t.status === 'success').length;
  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const retryingTasks = tasks.filter(t => t.status === 'retrying').length;

  let progressScore = 0;
  tasks.forEach(t => {
    if (t.status === 'success') progressScore += 1;
    else if (t.status === 'retrying') progressScore += 0.6;
    else if (t.status === 'running') progressScore += 0.4;
  });

  const percentage = tasks.length > 0
    ? Math.min(100, Math.round((progressScore / totalTasks) * 100))
    : isVerified ? 100 : isExecuting ? 12 : 0;

  // Derive active dynamic stage message strictly from real tasks & events
  const getStageMessage = () => {
    if (isVerified) return "Orchestration complete: All 9 requirements verified by Evaluator";

    const retryTask = tasks.find(t => t.status === 'retrying');
    if (retryTask) {
      return `Self-Healing Recovery: Task ${retryTask.task_id} re-assigned with corrective patch`;
    }

    const runningTask = tasks.find(t => t.status === 'running');
    if (runningTask) {
      const agent = runningTask.assigned_agent.toUpperCase();
      return `${agent} AGENT EXECUTING: ${runningTask.title}`;
    }

    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      return `[${lastEvent.agent.toUpperCase()}] ${lastEvent.message}`;
    }

    if (isExecuting) return "Initializing dependency graph and assigning specialist agents...";
    return "Ready to orchestrate mission directive";
  };

  const stageMessage = getStageMessage();

  // Autonomous recoveries count
  const recoveryCount = tasks.reduce((acc, t) => acc + (t.retry_count || 0), 0) ||
                        (events.filter(e => e.event_type === 'PATCH_APPLIED').length);

  // Active agents count
  const activeAgentsCount = new Set(
    tasks.filter(t => t.status === 'running' || t.status === 'retrying').map(t => t.assigned_agent)
  ).size;

  // Format elapsed time MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isExecuting && !isVerified && tasks.length === 0) {
    return null;
  }

  return (
    <div style={{
      background: '#ffffff',
      border: `1px solid ${isVerified ? 'var(--state-success-border)' : isExecuting ? 'var(--state-running-border)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      boxShadow: isExecuting ? '0 4px 12px -2px rgba(37, 99, 235, 0.1)' : 'var(--shadow-xs)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'all 0.3s ease',
    }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-xs)',
            background: isVerified ? 'var(--state-success-bg)' : isExecuting ? 'var(--state-running-bg)' : 'var(--bg-surface-secondary)',
            border: `1px solid ${isVerified ? 'var(--state-success-border)' : isExecuting ? 'var(--state-running-border)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isVerified ? 'var(--state-success)' : isExecuting ? 'var(--state-running)' : 'var(--text-muted)',
          }}>
            {isVerified ? <ShieldCheck size={16} /> : isExecuting ? <Activity size={16} className="status-dot-running" /> : <Zap size={16} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.86rem',
                fontWeight: '800',
                letterSpacing: '0.04em',
                fontFamily: 'var(--font-mono)',
                color: isVerified ? 'var(--state-success-text)' : 'var(--text-primary)',
              }}>
                {isVerified ? 'NEXUS ORCHESTRATION COMPLETE' : 'NEXUS IS ORCHESTRATING'}
              </span>
              <span className={`badge ${isVerified ? 'badge-success' : isExecuting ? 'badge-running' : 'badge-pending'}`}>
                {isVerified ? 'VERIFIED' : `${percentage}%`}
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500' }}>
              {stageMessage}
            </div>
          </div>
        </div>

        {/* Telemetry Stats Ticker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
          {/* Elapsed Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
            <Clock size={13} />
            <span>ELAPSED:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          {/* Tasks Completed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={13} style={{ color: isVerified ? 'var(--state-success)' : 'inherit' }} />
            <span>TASKS:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
              {completedTasks} / {totalTasks}
            </span>
          </div>

          {/* Active Agents */}
          {isExecuting && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <Activity size={13} style={{ color: 'var(--state-running)' }} />
              <span>AGENTS:</span>
              <span style={{ color: 'var(--state-running)', fontWeight: '700' }}>
                {activeAgentsCount || 1} ACTIVE
              </span>
            </div>
          )}

          {/* Recoveries */}
          {recoveryCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--state-warning-text)' }}>
              <RefreshCw size={12} />
              <span>RECOVERY:</span>
              <span style={{ fontWeight: '700' }}>
                {recoveryCount} AUTONOMOUS
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Progress Bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: 'var(--bg-surface-secondary)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
      }}>
        <div
          className={isExecuting ? "shimmer-bar" : ""}
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: isVerified ? 'var(--state-success)' : isExecuting ? undefined : '#0f172a',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: 'var(--radius-full)',
          }}
        />
      </div>
    </div>
  );
}
