import React from 'react';
import { useUI } from '../../context/UIContext';

const Topbar: React.FC = () => {
  const { dispatch } = useUI();

  return (
    <header className="topbar">
      <button
        className="topbar-toggle"
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      <h2 className="topbar-title">IndiColors ERP</h2>
      <div className="topbar-actions">
        {/* Future: notifications, user menu */}
      </div>
    </header>
  );
};

export default Topbar;
