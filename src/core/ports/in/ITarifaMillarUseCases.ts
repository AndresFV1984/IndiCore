import { CreateTarifaMillarDTO, TarifaMillar } from '../../domain/entities/TarifaMillar.js'

export interface ITarifaMillarUseCases {
  createTarifaMillar(dto: CreateTarifaMillarDTO): Promise<TarifaMillar>
  getTarifasMillar(): Promise<TarifaMillar[]>
  getTarifaMillarById(id: string): Promise<TarifaMillar | null>
  updateTarifaMillar(item: TarifaMillar): Promise<void>
  deleteTarifaMillar(id: string): Promise<void>
}
