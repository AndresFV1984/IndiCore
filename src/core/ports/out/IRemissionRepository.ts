import { Remission } from '../entities/Remission';

export interface IRemissionRepository {
  findById(id: string): Promise<Remission | null>;
  findAll(): Promise<Remission[]>;
  save(remission: Remission): Promise<void>;
  update(remission: Remission): Promise<void>;
  delete(id: string): Promise<void>;
}
