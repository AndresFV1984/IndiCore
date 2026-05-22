import { User, CreateUserDTO } from '../../domain/entities/User.js'
import { IUserRepository } from '../../ports/out/IUserRepository.js'
export class CreateUserUseCase { constructor(private r: IUserRepository) {} async execute(dto: CreateUserDTO) { const u = User.create(dto); await this.r.save(u); return u } }
