import React from 'react';
import { Award, Check, Clock } from 'lucide-react';

export default function EvaluatorPanel({ requirements, isVerified }) {
  const defaultCriteria = [
    { title: "Goal understood", desc: "Goal parsed, domain extracted, scope established" },
    { title: "Required analytics implemented", desc: "Accident trends, casualty frequency, and hotspots" },
    { title: "Dashboard generated", desc: "Component tree and interactive geospatial visualization" },
    { title: "Build completed", desc: "Dependencies resolved with zero build compilation errors" },
    { title: "Requested features detected", desc: "All 9 structured requirements validated against output" },
    { title: "Final output verified", desc: "Evaluator Agent confirms integrity of deliverable" }
  ];

  const criteria = (requirements && requirements.verification_requirements && requirements.verification_requirements.length > 0)
    ? requirements.verification_requirements.map(req => ({
        title: req,
        desc: "Requirement verified by Evaluator Agent"
      }))
    : defaultCriteria;

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Award size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Requirement Verification</span>
        </div>
        <span className={`badge ${isVerified ? 'badge-success' : 'badge-pending'}`}>
          {isVerified ? 'VERIFIED' : 'VERIFICATION PENDING'}
        </span>
      </div>

      <div className="panel-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {criteria.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '9px 12px',
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <div style={{ marginTop: '2px' }}>
                {isVerified ? (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--state-success-bg)',
                    border: '1px solid var(--state-success-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--state-success-text)',
                  }}>
                    <Check size={11} />
                  </div>
                ) : (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}>
                    <Clock size={10} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: isVerified ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
