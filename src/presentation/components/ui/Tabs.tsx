import React from 'react'
import clsx from 'clsx'

interface TabsProps {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}

const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={clsx('tab', { 'tab-active': active === tab.id })}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default Tabs
