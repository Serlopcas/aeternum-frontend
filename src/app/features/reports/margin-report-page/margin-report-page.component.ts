import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { MarginLineResponse, MarginReportResponse } from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { ReportApiService } from '../../../core/services/report-api.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { CurrencyPipe, PercentPipe } from '../../../shared/pipes/format.pipes';

type SortField = keyof Pick<
  MarginLineResponse,
  'lineRevenue' | 'lineCost' | 'lineMargin' | 'lineMarginPercent'
>;

@Component({
  selector: 'app-margin-report-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CurrencyPipe,
    PercentPipe,
  ],
  templateUrl: './margin-report-page.component.html',
  styleUrl: './margin-report-page.component.scss',
})
export class MarginReportPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(ReportApiService);
  private readonly notify = inject(NotificationService);

  loading = signal(true);
  report = signal<MarginReportResponse | null>(null);
  dateFrom = this.firstOfMonth();
  dateTo = this.today();
  pageNum = 0;

  private dateChange$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  sortField = signal<SortField | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');

  sortedLines = computed(() => {
    const rep = this.report();
    if (!rep) return [];
    const field = this.sortField();
    if (!field) return rep.lines;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...rep.lines].sort((a, b) => ((a[field] as number) - (b[field] as number)) * dir);
  });

  ngOnInit(): void {
    this.dateChange$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => {
      this.pageNum = 0;
      this.load();
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDateChange(): void {
    this.dateChange$.next();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .getMarginReport({
        dateFrom: this.dateFrom || undefined,
        dateTo: this.dateTo || undefined,
        page: this.pageNum,
        size: 20,
      })
      .subscribe({
        next: (r) => {
          this.report.set(r);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('Error cargando informe');
        },
      });
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return '';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  setCurrentMonth(): void {
    this.dateFrom = this.firstOfMonth();
    this.dateTo = this.today();
    this.pageNum = 0;
    this.load();
  }

  setLastMonth(): void {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    this.dateFrom = this.fmt(first);
    this.dateTo = this.fmt(last);
    this.pageNum = 0;
    this.load();
  }

  setCurrentQuarter(): void {
    const now = new Date();
    const qStart = Math.floor(now.getMonth() / 3) * 3;
    this.dateFrom = this.fmt(new Date(now.getFullYear(), qStart, 1));
    this.dateTo = this.today();
    this.pageNum = 0;
    this.load();
  }

  setCurrentYear(): void {
    this.dateFrom = `${new Date().getFullYear()}-01-01`;
    this.dateTo = this.today();
    this.pageNum = 0;
    this.load();
  }

  private firstOfMonth(): string {
    const d = new Date();
    return this.fmt(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  private today(): string {
    return this.fmt(new Date());
  }

  private fmt(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
