import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';

import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Shoppers from './pages/Shoppers';
import ShopperDetail from './pages/ShopperDetail';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import AICampaignCreator from './pages/AICampaignCreator';
import BrandInsights from './pages/BrandInsights';
import Feedback from './pages/Feedback';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shoppers" element={<Shoppers />} />
          <Route path="/shoppers/:id" element={<ShopperDetail />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/new" element={<AICampaignCreator />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/brand-insights" element={<BrandInsights />} />
          <Route path="/feedback" element={<Feedback />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
