import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Award, Zap, ChevronRight, Activity, TrendingUp } from 'lucide-react';

export default function BrandInsights() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrandInsights();
  }, []);

  const fetchBrandInsights = async () => {
    try {
      const res = await api.get('/ai/brand-insights');
      setInsights(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (card) => {
    if (card.action_text === 'Build this campaign') {
      navigate('/campaigns/new', { 
        state: { prompt: card.campaign_prompt } 
      });
    } else {
      navigate('/dashboard'); // fallback
    }
  };

  if (loading) return <div style={{padding: '40px'}}>Loading Brand Insights...</div>;
  if (!insights) return <div style={{padding: '40px'}}>Failed to load insights.</div>;

  const scoreColor = insights.health_score >= 80 ? 'var(--success)' : 
                     insights.health_score >= 60 ? 'var(--info)' : 
                     'var(--warning)';

  return (
    <div className="dashboard max-w-4xl mx-auto">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award size={28} color="var(--accent-primary)" />
            AI Brand Health Insights
          </h1>
          <p className="page-subtitle">Real-time macro analysis of shopper engagement & retention across your entire store.</p>
        </div>
      </div>

      {/* Parent Brand Health Score */}
      <div className="glass-panel" style={{ padding: '40px', display: 'flex', gap: '48px', alignItems: 'center', marginBottom: '40px', background: 'linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))' }}>
        <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: `conic-gradient(${scoreColor} ${insights.health_score}%, rgba(255,255,255,0.05) 0)` }}>
          <div style={{ width: '140px', height: '140px', background: 'var(--bg-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)' }}>
            <span style={{ fontSize: '48px', fontWeight: 800, color: scoreColor }}>{insights.health_score}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '28px', color: scoreColor, marginBottom: '12px' }}>Overall Brand Health</h2>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', lineHeight: 1.6, marginBottom: '24px' }}>
            Your brand is currently performing at a highly engaged level. Overall retention is stable, but there are clear opportunities to activate dormant shoppers and generate more reviews from recent loyal buyers.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '16px', fontSize: '14px' }}><TrendingUp size={16}/> +4% vs last month</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--info)', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 12px', borderRadius: '16px', fontSize: '14px' }}><Activity size={16}/> High open rates</span>
          </div>
        </div>
      </div>

      {/* 3 Actionable Recommendation Cards */}
      <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={20} color="var(--warning)" /> Top Growth Opportunities
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {insights.recommendations.map((rec, i) => (
          <div key={i} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {i < 2 && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-primary)' }} />}
            <div style={{ marginBottom: '16px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 600 }}>{rec.title}</h4>
                {i < 2 && <span className="badge badge-info" style={{ fontSize: '10px' }}>Priority {i+1}</span>}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                {rec.description}
              </p>
            </div>
            <button 
              className={i < 2 ? 'btn-primary' : 'btn-secondary'} 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              onClick={() => handleAction(rec)}
            >
              {rec.action_text} <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
