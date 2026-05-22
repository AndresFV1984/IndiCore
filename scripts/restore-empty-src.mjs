/**
 * Restaura archivos fuente vacíos (0 bytes) necesarios para que Vite compile.
 * Ejecutar: node scripts/restore-empty-src.mjs
 */
import { writeFileSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const files = {
  'src/presentation/stores/uiStore.ts': `import { create } from 'zustand'
interface UIState { sidebarOpen: boolean; toggleSidebar: () => void; setSidebarOpen: (open: boolean) => void }
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
`,
  'src/presentation/features/common/ComingSoonPage.tsx': `import React from 'react'
import { Link } from 'react-router-dom'
import type { AppRouteDefinition } from '../../../config/appRoutes'
import { ROUTES } from '../../../config/appRoutes'
const ComingSoonPage: React.FC<{ route: AppRouteDefinition }> = ({ route }) => (
  <div className="remissions-container">
    <h1 className="remissions-title">{route.label}</h1>
    <p>{route.purpose}</p>
    <p>Este módulo estará disponible próximamente.</p>
    <Link to={ROUTES.dashboard.path} className="remissions-btn-new">Volver al dashboard</Link>
  </div>
)
export default ComingSoonPage
`,
  'src/core/domain/entities/User.ts': `export type DocumentType = 'CC' | 'NIT' | 'CE' | 'PA' | 'TI'
export class User {
  constructor(public readonly id: string, public readonly name: string, public readonly document_type: DocumentType,
    public readonly identification_number: string, public readonly address: string, public readonly mail: string,
    public readonly contact: string, public readonly password_hash: string, public readonly state: boolean = true) {}
  static create(dto: CreateUserDTO) {
    return new User(dto.id || crypto.randomUUID(), dto.name, dto.document_type, dto.identification_number,
      dto.address ?? '', dto.mail, dto.contact ?? '', dto.password_hash ?? '', dto.state ?? true)
  }
}
export interface CreateUserDTO { id?: string; name: string; document_type: DocumentType; identification_number: string; address?: string; mail: string; contact?: string; password_hash?: string; state?: boolean }
`,
  'src/core/domain/entities/Vendedor.ts': `import type { DocumentType } from './User'
export class Vendedor {
  constructor(public readonly id: string, public readonly name: string, public readonly document_type: DocumentType,
    public readonly identification_number: string, public readonly address: string, public readonly mail: string,
    public readonly contact: string, public readonly state: boolean = true) {}
  static create(dto: CreateVendedorDTO) {
    return new Vendedor(dto.id || crypto.randomUUID(), dto.name, dto.document_type, dto.identification_number,
      dto.address ?? '', dto.mail, dto.contact ?? '', dto.state ?? true)
  }
}
export interface CreateVendedorDTO { id?: string; name: string; document_type: DocumentType; identification_number: string; address?: string; mail: string; contact?: string; state?: boolean }
`,
  'src/core/domain/entities/PrecioMontaje.ts': `export class PrecioMontaje {
  constructor(public readonly id: string, public readonly name: string, public readonly cost: number, public readonly state: boolean = true) {}
  static create(dto: CreatePrecioMontajeDTO) { return new PrecioMontaje(dto.id || crypto.randomUUID(), dto.name, dto.cost ?? 0, dto.state ?? true) }
}
export interface CreatePrecioMontajeDTO { id?: string; name: string; cost?: number; state?: boolean }
`,
  'src/presentation/constants/documentTypes.ts': `import type { DocumentType } from '../../core/domain/entities/User'
export type { DocumentType }
export const DOCUMENT_TYPE_OPTIONS = [{ value: 'CC', label: 'CC' }, { value: 'NIT', label: 'NIT' }, { value: 'CE', label: 'CE' }, { value: 'PA', label: 'PA' }, { value: 'TI', label: 'TI' }] as const
export const DOCUMENT_LABELS: Record<DocumentType, string> = { CC: 'CC', NIT: 'NIT', CE: 'CE', PA: 'PA', TI: 'TI' }
`,
  'src/presentation/components/directory/DirectoryEmptyState.tsx': `import React from 'react'
const DirectoryEmptyState: React.FC<{ icon?: string; title: string; hint?: string }> = ({ icon, title, hint }) => (
  <div className="directory-empty-state">{icon && <span aria-hidden>{icon}</span>}<p>{title}</p>{hint && <p>{hint}</p>}</div>
)
export default DirectoryEmptyState
`,
  'src/presentation/components/directory/FormField.tsx': `import React from 'react'
const FormField: React.FC<{ id: string; label: string; required?: boolean; fullWidth?: boolean; children: React.ReactNode }> = ({ id, label, required, fullWidth, children }) => (
  <div className={fullWidth ? 'record-form-field record-form-field--full' : 'record-form-field'}>
    <label htmlFor={id}>{label}{required && ' *'}</label>{children}</div>
)
export default FormField
`,
  'src/presentation/utils/passwordHash.ts': `export async function hashPassword(plain: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('')
}
`,
  'src/presentation/utils/exportFields.ts': `export interface ExportField<T> { label: string; value: (row: T) => string }
export function slugifyFilename(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80) || 'registro' }
export function todayExportSuffix() { const d = new Date(); return \`\${d.getFullYear()}\${String(d.getMonth()+1).padStart(2,'0')}\${String(d.getDate()).padStart(2,'0')}\` }
`,
  'src/presentation/utils/exportPdf.ts': `import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportField } from './exportFields'
export function downloadRecordPdf<T>(o: { filename: string; title: string; subtitle?: string; fields: ExportField<T>[]; row: T }) {
  const doc = new jsPDF(); doc.setFontSize(16); doc.text(o.title, 14, 18)
  if (o.subtitle) doc.text(o.subtitle, 14, 26)
  autoTable(doc, { startY: 30, head: [['Campo','Valor']], body: o.fields.map(f => [f.label, f.value(o.row)]) })
  doc.save(o.filename.endsWith('.pdf') ? o.filename : o.filename + '.pdf')
}
`,
  'src/core/ports/out/IUserRepository.ts': `import { User } from '../../domain/entities/User.js'
export interface IUserRepository { findById(id: string): Promise<User | null>; findAll(): Promise<User[]>; save(user: User): Promise<void>; update(user: User): Promise<void>; delete(id: string): Promise<void> }
`,
  'src/core/ports/out/IVendedorRepository.ts': `import { Vendedor } from '../../domain/entities/Vendedor.js'
export interface IVendedorRepository { findById(id: string): Promise<Vendedor | null>; findAll(): Promise<Vendedor[]>; save(v: Vendedor): Promise<void>; update(v: Vendedor): Promise<void>; delete(id: string): Promise<void> }
`,
  'src/core/ports/out/IPrecioMontajeRepository.ts': `import { PrecioMontaje } from '../../domain/entities/PrecioMontaje.js'
export interface IPrecioMontajeRepository { findById(id: string): Promise<PrecioMontaje | null>; findAll(): Promise<PrecioMontaje[]>; save(i: PrecioMontaje): Promise<void>; update(i: PrecioMontaje): Promise<void>; delete(id: string): Promise<void> }
`,
  'src/core/use-cases/users/CreateUserUseCase.ts': `import { User, CreateUserDTO } from '../../domain/entities/User.js'
import { IUserRepository } from '../../ports/out/IUserRepository.js'
export class CreateUserUseCase { constructor(private r: IUserRepository) {} async execute(dto: CreateUserDTO) { const u = User.create(dto); await this.r.save(u); return u } }
`,
  'src/core/use-cases/vendedores/CreateVendedorUseCase.ts': `import { Vendedor, CreateVendedorDTO } from '../../domain/entities/Vendedor.js'
import { IVendedorRepository } from '../../ports/out/IVendedorRepository.js'
export class CreateVendedorUseCase { constructor(private r: IVendedorRepository) {} async execute(dto: CreateVendedorDTO) { const v = Vendedor.create(dto); await this.r.save(v); return v } }
`,
  'src/core/use-cases/tamano-plancha/CreateTamanoPlanchaUseCase.ts': `import { TamanoPlancha, CreateTamanoPlanchaDTO } from '../../domain/entities/TamanoPlancha.js'
import { ITamanoPlanchaRepository } from '../../ports/out/ITamanoPlanchaRepository.js'
export class CreateTamanoPlanchaUseCase { constructor(private r: ITamanoPlanchaRepository) {} async execute(dto: CreateTamanoPlanchaDTO) { const i = TamanoPlancha.create(dto); await this.r.save(i); return i } }
`,
  'src/core/use-cases/precio-montaje/CreatePrecioMontajeUseCase.ts': `import { PrecioMontaje, CreatePrecioMontajeDTO } from '../../domain/entities/PrecioMontaje.js'
import { IPrecioMontajeRepository } from '../../ports/out/IPrecioMontajeRepository.js'
export class CreatePrecioMontajeUseCase { constructor(private r: IPrecioMontajeRepository) {} async execute(dto: CreatePrecioMontajeDTO) { const i = PrecioMontaje.create(dto); await this.r.save(i); return i } }
`,
  'src/infrastructure/repositories/InMemoryPrecioMontajeRepository.ts': `import { PrecioMontaje } from '../../core/domain/entities/PrecioMontaje.js'
import { IPrecioMontajeRepository } from '../../core/ports/out/IPrecioMontajeRepository.js'
export class InMemoryPrecioMontajeRepository implements IPrecioMontajeRepository {
  private items = [new PrecioMontaje('pm-1','Montaje estándar',85000,true)]
  async findById(id: string) { return this.items.find(p => p.id === id) ?? null }
  async findAll() { return [...this.items] }
  async save(i: PrecioMontaje) { this.items.push(i) }
  async update(i: PrecioMontaje) { const x = this.items.findIndex(p => p.id === i.id); if (x >= 0) this.items[x] = i }
  async delete(id: string) { this.items = this.items.filter(p => p.id !== id) }
}
`,
  'src/presentation/stores/ordersStore.ts': `import { create } from 'zustand'
import { Order } from '../../core/domain/entities/Order.js'
export const useOrdersStore = create<{ orders: Order[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setOrders: (o: Order[]) => void; addOrder: (o: Order) => void; updateOrder: (o: Order) => void; setError: (e: string) => void }>(set => ({
  orders: [], loading: false, error: null, setLoading: l => set({ loading: l }), setOrders: o => set({ orders: o, loading: false, error: null }),
  addOrder: o => set(s => ({ orders: [...s.orders, o] })), updateOrder: o => set(s => ({ orders: s.orders.map(x => x.id === o.id ? o : x) })), setError: e => set({ error: e, loading: false }),
}))
`,
  'src/presentation/stores/usersStore.ts': `import { create } from 'zustand'
import { User } from '../../core/domain/entities/User.js'
export const useUsersStore = create<{ users: User[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setUsers: (u: User[]) => void; addUser: (u: User) => void; updateUser: (u: User) => void; setError: (e: string) => void }>(set => ({
  users: [], loading: false, error: null, setLoading: l => set({ loading: l }), setUsers: u => set({ users: u, loading: false, error: null }),
  addUser: u => set(s => ({ users: [...s.users, u] })), updateUser: u => set(s => ({ users: s.users.map(x => x.id === u.id ? u : x) })), setError: e => set({ error: e, loading: false }),
}))
`,
  'src/presentation/stores/vendedoresStore.ts': `import { create } from 'zustand'
import { Vendedor } from '../../core/domain/entities/Vendedor.js'
export const useVendedoresStore = create<{ vendedores: Vendedor[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setVendedores: (v: Vendedor[]) => void; addVendedor: (v: Vendedor) => void; updateVendedor: (v: Vendedor) => void; setError: (e: string) => void }>(set => ({
  vendedores: [], loading: false, error: null, setLoading: l => set({ loading: l }), setVendedores: v => set({ vendedores: v, loading: false, error: null }),
  addVendedor: v => set(s => ({ vendedores: [...s.vendedores, v] })), updateVendedor: v => set(s => ({ vendedores: s.vendedores.map(x => x.id === v.id ? v : x) })), setError: e => set({ error: e, loading: false }),
}))
`,
  'src/presentation/stores/tamanoPlanchaStore.ts': `import { create } from 'zustand'
import { TamanoPlancha } from '../../core/domain/entities/TamanoPlancha.js'
export const useTamanoPlanchaStore = create<{ items: TamanoPlancha[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setItems: (i: TamanoPlancha[]) => void; addItem: (i: TamanoPlancha) => void; updateItem: (i: TamanoPlancha) => void; setError: (e: string) => void }>(set => ({
  items: [], loading: false, error: null, setLoading: l => set({ loading: l }), setItems: i => set({ items: i, loading: false, error: null }),
  addItem: i => set(s => ({ items: [...s.items, i] })), updateItem: i => set(s => ({ items: s.items.map(x => x.id === i.id ? i : x) })), setError: e => set({ error: e, loading: false }),
}))
`,
  'src/presentation/stores/precioMontajeStore.ts': `import { create } from 'zustand'
import { PrecioMontaje } from '../../core/domain/entities/PrecioMontaje.js'
export const usePrecioMontajeStore = create<{ items: PrecioMontaje[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setItems: (i: PrecioMontaje[]) => void; addItem: (i: PrecioMontaje) => void; updateItem: (i: PrecioMontaje) => void; setError: (e: string) => void }>(set => ({
  items: [], loading: false, error: null, setLoading: l => set({ loading: l }), setItems: i => set({ items: i, loading: false, error: null }),
  addItem: i => set(s => ({ items: [...s.items, i] })), updateItem: i => set(s => ({ items: s.items.map(x => x.id === i.id ? i : x) })), setError: e => set({ error: e, loading: false }),
}))
`,
  'src/presentation/hooks/useUsers.ts': `import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { CreateUserDTO, User } from '../../core/domain/entities/User.js'
import { useUsersStore } from '../stores/usersStore.js'
const c = Container.getInstance()
export const useUsersHook = () => {
  const { users, loading, error, setLoading, setUsers, addUser, updateUser: patch, setError } = useUsersStore()
  useEffect(() => { if (!users.length && !loading) { setLoading(true); c.getUserUseCases().getUsers().then(setUsers).catch(e => setError(e.message)) } }, [])
  return { users, loading, error, createUser: async (dto: CreateUserDTO) => { const u = await c.getUserUseCases().createUser(dto); addUser(u); return u },
    updateUser: async (dto: CreateUserDTO) => { if (!dto.id) throw new Error('id'); const u = User.create(dto); await c.getUserUseCases().updateUser(u); patch(u); return u } }
}
`,
  'src/presentation/hooks/useTamanoPlancha.ts': `import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { CreateTamanoPlanchaDTO, TamanoPlancha } from '../../core/domain/entities/TamanoPlancha.js'
import { useTamanoPlanchaStore } from '../stores/tamanoPlanchaStore.js'
const c = Container.getInstance()
export const useTamanoPlanchaHook = () => {
  const { items, loading, error, setLoading, setItems, addItem, updateItem: patch, setError } = useTamanoPlanchaStore()
  useEffect(() => { if (!items.length && !loading) { setLoading(true); c.getTamanoPlanchaUseCases().getTiposPlancha().then(setItems).catch(e => setError(e.message)) } }, [])
  return { items, loading, error, createTamanoPlancha: async (dto: CreateTamanoPlanchaDTO) => { const i = await c.getTamanoPlanchaUseCases().createTamanoPlancha(dto); addItem(i); return i },
    updateTamanoPlancha: async (dto: CreateTamanoPlanchaDTO) => { if (!dto.id) throw new Error('id'); const i = TamanoPlancha.create(dto); await c.getTamanoPlanchaUseCases().updateTamanoPlancha(i); patch(i); return i } }
}
`,
  'src/presentation/hooks/usePrecioMontaje.ts': `import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { CreatePrecioMontajeDTO, PrecioMontaje } from '../../core/domain/entities/PrecioMontaje.js'
import { usePrecioMontajeStore } from '../stores/precioMontajeStore.js'
const c = Container.getInstance()
export const usePrecioMontajeHook = () => {
  const { items, loading, error, setLoading, setItems, addItem, updateItem: patch, setError } = usePrecioMontajeStore()
  useEffect(() => { if (!items.length && !loading) { setLoading(true); c.getPrecioMontajeUseCases().getPreciosMontaje().then(setItems).catch(e => setError(e.message)) } }, [])
  return { items, loading, error, createPrecioMontaje: async (dto: CreatePrecioMontajeDTO) => { const i = await c.getPrecioMontajeUseCases().createPrecioMontaje(dto); addItem(i); return i },
    updatePrecioMontaje: async (dto: CreatePrecioMontajeDTO) => { if (!dto.id) throw new Error('id'); const i = PrecioMontaje.create(dto); await c.getPrecioMontajeUseCases().updatePrecioMontaje(i); patch(i); return i } }
}
`,
  'src/presentation/features/production/productionPreprensaSubTabs.ts': `export const PREPRENSA_SUB_TABS = [{ id: 'diseno', label: 'Diseño' }, { id: 'detalle', label: 'Detalle' }] as const
export type PreprensaSubTabId = (typeof PREPRENSA_SUB_TABS)[number]['id']
`,
  'src/presentation/features/production/ProductionPreprensaSubNav.tsx': `import React from 'react'
import { PREPRENSA_SUB_TABS, PreprensaSubTabId } from './productionPreprensaSubTabs'
import ProductionSubNav from './ProductionSubNav'
const ProductionPreprensaSubNav: React.FC<{ active: PreprensaSubTabId; onChange: (id: PreprensaSubTabId) => void }> = ({ active, onChange }) => (
  <ProductionSubNav tabs={PREPRENSA_SUB_TABS} active={active} onChange={onChange} ariaLabel="Preprensa" idPrefix="production-preprensa" />
)
export default ProductionPreprensaSubNav
`,
  'src/presentation/features/production/DisenoTipoPlanchaPicker.tsx': `import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
export function buildTipoPlanchaSnapshot(plancha: TamanoPlancha) {
  return { planchaId: plancha.id, planchaNombreMedida: plancha.name + ' — ' + plancha.medida, planchaValor: plancha.valor }
}
export default function DisenoTipoPlanchaPicker() { return null }
`,
}

let restored = 0
for (const [rel, content] of Object.entries(files)) {
  const full = join(root, rel)
  try {
    const st = statSync(full)
    if (st.size === 0) {
      writeFileSync(full, content, 'utf8')
      restored++
      console.log('restored:', rel)
    }
  } catch {
    writeFileSync(full, content, 'utf8')
    restored++
    console.log('created:', rel)
  }
}

const routesPath = join(root, 'src/config/appRoutes.ts')
let routes = readFileSync(routesPath, 'utf8')
if (!routes.includes('APP_ROUTES')) {
  routes = routes.replace(
    'export const ROUTE_REGISTRY',
    `export const APP_ROUTES = {
  production: ROUTES.production.path,
  catalogTerminados: ROUTES.catalogTerminados.path,
  catalogOperaciones: ROUTES.catalogOperaciones.path,
  catalogTipoPapel: ROUTES.catalogTipoPapel.path,
  catalogTamanoPapel: ROUTES.catalogTamanoPapel.path,
  catalogDespiece: ROUTES.catalogDespiecePliego.path,
  catalogCorte: ROUTES.catalogCortePapel.path,
  catalogTamanoPlancha: ROUTES.catalogTamanoPlancha.path,
} as const

export const ROUTE_REGISTRY`,
  )
  writeFileSync(routesPath, routes, 'utf8')
  console.log('updated: appRoutes.ts APP_ROUTES')
}

console.log('Done. Restored', restored, 'files.')
