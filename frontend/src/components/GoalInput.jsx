import React, { useState } from 'react';
import { ArrowRight, Check, AlertCircle, Sparkles, CheckCircle2, ListChecks } from 'lucide-react';

export default function GoalInput({ onStartWorkflow, isSubmitting, error, activeGoal, requirements }) {
  const defaultGoalText = "Build a RoadSafe-style accident analytics dashboard from this dataset.";
  const [goal, setGoal] = useState(activeGoal || defaultGoalText);

  const presets = [
    {
      title: "RoadSafe Accident Analytics Dashboard",
      text: "Build a RoadSafe-style accident analytics dashboard from this dataset.",
      badge: "Hackathon Preset"
    },
    {
      title: "Vision Zero Highway Hotspots",
      text: "Create a Vision Zero accident hotspot analyzer with collision severity clustering and mitigation recommendations.",
      badge: "Geospatial"
    },
    {
      title: "Traffic Risk & Casualty Predictor",
      text: "Develop an accident causation risk-factor engine with temporal trends and weather correlation reports.",
      badge: "Analytics"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!goal.trim() || isSubmitting) return;
    onStartWorkflow(goal.trim());
  };

  // Extract checklist items from requirements
  const getRequirementsChecklist = () => {
    if (!requirements) return [];
    const items = [];
    if (requirements.requested_features && requirements.requested_features.length > 0) {
      items.push(...requirements.requested_features);
    }
    if (requirements.data_requirements && requirements.data_requirements.length > 0) {
      requirements.data_requirements.forEach(dr => {
        if (!items.includes(dr)) items.push(dr);
      });
    }
    if (items.length === 0) {
      return [
        "Accident trends analysis",
        "Accident hotspots visualization",
        "Risk-factor correlation",
        "Mitigation recommendations",
        "Interactive dashboard interface"
      ];
    }
    return items;
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <span>Command Center Directive</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          STEP 1 • GOAL & SPECIFICATION
        </span>
      </div>

      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block',
            fontSize: '1.05rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}>
            What do you want NEXUS to build?
          </label>

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              placeholder="Describe your goal in natural language..."
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                lineHeight: '1.5',
                padding: '12px 14px',
                fontFamily: 'var(--font-sans)',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--border-focus)';
                e.target.style.boxShadow = '0 0 0 1px var(--border-focus)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-default)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Presets:
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setGoal(p.text)}
                disabled={isSubmitting}
                style={{
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '4px 9px',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <span>{p.title}</span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  background: '#ffffff',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  {p.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Submit Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot status-dot-running" />
              <span>NEXUS automatically extracts requirements, builds a DAG task plan, and assigns specialist agents.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !goal.trim()}
              className="btn-primary"
              style={{ minWidth: '140px' }}
            >
              {isSubmitting ? (
                <>
                  <span className="status-dot status-dot-running" style={{ background: '#ffffff' }} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Start Workflow</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'var(--state-failure-bg)',
            border: '1px solid var(--state-failure-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--state-failure-text)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <AlertCircle size={16} color="var(--state-failure)" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 8: Structured Requirements Panel */}
        {requirements && (
          <div style={{
            marginTop: '20px',
            background: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListChecks size={16} color="var(--state-success)" />
                <span style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  UNDERSTANDING
                </span>
              </div>
              <span className="badge badge-success">
                REQUIREMENTS EXTRACTED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Objective */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  Objective
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {requirements.objective || "Build an accident analytics dashboard."}
                </div>
              </div>

              {/* Expected Output */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  Expected Output
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {requirements.expected_output || "Working analytics dashboard"}
                </div>
              </div>
            </div>

            {/* Requirements Checklist */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                Requirements Checklist
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {getRequirementsChecklist().slice(0, 6).map((req, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    background: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <Check size={14} color="var(--state-success)" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: '500' }}>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
