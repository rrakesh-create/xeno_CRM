import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Megaphone, Zap } from 'lucide-react';
import './App.css';

import Dashboard from './pages/Dashboard';
import Shoppers from './pages/Shoppers';
import ShopperDetail from './pages/ShopperDetail';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import AICampaignCreator from './pages/AICampaignCreator';
import BrandInsights from './pages/BrandInsights';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: 'var(--warning)', color: 'black', textAlign: 'center', padding: '8px', fontSize: '12px', fontWeight: 600 }}>
          First initial database query execution may experience a 30–50 second delay on free-tier services while instances spin up.
        </div>
        <aside className="sidebar" style={{ marginTop: '30px' }}>
          <div className="sidebar-logo">
            <Zap size={28} color="#60a5fa" />
            Xeno CRM
          </div>
          
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/shoppers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} /> Shoppers
            </NavLink>
            <NavLink to="/campaigns" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Megaphone size={20} /> Campaigns
            </NavLink>
            <NavLink to="/brand-insights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Zap size={20} /> Brand Insights
            </NavLink>
          </nav>
        </aside>

        <main className="main-content" style={{ marginTop: '30px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/shoppers" element={<Shoppers />} />
            <Route path="/shoppers/:id" element={<ShopperDetail />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/new" element={<AICampaignCreator />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/brand-insights" element={<BrandInsights />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
