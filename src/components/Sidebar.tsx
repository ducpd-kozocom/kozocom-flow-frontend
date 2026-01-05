// ============================================================
// Sidebar.tsx
// Description: Navigation sidebar with glassmorphism effect
// ============================================================

import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────
// NAVIGATION ITEMS
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'candidates', path: '/candidates', label: 'Talent Scanner', icon: '👥' },
  { id: 'reviews', path: '/reviews', label: 'Code Reviews', icon: '💻' },
  { id: 'chat', path: '/chat', label: 'Smart Integrator', icon: '🧠' },
];

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface SidebarProps {
  activeItem: string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export const Sidebar = memo(function Sidebar({ activeItem }: SidebarProps) {
  const location = useLocation();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🌊</span>
          <div className="logo-text">
            <h1>KozoFlow</h1>
            <p>AI-Powered Platform</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/dashboard' && location.pathname === '/');
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">KF</div>
          <div className="user-details">
            <span className="user-name">Admin User</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
