import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import SidebarRunHistory from '../components/SidebarRunHistory';
import GoalInput from '../components/GoalInput';
import AgentPanel from '../components/AgentPanel';
import ExecutionPlanCard from '../components/ExecutionPlanCard';
import EvaluationPanel from '../components/EvaluationPanel';
import ProjectReadyBanner from '../components/ProjectReadyBanner';
import ExecutionLog from '../components/ExecutionLog';
import RightPanelTabs from '../components/RightPanelTabs';
import { API_BASE, IS_API_CONFIGURED } from '../config';
import { checkHealthWithRetry } from '../services/healthCheck';

export default function CommandCenter() {
  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(IS_API_CONFIGURED ? 'CONNECTING' : 'UNCONFIGURED');
  const [connectionMessage, setConnectionMessage] = useState(
    IS_API_CONFIGURED ? 'Connecting to NEXUS orchestrator...' : 'VITE_API_URL not configured.'
  );
  const [modelName, setModelName] = useState('gemini-3.8-flash');
  const [latency, setLatency] = useState(null);

  const [workflowsList, setWorkflowsList] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [requirements, setRequirements] = useState(null);
  const [events, setEvents] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([
    {
      time: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'NEXUS AI Developer Orchestrator command center initialized.',
    },
    {
      time: new Date().toLocaleTimeString(),
      type: 'info',
      message: API_BASE
        ? `Targeting backend orchestrator at ${API_BASE}`
        : 'Awaiting VITE_API_URL configuration...',
    },
  ]);

  const lastEventCountRef = useRef(0);
  const pollIntervalRef = useRef(null);

  const addLog = (type, message) => {
    setLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        type,
        message,
      },
    ]);
  };

  // Health check
  useEffect(() => {
    const probeHealth = async () => {
      try {
        const start = performance.now();
        const res = await checkHealthWithRetry();
        const ms = Math.round(performance.now() - start);
        setLatency(ms);

        if (res.isHealthy) {
          setIsOnline(true);
          setConnectionStatus('CONNECTED');
          if (res.data?.model) {
            setModelName(res.data.model);
          }
          setConnectionMessage(`Connected (${ms}ms) • ${res.data?.provider || 'Live AI'}`);
        } else {
          setIsOnline(false);
          setConnectionStatus('OFFLINE');
          setConnectionMessage(res.message || 'Backend offline');
        }
      } catch (err) {
        setIsOnline(false);
        setConnectionStatus('OFFLINE');
        setConnectionMessage(err.message);
      }
    };

    probeHealth();
    const interval = setInterval(probeHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent workflows
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
      console.warn('Failed to load recent workflows:', err);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Load a single workflow state
  const loadWorkflow = async (workflowId) => {
    try {
      const res = await fetch(`${API_BASE}/workflows/${workflowId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveWorkflow(data);
        setTasks(data.tasks || []);
        setRequirements(data.requirements || null);
        setEvaluation(data.evaluation || null);
        setArtifacts(data.artifacts || []);
      }

      // Events
      const evRes = await fetch(`${API_BASE}/workflows/${workflowId}/events`);
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData);
      }

      // Artifacts
      const artRes = await fetch(`${API_BASE}/workflows/${workflowId}/artifacts`);
      if (artRes.ok) {
        const artData = await artRes.json();
        setArtifacts(artData);
      }
    } catch (err) {
      console.warn('Failed to load workflow detail:', err);
    }
  };

  // Polling active workflow execution
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

          // Fetch new events
          const evRes = await fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/events`);
          if (evRes.ok) {
            const evData = await evRes.json();
            setEvents(evData);

            if (evData.length > lastEventCountRef.current) {
              const newEvts = evData.slice(lastEventCountRef.current);
              newEvts.forEach((e) => {
                addLog(e.status === 'failed' ? 'error' : e.status === 'success' ? 'success' : 'agent', `[${e.agent?.toUpperCase() || 'ORCHESTRATOR'}] ${e.message}`);
              });
              lastEventCountRef.current = evData.length;
            }
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

  // Start workflow
  const handleStartWorkflow = async (goalText, isDemo = false) => {
    setError(null);
    setIsSubmitting(true);
    addLog('info', `Initiating requirement analysis for: "${goalText}"`);

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
      lastEventCountRef.current = 0;
      setActiveWorkflow(newWorkflow);
      setTasks(newWorkflow.tasks || []);
      setRequirements(newWorkflow.requirements || null);
      setEvaluation(null);
      setArtifacts([]);
      setEvents([]);
      addLog('success', `Workflow ${newWorkflow.workflow_id.slice(0, 8)} created. Dispatching to agent pipeline...`);
      fetchWorkflows();
    } catch (err) {
      setError(err.message);
      addLog('error', `Workflow initialization error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified =
    evaluation?.status === 'passed' ||
    evaluation?.score === 100 ||
    activeWorkflow?.status === 'completed';

  const isExecuting =
    activeWorkflow?.status === 'running' ||
    activeWorkflow?.status === 'planned' ||
    isSubmitting;

  // Detect repair/regeneration events
  const repairEvents = events.filter(e =>
    e.event_type === 'EVALUATION_FAILED' ||
    e.event_type === 'REPAIR_STARTED' ||
    e.event_type === 'PATCH_APPLIED'
  );
  const isRepairing = repairEvents.length > 0 && isExecuting;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* 1. Header */}
      <Header
        isOnline={isOnline}
        connectionStatus={connectionStatus}
        modelName={modelName}
        latency={latency}
        apiUrl={API_BASE}
        isExecuting={isExecuting}
        isVerified={isVerified}
        connectionMessage={connectionMessage}
      />

      {/* Main Container: Sidebar (Left) + Center Column + Right Tabs Panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar: Run History */}
        <SidebarRunHistory
          workflows={workflowsList}
          activeWorkflowId={activeWorkflow?.workflow_id}
          onSelectWorkflow={loadWorkflow}
          isLoading={false}
        />

        {/* Center & Right Content Grid */}
        <main
          className="command-center-main"
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
            gap: '20px',
            padding: '24px 28px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 58px)',
          }}
        >
          {/* Center Column: Goal Input + Agent Pipeline + Execution Plan + Evaluation + Execution Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Final Project Ready Banner (When Completed) */}
            {activeWorkflow?.status === 'completed' && (
              <ProjectReadyBanner
                workflowId={activeWorkflow?.workflow_id}
                evaluation={evaluation}
                artifacts={artifacts}
                requirements={requirements}
              />
            )}

            {/* 2. Requirement Input */}
            <GoalInput
              onStartWorkflow={handleStartWorkflow}
              isSubmitting={isSubmitting || isExecuting}
              error={error}
              activeGoal={activeWorkflow?.original_goal}
              isOnline={isOnline}
              connectionStatus={connectionStatus}
              workflowStatus={activeWorkflow?.status}
            />

            {/* 3. Agent Pipeline (4 Major Agent Cards: Analyzer, Planner, Code Generator, Evaluator) */}
            <AgentPanel
              tasks={tasks}
              requirements={requirements}
              artifacts={artifacts}
              evaluation={evaluation}
              events={events}
            />

            {/* Repair / Regeneration Status */}
            {isRepairing && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--state-warning-bg)',
                border: '1px solid var(--state-warning-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--state-warning)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  ⟳
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--state-warning-text)' }}>
                    Evaluation Failed — Regeneration in Progress
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Problem detected. Code Generator is repairing the project. Re-evaluation will follow automatically.
                  </div>
                </div>
              </div>
            )}

            {/* 4. Execution Plan (Structured Card) */}
            {(requirements?.execution_plan || requirements?.project_name) && (
              <ExecutionPlanCard requirements={requirements} />
            )}

            {/* 6. Evaluation Panel */}
            {evaluation && (
              <EvaluationPanel evaluation={evaluation} />
            )}

            {/* 7. Execution Log */}
            <ExecutionLog logs={logs} />
          </div>

          {/* Right Panel: Tabs for Code, Tests, Deploy & ZIP, PR Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <RightPanelTabs
              workflowId={activeWorkflow?.workflow_id}
              artifacts={artifacts}
              evaluation={evaluation}
              requirements={requirements}
              tasks={tasks}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
