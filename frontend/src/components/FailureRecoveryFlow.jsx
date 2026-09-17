import React, { useState } from 'react';
import { ShieldAlert, Play, Check, AlertTriangle, ArrowRight, RefreshCw, Cpu, Activity } from 'lucide-react';

export default function FailureRecoveryFlow({ onTriggerRecoveryLog }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const recoveryStages = [
    {
      step: 1,
      title: "Task Failure",
      badge: "FAULT DETECTED",
      badgeType: "failed",
      desc: "QA Agent intercepts test failure during build verification.",
      detail: "Error: KeyError: 'latitude' schema field missing coordinate index",
    },
    {
      step: 2,
      title: "Failure Diagnosis",
      badge: "DIAGNOSIS",
      badgeType: "retrying",
      desc: "NEXUS Orchestrator analyzes error stacktrace against original Goal requirements.",
      detail: "Root Cause: Coordinate normalization transform bypassed in Data pipeline",
    },
    {
      step: 3,
      title: "Orchestrator Decision",
      badge: "DECISION",
      badgeType: "running",
      desc: "Orchestrator determines self-healing strategy: Reassign & Patch with constraints.",
      detail: "Decision: Regenerate transformation layer with explicit Lat/Long normalization",
    },
    {
      step: 4,
      title: "Retry / Reassign",
      badge: "REASSIGNMENT",
      badgeType: "running",
      desc: "Developer Agent dispatched with corrective prompt and failure context.",
      detail: "Task T2 retry_count incremented (0 → 1); constraint prompt applied",
    },
    {
      step: 5,
      title: "Correction",
      badge: "PATCH APPLIED",
      badgeType: "retrying",
      desc: "Developer Agent refactors data transformer and updates output bundle.",
      detail: "Patch: roadsafe_loader.py updated with robust fallback normalization",
    },
    {
      step: 6,
      title: "Re-Execution",
      badge: "BUILD RETRY",
      badgeType: "running",
      desc: "QA re-executes test suite on patched deliverable in sandbox.",
      detail: "Executing test suite: 18/18 test cases passing cleanly",
    },
    {
      step: 7,
      title: "Success Verified",
      badge: "RECOVERED",
      badgeType: "success",
      desc: "Deliverable verified intact. Workflow transitions to Evaluator Agent.",
      detail: "Zero compilation errors, clean build verified",
    },
  ];

  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setCurrentStep(1);
    if (onTriggerRecoveryLog) {
      onTriggerRecoveryLog(1, "QA Agent detected build error: KeyError 'latitude' missing");
    }

    const delays = [
      { step: 2, delay: 1000, msg: "NEXUS diagnosing root cause from execution stacktrace..." },
      { step: 3, delay: 2000, msg: "Orchestrator Decision: Reassign Task T2 to Developer Agent with coordinate constraint" },
      { step: 4, delay: 3000, msg: "Adaptive Retry: Task T2 retry_count incremented to 1; Developer Agent starting patch" },
      { step: 5, delay: 4200, msg: "Developer Agent applied patch to roadsafe_loader.py" },
      { step: 6, delay: 5400, msg: "QA Agent re-running build verification suite..." },
      { step: 7, delay: 6600, msg: "Build Passed cleanly. Adaptive recovery loop complete: SUCCESS verified!" },
    ];

    delays.forEach(({ step, delay, msg }) => {
      setTimeout(() => {
        setCurrentStep(step);
        if (onTriggerRecoveryLog) {
          onTriggerRecoveryLog(step, msg);
        }
        if (step === 7) {
          setIsSimulating(false);
        }
      }, delay);
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <ShieldAlert size={15} style={{ color: 'var(--text-muted)' }} />
          <span>Adaptive Orchestration & Failure Recovery Engine</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            SELF-HEALING RECOVERY LOOP
          </span>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="btn-secondary"
            style={{ padding: '3px 9px', fontSize: '0.74rem' }}
          >
            {isSimulating ? (
              <>
                <RefreshCw size={11} className="status-dot-running" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play size={11} />
                <span>Simulate Recovery Loop</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="panel-body">
        {/* Core Architecture Callout for Judges */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-surface-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>NEXUS Adaptive Loop:</strong> Unlike linear pipelines, NEXUS intercepts runtime exceptions, performs autonomous root-cause diagnosis, formulates corrective reassignments, and recovers autonomously.
          </div>
          <div style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '600',
            color: currentStep === 7 ? 'var(--state-success)' : currentStep > 0 ? 'var(--state-warning)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span className={`status-dot ${currentStep === 7 ? 'status-dot-success' : currentStep > 0 ? 'status-dot-running' : 'status-dot-pending'}`} />
            <span>{currentStep === 7 ? 'RECOVERY COMPLETED' : currentStep > 0 ? `STEP ${currentStep} / 7 ACTIVE` : 'READY'}</span>
          </div>
        </div>

        {/* 7-Step Recovery Visualizer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px',
        }}>
          {recoveryStages.map((stage) => {
            const isActive = currentStep === stage.step;
            const isCompleted = currentStep > stage.step;

            return (
              <div
                key={stage.step}
                style={{
                  background: isActive ? 'var(--bg-surface-secondary)' : '#ffffff',
                  border: `1px solid ${
                    isActive
                      ? 'var(--text-primary)'
                      : isCompleted
                      ? 'var(--state-success-border)'
                      : 'var(--border-subtle)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className={`badge badge-${stage.badgeType}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                      {stage.badge}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      color: isCompleted ? 'var(--state-success)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '600'
                    }}>
                      {isCompleted ? '✓' : `0${stage.step}`}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {stage.title}
                  </div>

                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
                    {stage.desc}
                  </div>
                </div>

                <div style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-surface-secondary)',
                  padding: '5px 7px',
                  borderRadius: '3px',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '4px',
                  lineHeight: '1.3',
                }}>
                  {stage.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
