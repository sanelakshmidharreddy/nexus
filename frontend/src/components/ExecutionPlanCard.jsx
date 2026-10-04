import React from 'react';
import { Compass, Code, Server, Database, CheckCircle2, Layers, Cpu, Globe } from 'lucide-react';

export default function ExecutionPlanCard({ requirements = null, plan = null }) {
  const activePlan = plan || requirements?.execution_plan;
  if (!activePlan && !requirements) return null;

  const projectName = activePlan?.project_name || requirements?.project_name || "Developer Project";
  const objective = activePlan?.objective || requirements?.objective || "Build application";
  const frontend = activePlan?.frontend || requirements?.technologies_identified?.frontend || "React 18 + Vite";
  const backend = activePlan?.backend || requirements?.technologies_identified?.backend || "FastAPI (Python)";
  const database = activePlan?.database || requirements?.technologies_identified?.database || "SQLite";
  const features = activePlan?.features || requirements?.requested_features || [];
  const apis = activePlan?.apis || requirements?.technologies_identified?.apis || [];
  const architecture = activePlan?.architecture || "Decoupled client-server architecture with RESTful API communication.";

  return (
    <div className="panel" style={{ background: '#ffffff', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <div className="panel-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.88rem' }}>
          <Compass size={16} style={{ color: 'var(--state-running)' }} />
          <span>STRUCTURED EXECUTION PLAN</span>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
          ARCHITECT APPROVED
        </span>
      </div>

      <div className="panel-body" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Project Header Info */}
        <div style={{
          padding: '14px 16px',
          background: 'var(--bg-canvas)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {projectName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {objective}
          </div>
        </div>

        {/* Tech Stack Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}>
          <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
              <Globe size={13} style={{ color: 'var(--state-running)' }} /> FRONTEND
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
              {frontend}
            </div>
          </div>

          <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
              <Server size={13} style={{ color: '#059669' }} /> BACKEND
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
              {backend}
            </div>
          </div>

          <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
              <Database size={13} style={{ color: '#d97706' }} /> DATABASE
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
              {database}
            </div>
          </div>
        </div>

        {/* Architecture Summary */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '10px 14px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-xs)', borderLeft: '3px solid var(--state-running)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Architecture: </strong>
          {architecture}
        </div>

        {/* Features & APIs Two-Column */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Features */}
          <div>
            <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
              IDENTIFIED FEATURES ({features.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {features.map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--state-success)', marginTop: '2px', flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* APIs */}
          <div>
            <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
              CONTRACT APIS ({apis.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {apis.map((api, idx) => (
                <div key={idx} style={{
                  padding: '5px 8px',
                  borderRadius: '3px',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-primary)',
                }}>
                  {api}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
