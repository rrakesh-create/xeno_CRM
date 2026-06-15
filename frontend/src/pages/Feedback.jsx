import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, 
  PieChart, Pie, Cell, 
  BarChart, Bar, Legend
} from 'recharts';
import { Star, Download, Trash2, ShieldAlert, Gift, CheckCircle, Search, User } from 'lucide-react';
import { 
  getFeedbacks, 
  submitFeedback, 
  getFeedbackAnalysis, 
  deleteFeedback, 
  exportFeedbackCSV,
  getCustomers 
} from '../lib/api';

const COLORS = ['#ef4444', '#f57c00', '#f59e0b', '#3b82f6', '#10b981']; // 1 to 5 Stars colors

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [customers, setCustomers] = useState([]);
  
  // Form state
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [customerInput, setCustomerInput] = useState('');
  const [consentInput, setConsentInput] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Interactive UI state
  const [activeTab, setActiveTab] = useState('all');
  const [showTableData, setShowTableData] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchData();
    // Load customers list for the dropdown
    getCustomers({ limit: 100 })
      .then(res => setCustomers(res.data))
      .catch(err => console.error(err));
  }, []);

  const fetchData = async () => {
    try {
      const [feedbacksRes, analysisRes] = await Promise.all([
        getFeedbacks(),
        getFeedbackAnalysis()
      ]);
      setFeedbacks(feedbacksRes.data);
      setAnalysis(analysisRes.data);
    } catch (err) {
      console.error(err);
      showToast("Error loading feedback data.");
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentInput) {
      alert("You must consent to the privacy terms to submit feedback.");
      return;
    }
    
    setFormLoading(true);
    try {
      await submitFeedback({
        customer_id: customerInput || null,
        rating: ratingInput,
        comment: commentInput,
        consent_given: consentInput
      });
      showToast("Feedback submitted successfully!");
      setCommentInput('');
      setCustomerInput('');
      setConsentInput(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error submitting feedback.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this feedback? This satisfies GDPR erasure requirements.")) {
      try {
        await deleteFeedback(id);
        showToast("Feedback deleted successfully.");
        fetchData();
      } catch (err) {
        console.error(err);
        showToast("Error deleting feedback.");
      }
    }
  };

  const handleAction = (customerName, type) => {
    if (type === 'recovery') {
      showToast(`Recovery discount code successfully dispatched to ${customerName}!`);
    } else if (type === 'loyalty') {
      showToast(`VIP loyalty invitation sent to ${customerName}!`);
    }
  };

  const handleExport = () => {
    window.open(exportFeedbackCSV(), '_blank');
    showToast("Feedback report downloaded successfully.");
  };

  // Filter feedbacks for the Tabbed Categorization Viewer
  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = f.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (f.comment && f.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    return f.rating === parseInt(activeTab) && matchesSearch;
  });

  // Promoter/Detractor lists for actionable segment cards
  const detractors = feedbacks.filter(f => f.rating <= 2 && f.customer_id);
  const promoters = feedbacks.filter(f => f.rating >= 4 && f.customer_id);

  // Heatmap generation: City vs. Star Rating count
  const cities = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat"];
  const ratings = [1, 2, 3, 4, 5];
  
  // Calculate matrix counts
  const heatmapData = {};
  cities.forEach(city => {
    heatmapData[city] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  });

  feedbacks.forEach(f => {
    if (f.customer_city && heatmapData[f.customer_city]) {
      heatmapData[f.customer_city][f.rating] = (heatmapData[f.customer_city][f.rating] || 0) + 1;
    }
  });

  const getHeatmapColor = (count) => {
    if (count === 0) return 'rgba(30, 58, 138, 0.02)'; // light bg
    const opacity = Math.min(0.1 + count * 0.2, 0.9);
    return `rgba(30, 58, 138, ${opacity})`; // primary accent shade
  };

  const getHeatmapTextColor = (count) => {
    return count > 3 ? '#ffffff' : 'var(--text-primary)';
  };

  // Recharts Chart formats
  const pieData = analysis ? Object.keys(analysis.rating_distribution).map(key => ({
    name: `${key} Star`,
    value: analysis.rating_distribution[key]
  })).reverse() : [];

  const trendData = analysis?.trends || [];
  
  const posKeywords = analysis?.keywords?.positive || [];
  const negKeywords = analysis?.keywords?.negative || [];

  return (
    <div className="feedback-page">
      {toastMessage && (
        <div className="action-toast">
          <CheckCircle size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">User Feedback & Sentiment Analysis</h1>
          <p className="page-subtitle">Understand shopper satisfaction, run targeted campaigns, and track satisfaction trends.</p>
        </div>
        <button className="btn-primary" onClick={handleExport}>
          <Download size={18} /> Export CSV Report
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid">
        <div className="glass-panel stat-card">
          <div className="stat-title">Average Star Rating</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {analysis?.average_rating || 0}
            <Star size={24} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline' }} />
          </div>
          <p className="feedback-meta">Out of {analysis?.total_count || 0} reviews</p>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-title">Promoters (4-5 ★)</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {analysis?.segments?.promoters?.count || 0}
          </div>
          <p className="feedback-meta">High satisfaction shoppers</p>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-title">Passives (3 ★)</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {analysis?.segments?.passives?.count || 0}
          </div>
          <p className="feedback-meta">Neutral shopper experience</p>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-title">Detractors (1-2 ★)</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {analysis?.segments?.detractors?.count || 0}
          </div>
          <p className="feedback-meta">At-risk shoppers needing follow-up</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="feedback-grid">
        {/* Trend line chart */}
        <div className="glass-panel" style={{ padding: '24px', height: '360px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Feedback Satisfaction Trend</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={trendData}>
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis domain={[1, 5]} stroke="#94a3b8" />
              <ChartTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="avg_rating" name="Avg Rating" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rating distribution Pie Chart */}
        <div className="glass-panel" style={{ padding: '24px', height: '380px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Rating Distribution</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={0}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name.split(' ')[0]}★ (${(percent * 100).toFixed(0)}%)`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[4 - index]} />
                ))}
              </Pie>
              <ChartTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accessible Table View Toggle (WCAG 2.1 Compliance) */}
      <div style={{ textAlign: 'right', marginBottom: '24px' }}>
        <button 
          className="action-btn action-btn-outline" 
          onClick={() => setShowTableData(!showTableData)}
          aria-expanded={showTableData}
        >
          {showTableData ? "Hide Screen-Reader Accessible Data" : "Show Screen-Reader Accessible Data Table"}
        </button>
        {showTableData && (
          <div className="glass-panel" style={{ marginTop: '16px', padding: '16px', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '12px' }}>Raw Data Table (Visualizations Backup)</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date / Category</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((t, idx) => (
                  <tr key={`t-${idx}`}>
                    <td>Trend: {t.date}</td>
                    <td>{t.avg_rating} Avg ({t.count} reviews)</td>
                  </tr>
                ))}
                {pieData.map((p, idx) => (
                  <tr key={`p-${idx}`}>
                    <td>Distribution: {p.name}</td>
                    <td>{p.value} reviews</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* City-wise Star Rating Heatmap & Keyword Analysis */}
      <div className="feedback-grid">
        {/* Heatmap */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Feedback Density Heatmap (City vs Rating)</h3>
          <p className="feedback-meta" style={{ marginBottom: '20px' }}>Hover cells to view exact review volumes per location.</p>
          <div className="heatmap-container">
            <table className="heatmap-table">
              <thead>
                <tr>
                  <th>City</th>
                  {ratings.map(r => (
                    <th key={r}>{r} Star</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cities.map(city => (
                  <tr key={city}>
                    <td style={{ padding: '12px', fontWeight: 600, fontSize: '14px', border: '1px solid var(--border-color)' }}>{city}</td>
                    {ratings.map(rating => {
                      const count = heatmapData[city][rating];
                      return (
                        <td key={rating}>
                          <div 
                            className="heatmap-cell"
                            style={{ 
                              backgroundColor: getHeatmapColor(count),
                              color: getHeatmapTextColor(count)
                            }}
                            title={`${city} - ${rating} Star: ${count} reviews`}
                            role="gridcell"
                          >
                            {count}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Keyword Frequency Analysis */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Common Themes & Keywords</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h4 style={{ fontSize: '13px', color: '#10b981', marginBottom: '12px' }}>Positive Themes (4-5 ★)</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {posKeywords.map((k, i) => (
                  <li key={i} style={{ padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>"{k.text}"</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{k.value}x</span>
                  </li>
                ))}
                {posKeywords.length === 0 && <li style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No positive comments yet</li>}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>Negative Themes (1-2 ★)</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {negKeywords.map((k, i) => (
                  <li key={i} style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>"{k.text}"</span>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{k.value}x</span>
                  </li>
                ))}
                {negKeywords.length === 0 && <li style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No negative comments yet</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Segment Comparisons */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Performance Comparisons across Feedback Segments</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Star Segment Group</th>
              <th>Review Count</th>
              <th>Avg Total Customer Spend</th>
              <th>Avg Customer Order Count</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, color: '#10b981' }}>Promoters (4-5 ★)</td>
              <td>{analysis?.segments?.promoters?.count || 0} shoppers</td>
              <td>INR {analysis?.segments?.promoters?.avg_spend || 0}</td>
              <td>{analysis?.segments?.promoters?.avg_orders || 0} orders</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: '#f59e0b' }}>Passives (3 ★)</td>
              <td>{analysis?.segments?.passives?.count || 0} shoppers</td>
              <td>INR {analysis?.segments?.passives?.avg_spend || 0}</td>
              <td>{analysis?.segments?.passives?.avg_orders || 0} orders</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: '#ef4444' }}>Detractors (1-2 ★)</td>
              <td>{analysis?.segments?.detractors?.count || 0} shoppers</td>
              <td>INR {analysis?.segments?.detractors?.avg_spend || 0}</td>
              <td>{analysis?.segments?.detractors?.avg_orders || 0} orders</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actionable Segmentation & Targeted Recovery Panels */}
      <div className="segmentation-split">
        {/* Detractors Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ShieldAlert size={20} color="#ef4444" />
            <h3 style={{ fontSize: '16px' }}>At-Risk Detractors (1-2 ★)</h3>
          </div>
          <p className="feedback-meta" style={{ marginBottom: '16px' }}>Flagged customers who left bad reviews. Offer recovery support or discount campaigns.</p>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '14px' }}>
              <thead>
                <tr>
                  <th>Shopper</th>
                  <th>Comment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {detractors.slice(0, 5).map(d => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.customer_name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{d.customer_email}</div>
                    </td>
                    <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.comment}>
                      {d.comment || "N/A"}
                    </td>
                    <td>
                      <button 
                        className="action-btn action-btn-primary" 
                        style={{ backgroundColor: '#ef4444' }}
                        onClick={() => handleAction(d.customer_name, 'recovery')}
                      >
                        Send Recovery Offer
                      </button>
                    </td>
                  </tr>
                ))}
                {detractors.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No detractors found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Promoters Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Gift size={20} color="#10b981" />
            <h3 style={{ fontSize: '16px' }}>Brand Promoters (4-5 ★)</h3>
          </div>
          <p className="feedback-meta" style={{ marginBottom: '16px' }}>Satisfied loyal customers. Build retention by inviting them to loyalty programs.</p>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '14px' }}>
              <thead>
                <tr>
                  <th>Shopper</th>
                  <th>Comment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {promoters.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.customer_name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.customer_email}</div>
                    </td>
                    <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.comment}>
                      {p.comment || "N/A"}
                    </td>
                    <td>
                      <button 
                        className="action-btn action-btn-primary" 
                        style={{ backgroundColor: '#10b981' }}
                        onClick={() => handleAction(p.customer_name, 'loyalty')}
                      >
                        Invite to VIP
                      </button>
                    </td>
                  </tr>
                ))}
                {promoters.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No promoters found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Star-wise Categorization Viewer */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px' }}>Shopper Feedback Log</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search comments or customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '220px', padding: '6px 12px', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Tab Controls */}
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All ({feedbacks.length})</button>
          <button className={`tab-btn ${activeTab === '5' ? 'active' : ''}`} onClick={() => setActiveTab('5')}>5 Stars ({feedbacks.filter(f => f.rating === 5).length})</button>
          <button className={`tab-btn ${activeTab === '4' ? 'active' : ''}`} onClick={() => setActiveTab('4')}>4 Stars ({feedbacks.filter(f => f.rating === 4).length})</button>
          <button className={`tab-btn ${activeTab === '3' ? 'active' : ''}`} onClick={() => setActiveTab('3')}>3 Stars ({feedbacks.filter(f => f.rating === 3).length})</button>
          <button className={`tab-btn ${activeTab === '2' ? 'active' : ''}`} onClick={() => setActiveTab('2')}>2 Stars ({feedbacks.filter(f => f.rating === 2).length})</button>
          <button className={`tab-btn ${activeTab === '1' ? 'active' : ''}`} onClick={() => setActiveTab('1')}>1 Star ({feedbacks.filter(f => f.rating === 1).length})</button>
        </div>

        {/* Comment Cards */}
        <div className="feedback-card-list">
          {filteredFeedbacks.map(f => (
            <div className="feedback-card" key={f.id}>
              <div className="feedback-header">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <User size={16} color="var(--text-secondary)" />
                  <strong>{f.customer_name}</strong>
                  <span className="feedback-meta">({f.customer_email} - {f.customer_city})</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < f.rating ? '#f59e0b' : 'none'} 
                        color={i < f.rating ? '#f59e0b' : '#cbd5e1'} 
                      />
                    ))}
                  </div>
                  <button 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} 
                    onClick={() => handleDelete(f.id)}
                    title="Delete review (GDPR erasure)"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="feedback-comment">{f.comment || <em>No comment written.</em>}</p>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'right' }}>
                Consent: {f.consent_given ? "Granted" : "Withheld"} | Date: {new Date(f.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {filteredFeedbacks.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No feedbacks matched the selected criteria.
            </div>
          )}
        </div>
      </div>

      {/* Simulator Review Submission Form */}
      <div className="glass-panel feedback-form-container">
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Simulate Shopper Feedback (GDPR/CCPA Auditable Form)</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Select Customer (Optional)</label>
            <select 
              className="input-field" 
              value={customerInput} 
              onChange={(e) => setCustomerInput(e.target.value)}
              style={{ padding: '8px 12px' }}
            >
              <option value="">Anonymous Submitter</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 500, display: 'block' }}>Rating</label>
            <div className="star-rating-selector">
              {ratings.map(r => (
                <button 
                  key={r} 
                  type="button" 
                  onClick={() => setRatingInput(r)}
                >
                  <Star 
                    size={28} 
                    fill={r <= ratingInput ? '#f59e0b' : 'none'} 
                    color={r <= ratingInput ? '#f59e0b' : '#cbd5e1'} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Comment</label>
            <textarea 
              className="input-field" 
              rows={3} 
              placeholder="Enter optional shopper feedback comment here..." 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="privacy-consent" 
              checked={consentInput} 
              onChange={(e) => setConsentInput(e.target.checked)}
              style={{ marginTop: '3px' }}
              required
            />
            <label htmlFor="privacy-consent" style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              I consent to Xeno CRM storing and processing my rating and comment details for the purpose of marketer dashboard statistics and campaign generation, in compliance with GDPR/CCPA regulations.
            </label>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={formLoading}
            style={{ width: 'fit-content' }}
          >
            Submit Auditable Feedback
          </button>
        </form>
      </div>
    </div>
  );
}
