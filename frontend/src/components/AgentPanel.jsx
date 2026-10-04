import React, { useState } from 'react';
import { Hammer, TestTube, Rocket, Users, Check, AlertTriangle, RefreshCw, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';

const STAGES = [
  {
    id: 'create',
    name: 'CREATE',
    role: 'Requirements → Architecture → Code Generation',
    icon: Hammer,
    color: '#2563eb',
    subSteps: ['Requirements analyzed', 'Architecture prepared', 'Source code generated'],
    taskIds: ['T1', 'T2', 'T3', 'T4', 'T5'],
  },
  {
    id: 'test',
    name: 'TEST',
    role: 'Validation → Testing → Verification',
    icon: TestTube,
    color: '#059669',
    subSteps: ['Syntax validation', 'API contract validation', 'Project verification'],
    taskIds: ['T6'],
  },
  {
    id: 'deploy',
    name: 'DEPLOY',
    role: 'Build → Configure → Deployment Ready',
    icon: Rocket,
    color: '#d97706',
    subSteps: ['Production configuration prepared', 'Deployment files generated', 'Deployment readiness verified'],
    taskIds: ['T7'],
  },
  {
    id: 'collaborate',
    name: 'COLLABORATE',
    role: 'Documentation → Change Summary → Developer Handoff',
    icon: Users,
    color: '#7c3aed',
    subSteps: ['README generated', 'Change summary prepared', 'Developer handoff prepared'],
    taskIds: ['T8'],
  },
];

export default function AgentPanel({ tasks = [], requirements = null, artifacts = [], evaluation = null, events = [] }) {
  const [expandedStage, setExpandedStage] = useState(null);

  const getStageState = (stage) => {
    const stageTasks = tasks.filter(t => stage.taskIds.includes(t.task_id));
    const totalCount = stageTasks.length;
    const completedCount = stageTasks.filter(t => t.status === 'success').length;
    const failedCount = stageTasks.filter(t => t.status === 'failed').length;
    const runningCount = stageTasks.filter(t => t.status === 'running').length;

    if (totalCount === 0) {
      return { status: 'WAITING', badgeClass: 'badge-pending', subtitle: '○ Waiting...' };
    }
    if (failedCount > 0) {
      const failTask = stageTasks.find(t => t.status === 'failed');
      return { status: 'FAILED', badgeClass: 'badge-failed', subtitle: `✕ ${failTask.error || failTask.title}` };
    }
    if (runningCount > 0) {
      const runningTask = stageTasks.find(t => t.status === 'running');
      return { status: 'RUNNING', badgeClass: 'badge-running', subtitle: `⟳ ${runningTask.title}` };
    }
    if (completedCount === totalCount) {
      return { status: 'SUCCESS', badgeClass: 'badge-success', subtitle: '✓ Stage completed' };
    }
    return { status: 'WAITING', badgeClass: 'badge-pending', subtitle: '○ Waiting...' };
  };

  const getSubStepStatus = (stage, subStepIdx) => {
    const stageTasks = tasks.filter(t => stage.taskIds.includes(t.task_id));
    const perStep = Math.ceil(stageTasks.length / stage.subSteps.length);
    const startIdx = subStepIdx * perStep;
    const endIdx = Math.min(startIdx + perStep, stageTasks.length);
    const stepTasks = stageTasks.slice(startIdx, endIdx);

    if (stepTasks.length === 0) return 'pending';
    if (stepTasks.every(t => t.status === 'success')) return 'success';
    if (stepTasks.some(t => t.status === 'failed')) return 'failed';
    if (stepTasks.some(t => t.status === 'running')) return 'running';
    return 'pending';
  };

  const toggleExpand = (stageId) => {
    setExpandedStage(prev => prev === stageId ? null : stageId);
  };

  return (
    <div className="panel" style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <div className="panel-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.88rem' }}>
          <span>NEXUS AGENT PIPELINE</span>
        </div>
        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          4 SPECIALISTS
        </span>
      </div>

      <div className="panel-body" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STAGES.map((stage, idx) => {
            const state = getStageState(stage);
            const Icon = stage.icon;
            const isExpanded = expandedStage === stage.id;

            let cardBorder = 'var(--border-subtle)';
            let cardBg = '#ffffff';
            let iconColor = 'var(--text-muted)';
            let indicator = null;

            if (state.status === 'SUCCESS') {
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
              indicator = <Clock size={13} style={{ color: 'var(--text-faint)' }} />;
            }

            return (
              <React.Fragment key={stage.id}>
                <div
                  onClick={() => toggleExpand(stage.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${cardBorder}`,
                    background: cardBg,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 180ms ease',
                    position: 'relative',
                    boxShadow: state.status === 'RUNNING' ? '0 0 0 2px rgba(37,99,235,0.1)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: '#ffffff',
                        border: `1px solid ${cardBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: iconColor,
                      }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                          {stage.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {stage.role}
                        </div>
                      </div>
                    </div>

                    <span className={`badge ${state.badgeClass}`} style={{ fontSize: '0.68rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {indicator}
                      <span>{state.status}</span>
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: state.status === 'RUNNING' ? 'var(--state-running-text)' : state.status === 'SUCCESS' ? 'var(--state-success-text)' : 'var(--text-muted)',
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

                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
                      {stage.subSteps.map((subStep, si) => {
                        const stepStatus = getSubStepStatus(stage, si);
                        return (
                          <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem' }}>
                            {stepStatus === 'success' ? (
                              <CheckCircle2 size={13} style={{ color: 'var(--state-success)', flexShrink: 0 }} />
                            ) : stepStatus === 'failed' ? (
                              <XCircle size={13} style={{ color: 'var(--state-failure)', flexShrink: 0 }} />
                            ) : stepStatus === 'running' ? (
                              <RefreshCw size={13} className="spin" style={{ color: 'var(--state-running)', flexShrink: 0 }} />
                            ) : (
                              <Clock size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                            )}
                            <span style={{ color: stepStatus === 'success' ? 'var(--state-success-text)' : stepStatus === 'failed' ? 'var(--state-failure-text)' : 'var(--text-secondary)' }}>
                              {subStep}
                            </span>
                            <span className={`badge ${stepStatus === 'success' ? 'badge-success' : stepStatus === 'failed' ? 'badge-failed' : stepStatus === 'running' ? 'badge-running' : 'badge-pending'}`} style={{ fontSize: '0.6rem', marginLeft: 'auto' }}>
                              {stepStatus === 'success' ? 'DONE' : stepStatus === 'failed' ? 'FAIL' : stepStatus === 'running' ? 'RUN' : 'WAIT'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {idx < STAGES.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                    <div style={{ width: '2px', height: '16px', background: 'var(--border-default)' }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
