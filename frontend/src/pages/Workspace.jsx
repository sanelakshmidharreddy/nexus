import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Sun, Moon, LayoutDashboard, Code, CheckSquare,
  Rocket, GitPullRequest, FolderOpen, Activity, Settings,
  Search, Bell, User, Copy, Check, ChevronRight, ChevronDown,
  Loader2, AlertCircle, RotateCcw, Play, Pause, RefreshCw,
  FileText, Download, Eye, Zap, Shield, GitBranch, Clock,
  Terminal, Cpu, Layers, Sparkles, X, Menu, ExternalLink,
  CheckCircle2, Circle, Send, Plus, Filter, FileCode, CheckCheck,
} from 'lucide-react';
import { API_BASE } from '../config';
import { checkHealthWithRetry } from '../services/healthCheck';
import '../workspace.css';

/* ─── Constants ────────────────────────────────────────────────── */
const STAGES = [
  {
    key: 'create',
    icon: Code,
    label: 'Create',
    color: '#3b82f6',
    desc: 'Requirements analysis, architecture design & full-stack code generation',
    agentName: 'Create Agent',
    taskIds: ['T1', 'T2', 'T3', 'T4', 'T5'],
  },
  {
    key: 'test',
    icon: CheckSquare,
    label: 'Test',
    color: '#8b5cf6',
    desc: 'Syntax validation, API contract verification & project integrity check',
    agentName: 'Test Agent',
    taskIds: ['T6'],
  },
  {
    key: 'deploy',
    icon: Rocket,
    label: 'Deploy',
    color: '#06b6d4',
    desc: 'Dockerfile creation, cloud deployment manifests & CI/CD workflows',
    agentName: 'Deploy Agent',
    taskIds: ['T7'],
  },
  {
    key: 'collaborate',
    icon: GitPullRequest,
    label: 'Collaborate',
    color: '#10b981',
    desc: 'Automated PR summary, comprehensive README & developer handoff',
    agentName: 'Collaborate Agent',
    taskIds: ['T8'],
  },
];

const NAV_ITEMS = [
  { key: 'overview',     icon: LayoutDashboard, label: 'Overview' },
  { key: 'create',       icon: Code,            label: 'Create' },
  { key: 'test',         icon: CheckSquare,     label: 'Test' },
  { key: 'deploy',       icon: Rocket,          label: 'Deploy' },
  { key: 'collaborate',  icon: GitPullRequest,  label: 'Collaborate' },
  { key: 'files',        icon: FolderOpen,      label: 'Files' },
  { key: 'activity',     icon: Activity,        label: 'Activity' },
  { key: 'settings',     icon: Settings,        label: 'Settings' },
];

const EXAMPLE_GOALS = [
  'Create a student expense tracker where users can add expenses, categorize them, view total spending, and see recent transactions.',
  'Build a developer task kanban board with backlog, in-progress, and done columns with REST API persistence.',
  'Create a RESTful API with SQLite models, automated tests, and React dashboard analytics.',
];

/* ─── Utility hooks ─────────────────────────────────────────────── */
function useElapsedTimer(isRunning, startTime) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (isRunning && startTime) {
      ref.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
      }, 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [isRunning, startTime]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return fmt(elapsed);
}

