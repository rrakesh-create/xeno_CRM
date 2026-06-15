import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getCustomerStats, getCampaigns } from '../lib/api';
import { Users, DollarSign, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [showPercent, setShowPercent] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, campsRes] = await Promise.all([
        getCustomerStats(),
        getCampaigns()
      ]);
      setStats(statsRes.data);
      setCampaigns(campsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const chartData = campaigns.slice(0, 5).map(c => {
    const total = c.audience_size || 1;
    if (showPercent) {
      return {
        name: c.name.substring(0, 15) + '...',
        'Delivered (%)': Math.round((c.stats.delivered / total) * 100),
        'Opened (%)': Math.round((c.stats.opened / total) * 100),
        'Clicked (%)': Math.round((c.stats.clicked / total) * 100),
        'Failed (%)': Math.round((c.stats.failed / total) * 100)
      };
    } else {
      return {
        name: c.name.substring(0, 15) + '...',
        'Sent (Audience)': c.audience_size,
        'Delivered': c.stats.delivered,
        'Opened': c.stats.opened,
        'Clicked': c.stats.clicked,
        'Failed': c.stats.failed
      };
    }
  });

  const calcAverages = () => {
    if (campaigns.length === 0) return { del: 0, opn: 0, clk: 0 };
    const sums = campaigns.reduce((acc, c) => {
      acc.del += c.stats.delivery_rate;
      acc.opn += c.stats.open_rate;
      acc.clk += c.stats.click_rate;
      return acc;
    }, { del: 0, opn: 0, clk: 0 });
    const len = campaigns.length;
    return { del: Math.round(sums.del/len), opn: Math.round(sums.opn/len), clk: Math.round(sums.clk/len) };
  };

  const avgs = calcAverages();

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopper Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your shopper engagement</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="glass-panel stat-card">
          <div className="stat-title"><Users size={16} style={{display:'inline', marginRight:6}}/> Total Shoppers</div>
          <div className="stat-value">{stats?.total_customers || 0}</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-title"><DollarSign size={16} style={{display:'inline', marginRight:6}}/> Total Revenue</div>
          <div className="stat-value">{formatCurrency(stats?.total_revenue || 0)}</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-title"><ShoppingBag size={16} style={{display:'inline', marginRight:6}}/> Total Orders</div>
          <div className="stat-value">{stats?.total_orders || 0}</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-title"><AlertTriangle size={16} style={{display:'inline', marginRight:6}} color="#ef4444"/> At-Risk (60+ days)</div>
          <div className="stat-value" style={{color: 'var(--danger)'}}>{stats?.inactive_count || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '24px', height: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px' }}>Recent Campaign Performance</h3>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card-hover)', padding: '4px', borderRadius: '8px' }}>
              <button 
                onClick={() => setShowPercent(false)} 
                style={{ 
                  background: !showPercent ? 'var(--bg-card)' : 'none', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  fontWeight: !showPercent ? 600 : 400,
                  cursor: 'pointer' 
                }}
              >
                Counts
              </button>
              <button 
                onClick={() => setShowPercent(true)} 
                style={{ 
                  background: showPercent ? 'var(--bg-card)' : 'none', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  fontWeight: showPercent ? 600 : 400,
                  cursor: 'pointer' 
                }}
              >
                Rates (%)
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" unit={showPercent ? "%" : ""} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
              <Legend verticalAlign="top" height={36} />
              {!showPercent && <Bar dataKey="Sent (Audience)" fill="#94a3b8" radius={[4,4,0,0]} />}
              <Bar dataKey={showPercent ? "Delivered (%)" : "Delivered"} fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey={showPercent ? "Opened (%)" : "Opened"} fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey={showPercent ? "Clicked (%)" : "Clicked"} fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey={showPercent ? "Failed (%)" : "Failed"} fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '18px' }}>Average Engagement</h3>
          <div className="stat-card" style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', padding: '16px' }}>
            <div className="stat-title" style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>Delivery Rate</div>
            <div className="stat-value" style={{color: '#3b82f6'}}>{avgs.del}%</div>
          </div>
          <div className="stat-card" style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '16px' }}>
            <div className="stat-title" style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>Open Rate</div>
            <div className="stat-value" style={{color: '#10b981'}}>{avgs.opn}%</div>
          </div>
          <div className="stat-card" style={{ background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', padding: '16px' }}>
            <div className="stat-title" style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>Click Rate</div>
            <div className="stat-value" style={{color: '#f59e0b'}}>{avgs.clk}%</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', maxHeight: '400px', overflowY: 'auto' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
          <h3 style={{ fontSize: '18px' }}>Recent Campaigns</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Channel</th>
              <th>Audience</th>
              <th>Delivery</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.slice(0, 5).map(c => (
              <tr key={c.id} onClick={() => navigate(`/campaigns/${c.id}`)}>
                <td style={{fontWeight: 500}}>{c.name}</td>
                <td>{c.channel}</td>
                <td>{c.audience_size} shoppers</td>
                <td>
                  {c.stats.delivery_rate}%
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${c.stats.delivery_rate}%`, backgroundColor: '#3b82f6' }}></div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${c.status === 'completed' ? 'badge-success' : c.status === 'running' ? 'badge-info' : 'badge-warning'}`}>
                    {c.status === 'running' && <div className="live-indicator"></div>}
                    {c.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No campaigns yet</td></tr>}
          </tbody>
        </table>
      </div>


    </div>
  );
}
