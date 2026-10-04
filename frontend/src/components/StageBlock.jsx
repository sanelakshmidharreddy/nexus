import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  FileCode,
  ShieldCheck,
  Rocket,
  GitPullRequest,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function StageBlock({
  stageKey,
  stageNumber,
  title,
  description,
  status = 'pending', // 'pending' | 'running' | 'success' | 'failed'
  tasks = [],
  requirements = null,
  evaluation = null,
  artifacts = [],
  workflowId = null,
  onSelectFile = null,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <span className="badge badge-running">
            <Loader2 size={12} className="spin" /> RUNNING
          </span>
        );
      case 'success':
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={12} /> DONE
          </span>
        );
      case 'failed':
        return (
          <span className="badge badge-failed">
            <AlertCircle size={12} /> FAILED
          </span>
        );
      default:
        return (
          <span className="badge badge-pending">
            <Clock size={12} /> WAITING
          </span>
        );
    }
  };

  const getStageIcon = () => {
    switch (stageKey) {
      case 'create':
        return <FileCode size={16} style={{ color: 'var(--state-running)' }} />;
      case 'test':
        return <ShieldCheck size={16} style={{ color: 'var(--state-success)' }} />;
      case 'deploy':
        return <Rocket size={16} style={{ color: 'var(--state-warning)' }} />;
      case 'collaborate':
        return <GitPullRequest size={16} style={{ color: '#8b5cf6' }} />;
      default:
        return <FileCode size={16} />;
    }
  };

  return (
    <div
      className="panel"
      style={{
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        transition: 'all 180ms ease',
      }}
    >
      {/* Stage Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          background: isExpanded ? 'var(--bg-surface)' : 'var(--bg-surface-secondary)',
          borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {stageNumber}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getStageIcon()}
            <span style={{ fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.01em' }}>{title}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {getStatusBadge()}
          {isExpanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Stage Body */}
      {isExpanded && (
        <div style={{ padding: '16px 18px', fontSize: '0.85rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.45 }}>{description}</p>

          {/* 1. CREATE STAGE CONTENT */}
          {stageKey === 'create' && (
            <div>
              {requirements && (
                <div
                  style={{
                    background: 'var(--bg-surface-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '4px' }}>
                    Project Target: {requirements.project_name || 'Full-Stack App'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Stack: {requirements.technologies_identified?.frontend || 'React 18 + Vite'} +{' '}
                    {requirements.technologies_identified?.backend || 'FastAPI'} +{' '}
                    {requirements.technologies_identified?.database || 'SQLite'}
                  </div>
                </div>
              )}

              {/* Generated Files List */}
              {artifacts.length > 0 ? (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Generated Source Files ({artifacts.filter((a) => a.path.startsWith('backend/') || a.path.startsWith('frontend/') || a.path === 'index.html').length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {artifacts
                      .filter((a) => a.path.startsWith('backend/') || a.path.startsWith('frontend/') || a.path === 'index.html')
                      .map((art) => (
                        <button
                          key={art.path}
                          onClick={() => onSelectFile && onSelectFile(art.path)}
                          className="badge badge-pending"
                          style={{ cursor: 'pointer', background: '#ffffff', border: '1px solid var(--border-default)', fontSize: '0.75rem' }}
                        >
                          <FileCode size={11} /> {art.path}
                        </button>
                      ))}
                  </div>
                </div>
              ) : status === 'running' ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                  Analyzer and Code Generator agents formulating architecture and source files...
                </div>
              ) : null}
            </div>
          )}

          {/* 2. TEST STAGE CONTENT */}
          {stageKey === 'test' && (
            <div>
              {evaluation ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: evaluation.passed ? 'var(--state-success-bg)' : 'var(--state-failure-bg)',
                      border: `1px solid ${evaluation.passed ? 'var(--state-success-border)' : 'var(--state-failure-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: evaluation.passed ? 'var(--state-success-text)' : 'var(--state-failure-text)', fontSize: '0.88rem' }}>
                        {evaluation.passed ? 'Static Validation & Contract Tests PASSED' : 'Validation Issues Detected'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Score: {evaluation.score}% ({evaluation.passed_checks}/{evaluation.total_checks} criteria verified)
                      </div>
                    </div>
                    <span className={`badge ${evaluation.passed ? 'badge-success' : 'badge-failed'}`}>
                      {evaluation.passed ? 'VERIFIED' : 'ACTION REQUIRED'}
                    </span>
                  </div>

                  {/* Verification Checks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(evaluation.checks || []).map((chk, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-surface-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>{chk.name}</span>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{chk.evidence}</p>
                        </div>
                        <span className={`badge ${chk.passed ? 'badge-success' : 'badge-failed'}`} style={{ fontSize: '0.68rem' }}>
                          {chk.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : status === 'running' ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                  Running static code analysis, AST parsing, and API consistency audits...
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Awaiting Create stage completion before running automated verification.
                </div>
              )}
            </div>
          )}

          {/* 3. DEPLOY STAGE CONTENT */}
          {stageKey === 'deploy' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                {['Dockerfile', 'render.yaml', 'vercel.json', '.github/workflows/deploy.yml', '.env.example'].map((df) => (
                  <button
                    key={df}
                    onClick={() => onSelectFile && onSelectFile(df)}
                    className="badge badge-pending"
                    style={{ cursor: 'pointer', background: '#ffffff', border: '1px solid var(--border-default)', fontSize: '0.75rem' }}
                  >
                    <Rocket size={11} /> {df}
                  </button>
                ))}
              </div>

              {/* Exact Deploy Commands */}
              <div
                style={{
                  background: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>LOCAL RUN COMMANDS</span>
                  <button
                    onClick={() => handleCopy('cd backend && pip install -r requirements.txt && uvicorn main:app --reload', 'cli')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    title="Copy commands"
                  >
                    {copiedKey === 'cli' ? <Check size={14} color="var(--state-success)" /> : <Copy size={14} />}
                  </button>
                </div>
                <pre
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    background: '#0f172a',
                    color: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    overflowX: 'auto',
                  }}
                >
                  {`# 1. Backend\ncd backend && pip install -r requirements.txt\nuvicorn main:app --port 8000\n\n# 2. Frontend\ncd frontend && npm install && npm run dev`}
                </pre>
              </div>
            </div>
          )}

          {/* 4. COLLABORATE STAGE CONTENT */}
          {stageKey === 'collaborate' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                {['README.md', 'PULL_REQUEST.md', 'CHANGELOG.md', 'CODE_REVIEW.md'].map((cf) => (
                  <button
                    key={cf}
                    onClick={() => onSelectFile && onSelectFile(cf)}
                    className="badge badge-pending"
                    style={{ cursor: 'pointer', background: '#ffffff', border: '1px solid var(--border-default)', fontSize: '0.75rem' }}
                  >
                    <GitPullRequest size={11} /> {cf}
                  </button>
                ))}
              </div>

              {/* Short PR / Code Review Snapshot */}
              <div
                style={{
                  background: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '4px' }}>
                  Pull Request & Code Review Ready
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Formal PR description, senior engineering review summary, and version changelog generated. Ready for code review and merge.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
