import React from 'react';
import { History, GitFork, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function SidebarRunHistory({
  workflows = [],
  activeWorkflowId = null,
  onSelectWorkflow = null,
  isLoading = false,
}) {
  return (
    <aside style={{
      width: '280px',
      flexShrink: 0,
      background: '#ffffff',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 'calc(100vh - 58px)',
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.84rem' }}>
          <History size={15} style={{ color: 'var(--text-muted)' }} />
          <span>RUN HISTORY</span>
        </div>
        <span style={{
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          padding: '2px 6px',
          borderRadius: '999px',
          background: 'var(--bg-surface-secondary)',
          color: 'var(--text-muted)',
          fontWeight: '700',
        }}>
          {workflows.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {workflows.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            {isLoading ? 'Loading run history...' : 'No prior runs found. Launch your first project above!'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {workflows.map((wf) => {
              const isSelected = wf.workflow_id === activeWorkflowId;
              const title = wf.requirements?.project_name || wf.original_goal || "Run " + wf.workflow_id.slice(0, 8);
              const isComplete = wf.status === 'completed';
              const isRunning = wf.status === 'running';
              const isFailed = wf.status === 'failed';

              return (
                <div
                  key={wf.workflow_id}
                  onClick={() => onSelectWorkflow && onSelectWorkflow(wf.workflow_id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-xs)',
                    border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--bg-surface-secondary)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 120ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? '700' : '600',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '175px',
                    }}>
                      {title}
                    </span>

                    <span className={`badge ${isComplete ? 'badge-success' : isRunning ? 'badge-running' : isFailed ? 'badge-failed' : 'badge-pending'}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                      {isComplete ? 'READY' : isRunning ? 'RUNNING' : isFailed ? 'FAILED' : 'PLANNED'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>{wf.workflow_id.slice(0, 8)}...</span>
                    <span>{wf.tasks?.length || 6} tasks</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
