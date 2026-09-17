import React from 'react';
import { Award, Check, Clock, X, AlertCircle } from 'lucide-react';

export default function EvaluatorPanel({ requirements, evaluation, isVerified }) {
  const defaultCriteria = [
    { title: "Goal understood and scoped", desc: "Goal parsed, domain extracted, scope established" },
    { title: "Required project files exist", desc: "Found all deliverable files: index.html, styles.css, app.js, data.json" },
    { title: "Core analytics implemented", desc: "Analysis summary valid: metrics, trends, and hotspots generated" },
    { title: "Working dashboard interface", desc: "HTML interface complete and renderable" },
    { title: "Build & syntax validation", desc: "JavaScript syntax valid, CSS valid, zero compilation errors" },
    { title: "Requested features detected", desc: "All core user features detected and present in build" },
    { title: "QA verification passed", desc: "QA Agent verified schema and runtime integrity" },
    { title: "Adaptive recovery verified", desc: "Self-healing loop diagnosed and recovered from injected fault" },
    { title: "Final deliverable operational", desc: "Deliverable bundle operational and ready for deployment" }
  ];

  const checks = evaluation?.checks || defaultCriteria.map(c => ({
    check: c.title,
    details: c.desc,
    passed: isVerified
  }));

  const hasEval = Boolean(evaluation && evaluation.score !== undefined);
  const score = hasEval ? evaluation.score : (isVerified ? 100 : 0);
  const passedCount = hasEval ? evaluation.passed_checks : (isVerified ? checks.length : 0);
  const totalCount = hasEval ? evaluation.total_checks : checks.length;
  const isPassed = hasEval ? evaluation.status === 'passed' : isVerified;

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Award size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Requirement & Evaluator Verification (9-Point Benchmark)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: isPassed ? 'var(--state-success)' : 'var(--text-muted)' }}>
            SCORE: {score}/100 ({passedCount}/{totalCount} PASSED)
          </span>
          <span className={`badge ${isPassed ? 'badge-success' : 'badge-pending'}`}>
            {isPassed ? 'VERIFIED' : 'VERIFICATION PENDING'}
          </span>
        </div>
      </div>

      <div className="panel-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {checks.map((item, idx) => {
            const checkPassed = Boolean(item.passed);
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '9px 12px',
                  background: '#ffffff',
                  border: `1px solid ${checkPassed ? 'var(--border-subtle)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {checkPassed ? (
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
                  ) : hasEval ? (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'var(--state-failure-bg)',
                      border: '1px solid var(--state-failure-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--state-failure-text)',
                    }}>
                      <X size={11} />
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
                    color: checkPassed ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}>
                    {item.check || item.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.details || item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
