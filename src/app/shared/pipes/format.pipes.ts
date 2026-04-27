import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'appCurrency', standalone: true })
export class CurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, symbol = '€'): string {
    if (value === null || value === undefined) return '—';
    return `${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  }
}

@Pipe({ name: 'appPercent', standalone: true })
export class PercentPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${value.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
  }
}

@Pipe({ name: 'appDate', standalone: true })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
}

@Pipe({ name: 'appDateTime', standalone: true })
export class DateTimeFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
