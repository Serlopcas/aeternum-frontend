import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DocumentStatusResponse,
  PurchaseOrderDetailResponse,
} from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { PurchaseApiService } from '../../../core/services/purchase-api.service';
import { ReportApiService } from '../../../core/services/report-api.service';
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
} from '../../../shared/pipes/format.pipes';

@Component({
  selector: 'app-purchase-detail-page',
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
  ],
  templateUrl: './purchase-detail-page.component.html',
  styleUrl: './purchase-detail-page.component.scss',
})
export class PurchaseDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PurchaseApiService);
  private readonly reportApi = inject(ReportApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  order = signal<PurchaseOrderDetailResponse | null>(null);
  loading = signal(true);
  availableStatuses = signal<DocumentStatusResponse[]>([]);

  newStatus = '';
  statusComment = '';
  receiveComment = '';
  receiveQuantities: Record<number, number> = {};

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getPurchase(id).subscribe({
      next: (o) => {
        this.order.set(o);
        this.newStatus = o.statusCode;
        this.loading.set(false);
        o.lines.forEach((l) => (this.receiveQuantities[l.id] = 0));
      },
      error: () => {
        this.notify.error('Pedido no encontrado');
        this.router.navigate(['/purchases']);
      },
    });
    this.reportApi.getDocumentStatuses('PURCHASE').subscribe({
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
          this.notify.success(
            this.newStatus === currentStatus ? 'Nota guardada' : 'Estado actualizado',
          );
          this.statusComment = '';
          this.reload(id);
        },
        error: (e) => this.notify.error('Error', e.message),
      });
  }

  receiveOrder(): void {
    const lines = Object.entries(this.receiveQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([lineId, qty]) => ({ lineId: Number(lineId), quantityReceivedNow: qty }));
    if (lines.length === 0) {
      this.notify.warning('Introduce cantidades a recepcionar');
      return;
    }
    const id = this.order()!.id;
    this.api.receive(id, { comment: this.receiveComment || undefined, lines }).subscribe({
      next: () => {
        this.notify.success('Recepción registrada');
        this.receiveComment = '';
        this.reload(id);
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  private reload(id: number): void {
    this.api.getPurchase(id).subscribe({
      next: (o) => {
        this.order.set(o);
        this.newStatus = o.statusCode;
        o.lines.forEach((l) => (this.receiveQuantities[l.id] = 0));
      },
      error: () => this.notify.error('Error recargando pedido'),
    });
  }
}
