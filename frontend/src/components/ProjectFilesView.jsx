import React from 'react';
import { FolderTree, FileCode, CheckCircle2, Layers, Check } from 'lucide-react';

export default function ProjectFilesView({ files }) {
  const defaultActivities = [
    { action: "Created", file: "dashboard.jsx", desc: "Interactive accident geospatial map & KPI cards", status: "SUCCESS" },
    { action: "Created", file: "analytics.jsx", desc: "Collision frequency trends & factor correlation", status: "SUCCESS" },
    { action: "Updated", file: "App.jsx", desc: "Route wiring & state synchronization", status: "SUCCESS" },
    { action: "Created", file: "api.py", desc: "FastAPI REST endpoints for accident records", status: "SUCCESS" },
    { action: "Build", file: "Vite + Python Pipeline", desc: "Automated compile and test pass", status: "SUCCESS" },
  ];

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <div className="panel-title">
          <FolderTree size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Project Activity & Generated Artifacts</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          SANDBOX: workspace/generated_projects/
        </span>
      </div>

      <div className="panel-body">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.76rem',
          fontWeight: '700',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '10px',
        }}>
          <Layers size={13} style={{ color: 'var(--text-muted)' }} />
          <span>PROJECT ACTIVITY</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {defaultActivities.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.78rem',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  color: item.action === 'Updated' ? 'var(--state-warning-text)' : 'var(--state-running-text)',
                  background: item.action === 'Updated' ? 'var(--state-warning-bg)' : 'var(--state-running-bg)',
                  border: `1px solid ${item.action === 'Updated' ? 'var(--state-warning-border)' : 'var(--state-running-border)'}`,
                  padding: '1px 5px',
                  borderRadius: '2px',
                }}>
                  {item.action}
                </span>

                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {item.file}
                </span>

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  — {item.desc}
                </span>
              </div>

              <span className="badge badge-success" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                <Check size={10} /> {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
