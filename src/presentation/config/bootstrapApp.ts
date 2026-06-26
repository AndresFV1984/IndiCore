import { Container } from '../../di/container'
import { useClientsStore } from '../stores/clientsStore'
import { useOrdersStore } from '../stores/ordersStore'
import { useUsersStore } from '../stores/usersStore'
import { useVendedoresStore } from '../stores/vendedoresStore'
import { useAuthStore } from '../stores/authStore'
import { dedupedFetch } from '../utils/dedupedFetch'
import { scheduleIdle } from '../utils/scheduleIdle'
import { prefetchAllRoutes } from './routePrefetch'

const container = Container.getInstance()

function prefetchOrders(): void {
  if (useOrdersStore.getState().orders.length > 0) return
  void dedupedFetch('store:orders', () => container.getOrderUseCases().getOrders()).then(fetched => {
    if (useOrdersStore.getState().orders.length === 0) {
      useOrdersStore.getState().setOrders(fetched)
    }
  })
}

function prefetchClients(): void {
  if (useClientsStore.getState().clients.length > 0) return
  void dedupedFetch('store:clients', () => container.getClientUseCases().getClients()).then(fetched => {
    if (useClientsStore.getState().clients.length === 0) {
      useClientsStore.getState().setClients(fetched)
    }
  })
}

function prefetchAuthSession(): void {
  if (useAuthStore.getState().session) return
  void dedupedFetch('auth:session', () => container.getAuthUseCases().getSession()).then(fetched => {
    if (!useAuthStore.getState().session) {
      useAuthStore.getState().setSession(fetched)
    }
  })
}

function prefetchUsers(): void {
  if (useUsersStore.getState().users.length > 0) return
  void dedupedFetch('store:users', () => container.getUserUseCases().getUsers()).then(fetched => {
    if (useUsersStore.getState().users.length === 0) {
      useUsersStore.getState().setUsers(fetched)
    }
  })
}

function prefetchRemissions(): void {
  void dedupedFetch('query:remissions', () => container.getRemissionUseCases().getRemissions())
}

function prefetchVendedores(): void {
  if (useVendedoresStore.getState().vendedores.length > 0) return
  void dedupedFetch('store:vendedores', () => container.getVendedorUseCases().getVendedores()).then(
    fetched => {
      if (useVendedoresStore.getState().vendedores.length === 0) {
        useVendedoresStore.getState().setVendedores(fetched)
      }
    },
  )
}

/** Precarga chunks y datos frecuentes tras el primer render, sin bloquear la UI. */
export function bootstrapApp(): void {
  scheduleIdle(() => prefetchAllRoutes(), { timeout: 2000, delayMs: 50 })

  scheduleIdle(() => {
    prefetchOrders()
    prefetchClients()
    prefetchRemissions()
  }, { timeout: 1500, delayMs: 100 })

  scheduleIdle(() => {
    prefetchAuthSession()
    prefetchUsers()
    prefetchVendedores()
  }, { timeout: 3000, delayMs: 400 })
}
