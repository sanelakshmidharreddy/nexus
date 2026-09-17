import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import GoalInput from '../components/GoalInput';
import WorkflowGraph from '../components/WorkflowGraph';
import AgentPanel from '../components/AgentPanel';
import ExecutionLog from '../components/ExecutionLog';
import FailureRecoveryFlow from '../components/FailureRecoveryFlow';
import ProjectFilesView from '../components/ProjectFilesView';
import EvaluatorPanel from '../components/EvaluatorPanel';
import FinalDeliverable from '../components/FinalDeliverable';
import { LayoutDashboard, GitFork, Users, Terminal, FolderTree, RefreshCw, Clock, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'workflows' | 'agents' | 'execution' | 'projects'

  const [isOnline, setIsOnline] = useState(false);
  const [modelName, setModelName] = useState('qwen2.5:7b-instruct');
  const [latency, setLatency] = useState(null);

  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [workflowsList, setWorkflowsList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requirements, setRequirements] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: 'info', message: 'NEXUS Command Center interface initialized.' },
    { time: new Date().toLocaleTimeString(), type: 'info', message: 'Checking orchestrator backend at http://localhost:8000...' }
  ]);

  const addLog = (type, message) => {
    setLogs(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  // Ping backend health & fetch recent workflows
  const checkHealthAndWorkflows = async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE}/health`);
      const delta = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        setIsOnline(true);
        setModelName(data.model || 'qwen2.5:7b-instruct');
        setLatency(delta);
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
      setLatency(null);
    }

    // Fetch existing workflows list
    try {
      const wfRes = await fetch(`${API_BASE}/workflows`);
      if (wfRes.ok) {
        const wfList = await wfRes.json();
        setWorkflowsList(wfList);
        // If no active workflow currently selected, select the latest one
        if (!activeWorkflow && wfList.length > 0) {
          const latest = wfList[0];
          setActiveWorkflow(latest);
          setRequirements(latest.requirements);
          setTasks(latest.tasks || []);
          if (latest.tasks && latest.tasks.length > 0) {
            setSelectedTaskId(latest.tasks[0].task_id);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkHealthAndWorkflows();
    const interval = setInterval(checkHealthAndWorkflows, 10000);
    return () => clearInterval(interval);
  }, []);

  // Submit Goal to Backend
  const handleStartWorkflow = async (goalText) => {
    setIsSubmitting(true);
    setError(null);
    addLog('info', `Mission directive dispatched: "${goalText}"`);
    addLog('info', 'Model requirements analyst extraction started (qwen2.5:7b-instruct)...');

    try {
      const response = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalText })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const workflow = await response.json();
      setActiveWorkflow(workflow);
      setRequirements(workflow.requirements);
      setTasks(workflow.tasks || []);
      if (workflow.tasks && workflow.tasks.length > 0) {
        setSelectedTaskId(workflow.tasks[0].task_id);
      }

      addLog('success', `Requirements verified: ${workflow.requirements?.objective || 'Objective parsed'}`);
      addLog('success', `Topological DAG task plan generated: ${workflow.tasks?.length || 0} tasks planned`);
      workflow.tasks?.forEach(t => {
        addLog('agent', `Task ${t.task_id} assigned to ${t.assigned_agent.toUpperCase()} agent: "${t.title}"`);
      });

      // Refresh workflows list
      checkHealthAndWorkflows();

    } catch (err) {
      setError(err.message || 'Failed to dispatch workflow to backend');
      addLog('error', `Workflow dispatch failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPastWorkflow = (wf) => {
    setActiveWorkflow(wf);
    setRequirements(wf.requirements);
    setTasks(wf.tasks || []);
    if (wf.tasks && wf.tasks.length > 0) {
      setSelectedTaskId(wf.tasks[0].task_id);
    }
    addLog('info', `Loaded persisted workflow ${wf.workflow_id}`);
    setActiveTab('overview');
  };

  const handleTriggerRecoveryLog = (step, msg) => {
    addLog(step === 1 ? 'error' : step === 2 || step === 4 ? 'warn' : 'success', `[ADAPTIVE RECOVERY] ${msg}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* Top Application Header */}
      <Header
        isOnline={isOnline}
        modelName={modelName}
        latency={latency}
        apiUrl={API_BASE}
      />

      {/* Navigation Bar / Shell Tabs */}
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
      }}>
        <nav style={{ display: 'flex', gap: '4px', padding: '6px 0' }}>
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
          </button>

          <button
            onClick={() => setActiveTab('execution')}
            className={`nav-tab ${activeTab === 'execution' ? 'active' : ''}`}
          >
            <Terminal size={14} />
            <span>Execution</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
          >
            <FolderTree size={14} />
            <span>Projects</span>
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>WORKFLOW ID:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
            {activeWorkflow ? activeWorkflow.workflow_id.slice(0, 10) + '...' : 'Awaiting initialization'}
          </span>
        </div>
      </div>

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
            {/* 1. Goal Input */}
            <GoalInput
              onStartWorkflow={handleStartWorkflow}
              isSubmitting={isSubmitting}
              error={error}
              activeGoal={activeWorkflow?.original_goal}
              requirements={requirements}
            />

            {/* 2. Workflow Graph */}
            <WorkflowGraph
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />

            {/* 3. Specialist Agent Swarm */}
            <AgentPanel tasks={tasks} />

            {/* 4. Adaptive Orchestration / Self-Healing Recovery Loop */}
            <FailureRecoveryFlow onTriggerRecoveryLog={handleTriggerRecoveryLog} />

            {/* 5. Live Execution Log & File Activity */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
              gap: '20px',
            }}>
              <ExecutionLog logs={logs} />
              <ProjectFilesView />
            </div>

            {/* 6. Evaluator Verification Panel */}
            <EvaluatorPanel
              requirements={requirements}
              isVerified={tasks.length > 0}
            />

            {/* 7. Final Deliverable */}
            <FinalDeliverable
              tasks={tasks}
              isVerified={tasks.length > 0}
              workflowId={activeWorkflow?.workflow_id}
              requirements={requirements}
            />
          </>
        )}

        {/* TAB 2: WORKFLOWS (Persisted Workflows History) */}
        {activeTab === 'workflows' && (
          <div className="panel">
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
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                              {wf.status.toUpperCase()}
                            </span>
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

        {/* TAB 3: AGENTS FOCUS */}
        {activeTab === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AgentPanel tasks={tasks} />
            <WorkflowGraph
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </div>
        )}

        {/* TAB 4: EXECUTION & ADAPTIVE RECOVERY */}
        {activeTab === 'execution' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FailureRecoveryFlow onTriggerRecoveryLog={handleTriggerRecoveryLog} />
            <ExecutionLog logs={logs} />
          </div>
        )}

        {/* TAB 5: PROJECTS & DELIVERABLE */}
        {activeTab === 'projects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ProjectFilesView />
            <FinalDeliverable
              tasks={tasks}
              isVerified={tasks.length > 0}
              workflowId={activeWorkflow?.workflow_id}
              requirements={requirements}
            />
          </div>
        )}
      </main>

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
      }}>
        <div>NEXUS AI Agent Orchestrator — Autonomous Multi-Agent Command Center</div>
        <div>FastAPI Backend: http://localhost:8000 | Vite Frontend: Active</div>
      </footer>
    </div>
  );
}
