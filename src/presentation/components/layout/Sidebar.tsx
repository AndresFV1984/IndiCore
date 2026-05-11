import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import logo from '../../../assets/logo-indicolors.png';

const Sidebar: React.FC = () => {
  const { state } = useUI();
  const location = useLocation();
  // Estado para controlar el despliegue de categorías
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className={`sidebar ${state.sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-block">
          <img src={logo} alt="IndiColors Logo" style={{ width: 48, height: 48, borderRadius: 12, background: 'white', objectFit: 'contain', boxShadow: '0 4px 12px rgba(255,106,61,0.15)', padding: 4, border: '1.5px solid #ffb899' }} />
          {state.sidebarOpen && (
            <div>
              <h1 className="sidebar-title">IndiColors</h1>
              <div className="sidebar-subtitle">Litografía · SAS</div>
            </div>
          )}
        </div>
      </div>
      <nav className="sidebar-nav">
        {/* Principal */}
        <div className="sidebar-section" onClick={() => toggleSection('principal')} style={{cursor:'pointer'}}>
          Principal
        </div>
        {openSections['principal'] && (
          <>
            <Link to="/dashboard" className={`sidebar-link ${location.pathname === '/dashboard' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">📊</span>
              {state.sidebarOpen && <span className="sidebar-label">Dashboard</span>}
            </Link>
          </>
        )}
        {/* Documentos */}
        <div className="sidebar-section" onClick={() => toggleSection('documentos')} style={{cursor:'pointer'}}>
          Documentos
        </div>
        {openSections['documentos'] && (
          <>
            <Link to="/production" className={`sidebar-link ${location.pathname === '/production' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">🏭</span>
              {state.sidebarOpen && <span className="sidebar-label">Producción</span>}
            </Link>
            <Link to="/orders" className={`sidebar-link ${location.pathname === '/orders' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">📦</span>
              {state.sidebarOpen && <span className="sidebar-label">Pedidos</span>}
            </Link>
            <Link to="/remissions" className={`sidebar-link ${location.pathname === '/remissions' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">🚚</span>
              {state.sidebarOpen && <span className="sidebar-label">Remisiones</span>}
            </Link>
          </>
        )}
        {/* Gestión */}
        <div className="sidebar-section" onClick={() => toggleSection('gestion')} style={{cursor:'pointer'}}>
          Gestión
        </div>
        {openSections['gestion'] && (
          <>
            <Link to="/clients" className={`sidebar-link ${location.pathname === '/clients' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">👥</span>
              {state.sidebarOpen && <span className="sidebar-label">Clientes</span>}
            </Link>
          </>
        )}
        {/* Catálogos */}
        <div className="sidebar-section" onClick={() => toggleSection('catalogos')} style={{cursor:'pointer'}}>
          Catálogos
        </div>
        {openSections['catalogos'] && (
          <>
            <Link to="/catalog/terminados" className={`sidebar-link ${location.pathname === '/catalog/terminados' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">✔️</span>
              {state.sidebarOpen && <span className="sidebar-label">Terminados</span>}
            </Link>
            <Link to="/catalog/operaciones" className={`sidebar-link ${location.pathname === '/catalog/operaciones' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">⚙️</span>
              {state.sidebarOpen && <span className="sidebar-label">Operaciones</span>}
            </Link>
            <Link to="/catalog/tipo-papel" className={`sidebar-link ${location.pathname === '/catalog/tipo-papel' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">📄</span>
              {state.sidebarOpen && <span className="sidebar-label">Tipo de papel</span>}
            </Link>
            <Link to="/catalog/tamano-papel" className={`sidebar-link ${location.pathname === '/catalog/tamano-papel' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">📏</span>
              {state.sidebarOpen && <span className="sidebar-label">Tamaño papel</span>}
            </Link>
            <Link to="/catalog/despiece-pliego" className={`sidebar-link ${location.pathname === '/catalog/despiece-pliego' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">🗂️</span>
              {state.sidebarOpen && <span className="sidebar-label">Despiece pliego</span>}
            </Link>
            <Link to="/catalog/corte-papel" className={`sidebar-link ${location.pathname === '/catalog/corte-papel' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">✂️</span>
              {state.sidebarOpen && <span className="sidebar-label">Corte de papel</span>}
            </Link>
          </>
        )}
        {/* Otros */}
        <div className="sidebar-section" onClick={() => toggleSection('otros')} style={{cursor:'pointer'}}>
          Otros
        </div>
        {openSections['otros'] && (
          <>
            <Link to="/reports" className={`sidebar-link ${location.pathname === '/reports' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">📑</span>
              {state.sidebarOpen && <span className="sidebar-label">Reportes</span>}
            </Link>
            <Link to="/settings" className={`sidebar-link ${location.pathname === '/settings' ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-icon">⚙️</span>
              {state.sidebarOpen && <span className="sidebar-label">Configuración</span>}
            </Link>
          </>
        )}
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          <img src={logo} alt="IndiColors Logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'contain', padding: '2px' }} />
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">Admin</div>
          <div className="sidebar-user-company">IndiColors</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
