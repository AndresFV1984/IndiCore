import { Vendedor } from '../../domain/entities/Vendedor.js'
export interface IVendedorRepository { findById(id: string): Promise<Vendedor | null>; findAll(): Promise<Vendedor[]>; save(v: Vendedor): Promise<void>; update(v: Vendedor): Promise<void>; delete(id: string): Promise<void> }
