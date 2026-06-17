import type { PaperRow } from '../../../../core/domain/entities/Order'
import type { PreprensaDisenoSpecs } from '../../../../core/domain/entities/PreprensaDiseno'
import { buildColoresPlanchasPatchWithSuministro } from './preprensaClienteSuministraPlanchasChange'
import { syncPaperRowsWithColoresPlanchas } from './paperRowsSync'

export const patchRemoveColoresPlanchaRegistro = (
  colorPlanchaId: string,
  preprensaDiseno: PreprensaDisenoSpecs,
  paperRows: PaperRow[]
): { preprensaDiseno: PreprensaDisenoSpecs; paperRows: PaperRow[] } => {
  const coloresPlanchas = preprensaDiseno.coloresPlanchas.filter(item => item.id !== colorPlanchaId)
  const paperRowsSynced = syncPaperRowsWithColoresPlanchas(
    coloresPlanchas,
    paperRows.filter(row => row.colorPlanchaId !== colorPlanchaId)
  )

  return {
    preprensaDiseno: {
      ...preprensaDiseno,
      ...buildColoresPlanchasPatchWithSuministro(coloresPlanchas),
    },
    paperRows: paperRowsSynced,
  }
}
