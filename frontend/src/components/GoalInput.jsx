import React, { useState } from 'react';
import { ArrowRight, Check, AlertCircle, Sparkles, ListChecks, Play, Zap } from 'lucide-react';

export default function GoalInput({ onStartWorkflow, isSubmitting, error, activeGoal, requirements, isOnline, workflowStatus }) {
  const defaultGoalText = "Build a RoadSafe-style accident analytics dashboard from this dataset.";
  const [goal, setGoal] = useState(activeGoal || defaultGoalText);
  const [submissionStage, setSubmissionStage] = useState('IDLE'); // 'IDLE' | 'INITIALIZING' | 'UNDERSTANDING' | 'PLANNING' | 'EXECUTING'

  const presets = [
    {
      title: "RoadSafe Analytics",
      text: "Build a RoadSafe-style accident analytics dashboard from this dataset.",
      badge: "Benchmark"
    },
    {
      title: "Vision Zero Hotspots",
      text: "Create a Vision Zero accident hotspot analyzer with collision severity clustering and mitigation recommendations.",
      badge: "Geospatial"
    },
    {
      title: "Traffic Risk Factors",
      text: "Develop an accident causation risk-factor engine with temporal trends and weather correlation reports.",
      badge: "Analytics"
    },
    {
      title: "Custom Goal",
      text: "",
      badge: "Freeform"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!goal.trim() || isSubmitting) return;

    setSubmissionStage('INITIALIZING');
    setTimeout(() => setSubmissionStage('UNDERSTANDING'), 300);
    setTimeout(() => setSubmissionStage('PLANNING'), 700);
    setTimeout(() => setSubmissionStage('EXECUTING'), 1200);

    onStartWorkflow(goal.trim(), false);
  };

  const handleRunDemo = () => {
    if (isSubmitting) return;

    setSubmissionStage('INITIALIZING');
    setTimeout(() => setSubmissionStage('UNDERSTANDING'), 250);
    setTimeout(() => setSubmissionStage('PLANNING'), 550);
    setTimeout(() => setSubmissionStage('EXECUTING'), 900);

    onStartWorkflow(defaultGoalText, true);
  };

  const handleSelectPreset = (p) => {
    if (p.text) {
      setGoal(p.text);
    } else {
      setGoal("");
    }
  };

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

  const getButtonText = () => {
    if (!isSubmitting) return "START ORCHESTRATION";
    switch (submissionStage) {
      case 'INITIALIZING': return "INITIALIZING...";
      case 'UNDERSTANDING': return "UNDERSTANDING...";
      case 'PLANNING': return "PLANNING DAG...";
      case 'EXECUTING': return "EXECUTING...";
      default: return "ORCHESTRATING...";
    }
  };

  return (
    <div className="panel" style={{ background: '#ffffff' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Zap size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Autonomous Directive & Mission Scoping</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            INPUT & REQUIREMENTS SYNTHESIS
          </span>
        </div>
      </div>

      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{
              fontSize: '1.08rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              What should NEXUS build?
            </label>

            {/* Benchmark Quick Run Button */}
            <button
              type="button"
              onClick={handleRunDemo}
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderColor: '#0f172a',
                padding: '6px 14px',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.16)',
              }}
              title="Launch complete autonomous demo workflow with controlled failure injection and self-healing recovery"
            >
              <Sparkles size={14} color="#f59e0b" />
              <span>RUN BENCHMARK MISSION</span>
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              placeholder="Build a RoadSafe-style accident analytics dashboard from this dataset."
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.94rem',
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
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
              PRESETS:
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                disabled={isSubmitting}
                style={{
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
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
                <span style={{ fontWeight: '500' }}>{p.title}</span>
                <span style={{
                  fontSize: '0.64rem',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  background: '#ffffff',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
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
              <span className={`status-dot ${isSubmitting ? 'status-dot-running' : 'status-dot-success'}`} />
              <span>NEXUS automatically scopes requirements, builds a topological DAG plan, and dispatches specialist agents.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !goal.trim()}
              className="btn-primary"
              style={{ minWidth: '170px' }}
            >
              {isSubmitting ? (
                <>
                  <span className="status-dot status-dot-running" style={{ background: '#ffffff' }} />
                  <span>{getButtonText()}</span>
                </>
              ) : (
                <>
                  <span>START ORCHESTRATION</span>
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

        {/* Structured Requirements Panel */}
        {requirements && (
          <div style={{
            marginTop: '18px',
            background: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListChecks size={16} color="var(--state-success)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  SYNTHESIZED INTENT & SCOPE
                </span>
              </div>
              <span className="badge badge-success">
                REQUIREMENTS EXTRACTED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                  Objective
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {requirements.objective || "Build a RoadSafe accident analytics dashboard."}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                  Expected Deliverable
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {requirements.expected_output || "Working analytics dashboard with interactive charts and hotspots"}
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                Target Feature Matrix
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px' }}>
                {getRequirementsChecklist().slice(0, 6).map((req, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '0.78rem',
                    color: 'var(--text-primary)',
                    background: '#ffffff',
                    padding: '5px 9px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <Check size={13} color="var(--state-success)" style={{ flexShrink: 0 }} />
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
