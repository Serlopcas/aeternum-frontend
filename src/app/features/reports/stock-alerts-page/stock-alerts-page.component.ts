import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageResponse, StockAlertResponse } from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { ReportApiService } from '../../../core/services/report-api.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-stock-alerts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './stock-alerts-page.component.html',
  styleUrl: './stock-alerts-page.component.scss',
})
export class StockAlertsPageComponent implements OnInit {
  private readonly api = inject(ReportApiService);
  private readonly notify = inject(NotificationService);

  loading = signal(true);
  page = signal<PageResponse<StockAlertResponse> | null>(null);
  onlySellable = false;
  pageNum = 0;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .getStockAlerts({
        onlySellable: this.onlySellable || null,
        page: this.pageNum,
        size: 20,
      })
      .subscribe({
        next: (p) => {
          this.page.set(p);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('Error cargando alertas');
        },
      });
  }
}
