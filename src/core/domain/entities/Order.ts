import { Money } from '../value-objects/Money.js';
import { OrderStatus } from '../value-objects/OrderStatus.js';
import { OrderTotalCalculator } from '../value-objects/OrderTotalCalculator.js';
import type { DespieceAsociado } from './CortePapel.js';
import { PreprensaDisenoSpecs, YesNoChoice } from './PreprensaDiseno.js';

export interface OrderSpecs {
  paperRows: PaperRow[];
  quantity: number;
  cantidadHojas: number;
  /** Hojas adicionales sumadas a la cantidad calculada (por defecto 2). */
  margenRedondeo: number;
  valorCorte: number;
  /** Si es «sí», el cliente aporta el papel y no se cobra valor papel del catálogo. */
  clienteSuministraPapel: YesNoChoice;
  mounting: boolean;
  mountingValue?: Money;
  design: boolean;
  preprensaDiseno: PreprensaDisenoSpecs;
  plates: number;
  platesValue: Money;
  thousands: number;
  inks: string;
  /** Tintas por plancha (tiro / retiro) en Impresión. */
  impresionTintasRegistros: ImpresionTintasRegistro[];
  machineOutputValue: Money;
  chapoliado: boolean;
  finishes: FinishItem[];
  operations: OperationItem[];
}

export interface PaperRow {
  /** Id de fila en corte (faltantes litografía u otras filas sin vínculo preprensa). */
  corteRowId?: string;
  /** Registro de Preprensa › Especificaciones técnicas (colores/planchas). */
  colorPlanchaId?: string;
  /** Faltante: litografía suministra hojas no entregadas por el cliente. */
  esFaltanteLitografia?: boolean;
  /** Registro preprensa al que pertenece el faltante. */
  faltanteDeColorPlanchaId?: string;
  /** Cantidad de hojas del faltante (diferencia calculada − entregadas). */
  hojasFaltanteCantidad?: number;
  /** Id en catálogo Tipo de papel */
  tipoPapelId?: string;
  type: string;
  size: string;
  valorHoja?: number;
  /** Cantidad de hojas por unidad de empaque (del tipo de papel). */
  unidadEmpaque?: number;
  /** Valor corte unitario del tipo de papel seleccionado (catálogo) */
  valorCorteUnitario?: number;
  /** Id en catálogo Corte de papel */
  cortePapelId?: string;
  /** Nombre del corte (catálogo) */
  cut: string;
  corteAncho?: string;
  corteAlto?: string;
  corteUnidadMedida?: string;
  despiece?: DespieceAsociado;
  /**
   * Cliente suministra papel: «si» = papel ya cortado; «no» = sin cortar (cobro de corte).
   * Cantidad hojas en ambos casos: (tamaños buenos + sobrante) ÷ piezas por pliego.
   */
  papelCortado?: YesNoChoice;
  /** Cliente suministra: hojas físicas que entregó el cliente. */
  hojasEntregadasCliente?: number;
  /** Sin cortar: tamaños buenos para el cálculo de cantidad hojas. */
  tamanosBuenosManual?: number;
  /** Sin cortar: sobrante para el cálculo de cantidad hojas. */
  sobranteManual?: number;
}

export interface FinishItem {
  name: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
}

export interface OperationItem {
  name: string;
  value: Money;
}

/** Índice en la paleta fija de tintas (0–6). -1 = sin asignar. */
export type ImpresionTintaPaletteIndex = number;

/** Tintas asociadas al tiro o al retiro de una plancha. */
export interface ImpresionLadoTintas {
  cantidad: number;
  tintas: ImpresionTintaPaletteIndex[];
}

/** Par tiro / retiro agregado a una plancha en Impresión › Tintas. */
export interface ImpresionTiroRetiroEntrada {
  id: string;
  tiro: ImpresionLadoTintas;
  retiro: ImpresionLadoTintas;
  /** Cantidad de tintas básicas distintas (tiro + retiro). */
  cantidadTintasColorBasico?: number;
  /** Cantidad de tintas Pantone distintas (tiro + retiro). */
  cantidadTintasPantone?: number;
  /** Millares calculados para colores básicos: (tiro + retiro) × Tamaños buenos ÷ 1.000. */
  millaresColorBasico?: number;
  /** Millares calculados para Pantone: (tiro + retiro) × Tamaños buenos ÷ 1.000. */
  millaresPantone?: number;
  /** Cobro por millares de colores básicos (primarios/secundarios). */
  precioTintaColorBasico?: number;
  /** Cobro por millares de colores Pantone. */
  precioTintaPantone?: number;
  /** Total de cobro por millares (Color básico + Pantone). */
  precioTinta?: number;
  /** Millares del registro tiro/retiro usados para el cobro de volteo. */
  millaresVolteo?: number;
  /** Cobro por volteo: millares × Precio por millar del tipo de volteo. */
  precioVolteo?: number;
}

/** Tipo de impresión bifronte por plancha. */
export type ImpresionTipoBifronte =
  | 'volteo-pinza'
  | 'volteo-escuadra'
  | 'diferente-plancha';

/** Configuración de tintas por registro de preprensa (plancha). */
export interface ImpresionTintasRegistro {
  colorPlanchaId: string;
  entradas: ImpresionTiroRetiroEntrada[];
  tipoBifronte?: ImpresionTipoBifronte | '';
  /** Tarifa por millar del catálogo asociada al volteo seleccionado. */
  tarifaVolteoMillarId?: string;
  /** Precio por millar (COP) tomado de la tarifa vigente al configurar el volteo. */
  precioVolteoMillar?: number;
  /** Tarifa por millar «Color básico» cuando tiro/retiro usan primarios o secundarios. */
  tarifaColorBasicoMillarId?: string;
  /** Precio por millar (COP) de Color básico al completar la asignación de tintas. */
  precioColorBasicoMillar?: number;
  /** Tarifa por millar «Pantone» cuando tiro/retiro incluyen al menos un Pantone. */
  tarifaPantoneMillarId?: string;
  /** Precio por millar (COP) de Pantone al completar la asignación de tintas. */
  precioPantoneMillar?: number;
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly workName: string,
    public readonly date: Date,
    public readonly specs: OrderSpecs,
    public readonly status: OrderStatus,
    public readonly total: Money,
    public readonly vendedorId: string = ''
  ) {}

  static create(dto: CreateOrderDTO): Order {
    const total = OrderTotalCalculator.calculate(dto.specs);
    return new Order(
      dto.id || crypto.randomUUID(),
      dto.clientId,
      dto.workName,
      dto.date,
      dto.specs,
      'En curso',
      total,
      dto.vendedorId ?? ''
    );
  }

  updateStatus(newStatus: OrderStatus): Order {
    return new Order(
      this.id,
      this.clientId,
      this.workName,
      this.date,
      this.specs,
      newStatus,
      this.total,
      this.vendedorId
    );
  }
}

export interface CreateOrderDTO {
  id?: string;
  clientId: string;
  workName: string;
  date: Date;
  specs: OrderSpecs;
  vendedorId?: string;
}
