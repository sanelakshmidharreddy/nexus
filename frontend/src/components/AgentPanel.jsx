import React, { useState } from 'react';
import { Search, Compass, Code2, ShieldCheck, Check, AlertTriangle, RefreshCw, ChevronDown, ChevronRight, FileCode, Layers, Server, Database, Globe, CheckCircle2, XCircle } from 'lucide-react';

export default function AgentPanel({ tasks = [], requirements = null, artifacts = [], evaluation = null, events = [] }) {
  const [expandedAgent, setExpandedAgent] = useState(null);

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

  const toggleExpand = (agentId) => {
    setExpandedAgent(prev => prev === agentId ? null : agentId);
  };

  const renderAgentDetails = (agentId) => {
    if (agentId === 'analyzer') {
      const features = requirements?.requested_features || [];
      const constraints = requirements?.constraints || [];
      const tech = requirements?.technologies_identified || {};
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
          {features.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '5px' }}>
                FEATURES IDENTIFIED ({features.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '0.74rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={11} style={{ color: 'var(--state-success)', marginTop: '2px', flexShrink: 0 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {constraints.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '5px' }}>
                CONSTRAINTS ({constraints.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {constraints.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--state-warning)', fontWeight: 700 }}>•</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tech.frontend && (
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '5px' }}>
                TECHNOLOGIES IDENTIFIED
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <span style={{ padding: '3px 8px', borderRadius: '3px', background: 'var(--state-running-bg)', border: '1px solid var(--state-running-border)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--state-running-text)' }}>
                  <Globe size={10} style={{ display: 'inline', marginRight: '3px' }} />{tech.frontend}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '3px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#166534' }}>
                  <Server size={10} style={{ display: 'inline', marginRight: '3px' }} />{tech.backend}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '3px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#92400e' }}>
                  <Database size={10} style={{ display: 'inline', marginRight: '3px' }} />{tech.database}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (agentId === 'planner') {
      const plan = requirements?.execution_plan || {};
      const apis = plan.apis || requirements?.technologies_identified?.apis || [];
      const features = plan.features || requirements?.requested_features || [];
      const structure = plan.project_structure || [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
            <div style={{ padding: '8px', background: 'var(--bg-canvas)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>FRONTEND</div>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{plan.frontend || requirements?.technologies_identified?.frontend || 'React 18 + Vite'}</div>
            </div>
            <div style={{ padding: '8px', background: 'var(--bg-canvas)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>BACKEND</div>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{plan.backend || requirements?.technologies_identified?.backend || 'FastAPI (Python)'}</div>
            </div>
            <div style={{ padding: '8px', background: 'var(--bg-canvas)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>DATABASE</div>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{plan.database || requirements?.technologies_identified?.database || 'SQLite'}</div>
            </div>
          </div>
          {apis.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '5px' }}>
                API CONTRACTS ({apis.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {apis.map((api, i) => (
                  <div key={i} style={{ padding: '4px 8px', borderRadius: '3px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {api}
                  </div>
                ))}
              </div>
            </div>
          )}
          {structure.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '5px' }}>
                PROJECT STRUCTURE
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {structure.map((s, i) => (
                  <span key={i} style={{ padding: '2px 6px', borderRadius: '3px', background: 'var(--bg-surface-secondary)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (agentId === 'code_generator') {
      const files = artifacts || [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px 12px', borderRadius: '4px', background: 'var(--state-success-bg)', border: '1px solid var(--state-success-border)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--state-success-text)', fontFamily: 'var(--font-mono)' }}>{files.length}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--state-success-text)', marginLeft: '4px' }}>files generated</span>
            </div>
          </div>
          {files.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '5px' }}>
                GENERATED FILES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '200px', overflowY: 'auto' }}>
                {files.map((f, i) => {
                  const name = typeof f === 'string' ? f : f.path || f.name;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 6px', borderRadius: '3px', background: 'var(--bg-canvas)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                      <FileCode size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (agentId === 'evaluator') {
      const checks = evaluation?.checks || [];
      const score = evaluation?.score;
      const passed = evaluation?.passed;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
          {score !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '6px 12px', borderRadius: '4px', background: passed ? 'var(--state-success-bg)' : 'var(--state-failure-bg)', border: `1px solid ${passed ? 'var(--state-success-border)' : 'var(--state-failure-border)'}` }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: passed ? 'var(--state-success-text)' : 'var(--state-failure-text)', fontFamily: 'var(--font-mono)' }}>{score}%</span>
                <span style={{ fontSize: '0.7rem', color: passed ? 'var(--state-success-text)' : 'var(--state-failure-text)', marginLeft: '4px' }}>{passed ? 'PASSED' : 'FAILED'}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {evaluation?.passed_checks || 0}/{evaluation?.total_checks || 0} checks passed
              </span>
            </div>
          )}
          {checks.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '5px' }}>
                VALIDATION CHECKS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {checks.map((chk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                    {chk.passed ? (
                      <CheckCircle2 size={11} style={{ color: 'var(--state-success)', flexShrink: 0 }} />
                    ) : (
                      <XCircle size={11} style={{ color: 'var(--state-failure)', flexShrink: 0 }} />
                    )}
                    <span style={{ color: chk.passed ? 'var(--text-primary)' : 'var(--state-failure-text)' }}>{chk.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
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
        <div className="agent-panel-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
        }}>
          {agents.map((agentDef) => {
            const state = getAgentState(agentDef);
            const Icon = agentDef.icon;
            const isExpanded = expandedAgent === agentDef.id;

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
                onClick={() => toggleExpand(agentDef.id)}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${cardBorder}`,
                  background: cardBg,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                  {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  <span>{isExpanded ? 'COLLAPSE' : 'EXPAND'}</span>
                </div>

                {isExpanded && renderAgentDetails(agentDef.id)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
