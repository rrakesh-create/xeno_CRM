import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCampaign, getCampaignStats } from '../lib/api';
import { ArrowLeft, Clock, Users, RefreshCw } from 'lucide-react';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
    let interval;
    if (campaign?.status === 'running') {
      interval = setInterval(fetchStats, 3000);
    }
    return () => clearInterval(interval);
  }, [id, campaign?.status]);

  const fetchData = async () => {
    try {
      const res = await getCampaign(id);
      setCampaign(res.data);
      setStats(res.data.stats);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getCampaignStats(id);
      setStats(res.data);
      if (res.data.delivery_rate === 100) {
        // Just refresh the whole thing to get the completed status if it's done
        fetchData();
      }
    } catch(e){}
  };

  if (!campaign) return <div style={{padding: '40px'}}>Loading...</div>;

  return (
    <div className="campaign-detail">
      <div style={{ marginBottom: '24px' }}>
        <button className="btn-primary" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }} onClick={() => navigate('/campaigns')}>
          <ArrowLeft size={16} /> Back to Campaigns
        </button>
      </div>
      
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">{campaign.name}</h1>
          <div className="page-subtitle" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
            <span className={`badge ${campaign.status === 'completed' ? 'badge-success' : campaign.status === 'running' ? 'badge-info' : 'badge-warning'}`}>
              {campaign.status === 'running' && <div className="live-indicator"></div>}
              {campaign.status.toUpperCase()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16}/> {campaign.segment_label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{campaign.channel}</span>
          </div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="glass-panel stat-card" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
          <div className="stat-title">Delivery Rate</div>
          <div className="stat-value" style={{color: '#3b82f6'}}>{stats?.delivery_rate || 0}%</div>
        </div>
        <div className="glass-panel stat-card" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
          <div className="stat-title">Open Rate</div>
          <div className="stat-value" style={{color: '#10b981'}}>{stats?.open_rate || 0}%</div>
        </div>
        <div className="glass-panel stat-card" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
          <div className="stat-title">Click Rate</div>
          <div className="stat-value" style={{color: '#f59e0b'}}>{stats?.click_rate || 0}%</div>
        </div>
        <div className="glass-panel stat-card" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
          <div className="stat-title">Failed</div>
          <div className="stat-value" style={{color: '#ef4444'}}>{stats?.failed || 0}</div>
        </div>
      </div>

      {campaign.status === 'running' && (
        <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--accent-primary)' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} className="spin" style={{ animation: 'spin 2s linear infinite' }} /> Live Feed
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
            {campaign.communications.slice(0, 15).map(c => (
              <div key={c.id} style={{ whiteSpace: 'nowrap', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '12px', border: `1px solid ${c.status === 'opened' ? 'var(--success)' : c.status === 'failed' ? 'var(--danger)' : 'var(--border-color)'}` }}>
                <span style={{ fontWeight: 600 }}>{c.customer_name}</span> — <span style={{ color: 'var(--text-secondary)' }}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Message Template</h3>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
            {campaign.message_template}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px' }}>Shopper Delivery Status</h3>
          </div>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shopper</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {campaign.communications.map(c => (
                  <tr key={c.id}>
                    <td style={{fontWeight: 500}}>{c.customer_name}</td>
                    <td style={{color: 'var(--text-secondary)'}}>{c.customer_email}</td>
                    <td>
                      <span className={`badge ${['opened', 'clicked'].includes(c.status) ? 'badge-success' : c.status === 'failed' ? 'badge-danger' : c.status === 'delivered' ? 'badge-info' : 'badge-warning'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{color: 'var(--text-secondary)', fontSize: '12px'}}>
                      {new Date(c.updated_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
