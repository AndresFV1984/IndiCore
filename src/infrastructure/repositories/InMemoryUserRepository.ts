import { User } from '../../core/domain/entities/User.js'
import { IUserRepository } from '../../core/ports/out/IUserRepository.js'
import { createUserSeeds } from '../seeds/gestionSeeds.js'

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
    this.users = createUserSeeds()
  }
}
