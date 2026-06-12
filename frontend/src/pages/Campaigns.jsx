import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCampaigns } from '../lib/api';
import { Plus, Megaphone } from 'lucide-react';

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await getCampaigns();
      setCampaigns(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="campaigns-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Create and manage your shopper engagement campaigns</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/campaigns/new')}>
          <Plus size={18} /> New Campaign
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Channel</th>
              <th>Audience Size</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Delivered</th>
              <th>Opened</th>
              <th>Clicked</th>
              <th>Failed</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id} onClick={() => navigate(`/campaigns/${c.id}`)}>
                <td>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Megaphone size={16} color="var(--accent-primary)" />
                    {c.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td>{c.channel}</td>
                <td>{c.audience_size}</td>
                <td>
                  <span className={`badge ${c.status === 'completed' ? 'badge-success' : c.status === 'running' ? 'badge-info' : 'badge-warning'}`}>
                    {c.status === 'running' && <div className="live-indicator"></div>}
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  {c.stats.sent}
                  <div className="progress-container"><div className="progress-bar" style={{ width: `${(c.stats.sent/c.audience_size)*100}%`, background: 'var(--text-secondary)' }}></div></div>
                </td>
                <td>
                  {c.stats.delivered}
                  <div className="progress-container"><div className="progress-bar" style={{ width: `${c.stats.delivery_rate}%`, background: 'var(--info)' }}></div></div>
                </td>
                <td>
                  {c.stats.opened}
                  <div className="progress-container"><div className="progress-bar" style={{ width: `${c.stats.open_rate}%`, background: 'var(--success)' }}></div></div>
                </td>
                <td>
                  {c.stats.clicked}
                  <div className="progress-container"><div className="progress-bar" style={{ width: `${c.stats.click_rate}%`, background: 'var(--warning)' }}></div></div>
                </td>
                <td style={{color: 'var(--danger)'}}>{c.stats.failed}</td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr><td colSpan="9" style={{textAlign: 'center'}}>No campaigns created yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
