import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AIChatWidget from '../components/AIChatWidget';

export default function MainLayout() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  return (
    <div className="app-container">
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: 'var(--warning)', color: 'black', textAlign: 'center', padding: '8px', fontSize: '12px', fontWeight: 600 }}>
        First initial database query execution may experience a 30–50 second delay on free-tier services while instances spin up.
      </div>
      
      <Sidebar 
        isSidebarCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />

      <main className="main-content">
        <Outlet />
      </main>

      <AIChatWidget />
    </div>
  );
}
