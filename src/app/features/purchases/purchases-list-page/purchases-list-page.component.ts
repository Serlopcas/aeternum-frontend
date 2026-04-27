import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DocumentStatusResponse, PurchaseOrderResponse } from '../../../core/models/api.models';
import { PurchaseApiService } from '../../../core/services/purchase-api.service';
import { ReportApiService } from '../../../core/services/report-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { DateRangeFilterComponent } from '../../../shared/components/date-range-filter/date-range-filter.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import {
  StatusBadgeComponent,
  getDocumentStatusColor,
} from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPipe, DateFormatPipe } from '../../../shared/pipes/format.pipes';

@Component({
  selector: 'app-purchases-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    PaginationComponent,
    DateRangeFilterComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    CurrencyPipe,
    DateFormatPipe,
  ],
  templateUrl: './purchases-list-page.component.html',
  styleUrl: './purchases-list-page.component.scss',
})
export class PurchasesListPageComponent implements OnInit {
  @Input() supplierId?: number;

  private readonly api = inject(PurchaseApiService);
  private readonly reportApi = inject(ReportApiService);
  protected readonly auth = inject(AuthStateService);

  purchases = signal<PurchaseOrderResponse[]>([]);
  statuses = signal<DocumentStatusResponse[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  statusFilter = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  pageSize = 25;

  ngOnInit(): void {
    this.load();
    this.reportApi.getDocumentStatuses('PURCHASE').subscribe({
      next: (s) => this.statuses.set(s),
      error: () => {},
    });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .getPurchases({
        status: this.statusFilter() || undefined,
        supplierId: this.supplierId,
        dateFrom: this.dateFrom() || undefined,
        dateTo: this.dateTo() || undefined,
        page: this.page(),
        size: this.pageSize,
        sort: 'documentDate,desc',
      })
      .subscribe({
        next: (r) => {
          this.purchases.set(r.content);
          this.totalPages.set(r.totalPages);
          this.totalElements.set(r.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onStatusChange(v: string): void {
    this.statusFilter.set(v);
    this.page.set(0);
    this.load();
  }
  onDateChange(e: { from: string; to: string }): void {
    this.dateFrom.set(e.from);
    this.dateTo.set(e.to);
    this.page.set(0);
    this.load();
  }
  onPageChange(p: number): void {
    this.page.set(p);
    this.load();
  }
  getStatusColor(code: string): string {
    return getDocumentStatusColor(code);
  }
}
