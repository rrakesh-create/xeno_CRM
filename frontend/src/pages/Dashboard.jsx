import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getCustomerStats, getCampaigns, aiInsights } from '../lib/api';
import { Users, DollarSign, ShoppingBag, AlertTriangle, Send, Zap } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

  const handleAsk = async (question) => {
    if (!question) return;
    setChatLoading(true);
    setChatQuestion(question);
    try {
      const recentCamp = campaigns.length > 0 ? campaigns[0].id : '';
      const res = await aiInsights(question, recentCamp);
      setChatAnswer(res.data.answer);
    } catch (err) {
      setChatAnswer("Sorry, I couldn't process that right now.");
    } finally {
      setChatLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const chartData = campaigns.slice(0, 5).map(c => ({
    name: c.name.substring(0, 10) + '...',
    delivered: c.stats.delivered,
    opened: c.stats.opened,
    clicked: c.stats.clicked
  }));

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
          <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Recent Campaign Performance</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
              <Bar dataKey="delivered" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="opened" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="clicked" fill="#f59e0b" radius={[4,4,0,0]} />
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

      {/* Pinned Insights Chat Widget */}
      <div className="glass-panel ai-chat-box" style={{ padding: '24px', position: 'sticky', bottom: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="#f59e0b" /> Campaign Insights AI
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {["Which campaign had the highest open rate?", "Why did the recent campaign fail to deliver?", "What is the average engagement for SMS?"].map((q, i) => (
            <button key={i} onClick={() => handleAsk(q)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '6px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
              {q}
            </button>
          ))}
        </div>

        {chatAnswer && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '16px', borderLeft: '3px solid var(--accent-primary)', fontSize: '14px', lineHeight: '1.5' }}>
            {chatAnswer}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Ask anything about your campaigns and shopper engagement..." 
            onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(e.target.value); }}
          />
          <button className="btn-primary" disabled={chatLoading} onClick={() => handleAsk(document.querySelector('.ai-chat-box input').value)}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
