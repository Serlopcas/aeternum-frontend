import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface EntityTableColumn<T = any> {
  key: string;
  header: string;
  value: (row: T) => string;
  cssClass?: string;
  width?: string;
}

export interface EntityTableAction<T = any> {
  label: string | ((row: T) => string);
  cssClass?: string;
  visible?: (row: T) => boolean;
  routerLink?: (row: T) => string[];
}

@Component({
  selector: 'app-entity-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StatusBadgeComponent],
  templateUrl: './entity-table.component.html',
  styleUrl: './entity-table.component.scss',
})
export class EntityTableComponent<T extends { id: number; active: boolean }> {
  columns = input.required<EntityTableColumn<T>[]>();
  rows = input.required<T[]>();
  actions = input<EntityTableAction<T>[]>([]);
  showStatus = input(true);
  trackBy = input<(row: T) => any>((r) => r.id);

  actionClick = output<{ action: EntityTableAction<T>; row: T }>();

  getLabel(action: EntityTableAction<T>, row: T): string {
    return typeof action.label === 'function' ? action.label(row) : action.label;
  }

  isVisible(action: EntityTableAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  onAction(action: EntityTableAction<T>, row: T): void {
    this.actionClick.emit({ action, row });
  }
}
