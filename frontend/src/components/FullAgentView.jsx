import React, { useState } from 'react';
import {
  ArrowLeft,
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
  ShieldCheck,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  FileText,
  Terminal,
  X,
  ExternalLink,
} from 'lucide-react';
import { API_BASE } from '../config';

export default function FullAgentView({
  agentId = 'research',
  onBack,
  tasks = [],
  requirements = null,
  events = [],
  artifacts = [],
  evaluation = null,
  workflow = null,
  workflowId = null,
  onSelectAgent = null,
}) {
  const [isInputContextOpen, setIsInputContextOpen] = useState(true);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const normalizedAgentId = (agentId || 'research').toLowerCase();

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

  const allAgentKeys = ['research', 'data', 'ui', 'developer', 'qa', 'evaluator'];
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

    if (isRunning) {
      if (index === 0) return { icon: '✓', status: 'completed', cls: 'node-completed' };
      if (index === 1) return { icon: '●', status: 'running', cls: 'node-running' };
      return { icon: '○', status: 'pending', cls: 'node-pending' };
    }

    if (index === 0 && totalCount > 0) return { icon: '✓', status: 'completed', cls: 'node-completed' };
    return { icon: '○', status: 'pending', cls: 'node-pending' };
  };

  const activeTaskObj = runningTask || retryingTask || failedTask || (agentTasks.length > 0 ? agentTasks[agentTasks.length - 1] : null);

  const handleFetchArtifact = async (fileName) => {
    setSelectedPreviewFile(fileName);
    setLoadingPreview(true);
    try {
      const activeWfId = workflowId || workflow?.workflow_id;
      if (!activeWfId) {
        setPreviewContent(`// Preview for ${fileName}\n// Workflow initialized but no files generated on disk.`);
        setLoadingPreview(false);
        return;
      }
      const res = await fetch(`${API_BASE}/workflows/${activeWfId}/artifact/${fileName}`);
      if (res.ok) {
        const text = await res.text();
        setPreviewContent(text);
      } else {
        setPreviewContent(`// File: ${fileName}\n// Status: Artifact generated in memory, preview unavailable from disk.`);
      }
    } catch {
      setPreviewContent(`// Error fetching ${fileName} from orchestrator.`);
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Header Bar */}
      <div style={{
        padding: '16px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
            <span>← Back to Command Center</span>
          </button>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }} />

          {/* Quick Specialist Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SPECIALISTS:
            </span>
            {allAgentKeys.map(key => {
              const meta = agentMeta[key];
              const isCurr = key === normalizedAgentId;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectAgent && onSelectAgent(key)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isCurr ? '700' : '500',
                    background: isCurr ? 'var(--text-primary)' : 'var(--bg-surface-secondary)',
                    color: isCurr ? '#ffffff' : 'var(--text-secondary)',
                    border: `1px solid ${isCurr ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                  }}
                >
                  {meta.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>ROUTE:</span>
          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
            /agents/{normalizedAgentId}/{workflowId || workflow?.workflow_id?.slice(0, 8) || 'active'}
          </span>
          <span className={`badge ${statusBadge.cls}`} style={{ fontSize: '0.72rem' }}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Main Operational Container */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* SECTION 2 & 3: HERO WORKSTATION HEADER & LIVE INDICATOR */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-sm)',
                background: currentMeta.bgLight,
                border: `1px solid ${currentMeta.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentMeta.color,
                boxShadow: 'var(--shadow-xs)',
              }}>
                <Icon size={28} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {currentMeta.name.toUpperCase()}
                  </h1>
                  <span className={`badge ${statusBadge.cls}`} style={{ fontSize: '0.78rem', padding: '3px 10px' }}>
                    {statusBadge.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentMeta.role}
                </div>
              </div>
            </div>

            {/* Performance Metrics Chips (Section 14) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'var(--bg-canvas)',
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>TASKS: </span>
                <strong>{completedCount} / {totalCount}</strong>
              </div>
              <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
              <div>
                <span style={{ color: 'var(--text-muted)' }}>RETRIES: </span>
                <strong>{retryingTask ? retryingTask.retry_count || 1 : (isAllSuccess && normalizedAgentId === 'developer') ? 1 : 0}</strong>
              </div>
              <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
              <div>
                <span style={{ color: 'var(--text-muted)' }}>ARTIFACTS: </span>
                <strong>{displayArtifacts.length}</strong>
              </div>
            </div>
          </div>

          {/* Live Agent Activity Banner (Section 3) */}
          <div style={{
            background: isRunning ? '#eff6ff' : isRetrying ? '#fffbeb' : isFailed ? '#fef2f2' : 'var(--bg-canvas)',
            border: `1px solid ${isRunning ? '#bfdbfe' : isRetrying ? '#fde68a' : isFailed ? '#fecaca' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isRunning && (
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  animation: 'pulse 1.5s infinite',
                }} />
              )}
              {isAllSuccess && <span style={{ color: '#059669', fontWeight: '800' }}>✓</span>}
              {isFailed && <span style={{ color: '#dc2626', fontWeight: '800' }}>!</span>}
              {isStandby && <span style={{ color: '#64748b' }}>○</span>}

              <span style={{ fontWeight: '700', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                {isRunning
                  ? 'AGENT ACTIVE'
                  : isRetrying
                  ? 'RECOVERY / PATCH IN PROGRESS'
                  : isFailed
                  ? 'FAILURE DETECTED'
                  : isAllSuccess
                  ? 'TASK COMPLETED'
                  : 'AGENT ON STANDBY'}
              </span>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isRunning && runningTask && (
                <span>Current task: <strong>{runningTask.task_id}</strong> — {runningTask.title}</span>
              )}
              {isRetrying && retryingTask && (
                <span>Retrying task: <strong>{retryingTask.task_id}</strong> — {retryingTask.title}</span>
              )}
              {isFailed && failedTask && (
                <span style={{ color: '#dc2626' }}>Defect in: <strong>{failedTask.task_id}</strong> — {failedTask.title}</span>
              )}
              {isAllSuccess && (
                <span>All assigned tasks executed and verified successfully.</span>
              )}
              {isStandby && (
                <span>No active task executing. Awaiting DAG assignment or trigger.</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: WHAT THIS AGENT DOES */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px 22px',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '800',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            marginBottom: '6px',
          }}>
            WHAT THIS AGENT DOES
          </div>
          <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.5', fontWeight: '500' }}>
            "{currentMeta.whatItDoes}"
          </div>
        </div>

        {/* SECTION 5: AGENT MICRO WORKFLOW (5 connected nodes) */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '800',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>SPECIALIST MICRO-WORKFLOW PIPELINE</span>
            <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>5-STAGE CONNECTED EXECUTION</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            alignItems: 'stretch',
          }}>
            {currentMeta.microWorkflow.map((step, idx) => {
              const node = getMicroWorkflowNodeState(idx);
              const isNodeRunning = node.status === 'running';
              const isNodeCompleted = node.status === 'completed';
              const isNodeFailed = node.status === 'failed';
              const isNodeRetrying = node.status === 'retrying';

              return (
                <div
                  key={step.key}
                  style={{
                    background: isNodeRunning ? '#eff6ff' : isNodeCompleted ? '#f0fdf4' : isNodeFailed ? '#fef2f2' : isNodeRetrying ? '#fffbeb' : 'var(--bg-canvas)',
                    border: `1px solid ${isNodeRunning ? '#2563eb' : isNodeCompleted ? '#10b981' : isNodeFailed ? '#ef4444' : isNodeRetrying ? '#f59e0b' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-xs)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      STEP 0{idx + 1}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      color: isNodeRunning ? '#2563eb' : isNodeCompleted ? '#059669' : isNodeFailed ? '#dc2626' : isNodeRetrying ? '#d97706' : 'var(--text-muted)',
                    }}>
                      {node.icon}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-mono)',
                    color: isNodeRunning ? '#1e3a8a' : isNodeCompleted ? '#065f46' : 'var(--text-primary)',
                    letterSpacing: '0.02em',
                  }}>
                    {step.label}
                  </div>

                  <div style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    color: isNodeRunning ? '#2563eb' : isNodeCompleted ? '#059669' : isNodeFailed ? '#dc2626' : 'var(--text-muted)',
                  }}>
                    {node.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-COLUMN OPERATIONAL GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '20px',
        }}>
          {/* COLUMN 1: TASKS & REAL EVENT ACTIVITY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* SECTION 6 & 7: REAL ASSIGNED TASKS & CURRENT TASK */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px 22px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                marginBottom: '14px',
              }}>
                ASSIGNED TASKS ({agentTasks.length})
              </div>

              {agentTasks.length === 0 ? (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                }}>
                  No tasks currently assigned to this specialist in active plan.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {agentTasks.map(t => (
                    <div
                      key={t.task_id}
                      style={{
                        padding: '12px 14px',
                        background: t.status === 'running' ? '#eff6ff' : t.status === 'retrying' ? '#fffbeb' : t.status === 'failed' ? '#fef2f2' : 'var(--bg-canvas)',
                        border: `1px solid ${t.status === 'running' ? '#bfdbfe' : t.status === 'retrying' ? '#fde68a' : t.status === 'failed' ? '#fecaca' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-xs)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                            {t.task_id}
                          </span>
                          <span className={`badge badge-${t.status === 'success' ? 'success' : t.status === 'running' ? 'running' : t.status === 'retrying' ? 'retrying' : t.status === 'failed' ? 'failed' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                            {t.status.toUpperCase()}
                          </span>
                        </div>
                        {t.retry_count > 0 && (
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#d97706' }}>
                            RETRY #{t.retry_count}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {t.title}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {t.description}
                      </div>

                      {t.dependencies && t.dependencies.length > 0 && (
                        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', gap: '4px' }}>
                          <span>DEPENDS:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{t.dependencies.join(', ')}</span>
                        </div>
                      )}

                      {t.error && (
                        <div style={{
                          marginTop: '4px',
                          padding: '6px 10px',
                          background: '#fee2e2',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#dc2626',
                        }}>
                          <strong>ERROR:</strong> {t.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 8: REAL AGENT ACTIVITY FEED */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px 22px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>AGENT ACTIVITY TIMELINE</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {agentEvents.length} REAL EVENTS
                </span>
              </div>

              {agentEvents.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                }}>
                  {totalCount > 0 ? 'Awaiting event streaming for this specialist.' : 'No events logged for standby agent.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {agentEvents.map((ev, idx) => (
                    <div
                      key={ev.event_id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '8px 10px',
                        background: 'var(--bg-canvas)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: ev.event_type?.includes('FAIL') ? '#dc2626' : ev.event_type?.includes('RECOVER') ? '#d97706' : '#059669',
                        fontWeight: '800',
                      }}>
                        {ev.event_type?.includes('FAIL') ? '!' : ev.event_type?.includes('RECOVER') ? '↻' : '✓'}
                      </span>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.72rem', color: 'var(--text-primary)' }}>
                            {ev.event_type || 'AGENT_ACTIVITY'}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '0.73rem' }}>
                          {ev.details?.message || ev.details?.title || JSON.stringify(ev.details || {})}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: CONTEXT, OUTPUT, ARTIFACTS & HANDOFF */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* SECTION 9: INPUT CONTEXT */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px 22px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div
                onClick={() => setIsInputContextOpen(!isInputContextOpen)}
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '800',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>INPUT CONTEXT & DEPENDENCY PASSING</span>
                {isInputContextOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>

              {isInputContextOpen && (
                <div style={{
                  marginTop: '12px',
                  background: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 14px',
                  fontSize: '0.76rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>GOAL OBJECTIVE: </span>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {workflow?.original_goal || 'Build interactive dashboard application'}
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>PREVIOUS AGENT: </span>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{currentMeta.dependsOn}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>DOWNSTREAM TARGET: </span>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{currentMeta.feeds}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 10: AGENT OUTPUT */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px 22px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}>
                AGENT OUTPUT & DELIVERABLES
              </div>

              {activeTaskObj && activeTaskObj.output ? (
                <div style={{
                  background: '#0f172a',
                  color: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-xs)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  maxHeight: '220px',
                  overflow: 'auto',
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {typeof activeTaskObj.output === 'object'
                      ? JSON.stringify(activeTaskObj.output, null, 2)
                      : String(activeTaskObj.output)}
                  </pre>
                </div>
              ) : (
                <div style={{
                  padding: '14px',
                  background: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  lineHeight: '1.4',
                }}>
                  {isAllSuccess
                    ? `Execution completed. Outputs deposited to workflow artifact store: ${displayArtifacts.join(', ')}.`
                    : 'Awaiting task execution to stream structured output.'}
                </div>
              )}
            </div>

            {/* SECTION 11: GENERATED ARTIFACTS */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px 22px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>GENERATED ARTIFACTS ({displayArtifacts.length})</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CLICK TO PREVIEW</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayArtifacts.map(fileName => (
                  <button
                    key={fileName}
                    type="button"
                    onClick={() => handleFetchArtifact(fileName)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={14} color="var(--text-muted)" />
                      <span>{fileName}</span>
                    </div>
                    <Eye size={12} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 12 & 13: AGENT HANDOFF & ORCHESTRATOR CONNECTION */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '18px 22px',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}>
                ORCHESTRATION HANDOFF ARCHITECTURE
              </div>

              <div style={{
                padding: '12px 14px',
                background: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>INPUT</div>
                  <strong>{currentMeta.dependsOn}</strong>
                </div>
                <span>→</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PAYLOAD</div>
                  <strong style={{ color: currentMeta.color }}>{currentMeta.handoffText}</strong>
                </div>
                <span>→</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TARGET</div>
                  <strong>{currentMeta.nextAgent}</strong>
                </div>
              </div>

              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.4',
              }}>
                NEXUS Orchestrator guarantees strict DAG dependency resolution before transferring execution context to {currentMeta.nextAgent}.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Artifact Preview Modal (Section 11) */}
      {selectedPreviewFile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '840px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-canvas)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.86rem', fontWeight: '700' }}>
                <FileCode size={18} color="var(--text-muted)" />
                <span>{selectedPreviewFile}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewFile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, padding: '18px', overflow: 'auto', background: '#0f172a', color: '#f8fafc' }}>
              {loadingPreview ? (
                <div style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Loading artifact content...</div>
              ) : (
                <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {previewContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
