import { Remission, CreateRemissionDTO } from '../../domain/entities/Remission';
import { RemissionStatus } from '../../domain/entities/Remission';

export interface IRemissionUseCases {
  createRemission(dto: CreateRemissionDTO): Promise<Remission>;
  getRemissions(): Promise<Remission[]>;
  getRemissionById(id: string): Promise<Remission | null>;
  updateRemissionStatus(id: string, status: RemissionStatus): Promise<void>;
  deleteRemission(id: string): Promise<void>;
}
