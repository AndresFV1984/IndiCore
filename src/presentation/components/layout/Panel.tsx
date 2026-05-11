import React from 'react';

interface PanelProps {
  children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ children }) => {
  return (
    <main className="panel">
      {children}
    </main>
  );
};

export default Panel;
