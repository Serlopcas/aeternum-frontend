import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError, DashboardResponse, StockAlertResponse } from '../../../core/models/api.models';
import { ReportApiService } from '../../../core/services/report-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ApiErrorAlertComponent } from '../../../shared/components/api-error-alert/api-error-alert.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CurrencyPipe } from '../../../shared/pipes/format.pipes';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    ApiErrorAlertComponent,
    CurrencyPipe,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  protected readonly auth = inject(AuthStateService);
  private readonly reportApi = inject(ReportApiService);

  loading = signal(false);
  error = signal<ApiError | null>(null);
  data = signal<DashboardResponse | null>(null);
  stockAlerts = signal<StockAlertResponse[]>([]);
  onlySellable = signal<boolean | null>(null);

  readonly dateFrom = this.firstOfMonth();
  readonly dateTo = this.today();
  readonly currentMonthLabel = new Date().toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  ngOnInit(): void {
    if (this.auth.isGestor()) {
      this.loadMetrics();
      this.loadStockAlerts();
    }
  }

  onSellableChange(val: string): void {
    this.onlySellable.set(val === '' ? null : val === 'true');
    this.loadStockAlerts();
  }

  private loadMetrics(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reportApi.getDashboard(this.dateFrom, this.dateTo).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  private loadStockAlerts(): void {
    this.reportApi
      .getStockAlerts({ onlySellable: this.onlySellable(), page: 0, size: 5 })
      .subscribe({
        next: (res) => this.stockAlerts.set(res.content),
        error: () => {},
      });
  }

  private firstOfMonth(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
