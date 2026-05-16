import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupplierResponse } from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { SupplierApiService } from '../../../core/services/supplier-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ActiveFilterComponent } from '../../../shared/components/active-filter/active-filter.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import {
  EntityTableAction,
  EntityTableColumn,
  EntityTableComponent,
} from '../../../shared/components/entity-table/entity-table.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';

@Component({
  selector: 'app-suppliers-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeaderComponent,
    PaginationComponent,
    SearchInputComponent,
    ActiveFilterComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    EntityTableComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './suppliers-list-page.component.html',
  styleUrl: './suppliers-list-page.component.scss',
})
export class SuppliersListPageComponent implements OnInit {
  private readonly api = inject(SupplierApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  suppliers = signal<SupplierResponse[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  activeFilter = signal<boolean | null>(null);
  search = signal('');
  confirmItem = signal<SupplierResponse | null>(null);
  confirmDeleteItem = signal<SupplierResponse | null>(null);

  columns: EntityTableColumn<SupplierResponse>[] = [
    { key: 'name', header: 'Nombre', value: (r) => r.name, cssClass: 'name-cell', width: '35%' },
    { key: 'taxId', header: 'CIF/NIF', value: (r) => r.taxId, cssClass: 'font-mono', width: '20%' },
  ];

  actions: EntityTableAction<SupplierResponse>[] = [
    { label: 'Ver', routerLink: (r) => ['/suppliers', String(r.id)] },
    {
      label: (r) => (r.active ? 'Desactivar' : 'Activar'),
      visible: () => this.auth.isGestor(),
    },
    {
      label: 'Eliminar',
      cssClass: 'action-btn--danger',
      visible: () => this.auth.isGestor(),
    },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .getSuppliers({
        active: this.activeFilter(),
        page: this.page(),
        size: 20,
        sort: 'name,asc',
      })
      .subscribe({
        next: (r) => {
          this.suppliers.set(r.content);
          this.totalPages.set(r.totalPages);
          this.totalElements.set(r.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(q: string): void {
    this.search.set(q);
    this.page.set(0);
    this.load();
  }
  onActiveChange(v: boolean | null): void {
    this.activeFilter.set(v);
    this.page.set(0);
    this.load();
  }
  onPageChange(p: number): void {
    this.page.set(p);
    this.load();
  }
  askToggle(s: SupplierResponse): void {
    this.confirmItem.set(s);
  }

  askDelete(s: SupplierResponse): void {
    this.confirmDeleteItem.set(s);
  }

  onTableAction(event: {
    action: EntityTableAction<SupplierResponse>;
    row: SupplierResponse;
  }): void {
    const label =
      typeof event.action.label === 'function' ? event.action.label(event.row) : event.action.label;
    if (label === 'Eliminar') {
      this.askDelete(event.row);
    } else if (label === 'Desactivar' || label === 'Activar') {
      this.askToggle(event.row);
    }
  }

  doToggle(): void {
    const s = this.confirmItem();
    if (!s) return;
    this.api.updateSupplierStatus(s.id, { active: !s.active }).subscribe({
      next: () => {
        this.notify.success(s.active ? 'Desactivado' : 'Activado');
        this.confirmItem.set(null);
        this.load();
      },
      error: (e) => {
        this.notify.error('Error', e.message);
        this.confirmItem.set(null);
      },
    });
  }

  doDelete(): void {
    const s = this.confirmDeleteItem();
    if (!s) return;
    this.api.deleteSupplier(s.id).subscribe({
      next: () => {
        this.notify.success('Proveedor eliminado');
        this.confirmDeleteItem.set(null);
        this.load();
      },
      error: (e) => {
        this.notify.error('Error', e.message);
        this.confirmDeleteItem.set(null);
      },
    });
  }
}
