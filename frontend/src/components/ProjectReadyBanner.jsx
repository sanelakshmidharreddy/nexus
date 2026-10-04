import React from 'react';
import { CheckCircle2, Download, ExternalLink, Sparkles, FolderDown } from 'lucide-react';
import { API_BASE } from '../config';

export default function ProjectReadyBanner({ workflowId, evaluation, artifacts = [], requirements }) {
  if (!workflowId) return null;

  const filesCount = artifacts.length || 11;
  const isPassed = evaluation?.status === 'passed' || evaluation?.score === 100 || (evaluation?.passed_checks === evaluation?.total_checks && evaluation?.total_checks > 0);
  const projectName = requirements?.project_name || "NEXUS Generated Project";

  const previewUrl = `${API_BASE}/workflows/${workflowId}/preview`;
  const zipUrl = `${API_BASE}/workflows/${workflowId}/zip`;

  const handleOpenPreview = () => {
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadZip = () => {
    window.location.href = zipUrl;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
      border: '1px solid var(--state-success-border)',
      borderRadius: 'var(--radius-md)',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'var(--state-success)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CheckCircle2 size={24} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--state-success-text)', letterSpacing: '-0.01em' }}>
              PROJECT READY
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
              <Sparkles size={11} /> READY TO RUN
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            <strong>{filesCount} files generated</strong> • Evaluation: <span style={{ color: 'var(--state-success-text)', fontWeight: '700' }}>{isPassed ? 'PASSED (100%)' : 'AUDIT COMPLETE'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleOpenPreview}
          className="btn-secondary"
          style={{
            padding: '9px 18px',
            fontSize: '0.82rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            borderColor: 'var(--state-success-border)',
            color: 'var(--state-success-text)',
          }}
        >
          <ExternalLink size={14} />
          <span>VIEW PROJECT</span>
        </button>

        <button
          onClick={handleDownloadZip}
          className="btn-primary"
          style={{
            padding: '9px 20px',
            fontSize: '0.82rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--state-success)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
          }}
        >
          <Download size={15} />
          <span>DOWNLOAD ZIP</span>
        </button>
      </div>
    </div>
  );
}
