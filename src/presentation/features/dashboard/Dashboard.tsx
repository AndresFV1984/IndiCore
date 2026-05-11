import React from 'react'
import KpiCard from '../../components/ui/KpiCard'

const Dashboard: React.FC = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <KpiCard
          label="Órdenes en producción"
          value="12"
          trend={5}
          trendDirection="up"
          icon="🏭"
          accentColor="var(--orange)"
        />
        <KpiCard
          label="Entregadas"
          value="45"
          trend={-2}
          trendDirection="down"
          icon="✅"
          accentColor="var(--teal)"
        />
        <KpiCard
          label="Valor activo (COP)"
          value="2.5M"
          trend={10}
          trendDirection="up"
          icon="💰"
          accentColor="var(--green)"
        />
        <KpiCard
          label="En revisión"
          value="3"
          trend={0}
          icon="🔍"
          accentColor="var(--amber)"
        />
      </div>
    </div>
  )
}

export default Dashboard
