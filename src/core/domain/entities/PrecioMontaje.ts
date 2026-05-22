export class PrecioMontaje {
  constructor(public readonly id: string, public readonly name: string, public readonly cost: number, public readonly state: boolean = true) {}
  static create(dto: CreatePrecioMontajeDTO) { return new PrecioMontaje(dto.id || crypto.randomUUID(), dto.name, dto.cost ?? 0, dto.state ?? true) }
}
export interface CreatePrecioMontajeDTO { id?: string; name: string; cost?: number; state?: boolean }
