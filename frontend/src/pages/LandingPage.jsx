import React from 'react';
import {
  Code,
  CheckCircle2,
  Rocket,
  GitPullRequest,
  Terminal,
  Layers,
  Cpu,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Download,
  Server,
  Sparkles,
} from 'lucide-react';

export default function LandingPage({ onOpenApp }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* 1. Navigation Bar */}
      <header
        style={{
          height: '60px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            N
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>NEXUS</span>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface-secondary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              DEVELOPER ORCHESTRATOR
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="https://github.com/sanelakshmidharreddy/nexus"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            <ExternalLink size={14} /> GitHub
          </a>
          <button onClick={onOpenApp} className="btn-primary">
            Open Workspace <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section
        style={{
          padding: '64px 24px 48px',
          maxWidth: '1080px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-default)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            marginBottom: '20px',
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--state-running)' }} />
          MULTI-AGENT AI DEVELOPER PIPELINE
        </div>

        <h1
          style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            maxWidth: '840px',
            marginBottom: '18px',
          }}
        >
          From requirement to runnable project, with AI agents handling{' '}
          <span style={{ color: 'var(--state-running)' }}>create</span>,{' '}
          <span style={{ color: 'var(--state-success)' }}>test</span>,{' '}
          <span style={{ color: 'var(--state-warning)' }}>deploy</span>, and{' '}
          <span style={{ color: '#8b5cf6' }}>collaborate</span>.
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '720px',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          An autonomous developer orchestrator that translates natural language engineering requirements into complete,
          decoupled full-stack codebases with automated test verification, production deployment blueprints, and pull request handoffs.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onOpenApp} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            Open Workspace <ArrowRight size={16} />
          </button>
          <a
            href="https://github.com/sanelakshmidharreddy/nexus"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '11px 20px', fontSize: '0.92rem', textDecoration: 'none' }}
          >
            <ExternalLink size={15} /> View on GitHub
          </a>
        </div>
      </section>

      {/* 3. Static Pipeline Diagram (Clean SVG/CSS, No Heavy Animation) */}
      <section style={{ maxWidth: '1080px', margin: '0 auto 48px', padding: '0 24px', width: '100%' }}>
        <div
          className="panel"
          style={{
            padding: '24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Operational Four-Stage Agent Architecture
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Stage 1: Create */}
            <div
              style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  1
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>CREATE</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Analyzer & Architect formulate engineering specs, API contracts, and generate 11+ full-stack source files.
              </div>
            </div>

            {/* Stage 2: Test */}
            <div
              style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  2
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>TEST</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Evaluator generates automated pytest suite and performs 9-point static AST validation on syntax and contracts.
              </div>
            </div>

            {/* Stage 3: Deploy */}
            <div
              style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: '#fffbeb',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  3
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>DEPLOY</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Generates Dockerfile, render.yaml, vercel.json, and GitHub Actions CI workflow for instant production release.
              </div>
            </div>

            {/* Stage 4: Collaborate */}
            <div
              style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: '#f5f3ff',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  4
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>COLLABORATE</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Produces formal Pull Request summary, version changelog, senior code review assessment, and README guide.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. "What You Get" Grid */}
      <section style={{ maxWidth: '1080px', margin: '0 auto 48px', padding: '0 24px', width: '100%' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '18px' }}>
          What You Get
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          <div className="panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Code size={18} style={{ color: 'var(--state-running)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Decoupled Full-Stack Codebase</h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              React 18 + Vite client consuming typed FastAPI Python backend endpoints backed by auto-migrating SQLite storage.
            </p>
          </div>

          <div className="panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--state-success)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Automated Verification Report</h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              9-point static AST analysis, dependency manifest checks, API route consistency validation, and sandbox isolation.
            </p>
          </div>

          <div className="panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Rocket size={18} style={{ color: 'var(--state-warning)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Multi-Cloud Deploy Configs</h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Production Dockerfile, render.yaml Infrastructure-as-Code blueprint, vercel.json SPA rewrites, and GitHub Actions CI.
            </p>
          </div>

          <div className="panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <GitPullRequest size={18} style={{ color: '#8b5cf6' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>PR Documentation & Code Review</h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Senior engineer code review notes, pull request summary, semantic changelog, and setup documentation.
            </p>
          </div>

          <div className="panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Download size={18} style={{ color: 'var(--text-primary)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>1-Click ZIP Archive & Live Preview</h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Download complete project archive ready for local extraction or test immediately via self-contained HTML preview.
            </p>
          </div>

          <div className="panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Terminal size={18} style={{ color: 'var(--state-running)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Iterative Conversational Modifications</h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ask follow-up requests ("add dark mode", "add a login page") to iteratively patch files with real re-evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Architecture Strip */}
      <section style={{ maxWidth: '1080px', margin: '0 auto 48px', padding: '0 24px', width: '100%' }}>
        <div
          className="panel"
          style={{
            padding: '20px 24px',
            background: 'var(--bg-surface-secondary)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Engineered Technology Stack
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
              React 18 / Vite • FastAPI (Python 3.11) • OmniRoute Multi-Key Routing • SQLite
            </div>
          </div>

          <button onClick={onOpenApp} className="btn-primary">
            Launch Workspace <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* 6. Honest "Current Limits" Note */}
      <section style={{ maxWidth: '1080px', margin: '0 auto 48px', padding: '0 24px', width: '100%' }}>
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>System Notice & Boundaries:</strong> Generated projects are fully contained in sandboxed workspaces (`workspace/generated_projects/`). Evaluation checks run static AST parsing, route matching, and contract audits. Direct GitHub repository push requires `GITHUB_TOKEN` in the backend environment; all deployment files and copyable CLI instructions are provided for zero-friction manual execution.
        </div>
      </section>

      {/* 7. Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-surface)',
        }}
      >
        <div>NEXUS AI Developer Orchestrator • Developer Tools Track</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href="https://github.com/sanelakshmidharreddy/nexus"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            GitHub Repository
          </a>
          <button onClick={onOpenApp} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
            Workspace
          </button>
        </div>
      </footer>
    </div>
  );
}
