import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, Terminal, Search, Compass, Code2, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

export default function GoalInput({
  onStartWorkflow,
  isSubmitting,
  error,
  activeGoal,
  isOnline,
  connectionStatus,
  workflowStatus,
}) {
  const defaultPlaceholder =
    "Create a student expense tracker where users can add expenses, categorize them, view total spending, and see recent transactions.";
  const [goal, setGoal] = useState(activeGoal || defaultPlaceholder);

  const presets = [
    {
      title: "Expense Tracker",
      prompt: "Create a student expense tracker where users can add expenses, categorize them, view total spending, and see recent transactions.",
      badge: "Full Stack"
    },
    {
      title: "REST API with auth + tests",
      prompt: "Create a REST API with token authentication, CRUD items, SQLite database, and automated tests.",
      badge: "Backend + Tests"
    },
    {
      title: "Todo app with SQLite",
      prompt: "Create a full-stack Todo application with priority levels, due dates, FastAPI backend, and React frontend with SQLite database.",
      badge: "Full Stack"
    },
    {
      title: "Custom goal",
      prompt: "",
      badge: "Custom"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!goal.trim() || isSubmitting) return;
    onStartWorkflow(goal.trim(), false);
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (!goal.trim() || isSubmitting) return;
    onStartWorkflow(goal.trim(), true);
  };

  const handleSelectPreset = (p) => {
    if (p.prompt) {
      setGoal(p.prompt);
    } else {
      setGoal("");
      // Focus textarea
      const el = document.getElementById('developer-requirement-textarea');
      if (el) el.focus();
    }
  };

  return (
    <div className="panel" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <div className="panel-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.88rem' }}>
          <Terminal size={16} style={{ color: 'var(--state-running)' }} />
          <span>Developer Requirement Input</span>
        </div>

        {/* Pipeline Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { name: 'Analyzer', icon: Search, color: '#2563eb' },
            { name: 'Planner', icon: Compass, color: '#7c3aed' },
            { name: 'Generator', icon: Code2, color: '#059669' },
            { name: 'Evaluator', icon: ShieldCheck, color: '#d97706' },
          ].map((chip) => {
            const Icon = chip.icon;
            return (
              <span
                key={chip.name}
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  color: chip.color,
                  background: `${chip.color}14`,
                  border: `1px solid ${chip.color}35`,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-xs)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Icon size={10} />
                <span>{chip.name}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="panel-body" style={{ padding: '18px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="developer-requirement-textarea"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}
            >
              What do you want to build?
            </label>
            <textarea
              id="developer-requirement-textarea"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe your engineering requirement (e.g. Student expense tracker, REST API with SQLite, Kanban board...)"
              rows={4}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.88rem',
                lineHeight: '1.5',
                color: 'var(--text-primary)',
                background: isSubmitting ? 'var(--bg-surface-secondary)' : 'var(--bg-surface)',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}
            />
          </div>

          {/* Example Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              EXAMPLES:
            </span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                disabled={isSubmitting}
                className="btn-secondary"
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--bg-surface)',
                }}
              >
                <span>{preset.title}</span>
                <span style={{
                  fontSize: '0.64rem',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'var(--bg-surface-secondary)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--state-failure-bg)',
              border: '1px solid var(--state-failure-border)',
              color: 'var(--state-failure-text)',
              fontSize: '0.8rem',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <button
                type="button"
                onClick={handleDemoSubmit}
                disabled={isSubmitting || !goal.trim()}
                className="btn-secondary"
                title="Run deterministic offline demo generation (fast)"
                style={{
                  fontSize: '0.74rem',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <Zap size={12} style={{ color: 'var(--state-warning)' }} />
                <span>Offline Demo (Fast)</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !goal.trim()}
              className="btn-primary"
              style={{
                padding: '9px 22px',
                fontSize: '0.84rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--text-primary)',
                color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background 150ms ease, transform 150ms ease',
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  <span>ORCHESTRATING...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>START NEXUS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
