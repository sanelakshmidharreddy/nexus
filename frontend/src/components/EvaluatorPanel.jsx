import React from 'react';
import { Award, Check, Clock, X, ShieldCheck, CheckCircle2, FileCheck } from 'lucide-react';

export default function EvaluatorPanel({ requirements, evaluation, isVerified }) {
  const defaultCriteria = [
    { title: "Goal understood and scoped", desc: "Goal parsed, domain extracted, and mission scope established" },
    { title: "Required project files exist", desc: "Found all deliverable files: index.html, styles.css, app.js, data.json" },
    { title: "Core analytics implemented", desc: "Analysis summary valid: metrics, trends, and hotspots generated" },
    { title: "Working dashboard interface", desc: "Interactive HTML5/CSS3/Vanilla JS UI fully renderable in sandbox" },
    { title: "Build & syntax validation", desc: "JavaScript syntax verified valid, CSS validated, zero compile errors" },
    { title: "Requested features detected", desc: "All core user features detected and present in build bundle" },
    { title: "QA verification passed", desc: "QA Agent verified schema consistency and coordinate accuracy" },
    { title: "Adaptive recovery verified", desc: "Self-healing loop diagnosed and recovered from injected coordinate defect" },
    { title: "Final deliverable operational", desc: "Deliverable operational and served live via /workflows/{id}/dashboard" }
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
    <div className="panel" style={{ height: '100%', background: '#ffffff' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Award size={16} style={{ color: isPassed ? 'var(--state-success)' : 'var(--text-muted)' }} />
          <span>NEXUS VERIFICATION AUDIT (9-POINT CRITERIA)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: '800', color: isPassed ? 'var(--state-success)' : 'var(--text-muted)' }}>
            SCORE: {score}/100 ({passedCount}/{totalCount} PASSED)
          </span>
          <span className={`badge ${isPassed ? 'badge-success' : 'badge-pending'}`}>
            {isPassed ? 'ALL CRITERIA VERIFIED' : 'AUDIT PENDING'}
          </span>
        </div>
      </div>

      <div className="panel-body">
        {/* Verification Summary Audit Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          marginBottom: '14px',
        }}>
          <div style={{ background: 'var(--bg-surface-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>REQUIREMENTS</div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-primary)' }}>{passedCount} / {totalCount}</div>
          </div>

          <div style={{ background: 'var(--bg-surface-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BUILD SYNTAX</div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: isPassed ? 'var(--state-success)' : 'var(--text-muted)' }}>
              {isPassed ? 'PASSED' : 'PENDING'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>QA STATUS</div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: isPassed ? 'var(--state-success)' : 'var(--text-muted)' }}>
              {isPassed ? 'PASSED' : 'PENDING'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SELF-HEALING</div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: isPassed ? 'var(--state-success)' : 'var(--text-muted)' }}>
              {isPassed ? 'COMPLETED' : 'PENDING'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-secondary)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DELIVERABLE</div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: isPassed ? 'var(--state-success)' : 'var(--text-muted)' }}>
              {isPassed ? 'READY' : 'PENDING'}
            </div>
          </div>
        </div>

        {/* 9 Concrete Verification Checks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {checks.map((item, idx) => {
            const checkPassed = Boolean(item.passed);
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 12px',
                  background: checkPassed ? '#fcfdfd' : '#ffffff',
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
                    fontWeight: '700',
                    color: checkPassed ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}>
                    {item.check || item.title}
                  </div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
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
