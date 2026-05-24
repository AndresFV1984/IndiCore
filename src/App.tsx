import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './presentation/components/layout/Sidebar'
import Panel from './presentation/components/layout/Panel'
import { useLayoutMedia } from './presentation/hooks/useLayoutMedia'
import { bootstrapApp } from './presentation/config/bootstrapApp'
import ActionToastHost from './presentation/components/ui/ActionToastHost'
import ConfirmDialogHost from './presentation/components/ui/ConfirmDialogHost'
import Dashboard from './presentation/features/dashboard/Dashboard'
const ComingSoonPage = lazy(() => import('./presentation/features/common/ComingSoonPage'))
import { ROUTES } from './config/appRoutes'

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

function App() {
  useLayoutMedia()

  useEffect(() => {
    bootstrapApp()
  }, [])

  return (
    <div className="app">
      <ActionToastHost />
      <ConfirmDialogHost />
      <Sidebar />
      <Panel>
        <Suspense
          fallback={
            <div className="app-suspense">
              <div className="app-suspense-spinner" aria-hidden />
              <span>Cargando…</span>
            </div>
          }
        >
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
            <Route path={ROUTES.reports.path} element={<ComingSoonPage route={ROUTES.reports} />} />
            <Route path={ROUTES.settings.path} element={<ComingSoonPage route={ROUTES.settings} />} />
          </Routes>
        </Suspense>
      </Panel>
    </div>
  )
}

export default App
