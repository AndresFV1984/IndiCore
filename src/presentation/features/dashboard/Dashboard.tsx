import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/di/container'
import { ROUTES } from '@/config/appRoutes'
import { useOrdersHook } from '@/presentation/hooks/useOrders'
import DashboardStatPanel from './DashboardStatPanel'
import {
  computePedidosStats,
  computeProductionStats,
  computeRemissionsStats,
} from './dashboardStats'
import './Dashboard.css'

const container = Container.getInstance()

const Dashboard: React.FC = () => {
  const { orders, loading: ordersLoading } = useOrdersHook()

  const { data: remissions = [], isLoading: remissionsLoading } = useQuery({
    queryKey: ['remissions'],
    queryFn: () => container.getRemissionUseCases().getRemissions(),
    staleTime: 5 * 60 * 1000,
  })

  const productionStats = useMemo(() => computeProductionStats(orders), [orders])
  const pedidosStats = useMemo(() => computePedidosStats(orders), [orders])
  const remissionsStats = useMemo(() => computeRemissionsStats(remissions), [remissions])

  const loading = ordersLoading || remissionsLoading

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Dashboard operativo</h1>
        <p className="dashboard-page__subtitle">
          Valor en el estado principal de cada módulo y cómo se reparte el dinero por estado.
        </p>
      </header>

      {loading ? (
        <div className="dashboard-page__skeleton" aria-busy="true" aria-label="Cargando indicadores">
          <div className="dashboard-page__skeleton-card" />
          <div className="dashboard-page__skeleton-card" />
          <div className="dashboard-page__skeleton-card" />
        </div>
      ) : (
        <div className="dashboard-page__grid">
          <DashboardStatPanel
            title="Producción"
            to={ROUTES.production.path}
            accentClass="dash-panel--production"
            stats={productionStats}
          />
          <DashboardStatPanel
            title="Pedidos"
            to={ROUTES.orders.path}
            accentClass="dash-panel--orders"
            stats={pedidosStats}
          />
          <DashboardStatPanel
            title="Remisiones"
            to={ROUTES.remissions.path}
            accentClass="dash-panel--remissions"
            stats={remissionsStats}
          />
        </div>
      )}
    </div>
  )
}

export default Dashboard