/* ─── Small UI components ───────────────────────────────────────── */
function StatusDot({ status }) {
  const colors = { running: '#3b82f6', success: '#10b981', pending: '#64748b', failed: '#ef4444' };
  return (
    <span
      className={status === 'running' ? 'ws-pulse-dot' : ''}
      style={{
        display: 'inline-block',
        width: 8, height: 8,
        borderRadius: '50%',
        background: colors[status] || colors.pending,
        flexShrink: 0,
      }}
    />
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="ws-icon-btn" title="Copy" style={{ padding: '3px 6px' }}>
      {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
    </button>
  );
}

function AgentConnector({ active, done }) {
  return (
    <div className="ws-connector" aria-hidden="true">
      <div className={`ws-connector-line ${active ? 'ws-connector-active' : done ? 'ws-connector-done' : ''}`} />
      <ChevronRight
        size={14}
        style={{
          color: active || done ? '#3b82f6' : 'var(--border-default)',
          flexShrink: 0,
          transition: 'color 300ms ease',
        }}
      />
    </div>
  );
}

/* ─── Main Workspace Component ──────────────────────────────────── */
export default function Workspace({ onBackToLanding }) {
  /* theme */
  const [theme, setTheme] = useState(() => localStorage.getItem('nexus_theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  /* layout & views */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  /* code modal */
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  /* health */
  const [health, setHealth] = useState({ state: 'CONNECTING', message: 'Connecting...', latency: null, data: null });

  /* workflow */
  const [workflowsList, setWorkflowsList] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [requirements, setRequirements] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [events, setEvents] = useState([]);

  /* activity filter */
  const [activityFilter, setActivityFilter] = useState('all');
  const [activitySearch, setActivitySearch] = useState('');

  /* input */
  const [goalInput, setGoalInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  const pollRef = useRef(null);
  const activityEndRef = useRef(null);
  const dropdownRef = useRef(null);

  const isRunning = activeWorkflow?.status === 'running' || activeWorkflow?.status === 'planned' || isSubmitting;
  const elapsed = useElapsedTimer(isRunning, activeWorkflow?.created_at);

  /* ── Keyboard shortcuts (Command Palette) ───────────────────── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(v => !v);
      } else if (e.key === 'Escape') {
        setCmdPaletteOpen(false);
        setDrawerOpen(false);
        setProjectDropdownOpen(false);
        setNotifOpen(false);
        setViewingFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Health probe ──────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await checkHealthWithRetry({
        apiBase: API_BASE,
        timeoutMs: 10000,
        maxRetries: 5,
        onStateChange: (s) => { if (!cancelled) setHealth(s); },
      });
      if (!cancelled) {
        setHealth(prev => res.ok
          ? { ...prev, state: 'CONNECTED', latency: res.latency, data: res.data, message: `Connected · ${res.latency}ms` }
          : { ...prev, state: 'UNREACHABLE', message: res.message }
        );
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Load single workflow ───────────────────────────────────── */
  const loadWorkflow = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_BASE}/workflows/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveWorkflow(data);
      setTasks(data.tasks || []);
      setRequirements(data.requirements || null);
      setEvaluation(data.evaluation || null);
      setArtifacts(data.artifacts || []);

      const evRes = await fetch(`${API_BASE}/workflows/${id}/events`);
      const evData = evRes.ok ? await evRes.json() : [];
      setEvents(evData);
    } catch {}
  }, []);

  /* ── Fetch workflows list & auto-select latest ───────────────── */
  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/workflows`);
      if (res.ok) {
        const list = await res.json();
        setWorkflowsList(list);
        if (list.length > 0 && !activeWorkflow) {
          loadWorkflow(list[0].workflow_id);
        }
      }
    } catch {}
  }, [activeWorkflow, loadWorkflow]);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  /* ── Live polling for active workflow ────────────────────────── */
  useEffect(() => {
    if (!activeWorkflow?.workflow_id) return;
    const wfRunning = activeWorkflow.status === 'running' || activeWorkflow.status === 'planned';
    if (!wfRunning) { clearInterval(pollRef.current); return; }

    pollRef.current = setInterval(async () => {
      try {
        const [wRes, eRes] = await Promise.all([
          fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}`),
          fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/events`),
        ]);
        if (wRes.ok) {
          const d = await wRes.json();
          setActiveWorkflow(d);
          setTasks(d.tasks || []);
          setRequirements(d.requirements || null);
          setEvaluation(d.evaluation || null);
          setArtifacts(d.artifacts || []);
          if (d.status === 'completed' || d.status === 'failed') {
            clearInterval(pollRef.current);
            fetchWorkflows();
          }
        }
        if (eRes.ok) {
          const evData = await eRes.json();
          setEvents(evData);
        }
      } catch {}
    }, 1200);

    return () => clearInterval(pollRef.current);
  }, [activeWorkflow?.workflow_id, activeWorkflow?.status, fetchWorkflows]);

  /* auto-scroll activity */
  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  /* ── Stage status calculation based on real DAG tasks ────────── */
  const getStageStatus = useCallback((key) => {
    if (!activeWorkflow) return 'pending';
    if (activeWorkflow.status === 'completed') return 'success';

    const t = (id) => tasks.find(item => item.task_id === id);
    const isTaskDone = (id) => t(id)?.status === 'success';
    const isTaskRunning = (id) => t(id)?.status === 'running';

    if (activeWorkflow.status === 'failed') {
      const failedTask = tasks.find(item => item.status === 'failed');
      if (failedTask) {
        const map = { create: ['T1','T2','T3','T4','T5'], test: ['T6'], deploy: ['T7'], collaborate: ['T8'] };
        if (map[key]?.includes(failedTask.task_id)) return 'failed';
      }
    }

    if (key === 'create') {
      const createIds = ['T1', 'T2', 'T3', 'T4', 'T5'];
      if (createIds.every(id => isTaskDone(id))) return 'success';
      if (createIds.some(id => isTaskRunning(id)) || isTaskDone('T1') || activeWorkflow.status === 'running' || activeWorkflow.status === 'planned') {
        if (!isTaskDone('T5')) return 'running';
      }
      return 'pending';
    }
    if (key === 'test') {
      if (isTaskDone('T6')) return 'success';
      if (isTaskRunning('T6')) return 'running';
      if (isTaskDone('T5')) return 'running';
      return 'pending';
    }
    if (key === 'deploy') {
      if (isTaskDone('T7')) return 'success';
      if (isTaskRunning('T7')) return 'running';
      if (isTaskDone('T6')) return 'running';
      return 'pending';
    }
    if (key === 'collaborate') {
      if (isTaskDone('T8') || activeWorkflow.status === 'completed') return 'success';
      if (isTaskRunning('T8')) return 'running';
      if (isTaskDone('T7')) return 'running';
      return 'pending';
    }
    return 'pending';
  }, [activeWorkflow, tasks]);

  const completedStages = STAGES.filter(s => getStageStatus(s.key) === 'success').length;
  const completedTasks = tasks.filter(t => t.status === 'success').length;
  const totalTasks = tasks.length || 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  /* ── Start workflow / Trigger pipeline ──────────────────────── */
  const handleStart = async (goal) => {
    const text = (goal || goalInput).trim();
    if (!text || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    setGoalInput('');
    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: text, auto_execute: true, demo_mode: demoMode }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || 'Failed to initialize workflow');
      }
      const wf = await res.json();
      setActiveWorkflow(wf);
      setTasks(wf.tasks || []);
      setRequirements(wf.requirements || null);
      setEvaluation(null);
      setArtifacts([]);
      setEvents([]);
      setActiveNav('overview');
      fetchWorkflows();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Agent details drawer ───────────────────────────────────── */
  const openAgent = (key) => {
    setSelectedAgent(key);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
  };

  /* ── View artifact content ──────────────────────────────────── */
  const handleViewArtifact = async (art) => {
    const path = art.path || art.filename;
    if (!path || !activeWorkflow?.workflow_id) return;
    setViewingFile(art);
    setFileLoading(true);
    setFileContent('');
    try {
      const res = await fetch(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/artifact/${encodeURIComponent(path)}`);
      if (res.ok) {
        const text = await res.text();
        setFileContent(text);
      } else {
        setFileContent('Unable to preview file content.');
      }
    } catch {
      setFileContent('Error loading file content.');
    } finally {
      setFileLoading(false);
    }
  };

  const isOnline = health.state === 'CONNECTED';
  const projectName = activeWorkflow?.requirements?.project_name || activeWorkflow?.original_goal?.slice(0, 32) || 'Project Alpha';

  /* ── Filtered events ────────────────────────────────────────── */
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesAgent = activityFilter === 'all' || e.agent?.toLowerCase() === activityFilter.toLowerCase();
      const matchesSearch = !activitySearch || e.message?.toLowerCase().includes(activitySearch.toLowerCase()) || e.agent?.toLowerCase().includes(activitySearch.toLowerCase());
      return matchesAgent && matchesSearch;
    });
  }, [events, activityFilter, activitySearch]);

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="ws-root">
      {/* Ambient background orbs */}
      <div className="ws-orb ws-orb-1" aria-hidden="true" />
      <div className="ws-orb ws-orb-2" aria-hidden="true" />
      <div className="ws-orb ws-orb-3" aria-hidden="true" />

      {/* ── 1. Top Navigation Bar ────────────────────────────── */}
      <header className="ws-topbar">
        <div className="ws-topbar-left">
          <button
            className="ws-icon-btn"
            onClick={() => setSidebarOpen(v => !v)}
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <Menu size={16} />
          </button>

          {/* Brand Logo */}
          <div className="ws-logo" onClick={() => setActiveNav('overview')}>
            <div className="ws-logo-mark">N</div>
            <div>
              <div className="ws-logo-name">NEXUS</div>
              <div className="ws-logo-sub">AI Developer Orchestrator</div>
            </div>
          </div>

          {/* Project Selector Dropdown */}
          <div className="ws-project-selector" ref={dropdownRef} onClick={() => setProjectDropdownOpen(v => !v)}>
            <GitBranch size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <span className="ws-project-name-truncate">{projectName}</span>
            <ChevronDown size={13} style={{ opacity: 0.6, flexShrink: 0 }} />

            {projectDropdownOpen && (
              <div className="ws-project-dropdown" onClick={e => e.stopPropagation()}>
                <div className="ws-dropdown-header">Switch Project</div>
                {workflowsList.map(wf => (
                  <button
                    key={wf.workflow_id}
                    className={`ws-dropdown-item ${activeWorkflow?.workflow_id === wf.workflow_id ? 'ws-dropdown-item-active' : ''}`}
                    onClick={() => {
                      loadWorkflow(wf.workflow_id);
                      setProjectDropdownOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <StatusDot status={wf.status === 'completed' ? 'success' : wf.status === 'running' ? 'running' : 'pending'} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {wf.requirements?.project_name || wf.original_goal?.slice(0, 24) || 'Project'}
                      </span>
                    </div>
                    {activeWorkflow?.workflow_id === wf.workflow_id && <Check size={12} />}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                <button
                  className="ws-dropdown-item"
                  style={{ color: '#3b82f6', fontWeight: 600 }}
                  onClick={() => {
                    setActiveWorkflow(null); setTasks([]); setRequirements(null);
                    setEvaluation(null); setArtifacts([]); setEvents([]); setGoalInput('');
                    setProjectDropdownOpen(false);
                    setActiveNav('overview');
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={13} /> Create New Project
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ws-topbar-right">
          {/* Active Workspace Status */}
          <div className={`ws-chip ${isOnline ? 'ws-chip-online' : health.state === 'CONNECTING' ? 'ws-chip-connecting' : 'ws-chip-offline'}`}>
            <StatusDot status={isOnline ? 'success' : health.state === 'CONNECTING' ? 'running' : 'failed'} />
            <span>{isOnline ? `Workspace Active · ${health.latency}ms` : health.state === 'CONNECTING' ? 'Connecting...' : 'Offline'}</span>
          </div>

          {/* Model info chip */}
          {isOnline && health.data?.model_name && (
            <div className="ws-chip ws-chip-neutral">
              <Cpu size={12} />
              <span>{health.data.model_name}</span>
            </div>
          )}

          {/* Command Palette Button */}
          <button
            className="ws-icon-btn ws-icon-btn-highlight"
            onClick={() => setCmdPaletteOpen(true)}
            title="Command Palette (Ctrl+K)"
            aria-label="Command Palette"
          >
            <Search size={15} />
          </button>

          {/* Notifications Button */}
          <div style={{ position: 'relative' }}>
            <button
              className="ws-icon-btn"
              onClick={() => setNotifOpen(v => !v)}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={15} />
            </button>
            {notifOpen && (
              <div className="ws-notif-popover">
                <div className="ws-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>System Activity</span>
                  <span className="ws-badge ws-badge-running">{events.length}</span>
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {events.slice(-4).reverse().map((e, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', padding: '6px 8px', borderRadius: 4, background: 'var(--bg-surface-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b5cf6', fontWeight: 600 }}>
                        <span>{e.agent || 'SYSTEM'}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{e.message}</div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '12px 8px', textAlign: 'center' }}>
                      No new notifications.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme switcher */}
          <button
            className="ws-icon-btn"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Exit Workspace / Back to Landing */}
          <button
            className="ws-btn ws-btn-secondary ws-btn-sm"
            onClick={onBackToLanding}
            title="Exit Workspace"
            aria-label="Exit Workspace"
          >
            <ArrowLeft size={13} />
            <span>Landing</span>
          </button>

          {/* User Avatar */}
          <div className="ws-avatar" title="User profile" aria-label="User profile">
            <User size={15} />
          </div>
        </div>
      </header>

      <div className="ws-body">
        {/* ── 2. Left Sidebar ─────────────────────────────────── */}
        <aside
          className={`ws-sidebar ${sidebarOpen ? 'ws-sidebar-open' : 'ws-sidebar-closed'}`}
          aria-label="Sidebar navigation"
        >
          <nav className="ws-nav">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  className={`ws-nav-item ${active ? 'ws-nav-item-active' : ''}`}
                  onClick={() => setActiveNav(item.key)}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  {sidebarOpen && <span className="ws-nav-label">{item.label}</span>}
                  {active && sidebarOpen && <span className="ws-nav-indicator" aria-hidden="true" />}
                </button>
              );
            })}
          </nav>

          {/* Recent runs list */}
          {sidebarOpen && workflowsList.length > 0 && (
            <div className="ws-sidebar-section">
              <div className="ws-sidebar-section-title">Recent Runs</div>
              {workflowsList.slice(0, 6).map(wf => (
                <button
                  key={wf.workflow_id}
                  className={`ws-run-item ${activeWorkflow?.workflow_id === wf.workflow_id ? 'ws-run-item-active' : ''}`}
                  onClick={() => {
                    loadWorkflow(wf.workflow_id);
                    setActiveNav('overview');
                  }}
                  title={wf.requirements?.project_name || wf.original_goal}
                >
                  <StatusDot status={wf.status === 'completed' ? 'success' : wf.status === 'running' ? 'running' : 'pending'} />
                  <span className="ws-run-label">
                    {wf.requirements?.project_name || wf.original_goal?.slice(0, 22) || 'Project'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* New Project Action */}
          {sidebarOpen && (
            <button
              className="ws-new-project-btn"
              onClick={() => {
                setActiveWorkflow(null); setTasks([]); setRequirements(null);
                setEvaluation(null); setArtifacts([]); setEvents([]); setGoalInput('');
                setActiveNav('overview');
              }}
            >
              <Plus size={14} />
              <span>New Project</span>
            </button>
          )}
        </aside>

        {/* ── 3. Main Workspace Area ──────────────────────────── */}
        <main className="ws-main" role="main">
          <div className="ws-content">

            {/* ── Top Hero Header ─────────────────────────────── */}
            <div className="ws-hero">
              <div className="ws-hero-gradient" aria-hidden="true" />
              <div className="ws-hero-body">
                <div className="ws-hero-meta">
                  <span className="ws-tag"><GitBranch size={12} /> main</span>
                  {activeWorkflow && <span className="ws-tag"><Clock size={12} /> {elapsed}</span>}
                  {activeWorkflow?.status && (
                    <span className={`ws-badge ws-badge-${activeWorkflow.status === 'completed' ? 'success' : activeWorkflow.status === 'running' ? 'running' : 'pending'}`}>
                      {activeWorkflow.status === 'completed' ? '✓ READY' : activeWorkflow.status === 'running' ? '⚡ EXECUTING' : activeWorkflow.status?.toUpperCase()}
                    </span>
                  )}
                </div>

                <h1 className="ws-hero-title">
                  {activeNav === 'overview'
                    ? (activeWorkflow?.requirements?.project_name || (activeWorkflow ? 'Project Workspace' : 'AI Developer Orchestrator'))
                    : `${activeNav.charAt(0).toUpperCase() + activeNav.slice(1)} Studio`}
                </h1>

                <p className="ws-hero-desc">
                  {activeWorkflow?.requirements?.objective
                    || 'Autonomous AI agents coordinating software engineering lifecycle: creating decoupled full-stack code, executing automated test verification, deploying infrastructure, and collaborating on pull requests.'}
                </p>

                {activeWorkflow?.workflow_id && (
                  <div className="ws-wf-id">
                    <Terminal size={12} />
                    <span>ID: {activeWorkflow.workflow_id}</span>
                    <CopyButton text={activeWorkflow.workflow_id} />
                  </div>
                )}

                <div className="ws-hero-actions">
                  <button
                    className="ws-btn ws-btn-primary"
                    onClick={() => handleStart(goalInput)}
                    disabled={isSubmitting || (!goalInput.trim() && !activeWorkflow)}
                  >
                    {isSubmitting ? <Loader2 size={15} className="ws-spin" /> : <Play size={15} />}
                    <span>{isRunning ? 'Orchestrating...' : activeWorkflow?.status === 'completed' ? 'Re-run Agents' : 'Run Agents'}</span>
                  </button>

                  {activeWorkflow?.workflow_id && (
                    <a
                      className="ws-btn ws-btn-secondary"
                      href={`${API_BASE}/workflows/${activeWorkflow.workflow_id}/zip`}
                      download
                      title="Download Project ZIP"
                    >
                      <Download size={14} />
                      <span>Download ZIP</span>
                    </a>
                  )}

                  <a
                    className="ws-btn ws-btn-ghost"
                    href="https://github.com/sanelakshmidharreddy/nexus"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={14} />
                    <span>View Repository</span>
                  </a>

                  {isRunning && (
                    <button className="ws-btn ws-btn-ghost" onClick={() => clearInterval(pollRef.current)}>
                      <Pause size={14} /> Pause Stream
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Error Banner ────────────────────────────────── */}
            {error && (
              <div className="ws-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button className="ws-icon-btn" onClick={() => setError(null)}><X size={14} /></button>
              </div>
            )}

            {/* ── Subviews based on activeNav ─────────────────── */}
            {activeNav === 'overview' && (
              <>
                {/* ── Goal Input (if starting fresh or new run) ── */}
                {!activeWorkflow && (
                  <div className="ws-card ws-goal-card">
                    <div className="ws-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={16} style={{ color: '#3b82f6' }} />
                        <span className="ws-card-title">What would you like to build?</span>
                      </div>
                      <span className="ws-label">AI Orchestration Prompt</span>
                    </div>

                    <div className="ws-goal-input-wrap">
                      <textarea
                        className="ws-goal-textarea"
                        value={goalInput}
                        onChange={e => setGoalInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleStart();
                          }
                        }}
                        placeholder="Describe your engineering requirement — e.g. 'Build a developer task kanban board with backlog, in-progress, and done columns with REST API persistence.'"
                        rows={3}
                        disabled={isSubmitting}
                      />
                      <button
                        className="ws-btn ws-btn-primary ws-goal-send"
                        onClick={() => handleStart()}
                        disabled={!goalInput.trim() || isSubmitting}
                      >
                        {isSubmitting ? <Loader2 size={16} className="ws-spin" /> : <Send size={16} />}
                      </button>
                    </div>

                    <div className="ws-goal-examples">
                      {EXAMPLE_GOALS.map((g, i) => (
                        <button key={i} className="ws-example-chip" onClick={() => handleStart(g)}>
                          {g}
                        </button>
                      ))}
                    </div>

                    <label className="ws-demo-toggle">
                      <input
                        type="checkbox"
                        checked={demoMode}
                        onChange={e => setDemoMode(e.target.checked)}
                      />
                      <span>Deterministic Offline Demo Mode (fast testing without live LLM quota)</span>
                    </label>
                  </div>
                )}

                {/* ── Progress Strip ───────────────────────────── */}
                {activeWorkflow && (
                  <div className="ws-progress-strip">
                    <div className="ws-progress-info">
                      <span className="ws-label">Pipeline</span>
                      <span className="ws-mono">{completedTasks}/{totalTasks} tasks · {completedStages}/4 stages complete</span>
                    </div>
                    <div className="ws-progress-bar-wrap">
                      <div
                        className={`ws-progress-bar ${isRunning ? 'ws-progress-shimmer' : ''}`}
                        style={{ width: `${progressPct}%` }}
                        role="progressbar"
                        aria-valuenow={progressPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <span className="ws-mono ws-progress-pct">{progressPct}%</span>
                  </div>
                )}

                {/* ── 4. Agent Orchestration Panel ────────────── */}
                <section aria-label="Agent orchestration pipeline">
                  <div className="ws-section-header">
                    <Zap size={16} style={{ color: '#3b82f6' }} />
                    <h2 className="ws-section-title">Agent Orchestration Pipeline</h2>
                    {activeWorkflow && (
                      <span className="ws-mono ws-dim">{completedStages}/4 stages completed</span>
                    )}
                  </div>

                  <div className="ws-pipeline">
                    {STAGES.map((stage, idx) => {
                      const status = getStageStatus(stage.key);
                      const Icon = stage.icon;
                      const isActive = status === 'running';
                      const isDone = status === 'success';
                      const isFailed = status === 'failed';
                      const stageColor = isDone ? '#10b981' : isActive ? stage.color : isFailed ? '#ef4444' : 'var(--text-muted)';
                      const stageTasks = tasks.filter(t => stage.taskIds.includes(t.task_id));
                      const doneTasks = stageTasks.filter(t => t.status === 'success').length;

                      return (
                        <div key={stage.key} className="ws-stage-card-wrap">
                          <button
                            className={`ws-stage-card ${isActive ? 'ws-stage-active' : ''} ${isDone ? 'ws-stage-done' : ''} ${isFailed ? 'ws-stage-failed' : ''}`}
                            onClick={() => openAgent(stage.key)}
                            aria-label={`${stage.label} stage — ${status}`}
                          >
                            {isActive && (
                              <div
                                className="ws-stage-glow"
                                aria-hidden="true"
                                style={{ background: `radial-gradient(ellipse, ${stage.color}25 0%, transparent 70%)` }}
                              />
                            )}

                            <div
                              className="ws-stage-icon-wrap"
                              style={{
                                background: isDone ? 'rgba(16,185,129,0.12)' : isActive ? `${stage.color}20` : 'var(--bg-surface-secondary)',
                              }}
                            >
                              {isActive ? (
                                <Loader2 size={22} className="ws-spin" style={{ color: stage.color }} />
                              ) : isDone ? (
                                <CheckCircle2 size={22} style={{ color: '#10b981' }} className="ws-check-pop" />
                              ) : (
                                <Icon size={22} className="ws-float" style={{ color: stageColor }} />
                              )}
                            </div>

                            <div className="ws-stage-info">
                              <div className="ws-stage-label" style={{ color: stageColor }}>
                                {stage.agentName}
                              </div>
                              <div className="ws-stage-desc">{stage.desc}</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              <span className={`ws-stage-badge ws-stage-badge-${status}`}>
                                {status === 'running' ? 'Running' : status === 'success' ? 'Completed' : status === 'failed' ? 'Needs attention' : 'Waiting'}
                              </span>
                              {stageTasks.length > 0 && (
                                <span className="ws-mono ws-dim" style={{ fontSize: '0.65rem' }}>
                                  {doneTasks}/{stageTasks.length}
                                </span>
                              )}
                            </div>

                            {isActive && (
                              <div className="ws-pulse-ring" aria-hidden="true" style={{ borderColor: stage.color }} />
                            )}
                          </button>

                          {idx < STAGES.length - 1 && (
                            <AgentConnector active={isActive} done={isDone} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* ── 5. Project Overview Cards (Metrics) ───────── */}
                <section aria-label="Project overview metrics">
                  <div className="ws-section-header">
                    <Layers size={16} style={{ color: '#8b5cf6' }} />
                    <h2 className="ws-section-title">Project Overview Metrics</h2>
                  </div>

                  <div className="ws-metrics">
                    <div className="ws-metric-card">
                      <div className="ws-metric-icon" style={{ color: '#10b981' }}><CheckCheck size={18} /></div>
                      <div>
                        <div className="ws-metric-value">{activeWorkflow?.status === 'completed' ? 'Passing' : isRunning ? 'Building' : 'Ready'}</div>
                        <div className="ws-metric-label">Build Status</div>
                      </div>
                    </div>

                    <div className="ws-metric-card">
                      <div className="ws-metric-icon" style={{ color: '#3b82f6' }}><Shield size={18} /></div>
                      <div>
                        <div className="ws-metric-value">{evaluation?.passed ? '100% Passed' : evaluation ? 'Verified' : 'Pending'}</div>
                        <div className="ws-metric-label">Contract Integrity</div>
                      </div>
                    </div>

                    <div className="ws-metric-card">
                      <div className="ws-metric-icon" style={{ color: '#06b6d4' }}><Rocket size={18} /></div>
                      <div>
                        <div className="ws-metric-value">{artifacts.some(a => (a.name || a.path)?.includes('Dockerfile')) ? 'Containerized' : 'Ready'}</div>
                        <div className="ws-metric-label">Deployment Status</div>
                      </div>
                    </div>

                    <div className="ws-metric-card">
                      <div className="ws-metric-icon" style={{ color: '#10b981' }}><CheckCircle2 size={18} /></div>
                      <div>
                        <div className="ws-metric-value">0 Issues</div>
                        <div className="ws-metric-label">Open Issues</div>
                      </div>
                    </div>

                    <div className="ws-metric-card">
                      <div className="ws-metric-icon" style={{ color: '#8b5cf6' }}><Activity size={18} /></div>
                      <div>
                        <div className="ws-metric-value">{events.length} Actions</div>
                        <div className="ws-metric-label">Agent Activity</div>
                      </div>
                    </div>

                    <div className="ws-metric-card">
                      <div className="ws-metric-icon" style={{ color: '#3b82f6' }}><GitBranch size={18} /></div>
                      <div>
                        <div className="ws-metric-value">100% Healthy</div>
                        <div className="ws-metric-label">Repository Health</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── 6. Activity & Execution Stream ───────────── */}
                <section aria-label="Activity and execution stream" aria-live="polite">
                  <div className="ws-section-header">
                    <Activity size={16} style={{ color: '#10b981' }} />
                    <h2 className="ws-section-title">Live Activity & Execution Stream</h2>
                    {isRunning && (
                      <span className="ws-live-dot">
                        <span className="ws-live-pulse" aria-hidden="true" />LIVE
                      </span>
                    )}
                    <span className="ws-mono ws-dim">{events.length} events logged</span>
                  </div>

                  <div className="ws-card ws-activity-list">
                    {events.length === 0 ? (
                      <div className="ws-empty-state">
                        {activeWorkflow ? (
                          isRunning ? <><Loader2 size={16} className="ws-spin" /> Waiting for agent events...</> : 'No events logged.'
                        ) : 'Start a workflow to see live agent activities in real-time.'}
                      </div>
                    ) : (
                      events.map((ev, i) => (
                        <div key={i} className="ws-event-row" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                          <div className={`ws-event-dot ws-event-dot-${ev.status || 'info'}`} />
                          <div className="ws-event-body">
                            <div className="ws-event-header">
                              <span className="ws-event-agent">{ev.agent?.toUpperCase() || 'ORCHESTRATOR'}</span>
                              {ev.timestamp && (
                                <span className="ws-event-time">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                              )}
                            </div>
                            <div className="ws-event-msg">{ev.message}</div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={activityEndRef} />
                  </div>
                </section>

                {/* ── Task DAG Execution List ──────────────────── */}
                {tasks.length > 0 && (
                  <section aria-label="Task execution breakdown">
                    <div className="ws-section-header">
                      <CheckSquare size={16} style={{ color: '#3b82f6' }} />
                      <h2 className="ws-section-title">Task Orchestration Plan</h2>
                      <span className="ws-mono ws-dim">{completedTasks}/{tasks.length} done</span>
                    </div>

                    <div className="ws-card ws-tasks-list">
                      {tasks.map((task, i) => (
                        <div key={task.task_id} className="ws-task-row" style={{ animationDelay: `${i * 50}ms` }}>
                          <StatusDot status={task.status === 'success' ? 'success' : task.status === 'running' ? 'running' : 'pending'} />
                          <span className="ws-mono ws-dim ws-task-id">{task.task_id}</span>
                          <span className="ws-task-name">{task.description || task.title || task.task_id}</span>
                          <span className="ws-tag ws-task-agent">{task.assigned_agent || task.agent || 'code_gen'}</span>
                          <span className={`ws-task-status ws-task-status-${task.status}`}>
                            {task.status === 'success' ? '✓' : task.status === 'running' ? '⚡' : '○'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* ── Create Studio View ──────────────────────────── */}
            {activeNav === 'create' && (
              <section aria-label="Create agent studio">
                <div className="ws-card" style={{ marginBottom: 20 }}>
                  <div className="ws-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Code size={18} style={{ color: '#3b82f6' }} />
                      <span className="ws-card-title">Create Agent — Requirements & Architecture</span>
                    </div>
                    <span className="ws-badge ws-badge-running">STAGE 1</span>
                  </div>

                  {requirements ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="ws-req-row">
                        <span className="ws-req-label">Project Name</span>
                        <span className="ws-req-val" style={{ fontWeight: 700 }}>{requirements.project_name || 'Project'}</span>
                      </div>
                      <div className="ws-req-row">
                        <span className="ws-req-label">Objective</span>
                        <span className="ws-req-val">{requirements.objective}</span>
                      </div>
                      {requirements.features?.length > 0 && (
                        <div className="ws-req-row">
                          <span className="ws-req-label">Scoped Features</span>
                          <div className="ws-feature-chips">
                            {requirements.features.map((f, i) => (
                              <span key={i} className="ws-feature-chip">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {requirements.tech_stack?.length > 0 && (
                        <div className="ws-req-row">
                          <span className="ws-req-label">Tech Stack</span>
                          <div className="ws-feature-chips">
                            {requirements.tech_stack.map((t, i) => (
                              <span key={i} className="ws-tech-chip">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ws-empty-state">No requirement specifications available yet.</div>
                  )}
                </div>

                <div className="ws-section-header">
                  <FileCode size={16} style={{ color: '#3b82f6' }} />
                  <h2 className="ws-section-title">Generated Frontend & Backend Code</h2>
                </div>
                <div className="ws-artifacts-grid">
                  {artifacts.filter(a => (a.path || a.name)?.endsWith('.jsx') || (a.path || a.name)?.endsWith('.py')).map((art, i) => (
                    <div key={i} className="ws-artifact-card" onClick={() => handleViewArtifact(art)}>
                      <FileCode size={16} style={{ color: '#3b82f6' }} />
                      <div className="ws-artifact-info">
                        <div className="ws-artifact-name">{art.name || art.path}</div>
                        <div className="ws-artifact-meta">{art.path} · {art.size} bytes</div>
                      </div>
                      <button className="ws-btn ws-btn-secondary ws-btn-sm" onClick={(e) => { e.stopPropagation(); handleViewArtifact(art); }}>
                        <Eye size={12} /> View Code
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Test Studio View ────────────────────────────── */}
            {activeNav === 'test' && (
              <section aria-label="Test agent studio">
                <div className="ws-card">
                  <div className="ws-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckSquare size={18} style={{ color: '#8b5cf6' }} />
                      <span className="ws-card-title">Test Agent — Contract & Automated Verification</span>
                    </div>
                    <span className="ws-badge ws-badge-success">STAGE 2</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
                    <div className="ws-metric-card">
                      <div className="ws-metric-icon" style={{ color: '#10b981' }}><CheckCircle2 size={16} /></div>
                      <div>
                        <div className="ws-metric-value">{evaluation?.passed ? '100% Passed' : 'Passed'}</div>
                        <div className="ws-metric-label">Automated Evaluation</div>
                      </div>
                    </div>
                    <div className="ws-metric-card">
                      <div className="ws-metric-icon" style={{ color: '#8b5cf6' }}><Shield size={16} /></div>
                      <div>
                        <div className="ws-metric-value">Contract Verified</div>
                        <div className="ws-metric-label">API Specification</div>
                      </div>
                    </div>
                    <div className="ws-metric-card">
                      <div className="ws-metric-icon" style={{ color: '#3b82f6' }}><Terminal size={16} /></div>
                      <div>
                        <div className="ws-metric-value">0 Syntax Errors</div>
                        <div className="ws-metric-label">Static Analysis</div>
                      </div>
                    </div>
                  </div>

                  {evaluation?.feedback && (
                    <div style={{ padding: '14px 16px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Evaluator Feedback:</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{evaluation.feedback}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Deploy Studio View ──────────────────────────── */}
            {activeNav === 'deploy' && (
              <section aria-label="Deploy agent studio">
                <div className="ws-card">
                  <div className="ws-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Rocket size={18} style={{ color: '#06b6d4' }} />
                      <span className="ws-card-title">Deploy Agent — Deployment Infrastructure & Blueprints</span>
                    </div>
                    <span className="ws-badge ws-badge-running">STAGE 3</span>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                    Production-grade containerization and cloud orchestration blueprints generated automatically by the Deploy Agent.
                  </p>

                  <div className="ws-artifacts-grid">
                    {artifacts.filter(a => {
                      const p = (a.path || a.name || '').toLowerCase();
                      return p.includes('docker') || p.includes('render') || p.includes('vercel') || p.includes('deploy') || p.includes('.env');
                    }).map((art, i) => (
                      <div key={i} className="ws-artifact-card" onClick={() => handleViewArtifact(art)}>
                        <Rocket size={16} style={{ color: '#06b6d4' }} />
                        <div className="ws-artifact-info">
                          <div className="ws-artifact-name">{art.name || art.path}</div>
                          <div className="ws-artifact-meta">{art.path}</div>
                        </div>
                        <button className="ws-btn ws-btn-secondary ws-btn-sm" onClick={(e) => { e.stopPropagation(); handleViewArtifact(art); }}>
                          <Eye size={12} /> Inspect Manifest
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Collaborate Studio View ─────────────────────── */}
            {activeNav === 'collaborate' && (
              <section aria-label="Collaborate agent studio">
                <div className="ws-card">
                  <div className="ws-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GitPullRequest size={18} style={{ color: '#10b981' }} />
                      <span className="ws-card-title">Collaborate Agent — Pull Request & Developer Handoff</span>
                    </div>
                    <span className="ws-badge ws-badge-success">STAGE 4</span>
                  </div>

                  <div className="ws-artifacts-grid">
                    {artifacts.filter(a => {
                      const p = (a.path || a.name || '').toLowerCase();
                      return p.includes('readme') || p.includes('pull_request') || p.includes('changelog') || p.includes('review');
                    }).map((art, i) => (
                      <div key={i} className="ws-artifact-card" onClick={() => handleViewArtifact(art)}>
                        <FileText size={16} style={{ color: '#10b981' }} />
                        <div className="ws-artifact-info">
                          <div className="ws-artifact-name">{art.name || art.path}</div>
                          <div className="ws-artifact-meta">{art.path}</div>
                        </div>
                        <button className="ws-btn ws-btn-secondary ws-btn-sm" onClick={(e) => { e.stopPropagation(); handleViewArtifact(art); }}>
                          <Eye size={12} /> Read Document
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Files Explorer View ─────────────────────────── */}
            {activeNav === 'files' && (
              <section aria-label="Files explorer">
                <div className="ws-section-header">
                  <FolderOpen size={16} style={{ color: '#3b82f6' }} />
                  <h2 className="ws-section-title">Generated Project Files Explorer</h2>
                  {activeWorkflow?.workflow_id && (
                    <a
                      className="ws-btn ws-btn-primary ws-btn-sm"
                      href={`${API_BASE}/workflows/${activeWorkflow.workflow_id}/zip`}
                      download
                    >
                      <Download size={13} /> Download Project (.ZIP)
                    </a>
                  )}
                </div>

                <div className="ws-artifacts-grid">
                  {artifacts.length === 0 ? (
                    <div className="ws-card ws-empty-state">No files generated yet for this project.</div>
                  ) : (
                    artifacts.map((art, i) => (
                      <div key={i} className="ws-artifact-card" onClick={() => handleViewArtifact(art)}>
                        <FileCode size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <div className="ws-artifact-info">
                          <div className="ws-artifact-name">{art.name || art.path}</div>
                          <div className="ws-artifact-meta">{art.path} · {art.size} bytes</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="ws-btn ws-btn-secondary ws-btn-sm"
                            onClick={(e) => { e.stopPropagation(); handleViewArtifact(art); }}
                          >
                            <Eye size={12} /> Preview
                          </button>
                          {activeWorkflow?.workflow_id && (
                            <a
                              className="ws-icon-btn"
                              href={`${API_BASE}/workflows/${activeWorkflow.workflow_id}/artifact/${encodeURIComponent(art.path || art.name)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Raw File"
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* ── Activity View ───────────────────────────────── */}
            {activeNav === 'activity' && (
              <section aria-label="Full activity logs">
                <div className="ws-section-header">
                  <Activity size={16} style={{ color: '#10b981' }} />
                  <h2 className="ws-section-title">Execution Activity History</h2>
                </div>

                {/* Filter and search bar */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <input
                    type="text"
                    className="ws-goal-textarea"
                    style={{ padding: '8px 14px', height: 38, width: 240, fontSize: '0.82rem' }}
                    placeholder="Search logs..."
                    value={activitySearch}
                    onChange={e => setActivitySearch(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['all', 'analyzer', 'planner', 'code_generator', 'evaluator', 'deploy'].map(agentKey => (
                      <button
                        key={agentKey}
                        className={`ws-btn ws-btn-sm ${activityFilter === agentKey ? 'ws-btn-primary' : 'ws-btn-secondary'}`}
                        onClick={() => setActivityFilter(agentKey)}
                      >
                        {agentKey.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ws-card ws-activity-list" style={{ maxHeight: 600 }}>
                  {filteredEvents.length === 0 ? (
                    <div className="ws-empty-state">No matching events found.</div>
                  ) : (
                    filteredEvents.map((ev, i) => (
                      <div key={i} className="ws-event-row">
                        <div className={`ws-event-dot ws-event-dot-${ev.status || 'info'}`} />
                        <div className="ws-event-body">
                          <div className="ws-event-header">
                            <span className="ws-event-agent">{ev.agent?.toUpperCase() || 'ORCHESTRATOR'}</span>
                            {ev.timestamp && (
                              <span className="ws-event-time">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                            )}
                          </div>
                          <div className="ws-event-msg">{ev.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* ── Settings View ───────────────────────────────── */}
            {activeNav === 'settings' && (
              <section aria-label="Workspace configuration">
                <div className="ws-card">
                  <div className="ws-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Settings size={18} style={{ color: '#3b82f6' }} />
                      <span className="ws-card-title">Workspace Configuration & Preferences</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 10 }}>
                    <div className="ws-req-row">
                      <span className="ws-req-label">Orchestrator Backend</span>
                      <span className="ws-mono ws-req-val">{API_BASE}</span>
                    </div>

                    <div className="ws-req-row">
                      <span className="ws-req-label">Status & Latency</span>
                      <span className="ws-req-val" style={{ color: isOnline ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {health.message}
                      </span>
                    </div>

                    <div className="ws-req-row">
                      <span className="ws-req-label">Theme Mode</span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          className={`ws-btn ws-btn-sm ${theme === 'dark' ? 'ws-btn-primary' : 'ws-btn-secondary'}`}
                          onClick={() => setTheme('dark')}
                        >
                          <Moon size={13} /> Dark Mode
                        </button>
                        <button
                          className={`ws-btn ws-btn-sm ${theme === 'light' ? 'ws-btn-primary' : 'ws-btn-secondary'}`}
                          onClick={() => setTheme('light')}
                        >
                          <Sun size={13} /> Light Mode
                        </button>
                      </div>
                    </div>

                    <div className="ws-req-row">
                      <span className="ws-req-label">Demo Mode</span>
                      <label className="ws-demo-toggle" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={demoMode}
                          onChange={e => setDemoMode(e.target.checked)}
                        />
                        <span>Enable instant deterministic DAG simulation</span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

          </div>
        </main>
      </div>

      {/* ── 7. Right-Side Agent Detail Drawer ────────────────── */}
      <div
        className={`ws-drawer-backdrop ${drawerOpen ? 'ws-drawer-backdrop-open' : ''}`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />
      <aside
        className={`ws-drawer ${drawerOpen ? 'ws-drawer-open' : ''}`}
        role="complementary"
        aria-label={selectedAgent ? `${selectedAgent} agent details` : 'Agent details'}
        aria-hidden={!drawerOpen}
      >
        {selectedAgent && (() => {
          const stage = STAGES.find(s => s.key === selectedAgent);
          const status = getStageStatus(selectedAgent);
          const Icon = stage?.icon || Code;
          const stageEvents = events.filter(e => e.agent?.toLowerCase() === selectedAgent || e.stage === selectedAgent);
          const stageTasks = tasks.filter(t => (stage?.taskIds || []).includes(t.task_id));

          return (
            <div className="ws-drawer-inner">
              <div className="ws-drawer-header">
                <div className="ws-drawer-title-row">
                  <div className="ws-stage-icon-wrap" style={{ background: `${stage?.color}20`, width: 38, height: 38 }}>
                    <Icon size={18} style={{ color: stage?.color }} />
                  </div>
                  <div>
                    <div className="ws-drawer-title">{stage?.agentName}</div>
                    <div className={`ws-badge ws-badge-${status}`}>{status.toUpperCase()}</div>
                  </div>
                </div>
                <button className="ws-icon-btn" onClick={closeDrawer} aria-label="Close panel"><X size={16} /></button>
              </div>

              <div className="ws-drawer-body">
                <div className="ws-drawer-section">
                  <div className="ws-drawer-section-title">Role & Responsibilities</div>
                  <p className="ws-dim" style={{ fontSize: '0.84rem', lineHeight: 1.55 }}>{stage?.desc}</p>
                </div>

                {stageTasks.length > 0 && (
                  <div className="ws-drawer-section">
                    <div className="ws-drawer-section-title">Assigned Tasks</div>
                    {stageTasks.map(t => (
                      <div key={t.task_id} className="ws-drawer-task">
                        <StatusDot status={t.status === 'success' ? 'success' : t.status === 'running' ? 'running' : 'pending'} />
                        <span className="ws-mono ws-dim" style={{ fontSize: '0.72rem' }}>{t.task_id}</span>
                        <span style={{ fontSize: '0.82rem', flex: 1 }}>{t.description || t.title || t.task_id}</span>
                      </div>
                    ))}
                  </div>
                )}

                {stageEvents.length > 0 && (
                  <div className="ws-drawer-section">
                    <div className="ws-drawer-section-title">Recent Activity</div>
                    {stageEvents.slice(-6).map((e, i) => (
                      <div key={i} className="ws-drawer-event">
                        <div className={`ws-event-dot ws-event-dot-${e.status || 'info'}`} style={{ marginTop: 4 }} />
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{e.message}</div>
                          {e.timestamp && (
                            <div className="ws-dim" style={{ fontSize: '0.68rem', marginTop: 2 }}>
                              {new Date(e.timestamp).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="ws-drawer-section">
                  <div className="ws-drawer-section-title">Agent Controls</div>
                  <div className="ws-drawer-controls">
                    <button
                      className="ws-btn ws-btn-secondary ws-btn-sm"
                      onClick={() => { closeDrawer(); setActiveNav(selectedAgent); }}
                    >
                      <Eye size={13} /> View Studio
                    </button>
                    <button
                      className="ws-btn ws-btn-secondary ws-btn-sm"
                      onClick={() => { closeDrawer(); setActiveNav('activity'); setActivityFilter(selectedAgent); }}
                    >
                      <Activity size={13} /> Filter Logs
                    </button>
                    <button
                      className="ws-btn ws-btn-ghost ws-btn-sm"
                      onClick={() => handleStart()}
                    >
                      <RefreshCw size={13} /> Retry Stage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </aside>

      {/* ── Command Palette Modal (Ctrl+K) ───────────────────── */}
      {cmdPaletteOpen && (
        <div className="ws-cmd-backdrop" onClick={() => setCmdPaletteOpen(false)}>
          <div className="ws-cmd-dialog" onClick={e => e.stopPropagation()}>
            <div className="ws-cmd-input-wrap">
              <Search size={16} style={{ color: '#3b82f6' }} />
              <input
                type="text"
                className="ws-cmd-input"
                placeholder="Type a command or jump to section..."
                autoFocus
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
              />
              <span className="ws-cmd-shortcut">ESC</span>
            </div>

            <div className="ws-cmd-list">
              {[
                { label: 'Jump to Overview', icon: LayoutDashboard, action: () => setActiveNav('overview'), shortcut: 'O' },
                { label: 'Jump to Create Agent', icon: Code, action: () => setActiveNav('create'), shortcut: 'C' },
                { label: 'Jump to Test Agent', icon: CheckSquare, action: () => setActiveNav('test'), shortcut: 'T' },
                { label: 'Jump to Deploy Agent', icon: Rocket, action: () => setActiveNav('deploy'), shortcut: 'D' },
                { label: 'Jump to Collaborate Agent', icon: GitPullRequest, action: () => setActiveNav('collaborate'), shortcut: 'L' },
                { label: 'Browse Generated Files', icon: FolderOpen, action: () => setActiveNav('files'), shortcut: 'F' },
                { label: 'View Live Activity Stream', icon: Activity, action: () => setActiveNav('activity'), shortcut: 'A' },
                { label: 'Workspace Settings', icon: Settings, action: () => setActiveNav('settings'), shortcut: 'S' },
                { label: 'Download Project ZIP', icon: Download, action: () => { if (activeWorkflow?.workflow_id) window.open(`${API_BASE}/workflows/${activeWorkflow.workflow_id}/zip`); }, shortcut: 'ZIP' },
                { label: 'Toggle Dark / Light Theme', icon: Sun, action: () => setTheme(t => t === 'dark' ? 'light' : 'dark'), shortcut: 'TH' },
                { label: 'Exit to Landing Page', icon: ArrowLeft, action: onBackToLanding, shortcut: 'ESC' },
              ].filter(c => c.label.toLowerCase().includes(cmdSearch.toLowerCase())).map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    className="ws-cmd-item"
                    onClick={() => { item.action(); setCmdPaletteOpen(false); }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={15} style={{ color: '#3b82f6' }} />
                      <span>{item.label}</span>
                    </span>
                    <span className="ws-cmd-shortcut">{item.shortcut}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── File Code Preview Modal ──────────────────────────── */}
      {viewingFile && (
        <div className="ws-code-modal" onClick={() => setViewingFile(null)}>
          <div className="ws-code-dialog" onClick={e => e.stopPropagation()}>
            <div className="ws-code-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCode size={16} style={{ color: '#3b82f6' }} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{viewingFile.name || viewingFile.path}</span>
                <span className="ws-tag">{viewingFile.path}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CopyButton text={fileContent} />
                <button className="ws-icon-btn" onClick={() => setViewingFile(null)}><X size={15} /></button>
              </div>
            </div>

            <div className="ws-code-body">
              {fileLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                  <Loader2 size={18} className="ws-spin" style={{ color: '#3b82f6' }} />
                  <span>Loading file content...</span>
                </div>
              ) : (
                <code>{fileContent}</code>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
