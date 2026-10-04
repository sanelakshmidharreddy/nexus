import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, Terminal, CheckCircle2, RefreshCw } from 'lucide-react';

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
    "Create a student expense tracker with a React frontend, FastAPI backend and SQLite database.";
  const [goal, setGoal] = useState(activeGoal || defaultPlaceholder);

  const presets = [
    {
      title: "Student Expense Tracker",
      prompt: "Create a student expense tracker with a React frontend, FastAPI backend and SQLite database where users can add expenses, categorize them, view total spending, and see recent transactions.",
      badge: "Full Stack"
    },
    {
      title: "API Key Manager",
      prompt: "Create a developer API key manager with FastAPI and React to generate, list, revoke, and track rate limits for developer API keys.",
      badge: "Dev Tool"
    },
    {
      title: "Task Kanban Board",
      prompt: "Create a modern Kanban task board with FastAPI, React, and SQLite supporting card reordering, status stages, and deadline alerts.",
      badge: "Productivity"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!goal.trim() || isSubmitting) return;
    onStartWorkflow(goal.trim(), false);
  };

  const handleSelectPreset = (p) => {
    setGoal(p.prompt);
  };

  return (
    <div className="panel" style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <div className="panel-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
          <Terminal size={16} style={{ color: 'var(--state-running)' }} />
          <span>DEVELOPER REQUIREMENT DIRECTIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            MULTI-AGENT ORCHESTRATION PIPELINE
          </span>
        </div>
      </div>

      <div className="panel-body" style={{ padding: '18px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              What do you want to build?
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={defaultPlaceholder}
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
                background: isSubmitting ? 'var(--bg-surface-secondary)' : '#ffffff',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}
            />
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              SUGGESTED PROMPTS:
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
                  background: '#ffffff',
                }}
              >
                <span>{preset.title}</span>
                <span style={{
                  fontSize: '0.65rem',
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Sparkles size={14} style={{ color: 'var(--state-running)' }} />
              <span>AI Pipeline: CREATE → TEST → DEPLOY → COLLABORATE</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !goal.trim()}
              className="btn-primary"
              style={{
                padding: '10px 22px',
                fontSize: '0.84rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--text-primary)',
                color: '#ffffff',
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
                  <Play size={15} fill="currentColor" />
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
