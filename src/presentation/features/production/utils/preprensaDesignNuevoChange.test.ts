import { describe, expect, it } from 'vitest'
import { emptyPreprensaDiseno } from '../../../../core/domain/entities/PreprensaDiseno'
import { patchPreprensaDesignNuevo } from './preprensaDesignNuevoChange'

describe('patchPreprensaDesignNuevo', () => {
  it('reinicia todos los campos al pasar a diseño nuevo', () => {
    const patch = patchPreprensaDesignNuevo('si')
    expect(patch).toEqual(emptyPreprensaDiseno())
    expect(patch.designNuevo).toBe('si')
    expect(patch.nombreDiseno).toBe('')
    expect(patch.coloresPlanchas).toEqual([])
    expect(patch.disenoExistenteId).toBe('')
  })

  it('reinicia todos los campos al pasar a diseño existente', () => {
    const patch = patchPreprensaDesignNuevo('no')
    expect(patch).toEqual({ ...emptyPreprensaDiseno(), designNuevo: 'no' })
    expect(patch.coloresPlanchas).toEqual([])
    expect(patch.nombreDiseno).toBe('')
  })
})
