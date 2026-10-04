import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Plus,
  Sun,
  Moon,
  Loader2,
  AlertCircle,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  ArrowLeft,
  Server,
  Code,
  ShieldCheck,
  Rocket,
  GitPullRequest,
  CheckCircle2,
} from 'lucide-react';
import StageBlock from '../components/StageBlock';
import RightPanelTabs from '../components/RightPanelTabs';
import { API_BASE, IS_API_CONFIGURED } from '../config';
import { checkHealthWithRetry } from '../services/healthCheck';

export default function Workspace({ onBackToLanding }) {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('nexus_theme') || 'light');

  // Health and Server Connectivity
  const [isOnline, setIsOnline] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('Checking orchestrator health...');
  const [latency, setLatency] = useState(null);

  // Workflow State
  const [workflowsList, setWorkflowsList] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [requirements, setRequirements] = useState(null);
  const [events, setEvents] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);

  // Chat Conversation State: array of messages [{ id, role: 'user' | 'assistant', text, stages, modifiedFiles, timestamp }]
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Logs
  const [logs, setLogs] = useState([]);

  // UI Panels
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const lastEventCountRef = useRef(0);
  const pollIntervalRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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

  // 1. Health Probe with Cold-Start Detection
  useEffect(() => {
    let timer = null;
    const probeHealth = async () => {
      try {
        const start = performance.now();
        setIsWakingUp(true);
        const res = await checkHealthWithRetry();
        const ms = Math.round(performance.now() - start);
        setLatency(ms);

        if (res.isHealthy) {
          setIsOnline(true);
          setIsWakingUp(false);
          setConnectionMessage(`Connected (${ms}ms) • ${res.data?.provider || 'Live AI'}`);
        } else {
          setIsOnline(false);
          setIsWakingUp(false);
          setConnectionMessage(res.message || 'Waking up server (Render cold start)...');
        }
      } catch (err) {
        setIsOnline(false);
        setIsWakingUp(false);
        setConnectionMessage('Waking up server...');
      }
    };

    probeHealth();
    timer = setInterval(probeHealth, 15000);
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
      console.warn('Failed to load recent workflows:', err);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // 3. Load Workflow State & Reconstruct Chat Thread
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

      // Fetch events
      const evRes = await fetch(`${API_BASE}/workflows/${workflowId}/events`);
      const evData = evRes.ok ? await evRes.json() : [];
      setEvents(evData);

      // Reconstruct messages thread for this workflow
      const thread = [
        {
          id: `user-${workflowId}`,
          role: 'user',
          text: data.original_goal || 'Create project',
          timestamp: data.created_at || new Date().toISOString(),
        },
        {
          id: `assistant-${workflowId}`,
          role: 'assistant',
          workflowId: data.workflow_id,
          status: data.status,
          timestamp: data.updated_at || new Date().toISOString(),
        },
      ];

      // Check for iterations in events
      const modEvents = evData.filter((e) => e.event_type === 'MODIFICATION_STARTED');
      modEvents.forEach((me, idx) => {
        thread.push({
          id: `user-mod-${idx}`,
          role: 'user',
          text: me.message.replace("Applying developer iteration: '", '').replace("'", ''),
          timestamp: me.timestamp,
        });
        thread.push({
          id: `assistant-mod-${idx}`,
          role: 'assistant-mod',
          text: `Applied iterative modification. Project files and evaluation re-verified.`,
          timestamp: me.timestamp,
        });
      });

      setMessages(thread);
    } catch (err) {
      console.warn('Failed to load workflow:', err);
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
            if (evData.length > lastEventCountRef.current) {
              const newEvts = evData.slice(lastEventCountRef.current);
              newEvts.forEach((e) => {
                addLog(
                  e.status === 'failed' ? 'error' : e.status === 'success' ? 'success' : 'agent',
                  `[${e.agent?.toUpperCase() || 'ORCHESTRATOR'}] ${e.message}`
                );
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

  // Scroll to bottom on message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tasks, activeWorkflow?.status]);

  // 5. Start New Workflow
  const handleStartWorkflow = async (goalText) => {
    if (!goalText || !goalText.trim()) return;
    setError(null);
    setIsSubmitting(true);
    const cleanText = goalText.trim();

    // Optimistic user message in chat
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: cleanText,
      timestamp: new Date().toISOString(),
    };
    setMessages([userMsg]);
    setInputValue('');
    addLog('info', `Initiating requirement: "${cleanText}"`);

    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: cleanText,
          auto_execute: true,
          demo_mode: demoMode,
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

      // Assistant placeholder message with the 4 stage blocks
      setMessages([
        userMsg,
        {
          id: `assistant-${newWorkflow.workflow_id}`,
          role: 'assistant',
          workflowId: newWorkflow.workflow_id,
          status: 'running',
          timestamp: new Date().toISOString(),
        },
      ]);

      fetchWorkflows();
    } catch (err) {
      setError(err.message);
      addLog('error', `Workflow error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Handle Follow-Up Iterative Modification
  const handleModifyWorkflow = async (instructionText) => {
    if (!instructionText || !instructionText.trim() || !activeWorkflow?.workflow_id) return;
    setError(null);
    setIsSubmitting(true);
    const cleanInst = instructionText.trim();

    const userModMsg = {
      id: `user-mod-${Date.now()}`,
      role: 'user',
      text: cleanInst,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userModMsg]);
    setInputValue('');
    addLog('info', `Applying iteration: "${cleanInst}"`);

    try {
      const res = await fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: cleanInst,
          demo_mode: demoMode,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to modify workflow');
      }

      // Reload workflow to reflect changes
      setTimeout(() => {
        loadWorkflow(activeWorkflow.workflow_id);
      }, 1200);
    } catch (err) {
      setError(err.message);
      addLog('error', `Iteration error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComposerSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting) return;

    if (!activeWorkflow || activeWorkflow.status === 'completed' || activeWorkflow.status === 'failed') {
      if (activeWorkflow && activeWorkflow.status === 'completed') {
        // Apply iterative modification
        handleModifyWorkflow(inputValue);
      } else {
        // Start brand new workflow
        handleStartWorkflow(inputValue);
      }
    } else {
      // Currently executing
      handleModifyWorkflow(inputValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComposerSubmit(e);
    }
  };

  // Helper to compute status for each of the 4 stages
  const getStageStatus = (stageKey) => {
    if (!activeWorkflow) return 'pending';
    const isWfDone = activeWorkflow.status === 'completed';
    const isWfFailed = activeWorkflow.status === 'failed';
    const isWfRunning = activeWorkflow.status === 'running' || activeWorkflow.status === 'planned';

    if (isWfDone) return 'success';

    // Map tasks to stages
    // T1, T2, T3 -> Create
    // T4 -> Test / Evaluator
    // T5 -> Deploy
    // T6 -> Collaborate / Evaluator
    const taskT1 = tasks.find((t) => t.task_id === 'T1');
    const taskT2 = tasks.find((t) => t.task_id === 'T2');
    const taskT3 = tasks.find((t) => t.task_id === 'T3');
    const taskT4 = tasks.find((t) => t.task_id === 'T4');
    const taskT5 = tasks.find((t) => t.task_id === 'T5');
    const taskT6 = tasks.find((t) => t.task_id === 'T6');

    if (stageKey === 'create') {
      if (taskT3?.status === 'success' || taskT4?.status === 'running' || taskT4?.status === 'success') return 'success';
      if (taskT1?.status === 'running' || taskT2?.status === 'running' || taskT3?.status === 'running') return 'running';
      if (isWfRunning) return 'running';
      return 'pending';
    }

    if (stageKey === 'test') {
      if (taskT4?.status === 'success' || taskT6?.status === 'success') return 'success';
      if (taskT4?.status === 'running' || taskT6?.status === 'running') return 'running';
      if (taskT3?.status === 'success') return 'running';
      return 'pending';
    }

    if (stageKey === 'deploy') {
      if (taskT5?.status === 'success' || isWfDone) return 'success';
      if (taskT5?.status === 'running') return 'running';
      if (taskT4?.status === 'success') return 'running';
      return 'pending';
    }

    if (stageKey === 'collaborate') {
      if (isWfDone) return 'success';
      if (taskT6?.status === 'running' || taskT5?.status === 'success') return 'running';
      return 'pending';
    }

    return 'pending';
  };

  const isExecuting = activeWorkflow?.status === 'running' || activeWorkflow?.status === 'planned' || isSubmitting;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* 1. Header Bar */}
      <header
        style={{
          height: '52px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToLanding}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Return to Landing Page"
          >
            <ArrowLeft size={13} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>NEXUS</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface-secondary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              WORKSPACE
            </span>
          </div>
        </div>

        {/* Server status & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Health Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: isOnline ? 'var(--state-success-text)' : 'var(--text-muted)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              background: isOnline ? 'var(--state-success-bg)' : 'var(--bg-surface-secondary)',
              border: `1px solid ${isOnline ? 'var(--state-success-border)' : 'var(--border-subtle)'}`,
            }}
          >
            <span className={`status-dot ${isOnline ? 'status-dot-success' : 'status-dot-pending'}`} />
            <span>{isWakingUp ? 'Waking up server...' : connectionMessage}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
          </button>

          {/* Right Panel Toggle */}
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            title={isRightPanelOpen ? 'Collapse artifacts panel' : 'Expand artifacts panel'}
          >
            {isRightPanelOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout: Left Sidebar + Center Chat Thread + Right Panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar: Run History */}
        <aside
          style={{
            width: isSidebarOpen ? '260px' : '0px',
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 180ms ease',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => {
                setActiveWorkflow(null);
                setMessages([]);
                setTasks([]);
                setRequirements(null);
                setEvaluation(null);
                setArtifacts([]);
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}
            >
              <Plus size={14} /> New Project
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                padding: '6px 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Project Runs ({workflowsList.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {workflowsList.map((wf) => {
                const isSelected = activeWorkflow?.workflow_id === wf.workflow_id;
                const title = wf.requirements?.project_name || wf.original_goal || 'Untitled Project';
                const timeStr = wf.created_at ? new Date(wf.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <button
                    key={wf.workflow_id}
                    onClick={() => loadWorkflow(wf.workflow_id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-xs)',
                      border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                      background: isSelected ? 'var(--bg-surface-secondary)' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: isSelected ? '700' : '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <span>{timeStr}</span>
                      <span className={`status-dot ${wf.status === 'completed' ? 'status-dot-success' : wf.status === 'running' ? 'status-dot-running' : 'status-dot-pending'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center: Conversation Thread */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-canvas)',
            overflow: 'hidden',
          }}
        >
          {/* Chat Messages Scroll Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Empty State with Prompt Chips */}
            {messages.length === 0 && (
              <div style={{ maxWidth: '680px', margin: '40px auto 0', textAlign: 'center' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                  }}
                >
                  N
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                  What would you like to build?
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                  Describe your engineering requirements. NEXUS will analyze, plan, generate full-stack code, run tests, formulate deploy configs, and prepare pull request docs.
                </p>

                {/* Suggested prompt chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  {[
                    'Create a student expense tracker where users can add expenses, categorize them, view total spending, and see recent transactions.',
                    'Build a developer task kanban board with backlog, in-progress, and done columns with REST API persistence.',
                    'Create a RESTful API with SQLite models, automated tests, and React dashboard analytics.',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStartWorkflow(chip)}
                      className="panel"
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.82rem',
                        lineHeight: 1.4,
                        transition: 'all 150ms ease',
                      }}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>"{chip}"</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Messages */}
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        maxWidth: '75%',
                        background: '#0f172a',
                        color: '#ffffff',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        boxShadow: 'var(--shadow-xs)',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              }

              if (msg.role === 'assistant') {
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '820px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <Sparkles size={14} style={{ color: 'var(--state-running)' }} />
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>NEXUS AGENT PIPELINE</span>
                    </div>

                    {/* Stage 1: CREATE */}
                    <StageBlock
                      stageKey="create"
                      stageNumber={1}
                      title="Create: Analyzer & Code Generator"
                      description="Parses requirements, generates decoupled React + FastAPI codebase, SQLite database models, and interactive preview."
                      status={getStageStatus('create')}
                      tasks={tasks}
                      requirements={requirements}
                      artifacts={artifacts}
                      workflowId={activeWorkflow?.workflow_id}
                    />

                    {/* Stage 2: TEST */}
                    <StageBlock
                      stageKey="test"
                      stageNumber={2}
                      title="Test: Evaluator Agent (Static Validation)"
                      description="Generates pytest automated test suite and executes 9-point static AST syntax and API contract verification."
                      status={getStageStatus('test')}
                      tasks={tasks}
                      requirements={requirements}
                      evaluation={evaluation}
                      artifacts={artifacts}
                      workflowId={activeWorkflow?.workflow_id}
                    />

                    {/* Stage 3: DEPLOY */}
                    <StageBlock
                      stageKey="deploy"
                      stageNumber={3}
                      title="Deploy: Production Deployment Blueprints"
                      description="Generates Dockerfile, render.yaml, vercel.json, and GitHub Actions CI workflow for zero-config cloud deployments."
                      status={getStageStatus('deploy')}
                      tasks={tasks}
                      requirements={requirements}
                      artifacts={artifacts}
                      workflowId={activeWorkflow?.workflow_id}
                    />

                    {/* Stage 4: COLLABORATE */}
                    <StageBlock
                      stageKey="collaborate"
                      stageNumber={4}
                      title="Collaborate: PR Summary & Code Review"
                      description="Generates comprehensive README, formal Pull Request description, semantic changelog, and senior engineer code review assessment."
                      status={getStageStatus('collaborate')}
                      tasks={tasks}
                      requirements={requirements}
                      artifacts={artifacts}
                      workflowId={activeWorkflow?.workflow_id}
                    />
                  </div>
                );
              }

              if (msg.role === 'assistant-mod') {
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '750px' }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--state-success-border)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--state-success-text)', fontWeight: 600, marginBottom: '4px' }}>
                        <CheckCircle2 size={14} /> Iteration Applied Successfully
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{msg.text}</p>
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--state-failure-bg)',
                  border: '1px solid var(--state-failure-border)',
                  color: 'var(--state-failure-text)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => handleStartWorkflow(inputValue || 'Create student expense tracker')}
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={12} /> Retry
                </button>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* 3. Bottom Composer */}
          <div
            style={{
              padding: '16px 28px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
            }}
          >
            <form onSubmit={handleComposerSubmit} style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeWorkflow?.status === 'completed'
                      ? 'Ask a follow-up modification (e.g. "add dark mode", "add a login page")...'
                      : 'Describe what you want to build (e.g. "Student expense tracker with categories and budget totals")...'
                  }
                  rows={2}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    resize: 'none',
                    fontSize: '0.88rem',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-primary)',
                    lineHeight: 1.45,
                  }}
                  disabled={isSubmitting}
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isSubmitting}
                  className="btn-primary"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    flexShrink: 0,
                  }}
                >
                  {isSubmitting ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline</span>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Fast offline demo mode</span>
                </label>
              </div>
            </form>
          </div>
        </main>

        {/* Right Panel: Collapsible Tabs (Files, Plan, Validation, Logs) */}
        {isRightPanelOpen && (
          <aside
            style={{
              width: '380px',
              borderLeft: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <RightPanelTabs
              workflowId={activeWorkflow?.workflow_id}
              artifacts={artifacts}
              evaluation={evaluation}
              requirements={requirements}
              tasks={tasks}
              logs={logs}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
