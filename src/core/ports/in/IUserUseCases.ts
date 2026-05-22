import { CreateUserDTO, User } from '../../domain/entities/User.js'

export interface IUserUseCases {
  createUser(dto: CreateUserDTO): Promise<User>
  getUsers(): Promise<User[]>
  getUserById(id: string): Promise<User | null>
  updateUser(user: User): Promise<void>
  deleteUser(id: string): Promise<void>
}
