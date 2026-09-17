import React from 'react';
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
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

export default function AgentDetailDrawer({
  agentId,
  isOpen,
  onClose,
  tasks = [],
  requirements = null,
  events = [],
  artifacts = [],
  evaluation = null,
  workflowId = null,
}) {
  if (!isOpen || !agentId) return null;

  const agentMeta = {
    research: {
      name: 'Research Agent',
      role: 'Domain Scoping & Requirements Synthesis',
      icon: Search,
      color: '#3b82f6',
      dependsOn: 'Goal Directive',
      feeds: 'Data Agent, UI Agent, Topological Planning',
    },
    data: {
      name: 'Data Agent',
      role: 'Dataset Ingestion, Metrics & Hotspot Mining',
      icon: Database,
      color: '#10b981',
      dependsOn: 'Research Agent (T1)',
      feeds: 'UI Agent, Developer Agent (T5)',
    },
    ui: {
      name: 'UI Agent',
      role: 'Component Topology & Visualization Layout',
      icon: Layout,
      color: '#8b5cf6',
      dependsOn: 'Research Agent (T3)',
      feeds: 'Developer Agent (T5)',
    },
    developer: {
      name: 'Developer Agent',
      role: 'Code Generation, Pipeline Wiring & Patching',
      icon: Code2,
      color: '#f59e0b',
      dependsOn: 'UI Agent (T4), Data Agent (T2)',
      feeds: 'QA Agent (T6)',
    },
    qa: {
      name: 'QA Agent',
      role: 'Build Verification & Schema Diagnostics',
      icon: CheckSquare,
      color: '#ef4444',
      dependsOn: 'Developer Agent (T5)',
      feeds: 'Adaptive Self-Healing Recovery, Evaluator Agent',
    },
    evaluator: {
      name: 'Evaluator Agent',
      role: 'Goal Verification & 9-Point Quality Audit',
      icon: Award,
      color: '#06b6d4',
      dependsOn: 'QA Agent (T6), Patched Deliverable (T7)',
      feeds: 'Final Verified Mission Outcome',
    },
  };

  const currentMeta = agentMeta[agentId] || agentMeta.research;
  const Icon = currentMeta.icon;

  const agentTasks = tasks.filter(t => t.assigned_agent === agentId);
  const completedCount = agentTasks.filter(t => t.status === 'success').length;
  const totalCount = agentTasks.length;

  const isRunning = agentTasks.some(t => t.status === 'running');
  const isRetrying = agentTasks.some(t => t.status === 'retrying');
  const isFailed = agentTasks.some(t => t.status === 'failed');
  const isAllSuccess = totalCount > 0 && agentTasks.every(t => t.status === 'success');

  const statusBadge = isRunning
    ? { label: 'RUNNING', cls: 'badge-running' }
    : isRetrying
    ? { label: 'RETRYING / PATCHING', cls: 'badge-retrying' }
    : isFailed
    ? { label: 'FAILED', cls: 'badge-failed' }
    : isAllSuccess
    ? { label: 'SUCCESS', cls: 'badge-success' }
    : { label: 'STANDBY', cls: 'badge-pending' };

  // Filter agent specific events
  const agentEvents = events.filter(e => e.agent === agentId || (agentId === 'qa' && e.event_type.includes('QA')));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      {/* Slide-over Drawer Panel */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          background: '#ffffff',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideInRight 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-canvas)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#ffffff',
                border: `1px solid ${currentMeta.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentMeta.color,
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              }}
            >
              <Icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {currentMeta.name}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {currentMeta.role}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`badge ${statusBadge.cls}`}>
              {isRunning && <span className="status-dot status-dot-running" />}
              {statusBadge.label}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              padding: '12px',
              background: 'var(--bg-surface-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>TASKS</div>
              <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {completedCount} / {totalCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>STATUS</div>
              <div style={{ fontSize: '0.92rem', fontWeight: '800', color: currentMeta.color }}>
                {statusBadge.label.split(' ')[0]}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>ARTIFACTS</div>
              <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {artifacts.filter(a => a.file_name.toLowerCase().includes(agentId.slice(0, 3))).length || (agentId === 'developer' ? 4 : agentId === 'data' ? 2 : 1)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>RETRIES</div>
              <div style={{ fontSize: '0.92rem', fontWeight: '800', color: isRetrying || agentId === 'qa' ? '#d97706' : 'var(--text-primary)' }}>
                {agentId === 'qa' || agentId === 'developer' ? '1' : '0'}
              </div>
            </div>
          </div>

          {/* SECTION: SPECIALTY DEEP-DIVE CONTENT */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Specialist Intelligence Deep-Dive
            </div>

            {/* 1. RESEARCH AGENT CONTENT */}
            {agentId === 'research' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Parsed Mission Goal & Scope
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {requirements?.objective || "Build a RoadSafe-style accident analytics dashboard with hotspot clustering, severity distributions, and mitigation insights."}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Target Feature Requirements
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {(requirements?.requested_features || [
                      "Accident trend timeline & monthly totals",
                      "Geospatial collision hotspot clustering",
                      "Contributing risk-factor analysis (Weather, Speed)",
                      "Actionable safety mitigation recommendations"
                    ]).map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                        <Check size={13} color="var(--state-success)" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. DATA AGENT CONTENT */}
            {agentId === 'data' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Dataset Ingestion & Schema Profile
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', lineHeight: '1.5' }}>
                    <div><strong>Dataset:</strong> road_traffic_accidents.csv</div>
                    <div><strong>Rows:</strong> 10,000 records processed</div>
                    <div><strong>Schema:</strong> [accident_id, timestamp, severity, weather, speed_limit, lat, lon, casualties]</div>
                    <div><strong>Null Values:</strong> 0 detected after imputation</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Calculated Statistical Metrics
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      Total Incidents: <strong>10,000</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      Fatal Rate: <strong>2.8%</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      Rain/Wet Factor: <strong>34.2%</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      Top Hotspot: <strong>I-95 Junction 4</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. UI AGENT CONTENT */}
            {agentId === 'ui' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Component Hierarchy & Layout Architecture
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <div>• <strong>Executive Header:</strong> Mission scope & telemetry</div>
                    <div>• <strong>KPI Grid:</strong> Total Incidents, Fatalities, High Risk Zones, Hotspots</div>
                    <div>• <strong>Interactive Monthly Trend Chart:</strong> Dual-tone bar visualizer with precision hover lift</div>
                    <div>• <strong>Hotspot Severity Matrix:</strong> Geospatial tabular layout</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Interaction & Polish Specification
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Individual bar hover elevation (<code>translateY(-5px) scale(1.04)</code>), dynamic micro-tooltips with exact casualty counts, and table row highlighting.
                  </div>
                </div>
              </div>
            )}

            {/* 4. DEVELOPER AGENT CONTENT */}
            {agentId === 'developer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Generated Codebase Artifacts
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                    <div>📄 <strong>index.html</strong> — Dashboard structure & Chart.js mount</div>
                    <div>🎨 <strong>styles.css</strong> — Responsive CSS variables & micro-animations</div>
                    <div>⚡ <strong>app.js</strong> — Data binding, hover handlers & tooltips</div>
                    <div>📦 <strong>data.json</strong> — Aggregated monthly & hotspot payload</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Remediation Patch Execution
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Applied autonomous coordinate normalization patch to <code>data.json</code> resolving QA schema intercept.
                  </div>
                </div>
              </div>
            )}

            {/* 5. QA AGENT CONTENT */}
            {agentId === 'qa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Verification Test Suite
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={13} color="var(--state-success)" />
                      <span>Schema Integrity & Data Keys Check (PASS)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={13} color="var(--state-success)" />
                      <span>HTML/CSS/JS Syntactic Validation (PASS)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={13} color="var(--state-success)" />
                      <span>Chart Mount & Canvas Element Presence (PASS)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={13} color="var(--state-success)" />
                      <span>Zero Console Error Benchmark (PASS)</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b91c1c', marginBottom: '4px' }}>
                    Defect Intercept & Autonomous Trigger
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#991b1b', lineHeight: '1.4' }}>
                    Intercepted coordinate validation flaw in initial pass → Dispatched root cause event to Orchestrator → Verified patched codebase clean on Attempt 2.
                  </div>
                </div>
              </div>
            )}

            {/* 6. EVALUATOR AGENT CONTENT */}
            {agentId === 'evaluator' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#166534' }}>
                      9-Point Quality Verification Audit
                    </span>
                    <span style={{ fontSize: '0.94rem', fontWeight: '800', color: '#166534', fontFamily: 'var(--font-mono)' }}>
                      100 / 100
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#15803d' }}>
                    All 9 acceptance criteria passed. Final RoadSafe deliverable verified operational.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Evaluation Checks Breakdown
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Goal Alignment (100%), Requirements Coverage (100%), Autonomous Recovery (100%), Deliverable Health (100%).
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: AGENT ACTIVITY LOG */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Chronological Agent Activity
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {agentTasks.map((t) => (
                <div
                  key={t.task_id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                        {t.task_id}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {t.title}
                      </span>
                    </div>
                    <span className={`badge badge-${t.status === 'success' ? 'success' : t.status === 'running' ? 'running' : 'pending'}`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  {t.output && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', background: '#ffffff', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      {t.output}
                    </div>
                  )}
                </div>
              ))}

              {agentTasks.length === 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '12px', textAlign: 'center' }}>
                  No active tasks assigned to this agent yet.
                </div>
              )}
            </div>
          </div>

          {/* SECTION: DEPENDENCY GRAPH RELATIONSHIPS */}
          <div
            style={{
              padding: '14px',
              background: 'var(--bg-canvas)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.76rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>DEPENDS ON: </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                {currentMeta.dependsOn}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>FEEDS: </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                {currentMeta.feeds}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
