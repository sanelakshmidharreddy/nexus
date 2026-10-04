import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Terminal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  Layers,
  Server,
  Code2,
  ShieldCheck,
  Rocket,
  GitPullRequest,
  Users,
  Compass,
  Search,
  Database,
  Globe,
  RefreshCw,
  X,
} from 'lucide-react';

import Header from '../components/Header';
import GoalInput from '../components/GoalInput';
import AgentGraph from '../components/AgentGraph';
import ExecutionPlanCard from '../components/ExecutionPlanCard';
import EvaluationPanel from '../components/EvaluationPanel';
import ProjectReadyBanner from '../components/ProjectReadyBanner';
import ExecutionLog from '../components/ExecutionLog';
import CompactRecoveryCard from '../components/CompactRecoveryCard';
import AgentPanel from '../components/AgentPanel';
import ProjectFilesView from '../components/ProjectFilesView';
import RecoveryCenterView from '../components/RecoveryCenterView';
import ExecutionView from '../components/ExecutionView';
import { API_BASE, IS_API_CONFIGURED } from '../config';
import { checkHealthWithRetry } from '../services/healthCheck';

export default function Workspace({ onBackToLanding }) {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('nexus_theme') || 'light');

  // Navigation tab state: 'overview' | 'workflows' | 'agents' | 'execution' | 'recovery' | 'projects'
  const [activeTab, setActiveTab] = useState('overview');

  // Health and Telemetry Connectivity
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [connectionMessage, setConnectionMessage] = useState('Checking orchestrator health...');
  const [modelName, setModelName] = useState('gemini-3.8-flash');
  const [providerMode, setProviderMode] = useState('live LLM');
  const [latency, setLatency] = useState(null);

  // Workflow State
  const [workflowsList, setWorkflowsList] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [requirements, setRequirements] = useState(null);
  const [events, setEvents] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);

  // Execution & Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Elapsed Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // UI Toast & Modal State
  const [copyToast, setCopyToast] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [viewingFileContent, setViewingFileContent] = useState('');
  const [loadingFileContent, setLoadingFileContent] = useState(false);

  const pollIntervalRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 1. Health Probe with real latency and model telemetry
  useEffect(() => {
    const probeHealth = async () => {
      try {
        const start = performance.now();
        const res = await checkHealthWithRetry({ apiBase: API_BASE, maxRetries: 2, timeoutMs: 6000 });
        const ms = Math.round(performance.now() - start);
        setLatency(ms);

        if (res.ok) {
          setIsOnline(true);
          setConnectionStatus('CONNECTED');
          if (res.data?.model) setModelName(res.data.model);
          if (res.data?.mode) setProviderMode(res.data.mode);
          setConnectionMessage(`Connected (${ms}ms) • ${res.data?.provider || 'Live AI'}`);
        } else {
          setIsOnline(false);
          setConnectionStatus('OFFLINE');
          setConnectionMessage(res.message || 'Backend offline');
        }
      } catch (err) {
        setIsOnline(false);
        setConnectionStatus('OFFLINE');
        setConnectionMessage(err.message || 'Connection error');
      }
    };

    probeHealth();
    const timer = setInterval(probeHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch Recent Workflows
  const fetchWorkflows = async () => {
    try {
      const res = await fetch(`${API_BASE}/workflows`);
      if (res.ok) {
        const list = await res.json();
        setWorkflowsList(list);
        if (!activeWorkflow && list.length > 0) {
          loadWorkflow(list[0].workflow_id);
        }
      }
    } catch (err) {
      console.warn('Failed to load workflows:', err);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // 3. Load Workflow State & Real Events
  const loadWorkflow = async (workflowId) => {
    try {
      const res = await fetch(`${API_BASE}/workflows/${workflowId}`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveWorkflow(data);
      setTasks(data.tasks || []);
      setRequirements(data.requirements || null);
      setEvaluation(data.evaluation || null);
      setArtifacts(data.artifacts || []);

      // Fetch real events
      const evRes = await fetch(`${API_BASE}/workflows/${workflowId}/events`);
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData);
      }

      // Fetch fresh artifacts list
      const artRes = await fetch(`${API_BASE}/workflows/${workflowId}/artifacts`);
      if (artRes.ok) {
        const artData = await artRes.json();
        setArtifacts(artData);
      }
    } catch (err) {
      console.warn('Failed to load workflow detail:', err);
    }
  };

  // 4. Polling for Active Execution
  useEffect(() => {
    if (!activeWorkflow?.workflow_id) return;
    const isRunning = activeWorkflow.status === 'running' || activeWorkflow.status === 'planned';

    if (isRunning) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}`);
          if (res.ok) {
            const data = await res.json();
            setActiveWorkflow(data);
            setTasks(data.tasks || []);
            setRequirements(data.requirements || null);
            setEvaluation(data.evaluation || null);
            setArtifacts(data.artifacts || []);

            if (data.status === 'completed' || data.status === 'failed') {
              clearInterval(pollIntervalRef.current);
              fetchWorkflows();
            }
          }

          const evRes = await fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/events`);
          if (evRes.ok) {
            const evData = await evRes.json();
            setEvents(evData);
          }

          const artRes = await fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/artifacts`);
          if (artRes.ok) {
            const artData = await artRes.json();
            setArtifacts(artData);
          }
        } catch (e) {
          console.warn('Polling error:', e);
        }
      }, 1000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeWorkflow?.workflow_id, activeWorkflow?.status]);

  // 5. Real Elapsed Timer Calculation (Fixes 00:00 bug)
  useEffect(() => {
    if (!activeWorkflow?.created_at) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(activeWorkflow.created_at).getTime();
    const isRunning = activeWorkflow.status === 'running' || activeWorkflow.status === 'planned';

    if (isRunning) {
      // Live counting timer
      const tick = () => {
        const now = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
      };
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    } else {
      // Completed or Failed: Freeze at real elapsed time
      let endTime = Date.now();
      if (activeWorkflow.updated_at) {
        endTime = new Date(activeWorkflow.updated_at).getTime();
      } else if (events.length > 0) {
        const lastEv = events[events.length - 1];
        if (lastEv.timestamp) endTime = new Date(lastEv.timestamp).getTime();
      }
      setElapsedSeconds(Math.max(1, Math.floor((endTime - startTime) / 1000)));
    }
  }, [activeWorkflow?.workflow_id, activeWorkflow?.status, activeWorkflow?.created_at, activeWorkflow?.updated_at, events.length]);

  const formatElapsed = (sec) => {
    const mins = Math.floor(sec / 60).toString().padStart(2, '0');
    const remSec = (sec % 60).toString().padStart(2, '0');
    return `${mins}:${remSec}`;
  };

  // 6. Start Workflow Handler
  const handleStartWorkflow = async (goalText, isDemo = false) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goalText,
          auto_execute: true,
          demo_mode: isDemo,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to initialize workflow');
      }

      const newWorkflow = await res.json();
      setActiveWorkflow(newWorkflow);
      setTasks(newWorkflow.tasks || []);
      setRequirements(newWorkflow.requirements || null);
      setEvaluation(null);
      setArtifacts([]);
      setEvents([]);
      fetchWorkflows();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Copy Workflow ID Helper
  const handleCopyWorkflowId = () => {
    if (!activeWorkflow?.workflow_id) return;
    navigator.clipboard.writeText(activeWorkflow.workflow_id);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  // 8. Open Artifact Code Viewer Modal
  const handleOpenFileModal = async (fileName) => {
    if (!activeWorkflow?.workflow_id) return;
    setViewingFile(fileName);
    setLoadingFileContent(true);
    try {
      const res = await fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/artifact/${fileName}`);
      if (res.ok) {
        const text = await res.text();
        setViewingFileContent(text);
      } else {
        setViewingFileContent(`// Error loading file: HTTP ${res.status}`);
      }
    } catch (err) {
      setViewingFileContent(`// Failed to fetch file content: ${err.message}`);
    } finally {
      setLoadingFileContent(false);
    }
  };

  // Derived Metrics & Status
  const isExecuting = activeWorkflow?.status === 'running' || activeWorkflow?.status === 'planned' || isSubmitting;
  const isVerified =
    evaluation?.status === 'passed' ||
    evaluation?.score === 100 ||
    activeWorkflow?.status === 'completed';

  const totalTasks = tasks.length || 6;
  const completedTasks = tasks.filter((t) => t.status === 'success').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const runningTask = tasks.find((t) => t.status === 'running');
  const activeTask = runningTask || tasks.find((t) => t.status === 'pending') || tasks[tasks.length - 1] || null;

  // Real Recovery Counts from Recorded Events
  const recoveryCounts = useMemo(() => {
    const defectEvents = events.filter((e) =>
      ['EVALUATION_FAILED', 'TASK_ERROR', 'QA_FAILED'].includes(e.event_type) ||
      (e.status === 'failed' && e.event_type !== 'WORKFLOW_FAILED')
    );
    const retryEvents = events.filter((e) =>
      ['REPAIR_STARTED', 'QA_RETRY', 'TASK_REASSIGNED'].includes(e.event_type)
    );
    const patchEvents = events.filter((e) =>
      ['PATCH_APPLIED', 'REPAIR_COMPLETED'].includes(e.event_type)
    );
    return {
      defects: defectEvents.length,
      retries: retryEvents.length,
      patches: patchEvents.length,
    };
  }, [events]);

  // Stage Status Mapping
  const stageStatuses = useMemo(() => {
    if (!activeWorkflow) return { create: 'pending', test: 'pending', deploy: 'pending', collaborate: 'pending' };
    const isWfDone = activeWorkflow.status === 'completed';
    const isWfFailed = activeWorkflow.status === 'failed';
    const isWfRunning = activeWorkflow.status === 'running' || activeWorkflow.status === 'planned';

    if (isWfDone) {
      return { create: 'success', test: 'success', deploy: 'success', collaborate: 'success' };
    }

    const t1 = tasks.find((t) => t.task_id === 'T1');
    const t2 = tasks.find((t) => t.task_id === 'T2');
    const t3 = tasks.find((t) => t.task_id === 'T3');
    const t4 = tasks.find((t) => t.task_id === 'T4');
    const t5 = tasks.find((t) => t.task_id === 'T5');
    const t6 = tasks.find((t) => t.task_id === 'T6');

    let create = 'pending';
    let test = 'pending';
    let deploy = 'pending';
    let collaborate = 'pending';

    // CREATE (T1, T2, T3)
    if (t3?.status === 'success' || t4?.status === 'running' || t4?.status === 'success') create = 'success';
    else if (t1?.status === 'running' || t2?.status === 'running' || t3?.status === 'running' || isWfRunning) create = 'running';

    // TEST (T4 / T6 Evaluation)
    if (t6?.status === 'success' || evaluation?.passed) test = 'success';
    else if (t6?.status === 'running' || t4?.status === 'running') test = 'running';
    else if (t3?.status === 'success') test = 'running';

    // DEPLOY (T5)
    if (t5?.status === 'success' || isWfDone) deploy = 'success';
    else if (t5?.status === 'running') deploy = 'running';
    else if (test === 'success') deploy = 'running';

    // COLLABORATE
    if (isWfDone) collaborate = 'success';
    else if (deploy === 'success') collaborate = 'running';

    return { create, test, deploy, collaborate };
  }, [activeWorkflow?.status, tasks, evaluation]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* 1. Header with System Chips, Real Latency, Model, API host, and Theme Toggle */}
      <Header
        isOnline={isOnline}
        connectionStatus={connectionStatus}
        modelName={modelName}
        providerMode={providerMode}
        latency={latency}
        apiUrl={API_BASE}
        isExecuting={isExecuting}
        isVerified={isVerified}
        connectionMessage={connectionMessage}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBackToLanding={onBackToLanding}
      />

      {/* 2. Navigation Tab Bar with Animated Sliding Underline + Workflow ID Badge */}
      <nav
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'sticky',
          top: '52px',
          zIndex: 45,
        }}
      >
        <div className="nav-tabs" role="tablist">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'workflows', label: `Workflows (${workflowsList.length})` },
            { id: 'agents', label: 'Agents (4)' },
            { id: 'execution', label: 'Execution' },
            { id: 'recovery', label: `Recovery (${recoveryCounts.defects})` },
            { id: 'projects', label: `Projects (${artifacts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right side: Workflow ID (copyable) + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeWorkflow?.workflow_id && (
            <button
              onClick={handleCopyWorkflowId}
              className="btn-secondary"
              title="Click to copy Workflow ID"
              style={{
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-surface-secondary)',
              }}
            >
              {copyToast ? (
                <>
                  <Check size={11} style={{ color: 'var(--state-success)' }} />
                  <span style={{ color: 'var(--state-success-text)' }}>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>WF-{activeWorkflow.workflow_id.slice(0, 8).toUpperCase()}</span>
                </>
              )}
            </button>
          )}

          <span
            className={`badge ${
              activeWorkflow?.status === 'completed'
                ? 'badge-success'
                : activeWorkflow?.status === 'running' || activeWorkflow?.status === 'planned'
                ? 'badge-running'
                : activeWorkflow?.status === 'failed'
                ? 'badge-failed'
                : 'badge-pending'
            }`}
            style={{ fontSize: '0.68rem', padding: '4px 9px' }}
          >
            {activeWorkflow?.status ? activeWorkflow.status.toUpperCase() : 'STANDBY'}
          </span>
        </div>
      </nav>

      {/* 3. Real Progress Strip (Task Counter, Active Agent, Real Elapsed Timer, Shimmer Progress Bar) */}
      <div
        style={{
          background: isExecuting ? 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 100%)' : 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          color: isExecuting ? '#ffffff' : 'var(--text-primary)',
          fontSize: '0.76rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Current Task Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <span style={{ color: isExecuting ? '#38bdf8' : 'var(--state-running)' }}>
              {activeTask?.task_id || 'T1'}
            </span>
            <span style={{ color: isExecuting ? 'rgba(255,255,255,0.4)' : 'var(--text-muted)' }}>/</span>
            <span style={{ color: isExecuting ? '#e2e8f0' : 'var(--text-secondary)' }}>
              {totalTasks}
            </span>
          </div>

          {/* Active Agent Name */}
          <div
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: isExecuting ? 'rgba(255, 255, 255, 0.12)' : 'var(--bg-surface-secondary)',
              border: `1px solid ${isExecuting ? 'rgba(255, 255, 255, 0.2)' : 'var(--border-subtle)'}`,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Users size={12} />
            <span>{(activeTask?.assigned_agent || 'orchestrator').toUpperCase()} AGENT</span>
          </div>

          {/* Task Title */}
          <span style={{ color: isExecuting ? '#cbd5e1' : 'var(--text-secondary)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeTask?.title || 'System initialized'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Real Elapsed Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} style={{ color: isExecuting ? '#94a3b8' : 'var(--text-muted)' }} />
            <span style={{ color: isExecuting ? '#94a3b8' : 'var(--text-muted)' }}>Elapsed:</span>
            <strong style={{ color: isExecuting ? '#ffffff' : 'var(--text-primary)' }}>
              {formatElapsed(elapsedSeconds)}
            </strong>
          </div>

          {/* Progress Bar with Subtle Moving Shimmer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '100px',
                height: '6px',
                background: isExecuting ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface-tertiary)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                className={isExecuting ? 'progress-bar-fill' : ''}
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: isVerified ? 'var(--state-success)' : 'var(--state-running)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 400ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
            <strong style={{ color: isExecuting ? '#38bdf8' : 'var(--text-primary)' }}>
              {progressPercent}%
            </strong>
          </div>
        </div>
      </div>

      {/* 4. Main Body Content Based on Active Tab */}
      <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
        {/* ========================================================
            TAB 1: OVERVIEW (Prototype Main Layout)
           ======================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px', margin: '0 auto' }}>
            {/* Top Two-Column Grid: Left Card + Right Dark Panel */}
            <div
              className="command-center-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, 1fr)',
                gap: '22px',
                alignItems: 'start',
              }}
            >
              {/* Left Column: Developer Requirement Input + Result Banner + Analyzer + Planner */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Developer Requirement Input Card */}
                <GoalInput
                  onStartWorkflow={handleStartWorkflow}
                  isSubmitting={isSubmitting || isExecuting}
                  error={error}
                  activeGoal={activeWorkflow?.original_goal}
                  isOnline={isOnline}
                  connectionStatus={connectionStatus}
                  workflowStatus={activeWorkflow?.status}
                />

                {/* Result Banner (Project Ready) */}
                {activeWorkflow?.status === 'completed' && (
                  <ProjectReadyBanner
                    workflowId={activeWorkflow?.workflow_id}
                    evaluation={evaluation}
                    artifacts={artifacts}
                    requirements={requirements}
                  />
                )}

                {/* Analyzer Output Card */}
                {requirements && (
                  <div className="panel" style={{ background: 'var(--bg-surface)' }}>
                    <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="panel-title">
                        <Search size={15} style={{ color: '#2563eb' }} />
                        <span>Analyzer Agent Output — Requirement Specification</span>
                      </div>
                      <span className="badge badge-success">ANALYSIS VERIFIED</span>
                    </div>

                    <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Objective & Mission
                        </div>
                        <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {requirements.objective || activeWorkflow?.original_goal}
                        </div>
                      </div>

                      {requirements.requested_features?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Features Identified ({requirements.requested_features.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {requirements.requested_features.map((feat, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '3px 8px',
                                  borderRadius: 'var(--radius-xs)',
                                  background: 'var(--bg-surface-secondary)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                ✓ {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {requirements.expected_deliverables && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Expected Deliverable Output
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {requirements.expected_deliverables}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Planner Output Card */}
                {requirements?.execution_plan && (
                  <ExecutionPlanCard requirements={requirements} />
                )}
              </div>

              {/* Right Column: Dark Panel "NEXUS Agent Pipeline" */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <AgentGraph
                  stageStatuses={stageStatuses}
                  activeWorkflow={activeWorkflow}
                  evaluation={evaluation}
                  artifacts={artifacts}
                  requirements={requirements}
                  tasks={tasks}
                  onSelectFile={handleOpenFileModal}
                />

                {/* Evaluation 9-Check Panel if present */}
                {evaluation && (
                  <EvaluationPanel evaluation={evaluation} />
                )}
              </div>
            </div>

            {/* Overview Sections Below: Task DAG, Stage Summaries, Recovery, Event Feed, Artifacts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Task DAG */}
              {tasks.length > 0 && (
                <div className="panel" style={{ background: 'var(--bg-surface)' }}>
                  <div className="panel-header">
                    <div className="panel-title">
                      <Layers size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>Task Execution DAG (T1 – T{tasks.length})</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      DEPENDENCY-RESOLVED ORDER
                    </span>
                  </div>

                  <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {tasks.map((task) => {
                      const isTaskDone = task.status === 'success';
                      const isTaskRunning = task.status === 'running';
                      const isTaskFailed = task.status === 'failed';
                      return (
                        <div
                          key={task.task_id}
                          className="interactive-card"
                          style={{
                            padding: '14px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${
                              isTaskDone
                                ? 'var(--state-success-border)'
                                : isTaskRunning
                                ? 'var(--state-running-border)'
                                : isTaskFailed
                                ? 'var(--state-failure-border)'
                                : 'var(--border-subtle)'
                            }`,
                            background: isTaskDone
                              ? 'var(--state-success-bg)'
                              : isTaskRunning
                              ? 'var(--state-running-bg)'
                              : 'var(--bg-surface)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                {task.task_id}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  fontFamily: 'var(--font-mono)',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  background: 'var(--bg-surface-secondary)',
                                  color: 'var(--text-secondary)',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                {task.assigned_agent.toUpperCase()}
                              </span>
                            </div>

                            <span
                              className={`badge ${
                                isTaskDone
                                  ? 'badge-success'
                                  : isTaskRunning
                                  ? 'badge-running'
                                  : isTaskFailed
                                  ? 'badge-failed'
                                  : 'badge-pending'
                              }`}
                            >
                              {task.status.toUpperCase()}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {task.title}
                          </div>

                          {task.output && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', background: 'var(--bg-surface)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                              {task.output}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stage Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {[
                  {
                    stage: 'CREATE',
                    icon: FileCode,
                    color: '#2563eb',
                    status: stageStatuses.create,
                    desc: 'Requirements scoping, decoupled architecture formulation, React client & FastAPI backend code synthesis.',
                  },
                  {
                    stage: 'TEST',
                    icon: ShieldCheck,
                    color: '#059669',
                    status: stageStatuses.test,
                    desc: 'Syntax validation, API contract verification, zero-missing-dependency audit, and sandbox safety checks.',
                  },
                  {
                    stage: 'DEPLOY',
                    icon: Rocket,
                    color: '#d97706',
                    status: stageStatuses.deploy,
                    desc: 'Production configurations, Uvicorn service startup, Render and Vercel cloud deployment blueprints.',
                  },
                  {
                    stage: 'COLLABORATE',
                    icon: GitPullRequest,
                    color: '#7c3aed',
                    status: stageStatuses.collaborate,
                    desc: 'README documentation, pull request description, change log summary, and developer handoff archive.',
                  },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.stage}
                      className="panel interactive-card"
                      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={14} style={{ color: s.color }} />
                          </div>
                          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                            {s.stage}
                          </span>
                        </div>
                        <span className={`badge badge-${s.status}`}>{s.status.toUpperCase()}</span>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                        {s.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Adaptive Orchestration & Self-Healing Panel */}
              <CompactRecoveryCard
                events={events}
                onViewRecoveryDetails={() => setActiveTab('recovery')}
              />

              {/* Real Execution Timeline & Event Feed */}
              <ExecutionLog
                events={events}
                isRunning={isExecuting}
              />

              {/* Project Workspace & Generated Artifacts */}
              <div className="panel" style={{ background: 'var(--bg-surface)' }}>
                <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="panel-title">
                    <FileCode size={15} style={{ color: 'var(--text-muted)' }} />
                    <span>Project Workspace & Generated Artifacts ({artifacts.length})</span>
                  </div>

                  {activeWorkflow?.workflow_id && (
                    <a
                      href={`${API_BASE}/workflows/${activeWorkflow.workflow_id}/zip`}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.74rem', textDecoration: 'none' }}
                      title="Download full project repository as ZIP"
                    >
                      <Download size={13} />
                      <span>Download ZIP</span>
                    </a>
                  )}
                </div>

                <div className="panel-body">
                  {artifacts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {isExecuting
                        ? 'Synthesizing project files across frontend/, backend/, and configs...'
                        : 'No project files generated yet. Enter a requirement and click START NEXUS.'}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                      {artifacts.map((art) => {
                        const fileName = typeof art === 'string' ? art : art.name || art.path;
                        const fileSize = art.size ? `${(art.size / 1024).toFixed(1)} KB` : 'Ready';
                        return (
                          <div
                            key={fileName}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-xs)',
                              background: 'var(--bg-surface-secondary)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              <FileCode size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {fileName}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>
                                READY
                              </span>
                              <button
                                onClick={() => handleOpenFileModal(fileName)}
                                className="btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                                title="View source code"
                              >
                                <Eye size={11} /> View
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: WORKFLOWS (Persisted Workflows History)
           ======================================================== */}
        {activeTab === 'workflows' && (
          <div className="panel" style={{ maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-surface)' }}>
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="panel-title">
                <Compass size={15} style={{ color: 'var(--text-muted)' }} />
                <span>Persisted Workflow Runs ({workflowsList.length})</span>
              </div>
              <button onClick={fetchWorkflows} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.74rem' }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            <div className="panel-body">
              {workflowsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No workflows found in database.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {workflowsList.map((wf) => {
                    const isSelected = activeWorkflow?.workflow_id === wf.workflow_id;
                    const isDone = wf.status === 'completed';
                    return (
                      <div
                        key={wf.workflow_id}
                        onClick={() => {
                          loadWorkflow(wf.workflow_id);
                          setActiveTab('overview');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          background: isSelected ? 'var(--bg-surface-secondary)' : 'var(--bg-surface)',
                          border: `1px solid ${isSelected ? 'var(--state-running)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          gap: '14px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                              WF-{wf.workflow_id.slice(0, 8).toUpperCase()}
                            </strong>
                            <span className={`badge ${isDone ? 'badge-success' : wf.status === 'running' ? 'badge-running' : 'badge-pending'}`}>
                              {wf.status.toUpperCase()}
                            </span>
                            {wf.evaluation && (
                              <span className="badge badge-success">
                                SCORE: {wf.evaluation.score}%
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              • {new Date(wf.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                            {wf.original_goal}
                          </div>
                        </div>

                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.76rem' }}>
                          {isSelected ? 'Active Run' : 'Load Run'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: AGENTS (Specialist Multi-Agent Swarm)
           ======================================================== */}
        {activeTab === 'agents' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AgentPanel
              tasks={tasks}
              requirements={requirements}
              artifacts={artifacts}
              evaluation={evaluation}
              events={events}
            />
          </div>
        )}

        {/* ========================================================
            TAB 4: EXECUTION (Operational DAG & Log Feed)
           ======================================================== */}
        {activeTab === 'execution' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ExecutionView
              workflow={activeWorkflow}
              tasks={tasks}
              events={events}
              logs={[]}
            />
          </div>
        )}

        {/* ========================================================
            TAB 5: RECOVERY (Autonomous Incident Response Center)
           ======================================================== */}
        {activeTab === 'recovery' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <RecoveryCenterView
              workflow={activeWorkflow}
              events={events}
              tasks={tasks}
            />
          </div>
        )}

        {/* ========================================================
            TAB 6: PROJECTS (Artifacts & Deliverable)
           ======================================================== */}
        {activeTab === 'projects' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ProjectFilesView
              artifacts={artifacts}
              workflowId={activeWorkflow?.workflow_id}
            />
          </div>
        )}
      </main>

      {/* 5. Interactive Code Viewer Modal */}
      {viewingFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setViewingFile(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '860px',
              height: '80vh',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={15} style={{ color: 'var(--state-running)' }} />
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                  {viewingFile}
                </span>
              </div>

              <button
                onClick={() => setViewingFile(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Code Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#0b0f19', color: '#e2e8f0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.6' }}>
              {loadingFileContent ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', paddingTop: '40px' }}>
                  Loading file content...
                </div>
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {viewingFileContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
