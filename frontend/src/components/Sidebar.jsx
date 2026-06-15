import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Megaphone, Zap, Star, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ isSidebarCollapsed, toggleSidebar, theme, toggleTheme }) {
  return (
    <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Zap size={26} color="#60a5fa" style={{ flexShrink: 0 }} />
          {!isSidebarCollapsed && <span>Xeno CRM</span>}
        </div>
        <button 
          id="sidebar-toggle-btn"
          onClick={toggleSidebar} 
          className="collapse-toggle-btn"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight size={18} style={{ flexShrink: 0 }} /> : <ChevronLeft size={18} style={{ flexShrink: 0 }} />}
        </button>
      </div>
      
      <nav className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title={isSidebarCollapsed ? "Dashboard" : ""} end>
          <LayoutDashboard size={20} style={{ flexShrink: 0 }} /> 
          {!isSidebarCollapsed && <span>Dashboard</span>}
        </NavLink>
        <NavLink to="/shoppers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title={isSidebarCollapsed ? "Shoppers" : ""}>
          <Users size={20} style={{ flexShrink: 0 }} /> 
          {!isSidebarCollapsed && <span>Shoppers</span>}
        </NavLink>
        <NavLink to="/campaigns" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title={isSidebarCollapsed ? "Campaigns" : ""}>
          <Megaphone size={20} style={{ flexShrink: 0 }} /> 
          {!isSidebarCollapsed && <span>Campaigns</span>}
        </NavLink>
        <NavLink to="/brand-insights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title={isSidebarCollapsed ? "Brand Insights" : ""}>
          <Zap size={20} style={{ flexShrink: 0 }} /> 
          {!isSidebarCollapsed && <span>Brand Insights</span>}
        </NavLink>
        <NavLink to="/feedback" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title={isSidebarCollapsed ? "Feedback Analysis" : ""}>
          <Star size={20} style={{ flexShrink: 0 }} /> 
          {!isSidebarCollapsed && <span>Feedback Analysis</span>}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button id="theme-toggle-btn" onClick={toggleTheme} className="theme-toggle-btn" title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}>
          {theme === 'light' ? <Moon size={18} style={{ flexShrink: 0 }} /> : <Sun size={18} style={{ flexShrink: 0 }} />}
        </button>
      </div>
    </aside>
  );
}
