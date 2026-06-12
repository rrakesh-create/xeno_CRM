import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomer, aiDiagnose } from '../lib/api';
import DiagnosticPanel from '../components/DiagnosticPanel';
import { ArrowLeft, User, Mail, Phone, MapPin, CreditCard, ShoppingBag, Activity } from 'lucide-react';

export default function ShopperDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [loadingDiag, setLoadingDiag] = useState(false);

  useEffect(() => {
    fetchShopper();
  }, [id]);

  const fetchShopper = async () => {
    try {
      const res = await getCustomer(id);
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const runDiagnosis = async () => {
    setLoadingDiag(true);
    try {
      const res = await aiDiagnose(id);
      setDiagnostic(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDiag(false);
    }
  };

  const handleStartCampaign = (action) => {
    // Navigate to AI campaign creator with pre-filled state
    // In a real app we'd pass state via location, but here we can just pass a prompt
    navigate('/campaigns/new', { 
      state: { 
        prompt: `Target ${data.profile.name} via ${action.channel}. Angle: ${action.message_angle}` 
      } 
    });
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  if (!data) return <div style={{padding: '40px'}}>Loading...</div>;

  const { profile, orders } = data;

  return (
    <div className="shopper-detail">
      <div style={{ marginBottom: '24px' }}>
        <button className="btn-primary" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }} onClick={() => navigate('/shoppers')}>
          <ArrowLeft size={16} /> Back to Shoppers
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={40} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {profile.name}
              <span className={`badge ${profile.engagement_badge === 'Low' ? 'badge-success' : profile.engagement_badge === 'Medium' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {profile.engagement_badge} Risk
              </span>
            </h1>
            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)', fontSize: '14px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={16}/> {profile.email}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={16}/> {profile.phone}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16}/> {profile.city}</span>
            </div>
            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-primary)', fontSize: '14px', flexWrap: 'wrap', marginTop: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><CreditCard size={16} color="var(--success)"/> Lifetime: {formatCurrency(profile.total_spend)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><ShoppingBag size={16} color="var(--info)"/> Orders: {profile.order_count}</span>
            </div>
          </div>
        </div>
        
        <button className="btn-primary" onClick={runDiagnosis} disabled={loadingDiag}>
          {loadingDiag ? 'Analyzing...' : <><Activity size={18} /> Run AI Diagnosis</>}
        </button>
      </div>

      {diagnostic && (
        <div style={{ marginBottom: '32px' }}>
          <DiagnosticPanel diagnostic={diagnostic} onStartCampaign={handleStartCampaign} />
        </div>
      )}

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px' }}>Order History</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Rating</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const items = JSON.parse(o.items);
              return (
                <tr key={o.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(o.ordered_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {items.map((it, i) => <span key={i}>{it.qty}x {it.name}</span>)}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(o.amount)}</td>
                  <td>
                    {o.rating ? (
                      <div style={{ display: 'flex', color: 'var(--warning)', letterSpacing: '2px' }}>
                        {'★'.repeat(o.rating)}{'☆'.repeat(5-o.rating)}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px' }}>
                    {o.review_text || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
