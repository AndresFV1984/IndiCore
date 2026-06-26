import {
  normalizeUserPermissions,
  normalizeUserRole,
  type UserPermission,
  type UserRole,
} from '../../core/domain/auth/userPermissions.js'
import { Client } from '../../core/domain/entities/Client.js'
import { User, type DocumentType } from '../../core/domain/entities/User.js'
import { Vendedor } from '../../core/domain/entities/Vendedor.js'
import { resolveLocationFields } from '../../core/utils/colombiaLocations.js'

/** SHA-256 de "Indiclors123*" — contraseña inicial de usuarios de acceso */
export const APP_USER_PASSWORD_HASH =
  'db620d1720fe74a57f746fb5291c9b9701e0b90f0c29277d05a8b3e4875a2a94'

export interface ClientSeed {
  id: string
  name: string
  nit: string
  phone: string
  city: string
  email: string
  department?: string
  cityCode?: string
  active?: boolean
  address?: string
  contact?: string
}

export interface PersonSeed {
  id: string
  name: string
  document_type: DocumentType
  identification_number: string
  city: string
  address: string
  mail: string
  contact: string
  department?: string
  cityCode?: string
  state?: boolean
  role?: UserRole
  permissions?: UserPermission[]
}

export const CLIENTS_SEED: ClientSeed[] = [
  {
    id: '1',
    name: 'Impresiones Bogotá S.A.',
    nit: '900123456-1',
    phone: '3001234567',
    city: 'Bogotá D.C.',
    email: 'contacto@impresionesbogota.com',
  },
  {
    id: '2',
    name: 'Litografía Medellín Ltda.',
    nit: '800234567-2',
    phone: '3012345678',
    city: 'Medellín',
    email: 'info@litografiamedellin.com',
  },
  {
    id: '3',
    name: 'Gráficas Cali E.U.',
    nit: '700345678-3',
    phone: '3023456789',
    city: 'Cali',
    email: 'ventas@graficascali.com',
  },
  {
    id: '4',
    name: 'Imprenta Barranquilla SAS',
    nit: '600456789-4',
    phone: '3034567890',
    city: 'Barranquilla',
    email: 'pedidos@imprentabarranquilla.com',
  },
  {
    id: '5',
    name: 'Cartón y Papel Cartagena',
    nit: '500567890-5',
    phone: '3045678901',
    city: 'Cartagena',
    email: 'comercial@cartonpapel.com',
  },
  {
    id: '6',
    name: 'Diseños Bucaramanga S.A.',
    nit: '400678901-6',
    phone: '3056789012',
    city: 'Bucaramanga',
    email: 'hola@disenosbucaramanga.com',
  },
  {
    id: '7',
    name: 'Etiquetas Pereira Ltda.',
    nit: '300789012-7',
    phone: '3067890123',
    city: 'Pereira',
    email: 'etiquetas@pereira.com',
  },
  {
    id: '8',
    name: 'Empaques Santa Marta E.U.',
    nit: '200890123-8',
    phone: '3078901234',
    city: 'Santa Marta',
    email: 'empaques@santamarta.com',
  },
  {
    id: '9',
    name: 'Publicidad Cúcuta SAS',
    nit: '100901234-9',
    phone: '3089012345',
    city: 'Cúcuta',
    email: 'publicidad@cucuta.com',
  },
  {
    id: '10',
    name: 'Rotulación Ibagué',
    nit: '901012345-0',
    phone: '3090123456',
    city: 'Ibagué',
    email: 'rotulacion@ibague.com',
  },
]

export const USERS_SEED: PersonSeed[] = [
  {
    id: 'user-bayron',
    name: 'Bayron',
    document_type: 'CC',
    identification_number: '1.045.892.301',
    city: 'Cali',
    address: 'Av. 6N # 28-45',
    mail: 'bayron@indicolors.com',
    contact: '602 555 0300',
    role: 'Administrador',
  },
  {
    id: 'user-andres',
    name: 'Andrés',
    document_type: 'CC',
    identification_number: '79.876.543',
    city: 'Medellín',
    address: 'Av. El Poblado # 5-23',
    mail: 'andres@indicolors.com',
    contact: '604 555 0200',
    role: 'Operador',
  },
]

export const VENDEDORES_SEED: PersonSeed[] = [
  {
    id: 'vend-1',
    name: 'Carolina Méndez',
    document_type: 'CC',
    identification_number: '52.384.901',
    city: 'Bogotá D.C.',
    address: 'Calle 72 # 10-34',
    mail: 'carolina.mendez@indicolors.com',
    contact: '310 555 1201',
  },
  {
    id: 'vend-2',
    name: 'Andrés Felipe Rojas',
    document_type: 'CC',
    identification_number: '80.156.432',
    city: 'Medellín',
    address: 'Carrera 43A # 1-50',
    mail: 'andres.rojas@indicolors.com',
    contact: '320 555 3402',
  },
  {
    id: 'vend-3',
    name: 'Felipe Giraldo Osorio',
    document_type: 'CC',
    identification_number: '1.098.234.567',
    city: 'Cali',
    address: 'Calle 5 # 14-22',
    mail: 'felipe.giraldo@indicolors.com',
    contact: '315 555 7803',
  },
  {
    id: 'vend-4',
    name: 'Valentina Restrepo',
    document_type: 'CC',
    identification_number: '41.902.118',
    city: 'Pereira',
    address: 'Calle 19 # 8-42',
    mail: 'valentina.restrepo@indicolors.com',
    contact: '318 555 4404',
  },
  {
    id: 'vend-5',
    name: 'Santiago Muñoz',
    document_type: 'CC',
    identification_number: '75.331.609',
    city: 'Cartagena',
    address: 'Bocagrande Cra. 3 # 8-120',
    mail: 'santiago.munoz@indicolors.com',
    contact: '300 555 5505',
  },
]

const resolvePersonLocation = (seed: PersonSeed) =>
  seed.department
    ? { department: seed.department, city: seed.city, cityCode: seed.cityCode ?? '' }
    : resolveLocationFields(seed.city)

export const createClientSeeds = (): Client[] =>
  CLIENTS_SEED.map(seed => {
    const loc = seed.department
      ? { department: seed.department, city: seed.city, cityCode: seed.cityCode ?? '' }
      : resolveLocationFields(seed.city)
    return new Client(
      seed.id,
      seed.name,
      seed.nit,
      seed.phone,
      loc.department,
      loc.city,
      loc.cityCode,
      seed.active ?? true,
      seed.address ?? '',
      seed.email,
      seed.contact ?? ''
    )
  })

export const createUserSeeds = (): User[] =>
  USERS_SEED.map(seed => {
    const loc = resolvePersonLocation(seed)
    return new User(
      seed.id,
      seed.name,
      seed.document_type,
      seed.identification_number,
      loc.department,
      loc.city,
      loc.cityCode,
      seed.address,
      seed.mail,
      seed.contact,
      APP_USER_PASSWORD_HASH,
      seed.state ?? true,
      normalizeUserRole(seed.role),
      normalizeUserPermissions(seed.permissions, seed.role)
    )
  })

export const createVendedorSeeds = (): Vendedor[] =>
  VENDEDORES_SEED.map(seed => {
    const loc = resolvePersonLocation(seed)
    return new Vendedor(
      seed.id,
      seed.name,
      seed.document_type,
      seed.identification_number,
      loc.department,
      loc.city,
      loc.cityCode,
      seed.address,
      seed.mail,
      seed.contact,
      seed.state ?? true
    )
  })
