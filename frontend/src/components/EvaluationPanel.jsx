import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function EvaluationPanel({ evaluation = null }) {
  if (!evaluation) return null;

  const checks = evaluation.checks || [];
  const score = evaluation.score;
  const passed = evaluation.passed;
  const passedChecks = evaluation.passed_checks || 0;
  const totalChecks = evaluation.total_checks || 0;
  const errors = evaluation.errors || [];

  return (
    <div className="panel" style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <div className="panel-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.88rem' }}>
          <ShieldCheck size={16} style={{ color: passed ? 'var(--state-success)' : 'var(--state-failure)' }} />
          <span>PROJECT EVALUATION</span>
        </div>
        <span className={`badge ${passed ? 'badge-success' : 'badge-failed'}`} style={{ fontSize: '0.72rem' }}>
          {passed ? 'PASSED' : 'FAILED'} {score}%
        </span>
      </div>

      <div className="panel-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Score Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: passed ? 'var(--state-success-bg)' : 'var(--state-failure-bg)', borderRadius: 'var(--radius-sm)', border: `1px solid ${passed ? 'var(--state-success-border)' : 'var(--state-failure-border)'}` }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: passed ? 'var(--state-success)' : 'var(--state-failure)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            flexShrink: 0,
          }}>
            {score}%
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: passed ? 'var(--state-success-text)' : 'var(--state-failure-text)' }}>
              {passed ? 'All Checks Passed' : 'Evaluation Failed'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {passedChecks}/{totalChecks} verification checks passed
            </div>
          </div>
        </div>

        {/* Checks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {checks.map((chk, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                border: `1px solid ${chk.passed ? 'var(--state-success-border)' : 'var(--state-failure-border)'}`,
                background: chk.passed ? 'var(--state-success-bg)' : 'var(--state-failure-bg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              {chk.passed ? (
                <CheckCircle2 size={15} style={{ color: 'var(--state-success)', marginTop: '1px', flexShrink: 0 }} />
              ) : (
                <XCircle size={15} style={{ color: 'var(--state-failure)', marginTop: '1px', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: chk.passed ? 'var(--state-success-text)' : 'var(--state-failure-text)' }}>
                  {chk.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                  {chk.evidence}
                </div>
              </div>
              <span className={`badge ${chk.passed ? 'badge-success' : 'badge-failed'}`} style={{ fontSize: '0.62rem', flexShrink: 0 }}>
                {chk.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-xs)', background: 'var(--state-failure-bg)', border: '1px solid var(--state-failure-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--state-failure-text)', marginBottom: '4px' }}>
              <AlertTriangle size={13} />
              <span>Issues Detected ({errors.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {errors.map((err, i) => (
                <div key={i} style={{ fontSize: '0.72rem', color: 'var(--state-failure-text)' }}>• {err}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
