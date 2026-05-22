import React from 'react'
const DirectoryEmptyState: React.FC<{ icon?: string; title: string; hint?: string }> = ({ icon, title, hint }) => (
  <div className="directory-empty-state">{icon && <span aria-hidden>{icon}</span>}<p>{title}</p>{hint && <p>{hint}</p>}</div>
)
export default DirectoryEmptyState
