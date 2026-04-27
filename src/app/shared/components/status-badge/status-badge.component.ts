import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  label = input('');
  colorClass = input('gray');
}

export function getDocumentStatusColor(code: string): string {
  const map: Record<string, string> = {
    DRAFT: 'gray',
    SENT: 'blue',
    CONFIRMED: 'blue-deep',
    RECEIVED_PARTIAL: 'amber',
    RECEIVED_COMPLETE: 'green',
    PREPARED: 'blue',
    DELIVERED: 'green',
    CANCELLED: 'red',
  };
  return map[code] ?? 'gray';
}

export function getActiveStatusColor(active: boolean): string {
  return active ? 'active' : 'inactive';
}
