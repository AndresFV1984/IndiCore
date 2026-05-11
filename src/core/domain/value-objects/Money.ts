export class Money {
  constructor(private readonly value: number, private readonly currency: string = 'COP') {
    if (value < 0) throw new Error('Money value cannot be negative');
  }

  getValue(): number {
    return this.value;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currencies must match');
    return new Money(this.value + other.value, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.value * factor, this.currency);
  }

  toString(): string {
    return `${this.currency} ${this.value.toLocaleString()}`;
  }
}
