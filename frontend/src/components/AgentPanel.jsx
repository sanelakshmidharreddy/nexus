import React, { useState } from 'react';
import {
  Hammer,
  TestTube,
  Rocket,
  Users,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
} from 'lucide-react';

const STAGES = [
  {
    id: 'create',
    name: 'CREATE',
    role: 'Requirements → Architecture → Code Generation',
    icon: Hammer,
    subSteps: ['Requirements analyzed', 'Architecture prepared', 'Source code generated'],
    taskIds: ['T1', 'T2', 'T3', 'T4', 'T5'],
  },
  {
    id: 'test',
    name: 'TEST',
    role: 'Validation → Testing → Verification',
    icon: TestTube,
    subSteps: ['Syntax validation', 'API contract validation', 'Project verification'],
    taskIds: ['T6'],
  },
  {
    id: 'deploy',
    name: 'DEPLOY',
    role: 'Build → Configure → Deployment Ready',
    icon: Rocket,
    subSteps: ['Production configuration prepared', 'Deployment files generated', 'Deployment readiness verified'],
    taskIds: ['T7'],
  },
  {
    id: 'collaborate',
    name: 'COLLABORATE',
    role: 'Documentation → Change Summary → Developer Handoff',
    icon: Users,
    subSteps: ['README generated', 'Change summary prepared', 'Developer handoff prepared'],
    taskIds: ['T8'],
  },
];

function getFileName(file) {
  return typeof file === 'string' ? file : file.path || file.name || 'Unnamed file';
}

