import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'

export function buildTipoPlanchaSnapshot(plancha: TamanoPlancha) {
  return {
    planchaId: plancha.id,
    planchaNombreMedida: `${plancha.name} — ${plancha.medida}`,
    planchaValor: plancha.valor,
  }
}
