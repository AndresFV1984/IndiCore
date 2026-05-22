import { Money } from './Money.js';
import { OrderSpecs } from '../entities/Order.js';

export class OrderTotalCalculator {
  static calculate(specs: OrderSpecs): Money {
    let total = new Money(0);

    // Add paper cut (assuming some calculation, for now placeholder)
    // total = total.add(specs.paperCutValue);

    if (specs.mounting && specs.mountingValue) {
      total = total.add(specs.mountingValue);
    }

    if (specs.preprensaDiseno?.designNuevo === 'si') {
      if (specs.preprensaDiseno.aplicaCostoDiseno) {
        total = total.add(new Money(specs.preprensaDiseno.crearDisenoCost || 0));
      }
      total = total.add(new Money(specs.preprensaDiseno.precioMontajeCosto || 0));
    }

    if (
      specs.preprensaDiseno?.designNuevo === 'no' &&
      specs.preprensaDiseno.planchaClienteTipo === 'plancha-nueva'
    ) {
      total = total.add(new Money(specs.preprensaDiseno.planchaNuevaCosto || 0));
    }

    total = total.add(specs.platesValue);
    total = total.add(specs.machineOutputValue.multiply(specs.thousands));

    specs.finishes.forEach(finish => {
      total = total.add(finish.total);
    });

    specs.operations.forEach(op => {
      total = total.add(op.value);
    });

    return total;
  }
}
