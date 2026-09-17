import React from 'react';
import { Users, Search, Database, Layout, Code2, CheckSquare, Award } from 'lucide-react';

export default function AgentPanel({ tasks }) {
  const agents = [
    {
      id: 'research',
      name: 'Research Agent',
      role: 'Domain Modeling & Requirement Analysis',
      icon: Search,
    },
    {
      id: 'data',
      name: 'Data Agent',
      role: 'Dataset Ingestion, Schema & Hotspots',
      icon: Database,
    },
    {
      id: 'ui',
      name: 'UI Agent',
      role: 'Component Layout & Dashboard Views',
      icon: Layout,
    },
    {
      id: 'developer',
      name: 'Developer Agent',
      role: 'Code Generation & Pipeline Execution',
      icon: Code2,
    },
    {
      id: 'qa',
      name: 'QA Agent',
      role: 'Build Verification & Defect Diagnostics',
      icon: CheckSquare,
    },
    {
      id: 'evaluator',
      name: 'Evaluator Agent',
      role: 'Goal Verification & Requirement Scoring',
      icon: Award,
    },
  ];

  const getAgentState = (agentId) => {
    const agentTasks = tasks.filter(t => t.assigned_agent === agentId);
    if (agentTasks.length === 0) {
      return {
        status: 'STANDBY',
        badgeClass: 'badge-pending',
        activeTask: null,
        lastActivity: 'Awaiting task assignment',
      };
    }
    if (agentTasks.some(t => t.status === 'running')) {
      const runningTask = agentTasks.find(t => t.status === 'running');
      return {
        status: 'RUNNING',
        badgeClass: 'badge-running',
        activeTask: runningTask.task_id,
        lastActivity: runningTask.title,
      };
    }
    if (agentTasks.some(t => t.status === 'retrying')) {
      const retryTask = agentTasks.find(t => t.status === 'retrying');
      return {
        status: 'RETRYING',
        badgeClass: 'badge-retrying',
        activeTask: retryTask.task_id,
        lastActivity: `Retrying: ${retryTask.title}`,
      };
    }
    if (agentTasks.some(t => t.status === 'failed')) {
      const failTask = agentTasks.find(t => t.status === 'failed');
      return {
        status: 'FAILED',
        badgeClass: 'badge-failed',
        activeTask: failTask.task_id,
        lastActivity: `Defect intercepted: ${failTask.title}`,
      };
    }
    if (agentTasks.every(t => t.status === 'success')) {
      return {
        status: 'SUCCESS',
        badgeClass: 'badge-success',
        activeTask: null,
        lastActivity: 'All assigned tasks completed',
      };
    }
    return {
      status: 'ASSIGNED',
      badgeClass: 'badge-pending',
      activeTask: agentTasks[0]?.task_id || null,
      lastActivity: `Planned: ${agentTasks[0]?.title || 'Pending execution'}`,
    };
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <Users size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Specialist Agents Swarm</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          6 SPECIALIST ROLES
        </span>
      </div>

      <div className="panel-body">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
        }}>
          {agents.map((agent) => {
            const Icon = agent.icon;
            const { status, badgeClass, activeTask, lastActivity } = getAgentState(agent.id);
            const agentTasks = tasks.filter(t => t.assigned_agent === agent.id);

            return (
              <div
                key={agent.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {/* Top Row: Icon + Name & Status Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} />
                    </div>

                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${badgeClass}`}>
                    {status}
                  </span>
                </div>

                {/* Details Row: Current Task & Last Activity */}
                <div style={{
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.73rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Tasks:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {agentTasks.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Activity:</span>
                    <span style={{
                      color: 'var(--text-secondary)',
                      fontWeight: '500',
                      textAlign: 'right',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '180px',
                    }}>
                      {lastActivity}
                    </span>
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
