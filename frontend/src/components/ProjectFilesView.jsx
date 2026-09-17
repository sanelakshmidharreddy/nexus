import React, { useState } from 'react';
import { FolderTree, FileCode, Layers, Check, ExternalLink, Eye, X } from 'lucide-react';
import { API_BASE } from '../config';

export default function ProjectFilesView({ artifacts = [], workflowId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);

  const defaultFiles = [
    { name: "index.html", desc: "Interactive accident geospatial map & KPI cards", size: "2.9 KB" },
    { name: "styles.css", desc: "Design system & dashboard styles", size: "3.4 KB" },
    { name: "app.js", desc: "Analytics logic, chart renders & hotspot clustering", size: "4.8 KB" },
    { name: "data.json", desc: "Cleaned RoadSafe accident records & coordinates", size: "9.2 KB" },
    { name: "analysis_summary.json", desc: "KPI metrics & severity distributions", size: "1.1 KB" },
    { name: "research.md", desc: "Domain analysis & requirement specifications", size: "1.8 KB" },
  ];

  const fileList = (artifacts && artifacts.length > 0)
    ? artifacts.map(f => {
        const name = typeof f === 'string' ? f : f.name;
        let desc = "Generated artifact";
        if (name === 'index.html') desc = "Interactive dashboard user interface";
        else if (name === 'styles.css') desc = "CSS styling & responsive layout tokens";
        else if (name === 'app.js') desc = "Analytics, temporal trends & coordinate mapping";
        else if (name === 'data.json') desc = "Normalized accident dataset with geospatial points";
        else if (name === 'data_profile.json') desc = "Data Agent schema profiling & field summary";
        else if (name === 'analysis_summary.json') desc = "Accident metrics, casualties & risk factors";
        else if (name === 'research.md') desc = "Research Agent domain breakdown & guidelines";
        else if (name === 'ui_spec.json') desc = "UI Agent component architecture & view layout";
        return { name, desc };
      })
    : defaultFiles;

  const handleOpenFile = async (fileName) => {
    if (!workflowId) return;
    setSelectedFile(fileName);
    setLoadingFile(true);
    try {
      const res = await fetch(`${API_BASE}/workflows/${workflowId}/artifact/${fileName}`);
      if (res.ok) {
        const text = await res.text();
        setFileContent(text);
      } else {
        setFileContent(`// Error loading file: HTTP ${res.status}`);
      }
    } catch (err) {
      setFileContent(`// Failed to fetch file from backend: ${err.message}`);
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <div className="panel-title">
          <FolderTree size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Project Workspace & Generated Artifacts</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {workflowId ? `SANDBOX: workspace/generated_projects/${workflowId.slice(0, 10)}...` : 'SANDBOX: workspace/generated_projects/'}
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
          <span>GENERATED ARTIFACTS ({fileList.length} FILES)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {fileList.map((item, idx) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                <FileCode size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {item.name}
                </span>

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  — {item.desc}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {workflowId && (
                  <button
                    onClick={() => handleOpenFile(item.name)}
                    className="btn-secondary"
                    style={{ padding: '2px 7px', fontSize: '0.7rem' }}
                    title="View file source code"
                  >
                    <Eye size={11} />
                    <span>View</span>
                  </button>
                )}
                <span className="badge badge-success" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                  <Check size={10} /> READY
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Viewer Modal */}
      {selectedFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '85vh',
            background: '#ffffff',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-modal)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '700' }}>
                <FileCode size={15} />
                <span>{selectedFile}</span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="btn-secondary"
                style={{ padding: '3px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, background: 'var(--bg-canvas)' }}>
              {loadingFile ? (
                <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Loading artifact content...</div>
              ) : (
                <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-primary)' }}>
                  {fileContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
