import { Client } from '../../core/domain/entities/Client'
import { User } from '../../core/domain/entities/User'
import { Vendedor } from '../../core/domain/entities/Vendedor'
import { DOCUMENT_LABELS } from '../constants/documentTypes'
import { USER_ROLE_LABELS, getPermissionLabel } from '../constants/userRoles'
import { formatLocationLabel } from '../../core/utils/colombiaLocations'
import type { ExportField } from './exportFields'
import { slugifyFilename, todayExportSuffix } from './exportFields'
import { downloadCsv } from './exportCsv'

const estadoLabel = (active: boolean) => (active ? 'Activo' : 'Inactivo')

const clientFields: ExportField<Client>[] = [
  { label: 'ID', value: c => c.id },
  { label: 'Nombre', value: c => c.name },
  { label: 'NIT / C.C.', value: c => c.nit },
  { label: 'Teléfono', value: c => c.phone },
  { label: 'Correo', value: c => c.email, width: 28 },
  { label: 'Departamento', value: c => c.department },
  { label: 'Ciudad', value: c => c.city },
  { label: 'Ubicación', value: c => formatLocationLabel(c.department, c.city), width: 24 },
  { label: 'Dirección', value: c => c.address, width: 36 },
  { label: 'Contacto', value: c => c.contact },
  { label: 'Estado', value: c => estadoLabel(c.active) },
]

const userFields: ExportField<User>[] = [
  { label: 'ID', value: u => u.id },
  { label: 'Nombre', value: u => u.name },
  {
    label: 'Tipo documento',
    value: u => DOCUMENT_LABELS[u.document_type] ?? u.document_type,
  },
  { label: 'Número documento', value: u => u.identification_number },
  { label: 'Correo', value: u => u.mail, width: 28 },
  { label: 'Contacto', value: u => u.contact },
  { label: 'Departamento', value: u => u.department },
  { label: 'Ciudad', value: u => u.city },
  { label: 'Ubicación', value: u => formatLocationLabel(u.department, u.city), width: 24 },
  { label: 'Dirección', value: u => u.address, width: 36 },
  { label: 'Rol', value: u => USER_ROLE_LABELS[u.role] ?? u.role },
  {
    label: 'Permisos',
    value: u => u.permissions.map(getPermissionLabel).join(' · ') || '—',
    width: 40,
  },
  { label: 'Estado', value: u => estadoLabel(u.state) },
]

const vendedorFields: ExportField<Vendedor>[] = [
  { label: 'ID', value: v => v.id },
  { label: 'Nombre', value: v => v.name },
  {
    label: 'Tipo documento',
    value: v => DOCUMENT_LABELS[v.document_type] ?? v.document_type,
  },
  { label: 'Número documento', value: v => v.identification_number },
  { label: 'Correo', value: v => v.mail, width: 28 },
  { label: 'Contacto', value: v => v.contact },
  { label: 'Departamento', value: v => v.department },
  { label: 'Ciudad', value: v => v.city },
  { label: 'Ubicación', value: v => formatLocationLabel(v.department, v.city), width: 24 },
  { label: 'Dirección', value: v => v.address, width: 36 },
  { label: 'Estado', value: v => estadoLabel(v.state) },
]

export async function exportClients(rows: Client[], scope: 'listado' | string): Promise<void> {
  const suffix = scope === 'listado' ? `listado-${todayExportSuffix()}` : slugifyFilename(scope)
  if (scope !== 'listado' && rows.length === 1) {
    const client = rows[0]
    const { downloadRecordPdf } = await import('./exportPdf')
    await downloadRecordPdf({
      filename: `clientes-${suffix}`,
      title: 'Ficha de cliente',
      subtitle: client.name,
      fields: clientFields,
      row: client,
    })
    return
  }
  downloadCsv(`clientes-${suffix}`, clientFields, rows)
}

export async function exportUsers(rows: User[], scope: 'listado' | string): Promise<void> {
  const suffix = scope === 'listado' ? `listado-${todayExportSuffix()}` : slugifyFilename(scope)
  if (scope !== 'listado' && rows.length === 1) {
    const user = rows[0]
    const { downloadRecordPdf } = await import('./exportPdf')
    await downloadRecordPdf({
      filename: `usuarios-${suffix}`,
      title: 'Ficha de usuario',
      subtitle: user.name,
      fields: userFields,
      row: user,
    })
    return
  }
  downloadCsv(`usuarios-${suffix}`, userFields, rows)
}

export async function exportVendedores(rows: Vendedor[], scope: 'listado' | string): Promise<void> {
  const suffix = scope === 'listado' ? `listado-${todayExportSuffix()}` : slugifyFilename(scope)
  if (scope !== 'listado' && rows.length === 1) {
    const vendedor = rows[0]
    const { downloadRecordPdf } = await import('./exportPdf')
    await downloadRecordPdf({
      filename: `vendedores-${suffix}`,
      title: 'Ficha de vendedor',
      subtitle: vendedor.name,
      fields: vendedorFields,
      row: vendedor,
    })
    return
  }
  downloadCsv(`vendedores-${suffix}`, vendedorFields, rows)
}
