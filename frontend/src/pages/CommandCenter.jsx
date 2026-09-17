import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import GoalInput from '../components/GoalInput';
import WorkflowGraph from '../components/WorkflowGraph';
import AgentPanel from '../components/AgentPanel';
import ExecutionLog from '../components/ExecutionLog';
import FailureRecoveryFlow from '../components/FailureRecoveryFlow';
import ProjectFilesView from '../components/ProjectFilesView';
import EvaluatorPanel from '../components/EvaluatorPanel';
import FinalDeliverable from '../components/FinalDeliverable';
import OrchestrationNetworkVisual from '../components/OrchestrationNetworkVisual';
import ExecutionProgressBar from '../components/ExecutionProgressBar';
import ArchitectureDiagram from '../components/ArchitectureDiagram';
import MissionLaunchExperience from '../components/MissionLaunchExperience';
import PersistentExecutionHeader from '../components/PersistentExecutionHeader';
import AgentDetailDrawer from '../components/AgentDetailDrawer';
import CompactRecoveryCard from '../components/CompactRecoveryCard';
import RecoveryCenterView from '../components/RecoveryCenterView';
import ExecutionView from '../components/ExecutionView';
import FullAgentView from '../components/FullAgentView';
import { LayoutDashboard, GitFork, Users, Terminal, FolderTree, RefreshCw, ShieldAlert } from 'lucide-react';
import { API_BASE } from '../config';

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'workflows' | 'agents' | 'execution' | 'recovery' | 'projects' | 'agent_full'

  const [isOnline, setIsOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('ONLINE'); // 'ONLINE' | 'DEGRADED' | 'OFFLINE'
  const [modelName, setModelName] = useState('qwen2.5:7b-instruct');
  const [latency, setLatency] = useState(null);

  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [workflowsList, setWorkflowsList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requirements, setRequirements] = useState(null);
  const [events, setEvents] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // New High-End UX interactive state
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [launchGoalText, setLaunchGoalText] = useState('');
  const [isLaunchBenchmark, setIsLaunchBenchmark] = useState(false);
  const [selectedAgentForDrawer, setSelectedAgentForDrawer] = useState(null);
  const [fullViewAgentId, setFullViewAgentId] = useState('research');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: 'info', message: 'NEXUS Command Center interface initialized.' },
    { time: new Date().toLocaleTimeString(), type: 'info', message: `Connected to orchestrator backend at ${API_BASE}...` }
  ]);

  const lastEventCountRef = useRef(0);

  const addLog = (type, message) => {
    setLogs(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  // Health check & recent workflows fetch
  const checkHealthAndWorkflows = async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE}/health`);
      const delta = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        setIsOnline(true);
        setConnectionStatus(data.model_reachable ? 'ONLINE' : 'DEGRADED');
        setModelName(data.model || 'qwen2.5:7b-instruct');
        setLatency(delta);
      } else {
        setIsOnline(false);
        setConnectionStatus('OFFLINE');
      }
    } catch {
      setIsOnline(false);
      setConnectionStatus('OFFLINE');
      setLatency(null);
    }

    try {
      const wfRes = await fetch(`${API_BASE}/workflows`);
      if (wfRes.ok) {
        const wfList = await wfRes.json();
        setWorkflowsList(wfList);
        if (!activeWorkflow && wfList.length > 0) {
          loadWorkflowData(wfList[0]);
        }
      }
    } catch {
      // ignore
    }
  };

  const loadWorkflowData = async (wf) => {
    setActiveWorkflow(wf);
    setRequirements(wf.requirements);
    setTasks(wf.tasks || []);
    setEvaluation(wf.evaluation || null);
    if (wf.tasks && wf.tasks.length > 0) {
      setSelectedTaskId(wf.tasks[0].task_id);
    }

    try {
      const [evRes, artRes] = await Promise.all([
        fetch(`${API_BASE}/workflows/${wf.workflow_id}/events`),
        fetch(`${API_BASE}/workflows/${wf.workflow_id}/artifacts`)
      ]);
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData);
      }
      if (artRes.ok) {
        const artData = await artRes.json();
        setArtifacts(artData);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkHealthAndWorkflows();
    const interval = setInterval(checkHealthAndWorkflows, 8000);
    return () => clearInterval(interval);
  }, []);

  // URL routing for /agents/<agentId>/<workflowId> (Section 21 & 22)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/agents/')) {
        const parts = path.split('/').filter(Boolean);
        // parts = ['agents', agentId, workflowId]
        if (parts[1]) {
          setFullViewAgentId(parts[1].toLowerCase());
          setActiveTab('agent_full');
        }
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Real-time polling when active workflow is running
  const isExecuting = Boolean(activeWorkflow && ['planned', 'running', 'in_progress'].includes(activeWorkflow.status));
  const isVerified = Boolean(
    activeWorkflow?.status === 'completed' ||
    evaluation?.status === 'passed' ||
    (tasks.length > 0 && tasks.every(t => t.status === 'success'))
  );

  useEffect(() => {
    if (!activeWorkflow || !isExecuting) return;

    const pollTimer = setInterval(async () => {
      try {
        const [wfRes, evRes, artRes] = await Promise.all([
          fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}`),
          fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/events`),
          fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/artifacts`)
        ]);

        if (wfRes.ok) {
          const updatedWf = await wfRes.json();
          setActiveWorkflow(updatedWf);
          setTasks(updatedWf.tasks || []);
          if (updatedWf.evaluation) {
            setEvaluation(updatedWf.evaluation);
          }
        }

        if (evRes.ok) {
          const evData = await evRes.json();
          setEvents(evData);

          if (evData.length > lastEventCountRef.current) {
            const newEvents = evData.slice(lastEventCountRef.current);
            newEvents.forEach(e => {
              let logType = 'info';
              if (e.event_type.includes('FAIL') || e.event_type.includes('ERROR')) logType = 'error';
              else if (e.event_type.includes('REASSIGN') || e.event_type.includes('RETRY') || e.event_type.includes('DIAGNOS')) logType = 'warn';
              else if (e.event_type.includes('PASS') || e.event_type.includes('EVALUAT') || e.event_type.includes('COMPLET')) logType = 'success';
              else if (e.event_type.includes('START') || e.event_type.includes('FINISH')) logType = 'agent';
              addLog(logType, `[${e.agent.toUpperCase()}] ${e.message}`);
            });
            lastEventCountRef.current = evData.length;
          }
        }

        if (artRes.ok) {
          const artData = await artRes.json();
          setArtifacts(artData);
        }
      } catch {
        // network blip
      }
    }, 750);

    return () => clearInterval(pollTimer);
  }, [activeWorkflow?.workflow_id, isExecuting]);

  // Submit Goal to Backend
  const handleStartWorkflow = async (goalText, isDemo = false) => {
    setIsSubmitting(true);
    setError(null);
    setLaunchGoalText(goalText);
    setIsLaunchBenchmark(isDemo);
    setIsLaunchModalOpen(true);
    lastEventCountRef.current = 0;
    addLog('info', `Mission directive dispatched: "${goalText}"`);
    addLog('info', `Topological planning initiated (Mode: ${isDemo ? 'RoadSafe Benchmark' : 'LLM Planner'})...`);

    try {
      const response = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goalText,
          auto_execute: true,
          demo_mode: isDemo
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const workflow = await response.json();
      setActiveWorkflow(workflow);
      setRequirements(workflow.requirements);
      setTasks(workflow.tasks || []);
      setEvents([]);
      setArtifacts([]);
      setEvaluation(null);
      if (workflow.tasks && workflow.tasks.length > 0) {
        setSelectedTaskId(workflow.tasks[0].task_id);
      }

      addLog('success', `Requirements synthesized: ${workflow.requirements?.objective || 'Objective parsed'}`);
      addLog('success', `DAG task plan generated: ${workflow.tasks?.length || 0} tasks planned`);
      workflow.tasks?.forEach(t => {
        addLog('agent', `Task ${t.task_id} assigned to ${t.assigned_agent.toUpperCase()} agent: "${t.title}"`);
      });

      checkHealthAndWorkflows();

    } catch (err) {
      const msg = err.message || 'Failed to dispatch workflow to backend';
      setError(msg);
      addLog('error', `Workflow dispatch failed: ${msg}`);
      setIsLaunchModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPastWorkflow = (wf) => {
    loadWorkflowData(wf);
    addLog('info', `Loaded persisted workflow ${wf.workflow_id}`);
    setActiveTab('overview');
  };

  const handleTriggerRecoveryLog = (step, msg) => {
    addLog(step === 1 ? 'error' : step === 2 || step === 4 ? 'warn' : 'success', `[ADAPTIVE RECOVERY] ${msg}`);
  };

  if (activeTab === 'agent_full') {
    return (
      <FullAgentView
        agentId={fullViewAgentId}
        onBack={() => {
          setActiveTab('overview');
          if (window.history && window.history.pushState) {
            window.history.pushState(null, '', '/');
          }
        }}
        onSelectAgent={(id) => {
          setFullViewAgentId(id);
          if (window.history && window.history.pushState) {
            window.history.pushState(null, '', `/agents/${id}/${activeWorkflow?.workflow_id || 'active'}`);
          }
        }}
        tasks={tasks}
        requirements={requirements}
        events={events}
        artifacts={artifacts}
        evaluation={evaluation}
        workflow={activeWorkflow}
        workflowId={activeWorkflow?.workflow_id}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* Top Application Header */}
      <Header
        isOnline={isOnline}
        connectionStatus={connectionStatus}
        modelName={modelName}
        latency={latency}
        apiUrl={API_BASE}
        isExecuting={isExecuting}
        isVerified={isVerified}
      />

      {/* Navigation Bar / Shell Tabs with Live Counters */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        position: 'sticky',
        top: '57px',
        zIndex: 40,
        flexWrap: 'wrap',
      }}>
        <nav style={{ display: 'flex', gap: '4px', padding: '6px 0', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard size={14} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('workflows')}
            className={`nav-tab ${activeTab === 'workflows' ? 'active' : ''}`}
          >
            <GitFork size={14} />
            <span>Workflows</span>
            {workflowsList.length > 0 && (
              <span style={{
                fontSize: '0.68rem',
                padding: '1px 5px',
                borderRadius: '999px',
                background: 'var(--bg-surface-secondary)',
                color: 'var(--text-muted)',
                fontWeight: '700',
              }}>
                {workflowsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`nav-tab ${activeTab === 'agents' ? 'active' : ''}`}
          >
            <Users size={14} />
            <span>Agents</span>
            <span style={{
              fontSize: '0.68rem',
              padding: '1px 5px',
              borderRadius: '999px',
              background: isExecuting ? 'var(--state-running-bg)' : 'var(--bg-surface-secondary)',
              color: isExecuting ? 'var(--state-running-text)' : 'var(--text-muted)',
              fontWeight: '700',
            }}>
              6
            </span>
          </button>

          <button
            onClick={() => setActiveTab('execution')}
            className={`nav-tab ${activeTab === 'execution' ? 'active' : ''}`}
          >
            <Terminal size={14} />
            <span>Execution</span>
            {isExecuting && (
              <span className="status-dot status-dot-running" style={{ width: '6px', height: '6px' }} />
            )}
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`nav-tab ${activeTab === 'recovery' ? 'active' : ''}`}
          >
            <ShieldAlert size={14} />
            <span>Recovery</span>
            <span style={{
              fontSize: '0.68rem',
              padding: '1px 5px',
              borderRadius: '999px',
              background: events.some(e => e.event_type === 'QA_PASSED') ? 'var(--state-success-bg)' : 'var(--bg-surface-secondary)',
              color: events.some(e => e.event_type === 'QA_PASSED') ? 'var(--state-success-text)' : 'var(--text-muted)',
              fontWeight: '700',
            }}>
              {events.some(e => e.event_type === 'QA_PASSED') ? '✓ 1' : '0'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
          >
            <FolderTree size={14} />
            <span>Projects</span>
            {artifacts.length > 0 && (
              <span style={{
                fontSize: '0.68rem',
                padding: '1px 5px',
                borderRadius: '999px',
                background: 'var(--bg-surface-secondary)',
                color: 'var(--text-muted)',
                fontWeight: '700',
              }}>
                {artifacts.length}
              </span>
            )}
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>WORKFLOW ID:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
            {activeWorkflow ? activeWorkflow.workflow_id.slice(0, 12) + '...' : 'Awaiting initialization'}
          </span>
          {activeWorkflow && (
            <span className={`badge badge-${activeWorkflow.status === 'completed' ? 'success' : activeWorkflow.status === 'running' ? 'running' : 'pending'}`}>
              {activeWorkflow.status.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Persistent Execution Header (Section 6) */}
      <PersistentExecutionHeader
        workflow={activeWorkflow}
        tasks={tasks}
        events={events}
        isExecuting={isExecuting}
        isVerified={isVerified}
        onNavigateToExecution={() => setActiveTab('execution')}
      />

      {/* Main Container */}
      <main style={{
        flex: 1,
        padding: '24px 28px',
        maxWidth: '1500px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* TAB 1: OVERVIEW (Full unified command center) */}
        {activeTab === 'overview' && (
          <>
            {/* HERO SECTION: Goal Directive (Left) + AI Orchestration Network Visual (Right) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '20px',
              alignItems: 'stretch',
            }}>
              <GoalInput
                onStartWorkflow={handleStartWorkflow}
                isSubmitting={isSubmitting}
                error={error}
                activeGoal={activeWorkflow?.original_goal}
                requirements={requirements}
                isOnline={isOnline}
                workflowStatus={activeWorkflow?.status}
              />

              <OrchestrationNetworkVisual
                tasks={tasks}
                events={events}
                isVerified={isVerified}
                isExecuting={isExecuting}
              />
            </div>

            {/* REAL-TIME EXECUTION PROGRESS & STAGE TELEMETRY BAR */}
            <ExecutionProgressBar
              workflow={activeWorkflow}
              tasks={tasks}
              events={events}
              isExecuting={isExecuting}
              isVerified={isVerified}
            />

            {/* LIVE ORCHESTRATION GRAPH (Centerpiece) */}
            <WorkflowGraph
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              events={events}
            />

            {/* SPECIALIST AGENT SWARM (Interactive cards with micro-depth) */}
            <AgentPanel
              tasks={tasks}
              onSelectAgent={setSelectedAgentForDrawer}
              selectedAgentId={selectedAgentForDrawer}
            />

            {/* ADAPTIVE ORCHESTRATION COMPACT RECOVERY SUMMARY CARD (Sections 17 & 25) */}
            <CompactRecoveryCard
              events={events}
              onViewRecoveryDetails={() => setActiveTab('recovery')}
            />

            {/* CHRONOLOGICAL AUDIT TIMELINE & GENERATED ARTIFACTS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
              gap: '20px',
            }}>
              <ExecutionLog logs={logs} />
              <ProjectFilesView
                artifacts={artifacts}
                workflowId={activeWorkflow?.workflow_id}
              />
            </div>

            {/* 9-POINT VERIFICATION AUDIT */}
            <EvaluatorPanel
              requirements={requirements}
              evaluation={evaluation}
              isVerified={isVerified}
              workflow={activeWorkflow}
              tasks={tasks}
              events={events}
              artifacts={artifacts}
              onNavigateToTab={setActiveTab}
            />

            {/* 3D FLOATING PRODUCT CARD & FINAL DELIVERABLE */}
            <FinalDeliverable
              tasks={tasks}
              isVerified={isVerified}
              workflowId={activeWorkflow?.workflow_id}
              requirements={requirements}
              evaluation={evaluation}
              onSwitchToTab={setActiveTab}
            />

            {/* HOW NEXUS WORKS ARCHITECTURE FLOW */}
            <ArchitectureDiagram />
          </>
        )}

        {/* TAB 2: WORKFLOWS (Persisted Workflows History) */}
        {activeTab === 'workflows' && (
          <div className="panel" style={{ background: '#ffffff' }}>
            <div className="panel-header">
              <div className="panel-title">
                <GitFork size={15} style={{ color: 'var(--text-muted)' }} />
                <span>Persisted Workflows History ({workflowsList.length})</span>
              </div>
              <button
                onClick={checkHealthAndWorkflows}
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
              >
                <RefreshCw size={11} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="panel-body">
              {workflowsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
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
                        onClick={() => handleSelectPastWorkflow(wf)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: isSelected ? 'var(--bg-surface-secondary)' : '#ffffff',
                          border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                              {wf.workflow_id.slice(0, 12)}
                            </span>
                            <span className={`badge badge-${isDone ? 'success' : wf.status === 'running' ? 'running' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                              {wf.status.toUpperCase()}
                            </span>
                            {wf.evaluation && (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                SCORE: {wf.evaluation.score}/100
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              • {new Date(wf.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.86rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {wf.original_goal}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {wf.tasks?.length || 0} tasks
                          </span>
                          <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.74rem' }}>
                            {isSelected ? 'Active' : 'Load Plan'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AGENTS FOCUS (Interactive swarm + Inspector) */}
        {activeTab === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AgentPanel
              tasks={tasks}
              onSelectAgent={setSelectedAgentForDrawer}
              selectedAgentId={selectedAgentForDrawer}
            />
            <WorkflowGraph
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              events={events}
            />
          </div>
        )}

        {/* TAB 4: OPERATIONAL EXECUTION VIEW (Sections 27 & 28) */}
        {activeTab === 'execution' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ExecutionView
              workflow={activeWorkflow}
              tasks={tasks}
              events={events}
              logs={logs}
            />
            <ExecutionLog logs={logs} />
          </div>
        )}

        {/* TAB 5: RECOVERY CENTER VIEW (Sections 18 - 24) */}
        {activeTab === 'recovery' && (
          <RecoveryCenterView
            workflow={activeWorkflow}
            events={events}
            tasks={tasks}
          />
        )}

        {/* TAB 6: PROJECTS & DELIVERABLE */}
        {activeTab === 'projects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ProjectFilesView
              artifacts={artifacts}
              workflowId={activeWorkflow?.workflow_id}
            />
            <FinalDeliverable
              tasks={tasks}
              isVerified={isVerified}
              workflowId={activeWorkflow?.workflow_id}
              requirements={requirements}
              evaluation={evaluation}
              onSwitchToTab={setActiveTab}
            />
          </div>
        )}
      </main>

      {/* Specialist Agent Intelligence Detail Drawer (Sections 11, 12, 13) */}
      <AgentDetailDrawer
        agentId={selectedAgentForDrawer}
        isOpen={Boolean(selectedAgentForDrawer)}
        onClose={() => setSelectedAgentForDrawer(null)}
        onOpenFullView={(agentId) => {
          setFullViewAgentId(agentId);
          setSelectedAgentForDrawer(null);
          setActiveTab('agent_full');
          if (window.history && window.history.pushState) {
            window.history.pushState(null, '', `/agents/${agentId}/${activeWorkflow?.workflow_id || 'active'}`);
          }
        }}
        tasks={tasks}
        requirements={requirements}
        events={events}
        artifacts={artifacts}
        evaluation={evaluation}
        workflowId={activeWorkflow?.workflow_id}
      />

      {/* Reusable Mission Launch Takeover Experience (Sections 3, 4, 5) */}
      <MissionLaunchExperience
        isOpen={isLaunchModalOpen}
        onComplete={() => setIsLaunchModalOpen(false)}
        goal={launchGoalText}
        isBenchmark={isLaunchBenchmark}
        workflow={activeWorkflow}
      />

      {/* Minimal Clean Footer */}
      <footer style={{
        padding: '12px 28px',
        borderTop: '1px solid var(--border-subtle)',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div>NEXUS AI Agent Orchestrator — Autonomous Multi-Agent Command Center</div>
        <div>FastAPI Backend: {API_BASE} | Autonomous DAG & Recovery: Operational</div>
      </footer>
    </div>
  );
}
