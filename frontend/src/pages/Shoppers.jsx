import React, { useEffect, useState } from 'react';
import { getCustomers, getCities } from '../lib/api';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import ShopperDrawer from '../components/ShopperDrawer';

export default function Shoppers() {
  const [shoppers, setShoppers] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const limit = 20;

  // Drawer
  const [selectedShopperId, setSelectedShopperId] = useState(null);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchShoppers();
  }, [search, city, minSpend, maxSpend, page]);

  const fetchCities = async () => {
    try {
      const res = await getCities();
      setCities(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShoppers = async () => {
    try {
      const res = await getCustomers({
        search: search || undefined,
        city: city || undefined,
        min_spend: minSpend ? parseFloat(minSpend) : undefined,
        max_spend: maxSpend ? parseFloat(maxSpend) : undefined,
        skip: page * limit,
        limit
      });
      setShoppers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="shoppers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shoppers</h1>
          <p className="page-subtitle">Manage and engage your customer base</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search shoppers by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          
          <select className="input-field" style={{ width: '150px' }} value={city} onChange={e => setCity(e.target.value)}>
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <input type="number" className="input-field" style={{ width: '120px' }} placeholder="Min Spend" value={minSpend} onChange={e => setMinSpend(e.target.value)} />
          <input type="number" className="input-field" style={{ width: '120px' }} placeholder="Max Spend" value={maxSpend} onChange={e => setMaxSpend(e.target.value)} />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Total Spend</th>
              <th>Orders</th>
              <th>Last Order</th>
              <th>Engagement Risk</th>
            </tr>
          </thead>
          <tbody>
            {shoppers.map(s => (
              <tr key={s.id} onClick={() => setSelectedShopperId(s.id)} style={{ cursor: 'pointer' }}>
                <td>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.email}</div>
                </td>
                <td>{s.city}</td>
                <td>{formatCurrency(s.total_spend)}</td>
                <td>{s.order_count}</td>
                <td>{s.last_order ? new Date(s.last_order).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <span className={`badge ${s.engagement_badge === 'Low' ? 'badge-success' : s.engagement_badge === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                    {s.engagement_badge}
                  </span>
                </td>
              </tr>
            ))}
            {shoppers.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>No shoppers found matching criteria.</td></tr>
            )}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
            Page {page + 1} <span style={{color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '8px'}}>| Use arrows to load more</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" style={{ padding: '8px', background: 'transparent', border: '1px solid var(--border-color)' }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn-primary" style={{ padding: '8px', background: 'transparent', border: '1px solid var(--border-color)' }} disabled={shoppers.length < limit} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {selectedShopperId && (
        <ShopperDrawer shopperId={selectedShopperId} onClose={() => setSelectedShopperId(null)} />
      )}
    </div>
  );
}
