import type { OrderSpecs } from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import type { YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'
import { isFaltanteLitografiaRow } from './cortePapelFaltante'
import { syncPaperRowsWithColoresPlanchas } from './paperRowsSync'

export function patchCorteClienteSuministraPapel(
  value: YesNoChoice,
  coloresPlanchas: DisenoColorPlanchaItem[] = [],
  currentRows: OrderSpecs['paperRows'] = []
): Partial<OrderSpecs> {
  const paperRows = syncPaperRowsWithColoresPlanchas(coloresPlanchas, currentRows).map(row => {
    if (isFaltanteLitografiaRow(row)) return row
    return value === 'si'
      ? {
          ...row,
          papelCortado: 'si',
          hojasEntregadasCliente: 0,
          tamanosBuenosManual: 0,
          sobranteManual: 0,
        }
      : row
  })

  return {
    clienteSuministraPapel: value,
    paperRows,
  }
}
