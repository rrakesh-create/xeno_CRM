import React from 'react';
import { Shield, Zap, AlertTriangle, TrendingUp, TrendingDown, Target, MessageCircle, PlayCircle } from 'lucide-react';

export default function DiagnosticPanel({ diagnostic, onStartCampaign }) {
  if (!diagnostic) return null;

  const scoreColor = 
    diagnostic.satisfaction_score >= 80 ? 'var(--success)' : 
    diagnostic.satisfaction_score >= 60 ? 'var(--info)' : 
    diagnostic.satisfaction_score >= 40 ? 'var(--warning)' : 'var(--danger)';

  const scoreLabel = diagnostic.satisfaction_level === 'loyal' ? 'Loyal Shopper' : 
                     diagnostic.satisfaction_level === 'engaged' ? 'Engaged' : 
                     diagnostic.satisfaction_level === 'at_risk' ? 'At Risk' : 'Disengaging';

  return (
    <div className="diagnostic-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Section 1: Engagement Score */}
      <div className="glass-panel" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '32px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: `conic-gradient(${scoreColor} ${diagnostic.satisfaction_score}%, rgba(255,255,255,0.1) 0)` }}>
          <div style={{ width: '100px', height: '100px', background: 'var(--bg-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: scoreColor }}>{diagnostic.satisfaction_score}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/100</span>
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: '24px', color: scoreColor, marginBottom: '8px' }}>{scoreLabel}</h2>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', lineHeight: 1.5 }}>{diagnostic.summary}</p>
        </div>
      </div>

      {/* Sections 2 & 3: What's Working & Risk Factors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Section 2: What's Working (Only show if loyal/engaged) */}
        {['loyal', 'engaged'].includes(diagnostic.satisfaction_level) && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
              <TrendingUp size={18} /> What's Working
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {diagnostic.satisfaction_drivers?.map((d, i) => (
                <div key={i} style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '10px' }}>{d.type}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Impact: <span style={{ color: 'var(--success)' }}>{d.impact}</span></span>
                  </div>
                  <div style={{ fontSize: '14px' }}>{d.evidence}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Risk Factors (Always show) */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
            <AlertTriangle size={18} /> Risk Factors
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {diagnostic.risk_factors?.map((r, i) => (
              <div key={i} style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="badge badge-warning" style={{ padding: '2px 8px', fontSize: '10px' }}>{r.type}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Severity: <span style={{ color: r.severity === 'High' ? 'var(--danger)' : 'var(--warning)' }}>{r.severity}</span></span>
                </div>
                <div style={{ fontSize: '14px' }}>{r.evidence}</div>
              </div>
            ))}
            {(!diagnostic.risk_factors || diagnostic.risk_factors.length === 0) && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No major risk factors detected.</div>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Recommended Actions */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
          <Target size={18} /> Recommended Actions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {diagnostic.retention_actions?.map((act, i) => (
            <div key={i} style={{ background: i === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? 'var(--accent-primary)' : 'var(--border-color)'}`, padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, paddingRight: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span className="badge badge-info" style={{ background: 'var(--accent-primary)', color: 'white' }}>Priority {i + 1}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <MessageCircle size={14} /> {act.channel}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{act.action}</div>
                <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>"{act.message_angle}"</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Reasoning: {act.reasoning}</div>
              </div>
              {i === 0 && (
                <button className="btn-primary" onClick={() => onStartCampaign(act)}>
                  <PlayCircle size={18} /> Start campaign for this shopper
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Channel Recommendation */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: '24px' }}>
          <div style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '8px' }}>Best Channel: {diagnostic.channel_recommendation?.best_channel}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{diagnostic.channel_recommendation?.best_reason}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '8px' }}>Avoid Channel: {diagnostic.channel_recommendation?.avoid_channel}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{diagnostic.channel_recommendation?.avoid_reason}</div>
        </div>
      </div>
      
    </div>
  );
}
