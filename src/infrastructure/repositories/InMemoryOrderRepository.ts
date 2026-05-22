import { Order } from '../../core/domain/entities/Order.js';
import { emptyPreprensaDiseno } from '../../core/domain/entities/PreprensaDiseno.js';
import { IOrderRepository } from '../../core/ports/out/IOrderRepository.js';
import { Money } from '../../core/domain/value-objects/Money.js';
import { PURCHASE_ORDER_PREFIX } from '../../core/domain/value-objects/PurchaseOrderId.js';

export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Order[] = [];

  constructor() {
    this.seedData();
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find(o => o.id === id) || null;
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders];
  }

  async save(order: Order): Promise<void> {
    this.orders.push(order);
  }

  async update(order: Order): Promise<void> {
    const index = this.orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      this.orders[index] = order;
    }
  }

  async delete(id: string): Promise<void> {
    this.orders = this.orders.filter(o => o.id !== id);
  }

  private seedData(): void {
    // Seed with 12-15 orders
    const clients = ['1', '2', '3', '4', '5', '6', '7', '8']; // Assuming client IDs
    const statuses: ('En curso' | 'Revisión' | 'Listo' | 'Entregado' | 'Cancelado')[] = ['En curso', 'Revisión', 'Listo', 'Entregado', 'Cancelado'];

    for (let i = 1; i <= 15; i++) {
      const clientId = [1, 2, 4, 14].includes(i)
        ? '1'
        : clients[Math.floor(Math.random() * clients.length)]

      let preprensaDiseno = emptyPreprensaDiseno()
      if ([1, 4, 14].includes(i)) {
        preprensaDiseno = {
          ...emptyPreprensaDiseno(),
          designNuevo: 'no',
          nombreDiseno: `Diseño empaque ${i}`,
          disenoExistenteNombre: `Diseño empaque ${i}`,
          aplicaCostoDiseno: true,
          crearDisenoCost: 180000 + i * 10000,
          designPdfFileName: `empaque-${i}.pdf`,
          planchaClienteTipo: i === 4 ? 'plancha-existente' : 'plancha-nueva',
          planchaNuevaCosto: i === 4 ? 0 : 250000,
          numeroCavidades: 2,
          colores: '4-colores',
          coloresPlanchas: [
            {
              id: 'cp-seed-1',
              colores: '1-color',
              planchaId: 'tp1',
              planchaNombreMedida: 'Plancha estándar — 70 × 100 cm',
              planchaValor: 185000,
              cantidad: 0,
              numeroPlanchas: 0,
              valorTotal: 0,
              numeroCavidades: 2,
              detalle: 'Cyan proceso',
              observacion: '',
            },
            {
              id: 'cp-seed-2',
              colores: '2-colores',
              planchaId: 'tp2',
              planchaNombreMedida: 'Plancha media — 64 × 90 cm',
              planchaValor: 152000,
              cantidad: 0,
              numeroPlanchas: 0,
              valorTotal: 0,
              numeroCavidades: 1,
              detalle: 'Magenta',
              observacion: '',
            },
            {
              id: 'cp-seed-3',
              colores: '3-colores',
              planchaId: 'tp1',
              planchaNombreMedida: 'Plancha estándar — 70 × 100 cm',
              planchaValor: 185000,
              cantidad: 0,
              numeroPlanchas: 0,
              valorTotal: 0,
              numeroCavidades: 2,
              detalle: 'Cyan proceso',
              observacion: '',
            },
            {
              id: 'cp-seed-3b',
              colores: '4-colores',
              planchaId: 'tp2',
              planchaNombreMedida: 'Plancha media — 64 × 90 cm',
              planchaValor: 152000,
              cantidad: 0,
              numeroPlanchas: 0,
              valorTotal: 0,
              numeroCavidades: 1,
              detalle: 'Negro',
              observacion: '',
            },
          ],
          planchaId: 'tp1',
          planchaNombreMedida: 'Plancha estándar — 70 × 100 cm',
          planchaValor: 185000,
          lineaTroquel: true,
          reservaUv: i === 1,
          precioMontajeId: 'pm1',
          precioMontajeNombre: 'Montaje estándar 4 tintas',
          precioMontajeCosto: 85000,
        }
      } else if (i === 2) {
        preprensaDiseno = {
          ...emptyPreprensaDiseno(),
          designNuevo: 'si',
          nombreDiseno: 'Catálogo corporativo 2024',
          aplicaCostoDiseno: true,
          crearDisenoCost: 320000,
          designPdfFileName: 'catalogo-2024.pdf',
          numeroCavidades: 1,
          colores: '2-colores',
          coloresPlanchas: [
            {
              id: 'cp-seed-4',
              colores: '2-colores',
              planchaId: 'tp3',
              planchaNombreMedida: 'Plancha pequeña — 50 × 70 cm',
              planchaValor: 98000,
              cantidad: 0,
              numeroPlanchas: 0,
              valorTotal: 0,
              numeroCavidades: 1,
              detalle: 'Magenta',
              observacion: '',
            },
            {
              id: 'cp-seed-5',
              colores: '1-color',
              planchaId: 'tp2',
              planchaNombreMedida: 'Plancha media — 64 × 90 cm',
              planchaValor: 152000,
              cantidad: 0,
              numeroPlanchas: 0,
              valorTotal: 0,
              numeroCavidades: 2,
              detalle: 'Cian proceso',
              observacion: '',
            },
            {
              id: 'cp-seed-5b',
              colores: '2-colores',
              planchaId: 'tp1',
              planchaNombreMedida: 'Plancha estándar — 70 × 100 cm',
              planchaValor: 185000,
              cantidad: 0,
              numeroPlanchas: 0,
              valorTotal: 0,
              numeroCavidades: 1,
              detalle: 'Magenta',
              observacion: '',
            },
          ],
          planchaId: 'tp2',
          planchaNombreMedida: 'Plancha media — 64 × 90 cm',
          planchaValor: 152000,
          estampado: true,
          precioMontajeId: 'pm2',
          precioMontajeNombre: 'Montaje complejo 6 tintas',
          precioMontajeCosto: 125000,
        }
      }

      const order = new Order(
        `${PURCHASE_ORDER_PREFIX}${String(i).padStart(3, '0')}`,
        clientId,
        `Trabajo ${i}`,
        new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        {
          paperRows: [{ type: 'Papel 1', size: '90x64', cut: 'Corte 1' }],
          quantity: Math.floor(Math.random() * 1000) + 100,
          sheets: 100,
          leftover: 10,
          mounting: Math.random() > 0.5,
          mountingValue: new Money(50000),
          design: preprensaDiseno.designNuevo === 'si',
          preprensaDiseno,
          plates: 2,
          platesValue: new Money(100000),
          thousands: 1,
          inks: '1x1',
          machineOutputValue: new Money(20000),
          chapoliado: Math.random() > 0.5,
          finishes: [],
          operations: []
        },
        statuses[Math.floor(Math.random() * statuses.length)],
        new Money(Math.floor(Math.random() * 1000000) + 100000),
        ''
      );
      this.orders.push(order);
    }
  }
}
