import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Database,
  Layout,
  Code2,
  CheckSquare,
  Award,
  Check,
  AlertTriangle,
  RefreshCw,
  FileCode,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  FileText,
  Terminal,
} from 'lucide-react';
import { API_BASE } from '../config';
import BackButton from './BackButton';

export default function AgentDetailDrawer({
  agentId,
  isOpen,
  onClose,
  onOpenFullView = null,
  tasks = [],
  requirements = null,
  events = [],
  artifacts = [],
  evaluation = null,
  workflowId = null,
}) {
  const [isInputContextOpen, setIsInputContextOpen] = useState(true);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Close on Escape key without losing scroll position (Section 27 & 28)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedPreviewFile) {
          setSelectedPreviewFile(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedPreviewFile]);

  if (!isOpen || !agentId) return null;

  const normalizedAgentId = agentId.toLowerCase();

  // Specialist Metadata definitions (Section 4, 12, 13)
  const agentMeta = {
    research: {
      name: 'Research Agent',
      role: 'Domain Scoping & Requirements Synthesis',
      icon: Search,
      color: '#3b82f6',
      bgLight: '#eff6ff',
      whatItDoes: 'Interprets the user goal, establishes domain scope, extracts requirements, and prepares context for downstream agents.',
      microWorkflow: [
        { key: 'RECEIVE', label: 'RECEIVE' },
        { key: 'UNDERSTAND', label: 'UNDERSTAND' },
        { key: 'EXTRACT', label: 'EXTRACT REQUIREMENTS' },
        { key: 'STRUCTURE', label: 'STRUCTURE CONTEXT' },
        { key: 'HANDOFF', label: 'HANDOFF' },
      ],
      dependsOn: 'Goal Directive',
      feeds: 'Data Agent (T2), Planning Context',
      handoffText: 'Requirements Context',
      nextAgent: 'Data Agent',
      defaultArtifacts: ['research.md'],
    },
    data: {
      name: 'Data Agent',
      role: 'Dataset Ingestion, Metrics & Hotspot Mining',
      icon: Database,
      color: '#10b981',
      bgLight: '#ecfdf5',
      whatItDoes: 'Inspects datasets, validates schema, computes analytical metrics, identifies patterns, and prepares structured data outputs.',
      microWorkflow: [
        { key: 'RECEIVE', label: 'RECEIVE DATA' },
        { key: 'SCHEMA', label: 'INSPECT SCHEMA' },
        { key: 'VALIDATE', label: 'CLEAN / VALIDATE' },
        { key: 'ANALYZE', label: 'ANALYZE' },
        { key: 'OUTPUT', label: 'GENERATE DATA OUTPUT' },
      ],
      dependsOn: 'Research Agent (T1)',
      feeds: 'UI Agent (T4), Developer Agent (T5)',
      handoffText: 'Analysis Results & Data Profile',
      nextAgent: 'UI Agent',
      defaultArtifacts: ['data_profile.json', 'analysis_summary.json'],
    },
    ui: {
      name: 'UI Agent',
      role: 'Component Topology & Visualization Layout',
      icon: Layout,
      color: '#8b5cf6',
      bgLight: '#f5f3ff',
      whatItDoes: 'Transforms requirements into dashboard structure, visualization hierarchy, component layout, and interaction requirements.',
      microWorkflow: [
        { key: 'RECEIVE', label: 'RECEIVE REQUIREMENTS' },
        { key: 'LAYOUT', label: 'DEFINE LAYOUT' },
        { key: 'CHARTS', label: 'SELECT VISUALIZATIONS' },
        { key: 'INTERACTION', label: 'DEFINE INTERACTIONS' },
        { key: 'HANDOFF', label: 'HANDOFF TO DEVELOPER' },
      ],
      dependsOn: 'Research Agent (T3), Data Agent (T2)',
      feeds: 'Developer Agent (T5)',
      handoffText: 'UI Specification & Layout Tokens',
      nextAgent: 'Developer Agent',
      defaultArtifacts: ['ui_spec.json'],
    },
    developer: {
      name: 'Developer Agent',
      role: 'Code Generation, Pipeline Wiring & Patching',
      icon: Code2,
      color: '#f59e0b',
      bgLight: '#fffbeb',
      whatItDoes: 'Generates the application code, integrates data and UI components, creates artifacts, and applies corrective patches.',
      microWorkflow: [
        { key: 'RECEIVE', label: 'RECEIVE SPECIFICATION' },
        { key: 'CODE', label: 'GENERATE CODE' },
        { key: 'WRITE', label: 'WRITE FILES' },
        { key: 'BUILD', label: 'BUILD' },
        { key: 'PATCH', label: 'PATCH IF REQUIRED' },
      ],
      dependsOn: 'UI Agent (T4), Data Agent (T2)',
      feeds: 'QA Agent (T6)',
      handoffText: 'Build + Codebase Artifacts',
      nextAgent: 'QA Agent',
      defaultArtifacts: ['index.html', 'styles.css', 'app.js', 'data.json'],
    },
    qa: {
      name: 'QA Agent',
      role: 'Build Verification & Schema Diagnostics',
      icon: CheckSquare,
      color: '#ef4444',
      bgLight: '#fef2f2',
      whatItDoes: 'Validates generated artifacts, runs checks, identifies defects, and verifies that the implementation satisfies technical constraints.',
      microWorkflow: [
        { key: 'RECEIVE', label: 'RECEIVE BUILD' },
        { key: 'CHECKS', label: 'RUN CHECKS' },
        { key: 'DETECT', label: 'DETECT FAILURE' },
        { key: 'REPORT', label: 'REPORT' },
        { key: 'RETEST', label: 'RETEST & VERIFY' },
      ],
      dependsOn: 'Developer Agent (T5)',
      feeds: 'Adaptive Self-Healing Recovery, Evaluator Agent',
      handoffText: 'Validation Result & Test Suite',
      nextAgent: 'Evaluator Agent',
      defaultArtifacts: ['build_report.json'],
    },
    evaluator: {
      name: 'Evaluator Agent',
      role: 'Goal Verification & 9-Point Quality Audit',
      icon: Award,
      color: '#06b6d4',
      bgLight: '#ecfeff',
      whatItDoes: 'Checks the completed deliverable against the original goal and verifies explicit requirements using evidence from the workflow.',
      microWorkflow: [
        { key: 'RECEIVE', label: 'RECEIVE DELIVERABLE' },
        { key: 'CHECK', label: 'CHECK REQUIREMENTS' },
        { key: 'VERIFY', label: 'VERIFY EVIDENCE' },
        { key: 'ASSESS', label: 'ASSESS OUTPUT' },
        { key: 'FINAL', label: 'FINAL VERIFICATION' },
      ],
      dependsOn: 'QA Agent (T6), Patched Deliverable (T7)',
      feeds: 'Final Verified Mission Outcome',
      handoffText: 'Evaluation Score & Acceptance Matrix',
      nextAgent: 'Verified Deliverable',
      defaultArtifacts: ['evaluation.json'],
    },
  };

  const currentMeta = agentMeta[normalizedAgentId] || agentMeta.research;
  const Icon = currentMeta.icon;

  // Real backend tasks assigned to this agent (Section 6)
  const agentTasks = tasks.filter(t => t.assigned_agent?.toLowerCase() === normalizedAgentId);
  const totalCount = agentTasks.length;
  const completedCount = agentTasks.filter(t => t.status === 'success').length;

  const runningTask = agentTasks.find(t => t.status === 'running');
  const retryingTask = agentTasks.find(t => t.status === 'retrying');
  const failedTask = agentTasks.find(t => t.status === 'failed');
  const isRunning = Boolean(runningTask);
  const isRetrying = Boolean(retryingTask);
  const isFailed = Boolean(failedTask);
  const isAllSuccess = totalCount > 0 && agentTasks.every(t => t.status === 'success');
  const isStandby = totalCount === 0 || (!isRunning && !isRetrying && !isFailed && !isAllSuccess);

  // Derive Real Status Badge (Section 2)
  const statusBadge = isRunning
    ? { label: '● RUNNING', cls: 'badge-running', color: '#2563eb' }
    : isRetrying
    ? { label: '↻ RETRYING / PATCHING', cls: 'badge-retrying', color: '#d97706' }
    : isFailed
    ? { label: '! FAILED', cls: 'badge-failed', color: '#dc2626' }
    : isAllSuccess
    ? { label: '✓ SUCCESS', cls: 'badge-success', color: '#059669' }
    : { label: '○ STANDBY', cls: 'badge-pending', color: '#64748b' };

  // Filter real events for this agent (Section 8)
  const agentEvents = events.filter(e => {
    const evAgent = e.agent?.toLowerCase() || '';
    if (evAgent === normalizedAgentId) return true;
    if (normalizedAgentId === 'qa' && (e.event_type?.includes('QA') || e.event_type?.includes('RECOVERY') || e.event_type?.includes('ROOT_CAUSE'))) return true;
    if (normalizedAgentId === 'developer' && (e.event_type?.includes('PATCH') || e.event_type?.includes('REASSIGN'))) return true;
    return false;
  });

  // Safe artifact lookup (Section 11)
  const agentArtifactNames = (artifacts && artifacts.length > 0)
    ? artifacts.map(a => typeof a === 'string' ? a : (a.name || a.file_name || a.path || '')).filter(Boolean)
    : currentMeta.defaultArtifacts;

  const relevantArtifacts = agentArtifactNames.filter(name => {
    const n = name.toLowerCase();
    if (normalizedAgentId === 'research') return n.includes('research') || n.endsWith('.md');
    if (normalizedAgentId === 'data') return n.includes('data') || n.includes('summary');
    if (normalizedAgentId === 'ui') return n.includes('ui');
    if (normalizedAgentId === 'developer') return n.includes('html') || n.includes('css') || n.includes('app.js') || n.includes('data.json');
    if (normalizedAgentId === 'qa') return n.includes('qa') || n.includes('report') || n.includes('test');
    if (normalizedAgentId === 'evaluator') return n.includes('eval');
    return true;
  });

  const displayArtifacts = relevantArtifacts.length > 0 ? relevantArtifacts : currentMeta.defaultArtifacts;

  // Real micro-workflow stage progression state (Section 5)
  const getMicroWorkflowNodeState = (index) => {
    if (isStandby) return { icon: '○', status: 'pending', cls: 'node-pending' };
    if (isAllSuccess) return { icon: '✓', status: 'completed', cls: 'node-completed' };
    if (isFailed && index === 2) return { icon: '!', status: 'failed', cls: 'node-failed' };
    if (isRetrying && index === 4) return { icon: '↻', status: 'retrying', cls: 'node-retrying' };

    // During running, highlight based on progress
    if (isRunning) {
      if (index === 0) return { icon: '✓', status: 'completed', cls: 'node-completed' };
      if (index === 1) return { icon: '✓', status: 'completed', cls: 'node-completed' };
      if (index === 2) return { icon: '●', status: 'running', cls: 'node-running' };
      return { icon: '○', status: 'pending', cls: 'node-pending' };
    }
    return { icon: '✓', status: 'completed', cls: 'node-completed' };
  };

  // Open inline file preview
  const handleOpenFilePreview = async (fileName) => {
    if (!workflowId) return;
    setSelectedPreviewFile(fileName);
    setLoadingPreview(true);
    try {
      const res = await fetch(`${API_BASE}/workflows/${workflowId}/artifact/${fileName}`);
      if (res.ok) {
        const text = await res.text();
        setPreviewContent(text);
      } else {
        setPreviewContent(`// Status ${res.status}: File not yet written to disk.`);
      }
    } catch (err) {
      setPreviewContent(`// Failed to fetch artifact: ${err.message}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  const activeTask = runningTask || retryingTask || failedTask || agentTasks[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${currentMeta.name} Workstation`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      {/* Slide-over Drawer Panel (Section 1) */}
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          height: '100%',
          background: '#ffffff',
          boxShadow: '-8px 0 30px rgba(15, 23, 42, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header (Section 2) */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-canvas)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                background: currentMeta.bgLight,
                border: `1px solid ${currentMeta.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentMeta.color,
                flexShrink: 0,
              }}
            >
              <Icon size={18} />
            </div>

            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {currentMeta.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                {currentMeta.role}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BackButton label="Back" size="small" onClick={onClose} ariaLabel="Close workstation drawer and go back" />

            <span className={`badge ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>

            {onOpenFullView && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullView(normalizedAgentId);
                }}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                title="Open dedicated Full Agent View page"
              >
                <span>Full View</span>
                <ExternalLink size={11} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close workstation drawer"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Agent Active Telemetry Banner (Section 3) */}
        {isRunning && (
          <div style={{
            background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)',
            borderBottom: '1px solid #bfdbfe',
            padding: '10px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            fontSize: '0.76rem',
            fontFamily: 'var(--font-mono)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-dot status-dot-running" style={{ width: '8px', height: '8px' }} />
              <strong style={{ color: '#1e40af' }}>AGENT ACTIVE:</strong>
              <span style={{ color: '#1e3a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                {runningTask?.title || 'Processing operational task...'}
              </span>
            </div>
            <span style={{ color: '#2563eb', fontWeight: '700' }}>● EXECUTING</span>
          </div>
        )}

        {isAllSuccess && (
          <div style={{
            background: 'var(--state-success-bg)',
            borderBottom: '1px solid var(--state-success-border)',
            padding: '8px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--state-success-text)',
          }}>
            <Check size={14} color="var(--state-success)" />
            <span>✓ ALL ASSIGNED TASKS COMPLETED & VERIFIED</span>
          </div>
        )}

        {/* Drawer Scrollable Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SECTION 4: WHAT THIS AGENT DOES */}
          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              WHAT THIS AGENT DOES
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
              {currentMeta.whatItDoes}
            </div>
          </div>

          {/* SECTION 5: AGENT MICRO WORKFLOW (5 Small Connected Nodes) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                AGENT MICRO WORKFLOW
              </span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                5 STAGE PIPELINE
              </span>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
            }}>
              {currentMeta.microWorkflow.map((step, idx) => {
                const nodeState = getMicroWorkflowNodeState(idx);
                const isCurrent = nodeState.status === 'running';

                return (
                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      background: isCurrent ? currentMeta.bgLight : 'transparent',
                      border: isCurrent ? `1px solid ${currentMeta.color}40` : '1px solid transparent',
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)',
                        background: nodeState.status === 'completed'
                          ? 'var(--state-success)'
                          : isCurrent
                          ? currentMeta.color
                          : nodeState.status === 'failed'
                          ? '#dc2626'
                          : 'var(--border-default)',
                        color: '#ffffff',
                        flexShrink: 0,
                      }}>
                        {nodeState.icon}
                      </div>

                      <span style={{
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: isCurrent ? '700' : '500',
                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}>
                        {step.label}
                      </span>
                    </div>

                    {idx < currentMeta.microWorkflow.length - 1 && (
                      <div style={{ width: '2px', height: '8px', background: 'var(--border-subtle)', marginLeft: '19px' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 6 & 7: CURRENT TASK & ASSIGNED TASKS */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              ASSIGNED TASKS ({totalCount})
            </div>

            {agentTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {agentTasks.map((task) => (
                  <div
                    key={task.task_id}
                    style={{
                      padding: '10px 12px',
                      background: task.status === 'running' ? '#f0f9ff' : '#ffffff',
                      border: `1px solid ${task.status === 'running' ? '#38bdf8' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                          {task.task_id}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {task.title}
                        </span>
                      </div>
                      <span className={`badge badge-${task.status === 'success' ? 'success' : task.status === 'running' ? 'running' : task.status === 'retrying' ? 'retrying' : task.status === 'failed' ? 'failed' : 'pending'}`}>
                        {task.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {task.description}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>DEPS: {task.dependencies?.length ? task.dependencies.join(', ') : 'None'}</span>
                      {task.retry_count > 0 && <span style={{ color: '#d97706' }}>RETRIES: {task.retry_count}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* SECTION 23: STANDBY STATE */
              <div style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
              }}>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  AGENT ON STANDBY
                </div>
                <div>No active tasks assigned yet. Awaiting mission dispatch or prerequisite completion.</div>
              </div>
            )}
          </div>

          {/* SECTION 8: AGENT ACTIVITY TIMELINE */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              AGENT ACTIVITY ({agentEvents.length})
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '180px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.74rem',
            }}>
              {agentEvents.map((evt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', borderBottom: idx < agentEvents.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: '4px' }}>
                  <span style={{ color: evt.status === 'failed' ? '#dc2626' : evt.status === 'warning' ? '#d97706' : 'var(--state-success)', fontWeight: '700' }}>
                    {evt.status === 'failed' ? '!' : evt.status === 'warning' ? '↻' : '✓'}
                  </span>
                  <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                    {evt.message}
                  </span>
                </div>
              ))}

              {agentEvents.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                  Activity feed will stream live events during task execution.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 9: INPUT CONTEXT (Collapsible) */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setIsInputContextOpen(prev => !prev)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--bg-canvas)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
              }}
            >
              <span>INPUT CONTEXT & DEPENDENCY PASSING</span>
              {isInputContextOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isInputContextOpen && (
              <div style={{ padding: '12px 14px', background: '#ffffff', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>GOAL: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{requirements?.objective || 'Build RoadSafe accident analytics dashboard.'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>PREVIOUS AGENT: </span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{currentMeta.dependsOn}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>DEPENDENCY CONSTRAINTS: </span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {activeTask?.dependencies?.length ? activeTask.dependencies.join(', ') : 'None'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 10: AGENT OUTPUT */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              AGENT OUTPUT
            </div>

            <div style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.45',
            }}>
              {activeTask?.output || (
                isAllSuccess
                  ? 'Specialist execution completed with 0 errors.'
                  : 'Output will populate automatically upon task completion.'
              )}
            </div>
          </div>

          {/* SECTION 11: GENERATED ARTIFACTS */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              GENERATED ARTIFACTS ({displayArtifacts.length})
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {displayArtifacts.map((fileName) => (
                <button
                  key={fileName}
                  type="button"
                  onClick={() => handleOpenFilePreview(fileName)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--bg-canvas)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                  title="Click to inspect generated artifact content"
                >
                  <FileText size={12} color="var(--text-muted)" />
                  <span>{fileName}</span>
                  <Eye size={11} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 12 & 13: AGENT HANDOFF & ORCHESTRATOR CONNECTION */}
          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              ORCHESTRATION HANDOFF
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{currentMeta.dependsOn}</span>
              <span>→</span>
              <strong style={{ color: currentMeta.color }}>{currentMeta.name}</strong>
              <span>→</span>
              <span>{currentMeta.nextAgent}</span>
            </div>
          </div>

          {/* SECTION 14: AGENT METRICS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '10px',
            background: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            textAlign: 'center',
            fontSize: '0.72rem',
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>TASKS</div>
              <strong>{completedCount} / {totalCount}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>ARTIFACTS</div>
              <strong>{displayArtifacts.length}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>STATUS</div>
              <strong style={{ color: statusBadge.color }}>{statusBadge.label.split(' ')[1] || statusBadge.label}</strong>
            </div>
          </div>

          {/* SECTION 21: OPEN FULL AGENT VIEW BUTTON */}
          <div style={{ paddingTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                if (onOpenFullView) {
                  onOpenFullView(agentId);
                }
              }}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span>OPEN FULL AGENT VIEW</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Inline Artifact Preview Modal (Section 11) */}
        {selectedPreviewFile && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.15s ease',
          }}>
            <div style={{
              padding: '12px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-canvas)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: '700' }}>
                <FileCode size={16} color="var(--text-muted)" />
                <span>{selectedPreviewFile}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewFile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, padding: '16px', overflow: 'auto', background: '#0f172a', color: '#f8fafc' }}>
              {loadingPreview ? (
                <div style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>Loading artifact content...</div>
              ) : (
                <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {previewContent}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
