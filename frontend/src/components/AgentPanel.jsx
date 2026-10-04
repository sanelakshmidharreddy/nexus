import React from 'react';
import { Search, Compass, Code2, ShieldCheck, Check, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AgentPanel({ tasks = [], onSelectAgent = null, selectedAgentId = null }) {
  const agents = [
    {
      id: 'analyzer',
      name: 'Analyzer Agent',
      role: 'Requirement Analysis & Feature Scoping',
      description: 'Understands developer prompt, extracts functional features, constraints, and target technology stack.',
      icon: Search,
      aliases: ['analyzer', 'research'],
    },
    {
      id: 'planner',
      name: 'Planner Agent',
      role: 'System Architecture & API Planning',
      description: 'Converts requirements into an execution plan with decoupled client-server architecture, database schemas, and REST routes.',
      icon: Compass,
      aliases: ['planner', 'data', 'ui'],
    },
    {
      id: 'code_generator',
      name: 'Code Generator Agent',
      role: 'Full-Stack Source Code Generation',
      description: 'Generates frontend components, FastAPI backend routes, Pydantic schemas, SQLite models, and web preview.',
      icon: Code2,
      aliases: ['code_generator', 'developer'],
    },
    {
      id: 'evaluator',
      name: 'Evaluator Agent',
      role: 'Automated Integrity & Contract Audit',
      description: 'Validates file existence, non-empty content, dependency manifests, API contract consistency, and sandbox security.',
      icon: ShieldCheck,
      aliases: ['evaluator', 'qa'],
    },
  ];

  const getAgentState = (agentDef) => {
    const agentTasks = tasks.filter(t => agentDef.aliases.includes(t.assigned_agent?.toLowerCase()));
    const totalCount = agentTasks.length;
    const completedCount = agentTasks.filter(t => t.status === 'success').length;

    if (totalCount === 0) {
      return {
        status: 'WAITING',
        statusLabel: 'Waiting',
        iconState: 'waiting',
        badgeClass: 'badge-pending',
        subtitle: '○ Waiting for previous stage...',
        totalCount: 0,
        completedCount: 0,
      };
    }

    if (agentTasks.some(t => t.status === 'running')) {
      const runningTask = agentTasks.find(t => t.status === 'running');
      return {
        status: 'RUNNING',
        statusLabel: 'Running',
        iconState: 'running',
        badgeClass: 'badge-running',
        subtitle: `⟳ ${runningTask.title || 'Executing step...'}`,
        totalCount,
        completedCount,
      };
    }

    if (agentTasks.some(t => t.status === 'failed')) {
      const failTask = agentTasks.find(t => t.status === 'failed');
      return {
        status: 'FAILED',
        statusLabel: 'Failed',
        iconState: 'failed',
        badgeClass: 'badge-failed',
        subtitle: `✕ Defect: ${failTask.error || failTask.title}`,
        totalCount,
        completedCount,
      };
    }

    if (completedCount === totalCount && totalCount > 0) {
      const lastTask = agentTasks[agentTasks.length - 1];
      return {
        status: 'COMPLETED',
        statusLabel: 'Completed',
        iconState: 'completed',
        badgeClass: 'badge-success',
        subtitle: `✓ ${lastTask.output ? lastTask.output.slice(0, 75) + '...' : 'Task execution verified'}`,
        totalCount,
        completedCount,
      };
    }

    return {
      status: 'WAITING',
      statusLabel: 'Waiting',
      iconState: 'waiting',
      badgeClass: 'badge-pending',
      subtitle: '○ Waiting to start',
      totalCount,
      completedCount,
    };
  };

  return (
    <div className="panel" style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <div className="panel-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.88rem' }}>
          <span>MULTI-AGENT DEVELOPMENT PIPELINE</span>
        </div>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          4 SPECIALIZED AUTONOMOUS AGENTS
        </span>
      </div>

      <div className="panel-body" style={{ padding: '16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
        }}>
          {agents.map((agentDef, index) => {
            const state = getAgentState(agentDef);
            const Icon = agentDef.icon;
            const isSelected = selectedAgentId === agentDef.id;

            let cardBorder = 'var(--border-subtle)';
            let cardBg = '#ffffff';
            let iconColor = 'var(--text-muted)';
            let indicator = null;

            if (state.status === 'COMPLETED') {
              cardBorder = 'var(--state-success-border)';
              cardBg = 'var(--state-success-bg)';
              iconColor = 'var(--state-success)';
              indicator = <span style={{ color: 'var(--state-success)', fontWeight: '800' }}>✓</span>;
            } else if (state.status === 'RUNNING') {
              cardBorder = 'var(--state-running-border)';
              cardBg = 'var(--state-running-bg)';
              iconColor = 'var(--state-running)';
              indicator = <RefreshCw size={13} className="spin" style={{ color: 'var(--state-running)' }} />;
            } else if (state.status === 'FAILED') {
              cardBorder = 'var(--state-failure-border)';
              cardBg = 'var(--state-failure-bg)';
              iconColor = 'var(--state-failure)';
              indicator = <AlertTriangle size={13} style={{ color: 'var(--state-failure)' }} />;
            } else {
              indicator = <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>○</span>;
            }

            return (
              <div
                key={agentDef.id}
                onClick={() => onSelectAgent && onSelectAgent(agentDef.id)}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${cardBorder}`,
                  background: cardBg,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: onSelectAgent ? 'pointer' : 'default',
                  transition: 'all 180ms ease',
                  position: 'relative',
                  boxShadow: state.status === 'RUNNING' ? '0 0 0 2px rgba(37,99,235,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: iconColor,
                    }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{agentDef.name}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${state.badgeClass}`} style={{ fontSize: '0.68rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {indicator}
                    <span>{state.status}</span>
                  </span>
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {agentDef.role}
                </div>

                <div style={{
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--border-subtle)',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: state.status === 'RUNNING' ? 'var(--state-running-text)' : state.status === 'COMPLETED' ? 'var(--state-success-text)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {state.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
