import React from 'react';
import { Target, Compass, GitFork, Users, Wrench, Play, ShieldAlert, Award } from 'lucide-react';

export default function ArchitectureDiagram() {
  const steps = [
    { title: "GOAL", sub: "Natural prompt", icon: Target, color: "#0f172a" },
    { title: "INTENT", sub: "Requirements", icon: Compass, color: "#475569" },
    { title: "PLAN", sub: "Topological DAG", icon: GitFork, color: "#2563eb" },
    { title: "AGENTS", sub: "6 Specialists", icon: Users, color: "#2563eb" },
    { title: "TOOLS", sub: "Sandboxed FS", icon: Wrench, color: "#0f172a" },
    { title: "EXECUTION", sub: "Real workspace", icon: Play, color: "#0f172a" },
    { title: "RECOVERY", sub: "Self-healing", icon: ShieldAlert, color: "#d97706" },
    { title: "VERIFICATION", sub: "9-Point score", icon: Award, color: "#059669" },
  ];

  return (
    <div className="panel" style={{ background: '#ffffff' }}>
      <div className="panel-header" style={{ padding: '10px 16px' }}>
        <div className="panel-title" style={{ fontSize: '0.8rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', letterSpacing: '0.04em' }}>
            HOW NEXUS WORKS — ARCHITECTURAL EXECUTION PIPELINE
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          END-TO-END AUTONOMOUS ENGINE
        </span>
      </div>

      <div className="panel-body" style={{ padding: '14px 18px', overflowX: 'auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '780px',
          gap: '8px',
        }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.title}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  minWidth: '88px',
                  transition: 'all 0.15s ease',
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.color,
                    marginBottom: '4px',
                  }}>
                    <Icon size={12} />
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    fontFamily: 'var(--font-mono)',
                    color: step.color,
                    letterSpacing: '0.02em',
                  }}>
                    {step.title}
                  </span>

                  <span style={{
                    fontSize: '0.64rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginTop: '2px',
                  }}>
                    {step.sub}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div style={{
                    color: 'var(--border-strong)',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    userSelect: 'none',
                  }}>
                    →
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
