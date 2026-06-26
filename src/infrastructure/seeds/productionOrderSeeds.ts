import type { UserPermission } from '../../core/domain/auth/userPermissions.js'
import { getPermissionsForRole } from '../../core/domain/auth/userPermissions.js'
import type {
  AcabadosProduccionRegistro,
  ImpresionTintasRegistro,
  OrderSpecs,
  PaperRow,
  TerminadosProduccionRegistro,
} from '../../core/domain/entities/Order.js'
import { Order } from '../../core/domain/entities/Order.js'
import {
  emptyPreprensaDiseno,
  type DisenoColorPlanchaItem,
  type PreprensaDisenoSpecs,
} from '../../core/domain/entities/PreprensaDiseno.js'
import { Money } from '../../core/domain/value-objects/Money.js'
import { OrderTotalCalculator } from '../../core/domain/value-objects/OrderTotalCalculator.js'
import { PURCHASE_ORDER_PREFIX } from '../../core/domain/value-objects/PurchaseOrderId.js'
import type { ProductionOrderStatus } from '../../core/domain/value-objects/ProductionOrderStatus.js'
import { syncPaperRowsWithColoresPlanchas } from '../../presentation/features/production/utils/paperRowsSync.js'
import { syncImpresionTintasRegistros } from '../../presentation/features/production/utils/impresionTintasUtils.js'
import { syncImpresionEstimarTintasRegistros } from '../../presentation/features/production/utils/estimarTintasRegistrosUtils.js'
import {
  buildFinishesFromTerminadosRegistros,
  syncTerminadosRegistros,
} from '../../presentation/features/production/utils/terminadosUtils.js'
import {
  buildOperationsFromAcabadosRegistros,
  syncAcabadosRegistros,
} from '../../presentation/features/production/utils/acabadosUtils.js'
import { createTipoPapelSeeds } from './tipoPapelSeeds.js'

const OPERATOR_PERMISSIONS = getPermissionsForRole('Operador')

interface ProductionOrderSeedConfig {
  suffix: string
  clientId: string
  workName: string
  vendedorId: string
  date: Date
  quantity: number
  productionStatus: ProductionOrderStatus
  commercialStatus: 'En curso' | 'Revisión' | 'Listo' | 'Entregado' | 'Cancelado'
  preprensaDiseno: PreprensaDisenoSpecs
  enrichPaperRow: (row: PaperRow, index: number) => PaperRow
  operators: {
    preprensa: string
    cortePapel: string
    impresion: string
    terminados: string
    acabados: string
    cobro: string
  }
}

const assignOperatorFields = (
  specs: OrderSpecs,
  userId: string,
  fieldPrefix:
    | 'operadorPreprensa'
    | 'operadorCortePapel'
    | 'operadorImpresion'
    | 'operadorTerminados'
    | 'operadorAcabados'
    | 'operadorCobro'
): void => {
  const idKey = `${fieldPrefix}Id` as keyof OrderSpecs
  const rolKey = `${fieldPrefix}Rol` as keyof OrderSpecs
  const permisosKey = `${fieldPrefix}Permisos` as keyof OrderSpecs
  ;(specs[idKey] as string) = userId
  ;(specs[rolKey] as string) = 'Operador'
  ;(specs[permisosKey] as UserPermission[]) = [...OPERATOR_PERMISSIONS]
}

const buildTintasRegistro = (colorPlanchaId: string, millares: number): ImpresionTintasRegistro => ({
  colorPlanchaId,
  entradas: [
    {
      id: `tintas-entrada-${colorPlanchaId}`,
      tiro: { cantidad: 4, tintas: [0, 1, 2, 3] },
      retiro: { cantidad: 4, tintas: [0, 1, 2, 3] },
      cantidadTintasColorBasico: 4,
      millaresColorBasico: millares,
      precioTintaColorBasico: millares * 34000,
      precioTinta: millares * 34000,
    },
  ],
  clienteSuministraPruebaSherpa: 'no',
  precioPruebaSherpa: 95000,
  clienteSuministraTintaPantone: 'no',
})

const buildTerminadosRegistro = (
  corteRowKey: string,
  colorPlanchaId: string,
  tamanosBuenos: number
): TerminadosProduccionRegistro => ({
  corteRowKey,
  colorPlanchaId,
  completo: true,
  entradas: [
    {
      id: `terminados-entrada-${corteRowKey}`,
      lineas: [
        {
          id: `terminados-linea-${corteRowKey}`,
          terminadoId: 't1',
          terminadoNombre: 'Brillo UV',
          valorCmCuadrado: 1200,
          costoMinimo: 18000,
          areaFactor: 1,
          tamanosBuenos,
          precioCalculado: 285000,
          precioCobro: 285000,
          origen: 'catalogo',
        },
      ],
    },
  ],
})

