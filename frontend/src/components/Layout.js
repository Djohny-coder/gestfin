import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/app', icon: 'bi-grid-1x2-fill', label: 'Tableau de bord', exact: true },
  { to: '/app/transactions', icon: 'bi-arrow-left-right', label: 'Transactions' },
  { to: '/app/dettes', icon: 'bi-credit-card-2-front', label: 'Dettes & Factures' },
  { to: '/app/rapports', icon: 'bi-bar-chart-line-fill', label: 'Rapports' },
  { to: '/app/parametres', icon: 'bi-gear-fill', label: 'Paramètres' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/connexion'); };

  const initiales = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
    : 'U';

  const visibleNav = NAV;

  return (
    <div className="app-layout">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">GF</div>
          <span className="sidebar-logo-text">GestFin</span>
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map(({ to, icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${icon}`} style={{ fontSize: 16 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" style={{ marginBottom: 8 }}>
            <div className="sidebar-user-avatar">{initiales}</div>
            <div className="sidebar-user-info">
              <div className="name">{user?.first_name || 'Utilisateur'}</div>
              <div className="company">{user?.nom_entreprise || 'Mon entreprise'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '8px 12px', border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              fontSize: 13, cursor: 'pointer', borderRadius: 6,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <i className="bi bi-box-arrow-right" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Mobile header */}
        <div style={{
          display: 'none',
          padding: '12px 16px',
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          alignItems: 'center',
          justifyContent: 'space-between',
        }} className="mobile-header">
          <button onClick={() => setSidebarOpen(true)} style={{ border: 'none', background: 'none', fontSize: 22 }}>
            <i className="bi bi-list" />
          </button>
          <span style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>GestFin</span>
          <div style={{ width: 24 }} />
        </div>

        <Outlet />
      </div>
    </div>
  );
}
