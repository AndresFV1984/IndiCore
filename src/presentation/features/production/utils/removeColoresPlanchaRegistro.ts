import type { PaperRow } from '../../../../core/domain/entities/Order'
import type { PreprensaDisenoSpecs } from '../../../../core/domain/entities/PreprensaDiseno'
import { buildColoresPlanchasPatch } from './coloresPlanchasUtils'
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
      ...buildColoresPlanchasPatch(coloresPlanchas, {
        clienteSuministraPlanchas: preprensaDiseno.clienteSuministraPlanchas,
      }),
    },
    paperRows: paperRowsSynced,
  }
}