const buildAcabadosRegistro = (
  corteRowKey: string,
  colorPlanchaId: string,
  tamanosBuenos: number
): AcabadosProduccionRegistro => ({
  corteRowKey,
  colorPlanchaId,
  completo: true,
  entradas: [
    {
      id: `acabados-entrada-${corteRowKey}`,
      lineas: [
        {
          id: `acabados-linea-${corteRowKey}`,
          operacionId: 'o3',
          operacionNombre: 'Plegar',
          valorCmCuadrado: 4200,
          costoMinimo: 4200,
          areaFactor: 1,
          tamanosBuenos,
          precioCalculado: 168000,
          precioCobro: 168000,
          origen: 'catalogo',
        },
        {
          id: `acabados-linea-${corteRowKey}-2`,
          operacionId: 'o4',
          operacionNombre: 'Embolcar',
          valorCmCuadrado: 3800,
          costoMinimo: 3800,
          areaFactor: 1,
          tamanosBuenos,
          precioCalculado: 152000,
          precioCobro: 152000,
          origen: 'catalogo',
        },
      ],
    },
  ],
})

const buildOrderSpecs = (config: ProductionOrderSeedConfig): OrderSpecs => {
  const tiposPapel = createTipoPapelSeeds()
  const coloresPlanchas = config.preprensaDiseno.coloresPlanchas
  const paperRows = syncPaperRowsWithColoresPlanchas(coloresPlanchas, []).map((row, index) =>
    config.enrichPaperRow(row, index)
  )

  const millares = Math.max(1, Math.round(config.quantity / 1000))
  const tintasBase = syncImpresionTintasRegistros(coloresPlanchas, [])
  const impresionTintasRegistros = tintasBase.map(registro =>
    buildTintasRegistro(registro.colorPlanchaId, millares)
  )

  const terminadosBase = syncTerminadosRegistros(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    2,
    'no',
    []
  )
  const terminadosRegistros = terminadosBase.map(registro => {
    const key = registro.corteRowKey
    const colorPlanchaId = registro.colorPlanchaId ?? key
    return buildTerminadosRegistro(key, colorPlanchaId, config.quantity)
  })

  const acabadosBase = syncAcabadosRegistros(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    2,
    'no',
    []
  )
  const acabadosRegistros = acabadosBase.map(registro => {
    const key = registro.corteRowKey
    const colorPlanchaId = registro.colorPlanchaId ?? key
    return buildAcabadosRegistro(key, colorPlanchaId, config.quantity)
  })

  const specs: OrderSpecs = {
    paperRows,
    quantity: config.quantity,
    cantidadHojas: Math.ceil(config.quantity / 4) + 2,
    margenRedondeo: 2,
    valorCorte: 420000,
    clienteSuministraPapel: 'no',
    mounting: true,
    mountingValue: new Money(85000),
    design: config.preprensaDiseno.designNuevo === 'si',
    preprensaDiseno: config.preprensaDiseno,
    plates: coloresPlanchas.length,
    platesValue: new Money(coloresPlanchas.length * 185000),
    thousands: millares,
    inks: '4x4',
    impresionTintasRegistros,
    impresionEstimarTintasRegistros: syncImpresionEstimarTintasRegistros(coloresPlanchas, []),
    terminadosRegistros,
    acabadosRegistros,
    machineOutputValue: new Money(28000),
    chapoliado: true,
    finishes: buildFinishesFromTerminadosRegistros(terminadosRegistros),
    operations: buildOperationsFromAcabadosRegistros(acabadosRegistros),
  }

  assignOperatorFields(specs, config.operators.preprensa, 'operadorPreprensa')
  assignOperatorFields(specs, config.operators.cortePapel, 'operadorCortePapel')
  assignOperatorFields(specs, config.operators.impresion, 'operadorImpresion')
  assignOperatorFields(specs, config.operators.terminados, 'operadorTerminados')
  assignOperatorFields(specs, config.operators.acabados, 'operadorAcabados')
  assignOperatorFields(specs, config.operators.cobro, 'operadorCobro')

  return specs
}

const buildPlancha = (
  id: string,
  colores: DisenoColorPlanchaItem['colores'],
  detalle: string,
  planchaId = 'tp1'
): DisenoColorPlanchaItem => ({
  id,
  colores,
  planchaId,
  planchaNombreMedida: 'Plancha estándar — 70 × 100 cm',
  planchaValor: 185000,
  cantidad: 0,
  numeroPlanchas: 2,
  valorTotal: 370000,
  numeroCavidades: 2,
  detalle,
  observacion: '',
})

