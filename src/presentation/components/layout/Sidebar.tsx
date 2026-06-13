import React, { useEffect, useState } from 'react'
import { Link, useLocation, type LinkProps } from 'react-router-dom'
import { ROUTES } from '../../../config/appRoutes'
import { APP_LOGO_SRC, APP_NAME, APP_TAGLINE } from '@/config/brand'
import { useUIStore } from '../../stores/uiStore'
import { prefetchRoute } from '../../config/routePrefetch'

const NavLink: React.FC<LinkProps> = ({ to, onMouseEnter, onFocus, ...rest }) => {
  const path = typeof to === 'string' ? to : (to.pathname ?? '')
  const warmRoute = () => prefetchRoute(path)
  return (
    <Link
      to={to}
      onMouseEnter={e => {
        warmRoute()
        onMouseEnter?.(e)
      }}
      onFocus={e => {
        warmRoute()
        onFocus?.(e)
      }}
      {...rest}
    />
  )
}

const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const [logoError, setLogoError] = useState(false)
  // Estado para controlar el despliegue de categorías
  // Por defecto abrimos las secciones en desarrollo para verificar el estilo del menú.
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({ principal: true, documentos: true, gestion: true, catalogos: true, otros: true });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Close sidebar when pressing ESC (useful on mobile)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) toggleSidebar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen, toggleSidebar]);

  // Close sidebar automatically when navigating on small screens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth <= 900 && sidebarOpen) {
      // whenever location changes, close sidebar on small devices
      setSidebarOpen(false);
    }
    // run when location changes
  }, [location.pathname]);

  return (
    <>
      {/* Backdrop for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={toggleSidebar}
          role="button"
          aria-label="Cerrar menú"
        />
      )}
      {!sidebarOpen && (
        <button
          type="button"
          className="sidebar-mobile-toggle"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      )}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        <div className={`sidebar-logo-block ${sidebarOpen ? 'sidebar-logo-block--open' : ''}`}>
          <NavLink
            to={ROUTES.dashboard.path}
            className="sidebar-brand"
            title={APP_NAME}
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth <= 900) setSidebarOpen(false)
            }}
          >
            {!logoError ? (
              <img
                src={APP_LOGO_SRC}
                alt={APP_NAME}
                className="sidebar-brand-logo"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="sidebar-logo-fallback" aria-hidden>
                IC
              </span>
            )}
          </NavLink>
          {sidebarOpen && <p className="sidebar-subtitle">{APP_TAGLINE}</p>}
        </div>
      </div>
      <div className="sidebar-toolbar">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
          title={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
        >
          <svg className="sidebar-collapse-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
            {sidebarOpen ? (
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          {sidebarOpen && <span className="sidebar-collapse-label">Contraer menú</span>}
        </button>
      </div>
      <nav className="sidebar-nav">
        {/* Principal */}
        <div
          role="button"
          tabIndex={0}
          className="sidebar-section sidebar-section-trigger"
          onClick={() => toggleSection('principal')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSection('principal');
            }
          }}
        >
          Principal
        </div>
        {openSections['principal'] && (
          <>
            <NavLink to={ROUTES.dashboard.path} title={ROUTES.dashboard.purpose} className={`sidebar-link ${location.pathname === ROUTES.dashboard.path || location.pathname === ROUTES.home.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Dashboard</span>}
            </NavLink>
          </>
        )}
        {/* Documentos */}
        <div
          role="button"
          tabIndex={0}
          className="sidebar-section sidebar-section-trigger"
          onClick={() => toggleSection('documentos')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSection('documentos');
            }
          }}
        >
          Documentos
        </div>
        {openSections['documentos'] && (
          <>
            <NavLink to={ROUTES.production.path} title={ROUTES.production.purpose} className={`sidebar-link ${location.pathname.startsWith(ROUTES.production.path) ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M7 3h8l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M15 3v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M8 8h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8 11.5h2.5M8 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M13 12.5l3.5 2v4.5L13 21.5 9.5 19v-4.5L13 12.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M13 12.5v9M9.5 15.5l3.5 2 3.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <circle cx="18" cy="18" r="2.25" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M18 16.2v1M18 19.8v1M16.2 18h1M19.8 18h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Producción</span>}
            </NavLink>
            <NavLink to={ROUTES.orders.path} title={ROUTES.orders.purpose} className={`sidebar-link ${location.pathname === ROUTES.orders.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Pedidos</span>}
            </NavLink>
            <NavLink to={ROUTES.remissions.path} title={ROUTES.remissions.purpose} className={`sidebar-link ${location.pathname === ROUTES.remissions.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M15 3v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M7 10h8M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M7 17l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 8h4v4h-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M17 8l2-1.2L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M20 10h3M22 8.5l1.5 1.5-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Remisiones</span>}
            </NavLink>
          </>
        )}
        {/* Gestión */}
        <div
          role="button"
          tabIndex={0}
          className="sidebar-section sidebar-section-trigger"
          onClick={() => toggleSection('gestion')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSection('gestion');
            }
          }}
        >
          Gestión
        </div>
        {openSections['gestion'] && (
          <>
            <NavLink to={ROUTES.users.path} title={ROUTES.users.purpose} className={`sidebar-link ${location.pathname.startsWith(ROUTES.users.path) ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">{ROUTES.users.label}</span>}
            </NavLink>
            <NavLink to={ROUTES.clients.path} title={ROUTES.clients.purpose} className={`sidebar-link ${location.pathname === ROUTES.clients.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">{ROUTES.clients.label}</span>}
            </NavLink>
            <NavLink to={ROUTES.vendedor.path} title={ROUTES.vendedor.purpose} className={`sidebar-link ${location.pathname.startsWith(ROUTES.vendedor.path) ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">{ROUTES.vendedor.label}</span>}
            </NavLink>
          </>
        )}
        {/* Catálogos */}
        <div
          role="button"
          tabIndex={0}
          className="sidebar-section sidebar-section-trigger"
          onClick={() => toggleSection('catalogos')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSection('catalogos');
            }
          }}
        >
          Catálogos
        </div>
        {openSections['catalogos'] && (
          <>
            <NavLink to={ROUTES.catalogTerminados.path} title={ROUTES.catalogTerminados.purpose} className={`sidebar-link ${location.pathname === ROUTES.catalogTerminados.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 3L3 8l9 5 9-5-9-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M3 13l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M3 18l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Terminados</span>}
            </NavLink>
            <NavLink to={ROUTES.catalogOperaciones.path} title={ROUTES.catalogOperaciones.purpose} className={`sidebar-link ${location.pathname === ROUTES.catalogOperaciones.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">{ROUTES.catalogOperaciones.label}</span>}
            </NavLink>
            <NavLink to={ROUTES.catalogTipoPapel.path} title={ROUTES.catalogTipoPapel.purpose} className={`sidebar-link ${location.pathname === ROUTES.catalogTipoPapel.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M15 4v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Tipo de papel</span>}
            </NavLink>
            <NavLink to={ROUTES.catalogDespiecePliego.path} title={ROUTES.catalogDespiecePliego.purpose} className={`sidebar-link ${location.pathname === ROUTES.catalogDespiecePliego.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Despiece pliego</span>}
            </NavLink>
            <NavLink to={ROUTES.catalogTamanoPlancha.path} title={ROUTES.catalogTamanoPlancha.purpose} className={`sidebar-link ${location.pathname === ROUTES.catalogTamanoPlancha.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="4" y="5" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 9h16M8 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Tipo Plancha</span>}
            </NavLink>
            <NavLink to={ROUTES.precioMontaje.path} title={ROUTES.precioMontaje.purpose} className={`sidebar-link ${location.pathname === ROUTES.precioMontaje.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Precio Montaje</span>}
            </NavLink>
            <NavLink to={ROUTES.tarifasMillar.path} title={ROUTES.tarifasMillar.purpose} className={`sidebar-link ${location.pathname === ROUTES.tarifasMillar.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M4 7h16M4 12h10M4 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M18 10l3 2-3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Tarifas por millar</span>}
            </NavLink>
          </>
        )}
        {/* Otros */}
        <div
          role="button"
          tabIndex={0}
          className="sidebar-section sidebar-section-trigger"
          onClick={() => toggleSection('otros')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleSection('otros');
            }
          }}
        >
          Otros
        </div>
        {openSections['otros'] && (
          <>
            <NavLink to={ROUTES.reports.path} title={ROUTES.reports.purpose} className={`sidebar-link ${location.pathname === ROUTES.reports.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M18 20V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 20V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Reportes</span>}
            </NavLink>
            <NavLink to={ROUTES.settings.path} title={ROUTES.settings.purpose} className={`sidebar-link ${location.pathname === ROUTES.settings.path ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              {sidebarOpen && <span className="sidebar-label">Configuración</span>}
            </NavLink>
          </>
        )}
      </nav>
    </aside>
    </>
  );
};

export default Sidebar;
