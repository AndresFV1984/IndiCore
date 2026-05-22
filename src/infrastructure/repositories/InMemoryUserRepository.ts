import { User } from '../../core/domain/entities/User.js'
import { IUserRepository } from '../../core/ports/out/IUserRepository.js'
import { resolveLocationFields } from '../../core/utils/colombiaLocations.js'

/** SHA-256 de "Indi2026!" — contraseña demo para usuarios de ejemplo */
const DEMO_PASSWORD_HASH =
  'a8f2bc74251f6a4136c8810990b2d6a173689bcd3ebe31c55d3396b2f03b67a6'

export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = []

  constructor() {
    this.seedData()
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) ?? null
  }

  async findAll(): Promise<User[]> {
    return [...this.users]
  }

  async save(user: User): Promise<void> {
    this.users.push(user)
  }

  async update(user: User): Promise<void> {
    const index = this.users.findIndex(u => u.id === user.id)
    if (index !== -1) this.users[index] = user
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id)
  }

  private seedData(): void {
    const seeds = [
      {
        id: 'user-1',
        name: 'María Luz García',
        document_type: 'CC' as const,
        identification_number: '51.234.567',
        city: 'Bogotá D.C.',
        address: 'Calle 100 # 19-54',
        mail: 'maria.garcia@indicolors.com',
        contact: '601 555 0100',
      },
      {
        id: 'user-2',
        name: 'Juan Pablo Herrera',
        document_type: 'CC' as const,
        identification_number: '79.876.543',
        city: 'Medellín',
        address: 'Av. El Poblado # 5-23',
        mail: 'juan.herrera@indicolors.com',
        contact: '604 555 0200',
      },
      {
        id: 'user-3',
        name: 'Bayron Morales',
        document_type: 'CC' as const,
        identification_number: '1.045.892.301',
        city: 'Cali',
        address: 'Av. 6N # 28-45',
        mail: 'bayron.morales@indicolors.com',
        contact: '602 555 0300',
      },
      {
        id: 'user-4',
        name: 'Laura Sofía Vargas',
        document_type: 'CC' as const,
        identification_number: '43.567.890',
        city: 'Barranquilla',
        address: 'Cra. 50 # 72-18',
        mail: 'laura.vargas@indicolors.com',
        contact: '605 555 0400',
      },
      {
        id: 'user-5',
        name: 'Diego Andrés Castillo',
        document_type: 'CC' as const,
        identification_number: '98.765.432',
        city: 'Bucaramanga',
        address: 'Calle 37 # 19-08',
        mail: 'diego.castillo@indicolors.com',
        contact: '607 555 0500',
      },
    ]

    this.users = seeds.map(s => {
      const loc = resolveLocationFields(s.city)
      return new User(
        s.id,
        s.name,
        s.document_type,
        s.identification_number,
        loc.department,
        loc.city,
        loc.cityCode,
        s.address,
        s.mail,
        s.contact,
        DEMO_PASSWORD_HASH,
        true,
      )
    })
  }
}
