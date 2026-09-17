import React from 'react';
import {
  Terminal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GitCommit,
  Layers,
  Users,
  FileCode,
  Check,
  Play,
  ArrowRight,
} from 'lucide-react';
import BackButton from './BackButton';

export default function ExecutionView({ workflow, tasks = [], events = [], logs = [] }) {
  const runningTask = tasks.find(t => t.status === 'running' || t.status === 'retrying');
  const completedTasks = tasks.filter(t => t.status === 'success').length;
  const totalTasks = tasks.length || 8;
  const percentComplete = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Operational Telemetry Bar */}
      <div className="panel" style={{ background: '#ffffff' }}>
        <div className="panel-header">
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BackButton label="Back" size="small" fallbackTab="overview" />
            <Terminal size={15} style={{ color: 'var(--text-muted)' }} />
            <span>Operational DAG Execution Controller</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              MODE: SEQUENTIAL DEPENDENCY EXECUTION (~2.2s CADENCE)
            </span>
          </div>
        </div>

        <div className="panel-body" style={{ padding: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                CURRENT ACTIVE STAGE
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {runningTask ? `${runningTask.task_id} — ${runningTask.assigned_agent.toUpperCase()}` : 'COMPLETED'}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                DAG PROGRESS
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--state-success)' }}>
                {completedTasks} / {totalTasks} Tasks ({percentComplete}%)
              </div>
            </div>

            <div style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                AUTONOMOUS RECOVERIES
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#d97706' }}>
                1 Defect Patched
              </div>
            </div>

            <div style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                EXECUTION CADENCE
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                2.2s / Task
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${percentComplete}%`,
              height: '100%',
              background: percentComplete === 100 ? 'var(--state-success)' : '#2563eb',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Task-By-Task Sequential DAG Cards (Section 28) */}
      <div className="panel" style={{ background: '#ffffff' }}>
        <div className="panel-header">
          <div className="panel-title">
            <Layers size={15} style={{ color: 'var(--text-muted)' }} />
            <span>Dependency-Aware Task Execution Graph (T1..T8)</span>
          </div>
          <span className="badge badge-success">DEPENDENCY ORDER</span>
        </div>

        <div className="panel-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.map((task) => {
            const isTaskRunning = task.status === 'running';
            const isTaskRetrying = task.status === 'retrying';
            const isTaskSuccess = task.status === 'success';
            const isTaskFailed = task.status === 'failed';

            return (
              <div
                key={task.task_id}
                style={{
                  background: isTaskRunning ? '#f0f9ff' : isTaskRetrying ? '#fffbeb' : '#ffffff',
                  border: `1px solid ${
                    isTaskRunning
                      ? '#38bdf8'
                      : isTaskRetrying
                      ? '#fbbf24'
                      : isTaskSuccess
                      ? 'var(--state-success-border)'
                      : 'var(--border-subtle)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: isTaskRunning ? '0 0 15px rgba(56, 189, 248, 0.2)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Header Row: Task ID + Title + Assigned Agent + Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      fontSize: '0.86rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--bg-surface-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      {task.task_id}
                    </span>

                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {task.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      color: 'var(--text-secondary)',
                    }}>
                      <Users size={13} />
                      <span>{task.assigned_agent.toUpperCase()} AGENT</span>
                    </div>

                    <span className={`badge badge-${isTaskSuccess ? 'success' : isTaskRunning ? 'running' : isTaskRetrying ? 'retrying' : isTaskFailed ? 'failed' : 'pending'}`}>
                      {isTaskRunning && <span className="status-dot status-dot-running" />}
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Subtitle / Description */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {task.description}
                </div>

                {/* Dependencies & Duration Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>DEPENDENCIES: </span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {task.dependencies && task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None (Root Task)'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>EST. DURATION: </span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      ~2.2s
                    </span>
                  </div>
                </div>

                {/* Task Output / Artifact */}
                {task.output && (
                  <div style={{
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}>
                    <Check size={14} color="var(--state-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: '1.4' }}>{task.output}</span>
                  </div>
                )}

                {/* Task Error if failed */}
                {task.error && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    color: '#991b1b',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {task.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
