import React from 'react';
import { GitBranch, Check, Clock, AlertTriangle, RefreshCw, User, CornerDownRight, ArrowRight, ShieldAlert } from 'lucide-react';

export default function WorkflowGraph({ tasks = [], selectedTaskId, onSelectTask, events = [] }) {
  // Check if recovery has occurred or is active
  const hasRecoveryStarted = events.some(e => ['QA_FAILED', 'ROOT_CAUSE_IDENTIFIED', 'TASK_REASSIGNED', 'PATCH_APPLIED', 'QA_RETRY'].includes(e.event_type)) ||
                             tasks.some(t => t.status === 'retrying' || t.retry_count > 0);
  const isRecoveryCompleted = events.some(e => e.event_type === 'QA_PASSED') ||
                              (hasRecoveryStarted && tasks.find(t => t.assigned_agent === 'qa')?.status === 'success');

  const pipelineSteps = [
    { key: "goal", label: "GOAL", active: tasks.length > 0, completed: tasks.length > 0 },
    { key: "understand", label: "UNDERSTAND", active: tasks.length > 0, completed: tasks.length > 0 },
    { key: "plan", label: "PLAN", active: tasks.length > 0, completed: tasks.length > 0 },
    { key: "agents", label: "AGENT SELECTION", active: tasks.length > 0, completed: tasks.length > 0 },
    {
      key: "execute",
      label: "EXECUTION",
      active: tasks.some(t => ['running', 'retrying', 'success'].includes(t.status)),
      completed: tasks.filter(t => ['developer', 'data', 'ui', 'research'].includes(t.assigned_agent)).every(t => t.status === 'success')
    },
    {
      key: "qa",
      label: "QA",
      active: tasks.some(t => t.assigned_agent === "qa" && ['running', 'failed', 'success'].includes(t.status)),
      failed: events.some(e => e.event_type === 'QA_FAILED') && !isRecoveryCompleted,
      completed: tasks.find(t => t.assigned_agent === 'qa')?.status === 'success'
    },
    {
      key: "recovery",
      label: "RECOVERY",
      active: hasRecoveryStarted && !isRecoveryCompleted,
      completed: isRecoveryCompleted,
      recovering: hasRecoveryStarted && !isRecoveryCompleted,
    },
    {
      key: "evaluate",
      label: "EVALUATION",
      active: tasks.some(t => t.assigned_agent === 'evaluator' && ['running', 'success'].includes(t.status)),
      completed: tasks.find(t => t.assigned_agent === 'evaluator')?.status === 'success'
    },
    {
      key: "verified",
      label: "VERIFIED",
      active: tasks.length > 0 && tasks.every(t => t.status === 'success'),
      completed: tasks.length > 0 && tasks.every(t => t.status === 'success')
    }
  ];

  const getStatusBadge = (status, retries) => {
    switch (status) {
      case 'success':
        return <span className="badge badge-success"><Check size={11} /> SUCCESS</span>;
      case 'running':
        return <span className="badge badge-running"><span className="status-dot status-dot-running" /> RUNNING</span>;
      case 'failed':
        return <span className="badge badge-failed"><AlertTriangle size={11} /> FAILED</span>;
      case 'retrying':
        return <span className="badge badge-retrying"><RefreshCw size={11} className="status-dot-running" /> RETRYING ({retries || 1})</span>;
      default:
        return <span className="badge badge-pending"><Clock size={11} /> PENDING</span>;
    }
  };

  const getAgentLabel = (agent) => {
    switch (agent?.toLowerCase()) {
      case 'research': return 'Research Agent';
      case 'data': return 'Data Agent';
      case 'ui': return 'UI Agent';
      case 'developer': return 'Developer Agent';
      case 'qa': return 'QA Agent';
      case 'evaluator': return 'Evaluator Agent';
      default: return `${agent || 'Specialist'} Agent`;
    }
  };

  return (
    <div className="panel" style={{ background: '#ffffff' }}>
      <div className="panel-header">
        <div className="panel-title">
          <GitBranch size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Topological Task DAG & Dependency Pipeline</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            DAG TOPOLOGY
          </span>
          <span className="badge badge-pending" style={{ background: 'var(--bg-surface-secondary)' }}>
            {tasks.length} {tasks.length === 1 ? 'TASK' : 'TASKS'}
          </span>
        </div>
      </div>

      <div className="panel-body">
        {/* Horizontal Pipeline Stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'var(--bg-surface-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          overflowX: 'auto',
          gap: '4px',
        }}>
          {pipelineSteps.map((step, idx) => {
            const isCompleted = step.completed;
            const isFailed = step.failed;
            const isRecovering = step.recovering;
            const isActive = step.active && !isCompleted;

            return (
              <React.Fragment key={step.key}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 9px',
                  borderRadius: 'var(--radius-xs)',
                  background: isCompleted ? '#ffffff' : isActive ? '#ffffff' : isFailed ? 'var(--state-failure-bg)' : isRecovering ? 'var(--state-warning-bg)' : 'transparent',
                  border: isCompleted
                    ? '1px solid var(--state-success-border)'
                    : isFailed
                    ? '1px solid var(--state-failure-border)'
                    : isRecovering
                    ? '1px solid var(--state-warning-border)'
                    : isActive
                    ? '1px solid #3b82f6'
                    : '1px solid transparent',
                  boxShadow: isActive || isCompleted ? 'var(--shadow-xs)' : 'none',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.62rem',
                    fontWeight: '800',
                    fontFamily: 'var(--font-mono)',
                    background: isCompleted
                      ? 'var(--state-success-bg)'
                      : isFailed
                      ? 'var(--state-failure-bg)'
                      : isRecovering
                      ? 'var(--state-warning-bg)'
                      : isActive
                      ? '#eff6ff'
                      : 'var(--bg-canvas)',
                    color: isCompleted
                      ? 'var(--state-success-text)'
                      : isFailed
                      ? 'var(--state-failure-text)'
                      : isRecovering
                      ? 'var(--state-warning-text)'
                      : isActive
                      ? '#1e40af'
                      : 'var(--text-faint)',
                    border: `1px solid ${
                      isCompleted
                        ? 'var(--state-success-border)'
                        : isFailed
                        ? 'var(--state-failure-border)'
                        : isRecovering
                        ? 'var(--state-warning-border)'
                        : isActive
                        ? '#bfdbfe'
                        : 'var(--border-subtle)'
                    }`,
                  }}>
                    {isCompleted ? '✓' : isFailed ? '!' : isRecovering ? '↻' : idx + 1}
                  </div>

                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: isActive || isCompleted ? '700' : '500',
                    letterSpacing: '0.02em',
                    color: isCompleted
                      ? 'var(--state-success-text)'
                      : isFailed
                      ? 'var(--state-failure-text)'
                      : isRecovering
                      ? 'var(--state-warning-text)'
                      : isActive
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                  }}>
                    {step.label}
                  </span>
                </div>

                {idx < pipelineSteps.length - 1 && (
                  <div style={{
                    width: '12px',
                    height: '1px',
                    background: isCompleted && pipelineSteps[idx + 1].completed ? 'var(--state-success)' : 'var(--border-default)',
                    flexShrink: 0,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Visual Self-Healing Recovery Route Banner */}
        {hasRecoveryStarted && (
          <div style={{
            background: 'var(--state-warning-bg)',
            border: '1px solid var(--state-warning-border)',
            borderRadius: 'var(--radius-xs)',
            padding: '8px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            color: 'var(--state-warning-text)',
            fontFamily: 'var(--font-mono)',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={14} />
              <strong style={{ fontWeight: '700' }}>ADAPTIVE SELF-HEALING LOOP:</strong>
              <span>QA Validation Intercepted</span>
              <span style={{ color: 'var(--border-strong)' }}>→</span>
              <span>Autonomous Root-Cause Diagnosis</span>
              <span style={{ color: 'var(--border-strong)' }}>→</span>
              <span style={{ textDecoration: 'underline', fontWeight: '700' }}>Backward Route to Developer</span>
              <span style={{ color: 'var(--border-strong)' }}>→</span>
              <span>Patch Applied</span>
              <span style={{ color: 'var(--border-strong)' }}>→</span>
              <span>{isRecoveryCompleted ? '✓ QA Verification Passed' : 'QA Re-Executing'}</span>
            </div>
            <span className={`badge ${isRecoveryCompleted ? 'badge-success' : 'badge-retrying'}`}>
              {isRecoveryCompleted ? 'RECOVERED' : 'HEALING'}
            </span>
          </div>
        )}

        {/* Task Nodes List */}
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px 20px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-canvas)',
          }}>
            <div>No active workflow planned yet.</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '4px' }}>
              Submit a directive above to construct the dependency DAG and assign specialists.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map((task) => {
              const isSelected = selectedTaskId === task.task_id;
              const isRunning = task.status === 'running';
              const isRetrying = task.status === 'retrying';
              const isFailed = task.status === 'failed';

              return (
                <div
                  key={task.task_id}
                  onClick={() => onSelectTask(task.task_id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: isSelected ? 'var(--bg-surface-secondary)' : isRunning ? '#eff6ff' : isRetrying ? '#fffbeb' : '#ffffff',
                    border: `1px solid ${
                      isSelected
                        ? 'var(--text-primary)'
                        : isRunning
                        ? '#93c5fd'
                        : isRetrying
                        ? '#fde68a'
                        : isFailed
                        ? '#fecaca'
                        : 'var(--border-subtle)'
                    }`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isRunning ? '0 2px 8px rgba(37, 99, 235, 0.08)' : isSelected ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isRunning) e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isRunning) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  {/* Left: Task ID & Title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '260px' }}>
                    <div style={{
                      padding: '3px 7px',
                      borderRadius: 'var(--radius-xs)',
                      background: isRunning ? '#2563eb' : isRetrying ? '#d97706' : 'var(--bg-surface-secondary)',
                      color: isRunning || isRetrying ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      fontFamily: 'var(--font-mono)',
                      border: `1px solid ${isRunning ? '#2563eb' : isRetrying ? '#d97706' : 'var(--border-default)'}`,
                      lineHeight: '1.2',
                    }}>
                      {task.task_id}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {task.description}
                      </div>
                      {task.error && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--state-failure)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                          Error: {task.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: Assigned Agent & Dependencies */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    {/* Agent badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.74rem',
                      fontWeight: '600',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      <User size={12} style={{ color: 'var(--text-muted)' }} />
                      <span>{getAgentLabel(task.assigned_agent)}</span>
                    </div>

                    {/* Dependencies indicator */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)'
                    }}>
                      <CornerDownRight size={13} style={{ color: 'var(--text-faint)' }} />
                      <span>DEPS:</span>
                      {task.dependencies && task.dependencies.length > 0 ? (
                        task.dependencies.map(dep => (
                          <span
                            key={dep}
                            style={{
                              padding: '1px 5px',
                              background: 'var(--bg-surface-secondary)',
                              borderRadius: '3px',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-subtle)',
                              fontWeight: '700',
                              fontSize: '0.7rem',
                            }}
                          >
                            {dep}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>NONE (ROOT)</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Status badge */}
                  <div>
                    {getStatusBadge(task.status, task.retry_count)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
