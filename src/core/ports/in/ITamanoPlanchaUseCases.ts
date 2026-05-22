import { CreateTamanoPlanchaDTO, TamanoPlancha } from '../../domain/entities/TamanoPlancha.js'

export interface ITamanoPlanchaUseCases {
  createTamanoPlancha(dto: CreateTamanoPlanchaDTO): Promise<TamanoPlancha>
  getTiposPlancha(): Promise<TamanoPlancha[]>
  getTamanoPlanchaById(id: string): Promise<TamanoPlancha | null>
  updateTamanoPlancha(item: TamanoPlancha): Promise<void>
  deleteTamanoPlancha(id: string): Promise<void>
}
