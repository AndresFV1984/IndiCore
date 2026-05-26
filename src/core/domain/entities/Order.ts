import { Money } from '../value-objects/Money.js';
import { OrderStatus } from '../value-objects/OrderStatus.js';
import { OrderTotalCalculator } from '../value-objects/OrderTotalCalculator.js';
import type { DespieceAsociado } from './CortePapel.js';
import { PreprensaDisenoSpecs } from './PreprensaDiseno.js';

export interface OrderSpecs {
  paperRows: PaperRow[];
  quantity: number;
  cantidadHojas: number;
  /** Hojas adicionales sumadas a la cantidad calculada (por defecto 2). */
  margenRedondeo: number;
  valorCorte: number;
  mounting: boolean;
  mountingValue?: Money;
  design: boolean;
  preprensaDiseno: PreprensaDisenoSpecs;
  plates: number;
  platesValue: Money;
  thousands: number;
  inks: string;
  machineOutputValue: Money;
  chapoliado: boolean;
  finishes: FinishItem[];
  operations: OperationItem[];
}

export interface PaperRow {
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
