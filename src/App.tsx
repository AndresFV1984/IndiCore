import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { OrdersProvider } from './presentation/context/OrdersContext'
import { ClientsProvider } from './presentation/context/ClientsContext'
import { UIProvider } from './presentation/context/UIContext'
import Sidebar from './presentation/components/layout/Sidebar'
import Topbar from './presentation/components/layout/Topbar'
import Panel from './presentation/components/layout/Panel'

// Lazy load modules
const Dashboard = lazy(() => import('./presentation/features/dashboard/Dashboard'))
const Production = lazy(() => import('./presentation/features/production/Production'))
const Orders = lazy(() => import('./presentation/features/orders/Orders'))
const Clients = lazy(() => import('./presentation/features/clients/Clients'))
const Remissions = lazy(() => import('./presentation/features/remissions/Remissions'))
const Catalog = lazy(() => import('./presentation/features/catalog/Catalog'))

function App() {
  return (
    <UIProvider>
      <OrdersProvider>
        <ClientsProvider>
          <div className="app">
            <Sidebar />
            <Topbar />
            <Panel>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/production" element={<Production />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/remissions" element={<Remissions />} />
                  <Route path="/catalog" element={<Catalog />} />
                </Routes>
              </Suspense>
            </Panel>
          </div>
        </ClientsProvider>
      </OrdersProvider>
    </UIProvider>
  )
}

export default App
