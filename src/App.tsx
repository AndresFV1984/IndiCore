import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './presentation/components/layout/Sidebar'
import Panel from './presentation/components/layout/Panel'
import AppHomeRedirect from './presentation/components/auth/AppHomeRedirect'
import OperatorRouteGuard from './presentation/components/auth/OperatorRouteGuard'
import { useLayoutMedia } from './presentation/hooks/useLayoutMedia'
import { useAuth } from './presentation/hooks/useAuth'
import { bootstrapApp } from './presentation/config/bootstrapApp'
import ActionToastHost from './presentation/components/ui/ActionToastHost'
import ConfirmDialogHost from './presentation/components/ui/ConfirmDialogHost'
import Dashboard from './presentation/features/dashboard/Dashboard'
const ComingSoonPage = lazy(() => import('./presentation/features/common/ComingSoonPage'))
import { ROUTES } from './config/appRoutes'
import Login from './presentation/features/auth/Login'

// Lazy load modules (rutas con nombre funcional definido en `config/appRoutes.ts`)
const Production = lazy(() => import('./presentation/features/production/Production'))
const Orders = lazy(() => import('./presentation/features/orders/Orders'))
const Clients = lazy(() => import('./presentation/features/clients/Clients'))
const Users = lazy(() => import('./presentation/features/users/Users'))
const Vendedores = lazy(() => import('./presentation/features/vendedores/Vendedores'))
const Remissions = lazy(() => import('./presentation/features/remissions/Remissions'))
const Catalog = lazy(() => import('./presentation/features/catalog/Catalog'))
const Terminados = lazy(() => import('./presentation/features/catalog/CatalogTerminados'))
const Operaciones = lazy(() => import('./presentation/features/catalog/OperationsCatalog'))
const TamanoPlancha = lazy(() => import('./presentation/features/catalog/CatalogTamanoPlancha'))
const TipoPapel = lazy(() => import('./presentation/features/catalog/CatalogTipoPapel'))
const DespiecePliego = lazy(() => import('./presentation/features/catalog/CatalogDespiecePliego'))
const PrecioMontaje = lazy(() => import('./presentation/features/precio-montaje/PrecioMontaje'))
const TarifasMillar = lazy(() => import('./presentation/features/tarifas-millar/TarifasMillar'))
const TrazabilidadOperarios = lazy(
  () => import('./presentation/features/trazabilidad/TrazabilidadOperarios')
)
const ProductionOperatorOrderList = lazy(
  () => import('./presentation/features/operator/ProductionOperatorOrderList')
)
const ProductionOperatorOrderPanel = lazy(
  () => import('./presentation/features/operator/ProductionOperatorOrderPanel')
)

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="app-suspense">
          <div className="app-suspense-spinner" aria-hidden />
          <span>Cargando…</span>
        </div>
      }
    >
      <OperatorRouteGuard>
        <AppHomeRedirect />
        <Routes>
        <Route path={ROUTES.home.path} element={<Dashboard />} />
        <Route path={ROUTES.dashboard.path} element={<Dashboard />} />
        <Route path={`${ROUTES.production.path}/*`} element={<Production />} />
        <Route path={ROUTES.orders.path} element={<Orders />} />
        <Route path={ROUTES.clients.path} element={<Clients />} />
        <Route path={ROUTES.users.path} element={<Users />} />
        <Route path={ROUTES.vendedor.path} element={<Vendedores />} />
        <Route path={ROUTES.remissions.path} element={<Remissions />} />
        <Route path={ROUTES.catalogHub.path} element={<Catalog />} />
        <Route path={ROUTES.catalogTerminados.path} element={<Terminados />} />
        <Route path={ROUTES.catalogOperaciones.path} element={<Operaciones />} />
        <Route path={ROUTES.catalogTipoPapel.path} element={<TipoPapel />} />
        <Route
          path={ROUTES.catalogTamanoPapel.path}
          element={<ComingSoonPage route={ROUTES.catalogTamanoPapel} />}
        />
        <Route path={ROUTES.catalogDespiecePliego.path} element={<DespiecePliego />} />
        <Route path={ROUTES.catalogTamanoPlancha.path} element={<TamanoPlancha />} />
        <Route path={ROUTES.precioMontaje.path} element={<PrecioMontaje />} />
        <Route path={ROUTES.tarifasMillar.path} element={<TarifasMillar />} />
        <Route path={ROUTES.trazabilidad.path} element={<TrazabilidadOperarios />} />
        <Route
          path={`${ROUTES.operatorWork.path}/:orderId`}
          element={
            <Suspense
              fallback={
                <div className="operator-work__state">Cargando orden de producción…</div>
              }
            >
              <ProductionOperatorOrderPanel />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.operatorWork.path}
          element={
            <Suspense
              fallback={
                <div className="operator-work__state">Cargando tus órdenes…</div>
              }
            >
              <ProductionOperatorOrderList />
            </Suspense>
          }
        />
        <Route path={ROUTES.reports.path} element={<ComingSoonPage route={ROUTES.reports} />} />
        <Route path={ROUTES.settings.path} element={<ComingSoonPage route={ROUTES.settings} />} />
        </Routes>
      </OperatorRouteGuard>
    </Suspense>
  )
}

function App() {
  useLayoutMedia()
  const { session, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    bootstrapApp()
  }, [])

  if (location.pathname === ROUTES.login.path) {
    return <Login />
  }

  if (loading) {
    return (
      <div className="app-suspense app-suspense--fullscreen">
        <div className="app-suspense-spinner" aria-hidden />
        <span>Cargando sesión…</span>
      </div>
    )
  }

  if (!session) {
    return <Navigate to={ROUTES.login.path} replace state={{ from: location.pathname }} />
  }

  return (
    <div className="app">
      <ActionToastHost />
      <ConfirmDialogHost />
      <Sidebar />
      <Panel>
        <AppRoutes />
      </Panel>
    </div>
  )
}

export default App