export default function AgentPanel({ tasks = [], requirements = null, artifacts = [], evaluation = null, events = [] }) {
  const [expandedStage, setExpandedStage] = useState(null);

  const getStageState = (stage) => {
    const stageTasks = tasks.filter((task) => stage.taskIds.includes(task.task_id));
    const completedCount = stageTasks.filter((task) => task.status === 'success').length;
    const failedTask = stageTasks.find((task) => task.status === 'failed');
    const runningTask = stageTasks.find((task) => task.status === 'running');

    if (failedTask) {
      return { status: 'FAILED', badgeClass: 'badge-failed', subtitle: `✕ ${failedTask.error || failedTask.title}` };
    }
    if (runningTask) {
      return { status: 'RUNNING', badgeClass: 'badge-running', subtitle: `⟳ ${runningTask.title}` };
    }
    if (stageTasks.length > 0 && completedCount === stageTasks.length) {
      return { status: 'SUCCESS', badgeClass: 'badge-success', subtitle: '✓ Stage completed' };
    }
    return { status: 'WAITING', badgeClass: 'badge-pending', subtitle: '○ Waiting...' };
  };

  const getSubStepStatus = (stage, subStepIdx) => {
    const stageTasks = tasks.filter((task) => stage.taskIds.includes(task.task_id));
    const perStep = Math.ceil(stageTasks.length / stage.subSteps.length);
    const stepTasks = stageTasks.slice(subStepIdx * perStep, (subStepIdx + 1) * perStep);

    if (stepTasks.length === 0) return 'pending';
    if (stepTasks.every((task) => task.status === 'success')) return 'success';
    if (stepTasks.some((task) => task.status === 'failed')) return 'failed';
    if (stepTasks.some((task) => task.status === 'running')) return 'running';
    return 'pending';
  };

  const renderStageDetails = (stageId) => {
    if (stageId === 'create') {
      const features = requirements?.requested_features || [];
      const constraints = requirements?.constraints || [];
      const technologies = requirements?.technologies_identified || {};
      const plan = requirements?.execution_plan || {};
      const apis = plan.apis || technologies.apis || [];
      const structure = plan.project_structure || [];
      const stack = [
        ['Frontend', plan.frontend || technologies.frontend],
        ['Backend', plan.backend || technologies.backend],
        ['Database', plan.database || technologies.database],
      ].filter(([, value]) => value);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {features.length > 0 && (
            <DetailList title={`FEATURES IDENTIFIED (${features.length})`} items={features} icon="check" />
          )}
          {constraints.length > 0 && (
            <DetailList title={`CONSTRAINTS (${constraints.length})`} items={constraints} />
          )}
          {stack.length > 0 && (
            <div>
              <DetailHeading>TECHNOLOGIES IDENTIFIED</DetailHeading>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {stack.map(([label, value]) => (
                  <span key={label} style={{ padding: '4px 8px', borderRadius: '3px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                    <strong>{label}:</strong> {value}
                  </span>
                ))}
              </div>
            </div>
          )}
          {apis.length > 0 && <DetailList title={`API CONTRACTS (${apis.length})`} items={apis} />}
          {structure.length > 0 && <DetailList title="PROJECT STRUCTURE" items={structure} />}
          {features.length === 0 && constraints.length === 0 && stack.length === 0 && apis.length === 0 && structure.length === 0 && (
            <DetailEmpty>No requirement or architecture details available yet.</DetailEmpty>
          )}
        </div>
      );
    }

    if (stageId === 'test') {
      const checks = evaluation?.checks || [];
      const errors = evaluation?.errors || [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {evaluation ? (
            <>
              <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {evaluation.score !== undefined ? `SCORE ${evaluation.score}% · ` : ''}
                {evaluation.passed_checks || 0}/{evaluation.total_checks || checks.length} checks passed
              </div>
              {checks.map((check, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '0.72rem' }}>
                  {check.passed
                    ? <CheckCircle2 size={12} style={{ color: 'var(--state-success)', flexShrink: 0 }} />
                    : <XCircle size={12} style={{ color: 'var(--state-failure)', flexShrink: 0 }} />}
                  <span style={{ color: check.passed ? 'var(--text-primary)' : 'var(--state-failure-text)' }}>
                    <strong>{check.name}</strong>{check.evidence ? ` — ${check.evidence}` : ''}
                  </span>
                </div>
              ))}
              {errors.map((error, index) => (
                <div key={`error-${index}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '0.72rem', color: 'var(--state-failure-text)' }}>
                  <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              ))}
            </>
          ) : (
            <DetailEmpty>Evaluation results will appear here when available.</DetailEmpty>
          )}
        </div>
      );
    }

    if (stageId === 'deploy') {
      return artifacts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
          {artifacts.map((file, index) => (
            <div key={`${getFileName(file)}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <FileCode size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span>{getFileName(file)}</span>
            </div>
          ))}
        </div>
      ) : (
        <DetailEmpty>No generated artifacts available yet.</DetailEmpty>
      );
    }

    const recentEvents = events.slice(-8).reverse();
    return recentEvents.length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
        {recentEvents.map((event, index) => (
          <div key={`${event.event_type || event.message || 'event'}-${index}`} style={{ padding: '6px 8px', borderRadius: '3px', background: 'var(--bg-canvas)', fontSize: '0.72rem' }}>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', marginBottom: '2px' }}>
              {[event.agent, event.event_type, event.status].filter(Boolean).join(' · ')}
            </div>
            <div style={{ color: 'var(--text-primary)' }}>{event.message}</div>
          </div>
        ))}
      </div>
    ) : (
      <DetailEmpty>Workflow events will appear here as the handoff progresses.</DetailEmpty>
    );
  };

  return (
    <div className="panel" style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <div className="panel-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>AGENT PIPELINE</div>
        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>4 PRODUCT STAGES</span>
      </div>

      <div className="panel-body" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STAGES.map((stage, index) => {
            const state = getStageState(stage);
            const Icon = stage.icon;
            const isExpanded = expandedStage === stage.id;
            const color = state.status === 'SUCCESS'
              ? 'var(--state-success)'
              : state.status === 'RUNNING'
                ? 'var(--state-running)'
                : state.status === 'FAILED'
                  ? 'var(--state-failure)'
                  : 'var(--text-muted)';
            const border = state.status === 'SUCCESS'
              ? 'var(--state-success-border)'
              : state.status === 'RUNNING'
                ? 'var(--state-running-border)'
                : state.status === 'FAILED'
                  ? 'var(--state-failure-border)'
                  : 'var(--border-subtle)';

            return (
              <React.Fragment key={stage.id}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedStage((current) => current === stage.id ? null : stage.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setExpandedStage((current) => current === stage.id ? null : stage.id);
                    }
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${border}`,
                    background: state.status === 'SUCCESS' ? 'var(--state-success-bg)' : state.status === 'RUNNING' ? 'var(--state-running-bg)' : state.status === 'FAILED' ? 'var(--state-failure-bg)' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 180ms ease',
                    boxShadow: state.status === 'RUNNING' ? '0 0 0 2px rgba(37,99,235,0.1)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ffffff', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                          {stage.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {stage.role}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${state.badgeClass}`} style={{ fontSize: '0.68rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {state.status === 'SUCCESS' && <CheckCircle2 size={12} />}
                      {state.status === 'RUNNING' && <RefreshCw size={12} className="spin" />}
                      {state.status === 'FAILED' && <AlertTriangle size={12} />}
                      {state.status === 'WAITING' && <Clock size={12} />}
                      {state.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {state.subtitle}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                    {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    <span>{isExpanded ? 'COLLAPSE DETAILS' : 'EXPAND DETAILS'}</span>
                  </div>

                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '4px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
                      {stage.subSteps.map((subStep, subStepIndex) => {
                        const stepStatus = getSubStepStatus(stage, subStepIndex);
                        return (
                          <div key={subStep} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem' }}>
                            {stepStatus === 'success'
                              ? <CheckCircle2 size={13} style={{ color: 'var(--state-success)', flexShrink: 0 }} />
                              : stepStatus === 'failed'
                                ? <XCircle size={13} style={{ color: 'var(--state-failure)', flexShrink: 0 }} />
                                : stepStatus === 'running'
                                  ? <RefreshCw size={13} className="spin" style={{ color: 'var(--state-running)', flexShrink: 0 }} />
                                  : <Clock size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />}
                            <span style={{ color: stepStatus === 'success' ? 'var(--state-success-text)' : stepStatus === 'failed' ? 'var(--state-failure-text)' : 'var(--text-secondary)' }}>
                              {subStep}
                            </span>
                            <span className={`badge ${stepStatus === 'success' ? 'badge-success' : stepStatus === 'failed' ? 'badge-failed' : stepStatus === 'running' ? 'badge-running' : 'badge-pending'}`} style={{ fontSize: '0.6rem', marginLeft: 'auto' }}>
                              {stepStatus === 'success' ? 'DONE' : stepStatus === 'failed' ? 'FAIL' : stepStatus === 'running' ? 'RUN' : 'WAIT'}
                            </span>
                          </div>
                        );
                      })}
                      <div style={{ paddingTop: '9px', borderTop: '1px dashed var(--border-subtle)' }}>
                        {renderStageDetails(stage.id)}
                      </div>
                    </div>
                  )}
                </div>
                {index < STAGES.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0' }}>
                    <div style={{ width: '2px', height: '8px', background: 'var(--border-default)' }} />
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

function DetailHeading({ children }) {
  return (
    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
      {children}
    </div>
  );
}

function DetailList({ title, items, icon }) {
  return (
    <div>
      <DetailHeading>{title}</DetailHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {icon === 'check' && <CheckCircle2 size={11} style={{ color: 'var(--state-success)', marginTop: '2px', flexShrink: 0 }} />}
            <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailEmpty({ children }) {
  return <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{children}</div>;
}
