import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateSupplierProductVariantRequest,
  InventoryMovementResponse,
  ProductImageResponse,
  ProductVariantDetailResponse,
  SupplierProductVariantResponse,
  SupplierResponse,
  SupplierVariantPurchaseCostHistoryResponse,
  UpdateProductImageRequest,
  UpdateProductVariantRequest,
  UpdateSupplierProductVariantRequest,
  VariantSalePriceHistoryResponse,
} from '../../../core/models/api.models';
import { InventoryApiService } from '../../../core/services/inventory-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { SupplierApiService } from '../../../core/services/supplier-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPipe, DateTimeFormatPipe } from '../../../shared/pipes/format.pipes';

@Component({
  selector: 'app-variant-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    CurrencyPipe,
    DateTimeFormatPipe,
  ],
  templateUrl: './variant-detail-page.component.html',
  styleUrl: './variant-detail-page.component.scss',
})
export class VariantDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ProductApiService);
  private readonly invApi = inject(InventoryApiService);
  private readonly supplierApi = inject(SupplierApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  variant = signal<ProductVariantDetailResponse | null>(null);
  loading = signal(true);
  tab = signal<'info' | 'images' | 'suppliers' | 'priceHistory' | 'movements'>('info');
  editMode = signal(false);
  productId = 0;
  private variantId = 0;
  form: UpdateProductVariantRequest = {};
  fromVariants = false;

  confirmToggle = signal(false);

  priceHistory = signal<VariantSalePriceHistoryResponse[]>([]);
  movements = signal<InventoryMovementResponse[]>([]);
  allSuppliers = signal<SupplierResponse[]>([]);

  supplierLinkDialogOpen = signal(false);
  editLinkId = signal<number | null>(null);
  linkForm = {
    supplierId: null as number | null,
    supplierReference: '',
    basePurchaseCost: 0,
    isPreferredSupplier: false,
    leadTimeDays: undefined as number | undefined,
  };

  costHistoryDialogOpen = signal(false);
  costHistory = signal<SupplierVariantPurchaseCostHistoryResponse[]>([]);

  // ─── Images ───
  imageDialogOpen = signal(false);
  editImageId = signal<number | null>(null);
  imageForm = { altText: '', displayOrder: 1, isPrimary: false };
  isFirstImage = signal(false);
  selectedFile: File | null = null;
  imagePreview = signal<string | null>(null);
  confirmDeleteImage = signal<ProductImageResponse | null>(null);

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('productId'));
    this.variantId = Number(this.route.snapshot.paramMap.get('variantId'));
    // Detect if user came from the variants catalog page
    const from = this.route.snapshot.queryParamMap.get('from');
    this.fromVariants = from === 'variants';
    this.loadVariant();
  }

  private loadVariant(): void {
    this.api.getVariant(this.productId, this.variantId).subscribe({
      next: (v) => {
        this.variant.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Variante no encontrada');
        this.router.navigate(['/products', this.productId]);
      },
    });
  }

  startEdit(): void {
    const v = this.variant()!;
    this.form = {
      sku: v.sku,
      material: v.material ?? '',
      finish: v.finish ?? '',
      color: v.color ?? '',
      purity: v.purity ?? '',
      weightGrams: v.weightGrams ?? undefined,
      baseSalePrice: v.baseSalePrice ?? undefined,
      minimumStock: v.minimumStock,
      isSellable: v.isSellable,
      internalNotes: v.internalNotes ?? '',
    };
    this.editMode.set(true);
  }

  saveVariant(): void {
    this.api.updateVariant(this.productId, this.variantId, this.form).subscribe({
      next: () => {
        this.notify.success('Variante actualizada');
        this.editMode.set(false);
        this.loadVariant();
      },
      error: (e) => this.notify.error('Error actualizando variante', e.message),
    });
  }

  toggleActive(): void {
    const v = this.variant();
    if (!v) return;
    this.api.updateVariantStatus(this.productId, this.variantId, { active: !v.active }).subscribe({
      next: () => {
        this.notify.success(v.active ? 'Variante desactivada' : 'Variante activada');
        this.confirmToggle.set(false);
        this.loadVariant();
      },
      error: (e) => this.notify.error('Error cambiando estado', e.message),
    });
  }

  goBack(): void {
    if (this.fromVariants) {
      this.router.navigate(['/variants']);
    } else {
      this.router.navigate(['/products', this.productId]);
    }
  }

  loadSuppliers(): void {
    this.tab.set('suppliers');
    if (!this.allSuppliers().length) {
      this.supplierApi.getSuppliers({ active: true, size: 200 }).subscribe({
        next: (r) => this.allSuppliers.set(r.content),
        error: () => this.notify.error('Error cargando proveedores'),
      });
    }
  }

  loadPriceHistory(): void {
    this.tab.set('priceHistory');
    this.api.getVariantPriceHistory(this.productId, this.variantId).subscribe({
      next: (h) => this.priceHistory.set(h),
      error: () => this.notify.error('Error cargando historial de precios'),
    });
  }

  getMovLabel(type: string): string {
    const labels: Record<string, string> = {
      PURCHASE_IN: 'Entrada compra',
      SALE_OUT: 'Salida venta',
      ADJUSTMENT_IN: 'Ajuste +',
      ADJUSTMENT_OUT: 'Ajuste −',
    };
    return labels[type] ?? type;
  }

  loadMovements(): void {
    this.tab.set('movements');
    this.invApi.getVariantMovements(this.variantId, { size: 50 }).subscribe({
      next: (r) => this.movements.set(r.content),
      error: () => this.notify.error('Error cargando movimientos'),
    });
  }

  openSupplierLinkDialog(): void {
    this.editLinkId.set(null);
    this.linkForm = {
      supplierId: null,
      supplierReference: '',
      basePurchaseCost: 0,
      leadTimeDays: undefined,
      isPreferredSupplier: false,
    };
    this.supplierLinkDialogOpen.set(true);
  }

  editSupplierLink(sl: SupplierProductVariantResponse): void {
    this.editLinkId.set(sl.id);
    this.linkForm = {
      supplierId: sl.supplierId,
      supplierReference: sl.supplierReference ?? '',
      basePurchaseCost: sl.basePurchaseCost,
      leadTimeDays: sl.leadTimeDays ?? undefined,
      isPreferredSupplier: sl.isPreferredSupplier,
    };
    this.supplierLinkDialogOpen.set(true);
  }

  saveSupplierLink(): void {
    const obs = this.editLinkId()
      ? this.api.updateVariantSupplier(
          this.productId,
          this.variantId,
          this.editLinkId()!,
          this.linkForm as UpdateSupplierProductVariantRequest,
        )
      : this.api.createVariantSupplier(
          this.productId,
          this.variantId,
          this.linkForm as CreateSupplierProductVariantRequest,
        );
    obs.subscribe({
      next: () => {
        this.notify.success(this.editLinkId() ? 'Vínculo actualizado' : 'Proveedor vinculado');
        this.supplierLinkDialogOpen.set(false);
        this.loadVariant();
      },
      error: (e) => this.notify.error('Error guardando vínculo', e.message),
    });
  }

  viewCostHistory(sl: SupplierProductVariantResponse): void {
    this.api.getVariantSupplierCostHistory(this.productId, this.variantId, sl.id).subscribe({
      next: (h) => {
        this.costHistory.set(h);
        this.costHistoryDialogOpen.set(true);
      },
      error: (e) => this.notify.error('Error cargando historial de costes', e.message),
    });
  }

  // ─── Images ───
  openImageDialog(): void {
    const activeImages = this.variant()?.images?.filter((i) => i.active) ?? [];
    const first = activeImages.length === 0;
    this.isFirstImage.set(first);
    this.editImageId.set(null);
    const nextOrder =
      activeImages.length > 0 ? Math.max(...activeImages.map((i) => i.displayOrder)) + 1 : 1;
    this.imageForm = { altText: '', displayOrder: nextOrder, isPrimary: first };
    this.selectedFile = null;
    this.imagePreview.set(null);
    this.imageDialogOpen.set(true);
  }

  editImage(img: ProductImageResponse): void {
    this.isFirstImage.set(false);
    this.editImageId.set(img.id);
    this.imageForm = {
      altText: img.altText ?? '',
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary,
    };
    this.selectedFile = null;
    this.imagePreview.set(img.publicUrl);
    this.imageDialogOpen.set(true);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  saveImage(): void {
    if (this.editImageId()) {
      this.api
        .updateVariantImage(
          this.productId,
          this.variantId,
          this.editImageId()!,
          this.imageForm as UpdateProductImageRequest,
        )
        .subscribe({
          next: () => {
            this.notify.success('Imagen actualizada');
            this.imageDialogOpen.set(false);
            this.loadVariant();
          },
          error: (e) => this.notify.error('Error', e.message),
        });
    } else {
      if (!this.selectedFile) {
        this.notify.error('Selecciona un archivo de imagen');
        return;
      }
      this.api
        .createVariantImage(this.productId, this.variantId, this.selectedFile, this.imageForm)
        .subscribe({
          next: () => {
            this.notify.success('Imagen añadida');
            this.imageDialogOpen.set(false);
            this.loadVariant();
          },
          error: (e) => this.notify.error('Error', e.message),
        });
    }
  }

  askDeleteImage(img: ProductImageResponse): void {
    this.confirmDeleteImage.set(img);
  }

  doDeleteImage(): void {
    const img = this.confirmDeleteImage();
    if (!img) return;
    this.api.deleteVariantImage(this.productId, this.variantId, img.id).subscribe({
      next: () => {
        this.notify.success('Imagen eliminada');
        this.confirmDeleteImage.set(null);
        this.loadVariant();
      },
      error: (e) => {
        this.notify.error('Error al eliminar imagen', e.message);
        this.confirmDeleteImage.set(null);
      },
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="140" fill="%23E5E7EB"><rect width="180" height="140"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236B7280" font-size="12">Sin imagen</text></svg>';
  }
}
