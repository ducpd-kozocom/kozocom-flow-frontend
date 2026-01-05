// ============================================================
// Layout.tsx
// Description: Main application layout with sidebar and content area
// ============================================================

import { memo, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageDescription?: string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export const Layout = memo(function Layout({
  children,
  pageTitle,
  pageDescription,
}: LayoutProps) {
  const location = useLocation();
  
  // Get active item from current path
  const activeItem = location.pathname.replace('/', '') || 'dashboard';

  return (
    <div className="app-layout">
      <Sidebar activeItem={activeItem} />

      <main className="main-content">
        <header className="page-header">
          <div className="header-content">
            <h1 className="page-title">{pageTitle}</h1>
            {pageDescription && (
              <p className="page-description">{pageDescription}</p>
            )}
          </div>
          <div className="header-actions">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
              />
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
});

export default Layout;
