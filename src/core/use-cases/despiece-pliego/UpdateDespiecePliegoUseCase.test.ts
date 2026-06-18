import { describe, expect, it, beforeEach } from 'vitest'
import { DespiecePliego } from '../../domain/entities/DespiecePliego.js'
import { TipoPapel } from '../../domain/entities/TipoPapel.js'
import { CortePapel } from '../../domain/entities/CortePapel.js'
import { InMemoryDespiecePliegoRepository } from '../../../infrastructure/repositories/InMemoryDespiecePliegoRepository.js'
import { InMemoryTipoPapelRepository } from '../../../infrastructure/repositories/InMemoryTipoPapelRepository.js'
import { InMemoryCortePapelRepository } from '../../../infrastructure/repositories/InMemoryCortePapelRepository.js'
import { UpdateDespiecePliegoUseCase } from './UpdateDespiecePliegoUseCase.js'

describe('UpdateDespiecePliegoUseCase', () => {
  let despieceRepo: InMemoryDespiecePliegoRepository
  let tipoPapelRepo: InMemoryTipoPapelRepository
  let cortePapelRepo: InMemoryCortePapelRepository
  let useCase: UpdateDespiecePliegoUseCase

  beforeEach(() => {
    despieceRepo = new InMemoryDespiecePliegoRepository()
    tipoPapelRepo = new InMemoryTipoPapelRepository()
    cortePapelRepo = new InMemoryCortePapelRepository()
    useCase = new UpdateDespiecePliegoUseCase(despieceRepo, tipoPapelRepo, cortePapelRepo)
  })

  it('propaga cambios del despiece a tipos de papel y cortes asociados', async () => {
    const original = (await despieceRepo.findAll()).find(item => item.id === 'dp-1')
    expect(original).toBeTruthy()

    const updated = DespiecePliego.create({
      id: 'dp-1',
      name: 'Etiqueta XL',
      ancho: '12',
      alto: '6',
      unidadMedida: 'cm',
      piezasPorPliego: 18,
      active: true,
    })

    await useCase.execute(updated)

    const tipoPapel = (await tipoPapelRepo.findAll()).find(item => item.id === 'papel-1')
    const despieceEnTipo = tipoPapel?.despiecesPliego.find(d => d.despieceId === 'dp-1')
    expect(despieceEnTipo?.name).toBe('Etiqueta XL')
    expect(despieceEnTipo?.piezasPorPliego).toBe(18)
    expect(despieceEnTipo?.valorCorte).toBe(420)

    const cortePapel = (await cortePapelRepo.findAll()).find(item => item.id === 'cp-1')
    const despieceEnCorte = cortePapel?.despieces.find(d => d.despieceId === 'dp-1')
    expect(despieceEnCorte?.name).toBe('Etiqueta XL')
    expect(despieceEnCorte?.ancho).toBe('12')
  })
})
