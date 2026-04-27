import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DocumentStatusResponse, SalesOrderResponse } from '../../../core/models/api.models';
import { ReportApiService } from '../../../core/services/report-api.service';
import { SalesApiService } from '../../../core/services/sales-api.service';
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
  selector: 'app-sales-list-page',
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
  templateUrl: './sales-list-page.component.html',
  styleUrl: './sales-list-page.component.scss',
})
export class SalesListPageComponent implements OnInit {
  @Input() clientId?: number;

  private readonly api = inject(SalesApiService);
  private readonly reportApi = inject(ReportApiService);

  sales = signal<SalesOrderResponse[]>([]);
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
    this.reportApi.getDocumentStatuses('SALE').subscribe({
      next: (s) => this.statuses.set(s),
      error: () => {},
    });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .getSales({
        status: this.statusFilter() || undefined,
        clientId: this.clientId,
        dateFrom: this.dateFrom() || undefined,
        dateTo: this.dateTo() || undefined,
        page: this.page(),
        size: this.pageSize,
        sort: 'documentDate,desc',
      })
      .subscribe({
        next: (r) => {
          this.sales.set(r.content);
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
