import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocumentStatusResponse, SalesOrderDetailResponse } from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { ReportApiService } from '../../../core/services/report-api.service';
import { SalesApiService } from '../../../core/services/sales-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  StatusBadgeComponent,
  getDocumentStatusColor,
} from '../../../shared/components/status-badge/status-badge.component';
import {
  CurrencyPipe,
  DateFormatPipe,
  DateTimeFormatPipe,
  PercentPipe,
} from '../../../shared/pipes/format.pipes';

@Component({
  selector: 'app-sale-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    CurrencyPipe,
    DateFormatPipe,
    DateTimeFormatPipe,
    PercentPipe,
  ],
  templateUrl: './sale-detail-page.component.html',
  styleUrl: './sale-detail-page.component.scss',
})
export class SaleDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SalesApiService);
  private readonly reportApi = inject(ReportApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  order = signal<SalesOrderDetailResponse | null>(null);
  loading = signal(true);
  availableStatuses = signal<DocumentStatusResponse[]>([]);
  newStatus = '';
  statusComment = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getSale(id).subscribe({
      next: (o) => {
        this.order.set(o);
        this.newStatus = o.statusCode;
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Pedido no encontrado');
        this.router.navigate(['/sales']);
      },
    });
    this.reportApi.getDocumentStatuses('SALE').subscribe({
      next: (s) => this.availableStatuses.set(s),
      error: () => {},
    });
  }

  getStatusColor(code: string): string {
    return getDocumentStatusColor(code);
  }

  changeStatus(): void {
    const currentStatus = this.order()!.statusCode;
    if (!this.newStatus || (this.newStatus === currentStatus && !this.statusComment)) return;
    const id = this.order()!.id;
    this.api
      .changeStatus(id, { statusCode: this.newStatus, comment: this.statusComment || undefined })
      .subscribe({
        next: () => {
          const wasSame = this.newStatus === currentStatus;
          this.notify.success(wasSame ? 'Nota guardada' : 'Estado actualizado');
          this.statusComment = '';
          this.api.getSale(id).subscribe({
            next: (o) => {
              this.order.set(o);
              this.newStatus = o.statusCode;
            },
            error: () => this.notify.error('Error recargando pedido'),
          });
        },
        error: (e) => this.notify.error('Error', e.message),
      });
  }
}