const enrichFlyerPaperRow = (row: PaperRow): PaperRow => ({
  ...row,
  tipoPapelId: 'papel-1',
  type: 'Couché brillante',
  size: '70 × 100 cm',
  cut: 'Corte flyer',
  cortePapelId: 'cp-3',
  corteAncho: '70',
  corteAlto: '100',
  corteUnidadMedida: 'cm',
  despiece: {
    despieceId: 'dp-3',
    name: 'Flyer',
    ancho: '21',
    alto: '14.8',
    unidadMedida: 'cm',
    piezasPorPliego: 4,
  },
  papelCortado: 'no',
  valorHoja: 1250,
  unidadEmpaque: 250,
  valorCorteUnitario: 420,
  tamanosBuenosManual: 5000,
  sobranteManual: 120,
})

const enrichTarjetaPaperRow = (row: PaperRow): PaperRow => ({
  ...row,
  tipoPapelId: 'papel-2',
  type: 'Bond offset',
  size: '64 × 90 cm',
  cut: 'Corte tarjeta',
  cortePapelId: 'cp-4',
  corteAncho: '64',
  corteAlto: '90',
  corteUnidadMedida: 'cm',
  despiece: {
    despieceId: 'dp-2',
    name: 'Tarjeta',
    ancho: '9',
    alto: '5',
    unidadMedida: 'cm',
    piezasPorPliego: 32,
  },
  papelCortado: 'no',
  valorHoja: 890,
  unidadEmpaque: 500,
  valorCorteUnitario: 380,
  tamanosBuenosManual: 8000,
  sobranteManual: 200,
})

const enrichEtiquetaPaperRow = (row: PaperRow): PaperRow => ({
  ...row,
  tipoPapelId: 'papel-1',
  type: 'Couché brillante',
  size: '70 × 100 cm',
  cut: 'Corte etiqueta',
  cortePapelId: 'cp-1',
  corteAncho: '70',
  corteAlto: '100',
  corteUnidadMedida: 'cm',
  despiece: {
    despieceId: 'dp-1',
    name: 'Etiqueta',
    ancho: '10',
    alto: '5',
    unidadMedida: 'cm',
    piezasPorPliego: 24,
  },
  papelCortado: 'no',
  valorHoja: 1250,
  unidadEmpaque: 250,
  valorCorteUnitario: 420,
  tamanosBuenosManual: 25000,
  sobranteManual: 500,
})

