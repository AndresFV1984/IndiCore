import { describe, expect, it } from 'vitest'
import { emptyPreprensaDiseno } from '../../../../core/domain/entities/PreprensaDiseno'
import {
  patchPreprensaDesignNuevo,
  preprensaDisenoHasRegisteredContent,
} from './preprensaDesignNuevoChange'

describe('preprensaDisenoHasRegisteredContent', () => {
  it('devuelve false en el estado vacío', () => {
    expect(preprensaDisenoHasRegisteredContent(emptyPreprensaDiseno())).toBe(false)
  })

  it('detecta nombre de diseño ingresado', () => {
    expect(
      preprensaDisenoHasRegisteredContent({
        ...emptyPreprensaDiseno(),
        nombreDiseno: 'Etiqueta promocional',
      })
    ).toBe(true)
  })

  it('detecta trabajo existente seleccionado', () => {
    expect(
      preprensaDisenoHasRegisteredContent({
        ...emptyPreprensaDiseno(),
        designNuevo: 'no',
        disenoExistenteId: 'ord-1',
      })
    ).toBe(true)
  })
})

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
