import React from 'react';
import { Users, Search, Database, Layout, Code2, CheckSquare, Award, Check, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AgentPanel({ tasks = [], onSelectAgent = null, selectedAgentId = null }) {
  const agents = [
    {
      id: 'research',
      name: 'Research Agent',
      role: 'Domain Scoping & Requirements Synthesis',
      icon: Search,
    },
    {
      id: 'data',
      name: 'Data Agent',
      role: 'Dataset Ingestion, Metrics & Hotspot Mining',
      icon: Database,
    },
    {
      id: 'ui',
      name: 'UI Agent',
      role: 'Component Topology & Visualization Layout',
      icon: Layout,
    },
    {
      id: 'developer',
      name: 'Developer Agent',
      role: 'Code Generation, Pipeline Wiring & Patching',
      icon: Code2,
    },
    {
      id: 'qa',
      name: 'QA Agent',
      role: 'Build Verification & Schema Diagnostics',
      icon: CheckSquare,
    },
    {
      id: 'evaluator',
      name: 'Evaluator Agent',
      role: 'Goal Verification & 9-Point Quality Audit',
      icon: Award,
    },
  ];

  const getAgentState = (agentId) => {
    const agentTasks = tasks.filter(t => t.assigned_agent === agentId);
    const totalCount = agentTasks.length;
    const completedCount = agentTasks.filter(t => t.status === 'success').length;

    if (totalCount === 0) {
      return {
        status: 'STANDBY',
        badgeClass: 'badge-pending',
        activeTask: null,
        lastActivity: 'Awaiting task assignment',
        totalCount: 0,
        completedCount: 0,
        isRunning: false,
        isFailed: false,
        isRetrying: false,
      };
    }

    if (agentTasks.some(t => t.status === 'running')) {
      const runningTask = agentTasks.find(t => t.status === 'running');
      return {
        status: 'RUNNING',
        badgeClass: 'badge-running',
        activeTask: runningTask.task_id,
        lastActivity: runningTask.title,
        totalCount,
        completedCount,
        isRunning: true,
        isFailed: false,
        isRetrying: false,
      };
    }

    if (agentTasks.some(t => t.status === 'retrying')) {
      const retryTask = agentTasks.find(t => t.status === 'retrying');
      return {
        status: 'RETRYING',
        badgeClass: 'badge-retrying',
        activeTask: retryTask.task_id,
        lastActivity: `Applying Patch: ${retryTask.title}`,
        totalCount,
        completedCount,
        isRunning: false,
        isFailed: false,
        isRetrying: true,
      };
    }

    if (agentTasks.some(t => t.status === 'failed')) {
      const failTask = agentTasks.find(t => t.status === 'failed');
      return {
        status: 'FAILED',
        badgeClass: 'badge-failed',
        activeTask: failTask.task_id,
        lastActivity: `Defect Detected: ${failTask.title}`,
        totalCount,
        completedCount,
        isRunning: false,
        isFailed: true,
        isRetrying: false,
      };
    }

    if (agentTasks.every(t => t.status === 'success')) {
      return {
        status: 'SUCCESS',
        badgeClass: 'badge-success',
        activeTask: null,
        lastActivity: 'All assigned tasks completed',
        totalCount,
        completedCount,
        isRunning: false,
        isFailed: false,
        isRetrying: false,
      };
    }

    return {
      status: 'PLANNED',
      badgeClass: 'badge-pending',
      activeTask: agentTasks[0]?.task_id || null,
      lastActivity: `Queued: ${agentTasks[0]?.title || 'Pending execution'}`,
      totalCount,
      completedCount,
      isRunning: false,
      isFailed: false,
      isRetrying: false,
    };
  };

  return (
    <div className="panel" style={{ background: '#ffffff' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Users size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Specialist Multi-Agent Swarm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            AUTONOMOUS ROLES (6 SPECIALISTS)
          </span>
        </div>
      </div>

      <div className="panel-body">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
        }}>
          {agents.map((agent) => {
            const Icon = agent.icon;
            const state = getAgentState(agent.id);

            const isSelected = selectedAgentId === agent.id;
            let cardClass = "interactive-agent-card";
            if (state.isRunning) cardClass += " agent-card-active";
            else if (state.isRetrying) cardClass += " agent-card-recovering";
            else if (state.isFailed) cardClass += " agent-card-failed";

            return (
              <div
                key={agent.id}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${agent.name} - Status: ${state.status} - ${state.lastActivity}`}
                className={cardClass}
                onClick={() => onSelectAgent && onSelectAgent(agent.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onSelectAgent) onSelectAgent(agent.id);
                  }
                }}
                style={{
                  background: isSelected ? 'var(--bg-surface-secondary)' : '#ffffff',
                  border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                  position: 'relative',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = isSelected ? 'var(--text-primary)' : 'var(--border-focus)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isSelected ? 'var(--shadow-md)' : 'var(--shadow-xs)';
                  e.currentTarget.style.borderColor = isSelected ? 'var(--text-primary)' : 'var(--border-subtle)';
                }}
                title={`Click to open ${agent.name} Workstation`}
              >
                {/* Top Row: Icon + Name & Status Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-xs)',
                      background: state.isRunning ? '#eff6ff' : 'var(--bg-surface-secondary)',
                      border: `1px solid ${state.isRunning ? '#bfdbfe' : 'var(--border-subtle)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: state.isRunning ? '#2563eb' : 'var(--text-primary)',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {agent.name}
                        </span>
                        {isSelected && (
                          <span style={{
                            fontSize: '0.62rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '800',
                            color: 'var(--text-primary)',
                            background: '#ffffff',
                            border: '1px solid var(--text-primary)',
                            padding: '0 4px',
                            borderRadius: '2px',
                            letterSpacing: '0.04em',
                          }}>
                            [SELECTED]
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${state.badgeClass}`}>
                    {state.isRunning && <span className="status-dot status-dot-running" />}
                    {state.status}
                  </span>
                </div>

                {/* Details Row: Progress & Active Task */}
                <div style={{
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.73rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tasks Progress:</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {state.totalCount > 0 ? `${state.completedCount} / ${state.totalCount} tasks` : '0 tasks'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Current Activity:</span>
                    <span style={{
                      color: state.isRunning ? '#2563eb' : state.isRetrying ? '#d97706' : 'var(--text-secondary)',
                      fontWeight: state.isRunning || state.isRetrying ? '700' : '500',
                      textAlign: 'right',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '180px',
                    }}>
                      {state.lastActivity}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    color: 'var(--text-muted)',
                    fontSize: '0.67rem',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '2px',
                  }}>
                    <span>Inspect Agent</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