const PRODUCTION_ORDER_SEED_CONFIGS: ProductionOrderSeedConfig[] = [
  {
    suffix: '001',
    clientId: '1',
    workName: 'Empaque cajas premium',
    vendedorId: 'vend-1',
    date: new Date('2026-05-12T10:00:00.000Z'),
    quantity: 5000,
    productionStatus: 'En Proceso Preprensa',
    commercialStatus: 'En curso',
    preprensaDiseno: {
      ...emptyPreprensaDiseno(),
      designNuevo: 'no',
      nombreDiseno: 'Empaque cajas premium',
      disenoExistenteNombre: 'Empaque cajas premium',
      aplicaCostoDiseno: true,
      crearDisenoCost: 180000,
      designPdfFileName: 'empaque-cajas.pdf',
      planchaClienteTipo: 'plancha-nueva',
      planchaNuevaCosto: 250000,
      numeroCavidades: 2,
      colores: '4-colores',
      coloresPlanchas: [
        buildPlancha('po1-cp1', '4-colores', 'CMYK proceso'),
        buildPlancha('po1-cp2', '1-color', 'Barniz UV', 'tp2'),
      ],
      planchaId: 'tp1',
      planchaNombreMedida: 'Plancha estándar — 70 × 100 cm',
      planchaValor: 185000,
      lineaTroquel: true,
      reservaUv: true,
      precioMontajeId: 'pm1',
      precioMontajeNombre: 'Montaje estándar 4 tintas',
      precioMontajeCosto: 85000,
    },
    enrichPaperRow: row => enrichFlyerPaperRow(row),
    operators: {
      preprensa: 'user-2',
      cortePapel: 'user-5',
      impresion: 'user-4',
      terminados: 'user-2',
      acabados: 'user-5',
      cobro: 'user-3',
    },
  },
  {
    suffix: '002',
    clientId: '2',
    workName: 'Catálogo corporativo 2026',
    vendedorId: 'vend-2',
    date: new Date('2026-05-18T08:30:00.000Z'),
    quantity: 8000,
    productionStatus: 'En Proceso Corte de papel',
    commercialStatus: 'En curso',
    preprensaDiseno: {
      ...emptyPreprensaDiseno(),
      designNuevo: 'si',
      nombreDiseno: 'Catálogo corporativo 2026',
      aplicaCostoDiseno: true,
      crearDisenoCost: 320000,
      designPdfFileName: 'catalogo-2026.pdf',
      numeroCavidades: 1,
      colores: '4-colores',
      coloresPlanchas: [
        buildPlancha('po2-cp1', '4-colores', 'Portada CMYK'),
        buildPlancha('po2-cp2', '2-colores', 'Interior negro + tono', 'tp2'),
      ],
      planchaId: 'tp2',
      planchaNombreMedida: 'Plancha media — 64 × 90 cm',
      planchaValor: 152000,
      estampado: true,
      precioMontajeId: 'pm2',
      precioMontajeNombre: 'Montaje complejo 6 tintas',
      precioMontajeCosto: 125000,
    },
    enrichPaperRow: (row, index) =>
      index === 0 ? enrichTarjetaPaperRow(row) : enrichFlyerPaperRow(row),
    operators: {
      preprensa: 'user-2',
      cortePapel: 'user-5',
      impresion: 'user-4',
      terminados: 'user-2',
      acabados: 'user-5',
      cobro: 'user-3',
    },
  },
  {
    suffix: '003',
    clientId: '3',
    workName: 'Volantes promocionales junio',
    vendedorId: 'vend-1',
    date: new Date('2026-06-02T14:15:00.000Z'),
    quantity: 12000,
    productionStatus: 'En Revisión',
    commercialStatus: 'Revisión',
    preprensaDiseno: {
      ...emptyPreprensaDiseno(),
      designNuevo: 'no',
      nombreDiseno: 'Volantes promocionales junio',
      disenoExistenteNombre: 'Volantes promocionales junio',
      aplicaCostoDiseno: false,
      designPdfFileName: 'volantes-junio.pdf',
      planchaClienteTipo: 'plancha-existente',
      planchaNuevaCosto: 0,
      numeroCavidades: 2,
      colores: '4-colores',
      coloresPlanchas: [buildPlancha('po3-cp1', '4-colores', 'Full color promocional')],
      planchaId: 'tp1',
      planchaNombreMedida: 'Plancha estándar — 70 × 100 cm',
      planchaValor: 185000,
      precioMontajeId: 'pm1',
      precioMontajeNombre: 'Montaje estándar 4 tintas',
      precioMontajeCosto: 85000,
    },
    enrichPaperRow: row => enrichFlyerPaperRow(row),
    operators: {
      preprensa: 'user-4',
      cortePapel: 'user-2',
      impresion: 'user-5',
      terminados: 'user-4',
      acabados: 'user-2',
      cobro: 'user-1',
    },
  },
  {
    suffix: '004',
    clientId: '1',
    workName: 'Etiquetas farmacéuticas',
    vendedorId: 'vend-3',
    date: new Date('2026-06-10T09:45:00.000Z'),
    quantity: 25000,
    productionStatus: 'En Proceso Impresion',
    commercialStatus: 'En curso',
    preprensaDiseno: {
      ...emptyPreprensaDiseno(),
      designNuevo: 'no',
      nombreDiseno: 'Etiquetas farmacéuticas',
      disenoExistenteNombre: 'Etiquetas farmacéuticas',
      aplicaCostoDiseno: true,
      crearDisenoCost: 210000,
      designPdfFileName: 'etiquetas-farma.pdf',
      planchaClienteTipo: 'plancha-nueva',
      planchaNuevaCosto: 250000,
      numeroCavidades: 2,
      colores: '4-colores',
      coloresPlanchas: [
        buildPlancha('po4-cp1', '4-colores', 'CMYK regulado'),
        buildPlancha('po4-cp2', '1-color', 'Troquel existente', 'tp2'),
      ],
      planchaId: 'tp1',
      planchaNombreMedida: 'Plancha estándar — 70 × 100 cm',
      planchaValor: 185000,
      lineaTroquel: true,
      precioMontajeId: 'pm1',
      precioMontajeNombre: 'Montaje estándar 4 tintas',
      precioMontajeCosto: 85000,
    },
    enrichPaperRow: (row, index) =>
      index === 0 ? enrichEtiquetaPaperRow(row) : enrichFlyerPaperRow(row),
    operators: {
      preprensa: 'user-2',
      cortePapel: 'user-5',
      impresion: 'user-4',
      terminados: 'user-2',
      acabados: 'user-5',
      cobro: 'user-3',
    },
  },
]

export const createProductionOrderSeeds = (): Order[] =>
  PRODUCTION_ORDER_SEED_CONFIGS.map(config => {
    const specs = buildOrderSpecs(config)
    return new Order(
      `${PURCHASE_ORDER_PREFIX}${config.suffix}`,
      config.clientId,
      config.workName,
      config.date,
      specs,
      config.commercialStatus,
      OrderTotalCalculator.calculate(specs),
      config.vendedorId,
      config.productionStatus
    )
  })

export const PRODUCTION_ORDER_SEED_SUMMARIES = PRODUCTION_ORDER_SEED_CONFIGS.map(config => ({
  id: `${PURCHASE_ORDER_PREFIX}${config.suffix}`,
  workName: config.workName,
  productionStatus: config.productionStatus,
}))
