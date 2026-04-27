import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientResponse } from '../../../core/models/api.models';
import { ClientApiService } from '../../../core/services/client-api.service';
import { NotificationService } from '../../../core/services/notification.service';
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
  selector: 'app-clients-list-page',
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
  templateUrl: './clients-list-page.component.html',
  styleUrl: './clients-list-page.component.scss',
})
export class ClientsListPageComponent implements OnInit {
  private readonly api = inject(ClientApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  clients = signal<ClientResponse[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  activeFilter = signal<boolean | null>(null);
  search = signal('');
  confirmItem = signal<ClientResponse | null>(null);
  confirmDeleteItem = signal<ClientResponse | null>(null);

  columns: EntityTableColumn<ClientResponse>[] = [
    { key: 'name', header: 'Nombre', value: (r) => r.name, cssClass: 'name-cell', width: '35%' },
    { key: 'taxId', header: 'CIF/NIF', value: (r) => r.taxId, cssClass: 'font-mono', width: '20%' },
  ];

  actions: EntityTableAction<ClientResponse>[] = [
    { label: 'Ver', routerLink: (r) => ['/clients', String(r.id)] },
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
      .getClients({
        active: this.activeFilter(),
        page: this.page(),
        size: 20,
        sort: 'name,asc',
      })
      .subscribe({
        next: (r) => {
          this.clients.set(r.content);
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
  getActiveColor(active: boolean): string {
    return active ? 'green' : 'red';
  }
  askToggle(c: ClientResponse): void {
    this.confirmItem.set(c);
  }

  askDelete(c: ClientResponse): void {
    this.confirmDeleteItem.set(c);
  }

  onTableAction(event: { action: EntityTableAction<ClientResponse>; row: ClientResponse }): void {
    const label =
      typeof event.action.label === 'function' ? event.action.label(event.row) : event.action.label;
    if (label === 'Eliminar') {
      this.askDelete(event.row);
    } else if (label === 'Desactivar' || label === 'Activar') {
      this.askToggle(event.row);
    }
  }

  doToggle(): void {
    const c = this.confirmItem();
    if (!c) return;
    this.api.updateClientStatus(c.id, { active: !c.active }).subscribe({
      next: () => {
        this.notify.success(c.active ? 'Desactivado' : 'Activado');
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
    const c = this.confirmDeleteItem();
    if (!c) return;
    this.api.deleteClient(c.id).subscribe({
      next: () => {
        this.notify.success('Cliente eliminado');
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
