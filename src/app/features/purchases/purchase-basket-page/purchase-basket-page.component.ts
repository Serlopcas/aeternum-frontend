import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, forkJoin } from 'rxjs';
import {
  CategoryTreeResponse,
  ColorResponse,
  PageResponse,
  PurchaseDraftMeta,
  SupplierCatalogItemResponse,
  SupplierResponse,
} from '../../../core/models/api.models';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PurchaseApiService } from '../../../core/services/purchase-api.service';
import { PurchaseBasketService } from '../../../core/services/purchase-basket.service';
import { ReferenceDataCacheService } from '../../../core/services/reference-data-cache.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CurrencyPipe } from '../../../shared/pipes/format.pipes';

interface FlatCategory {
  id: number;
  label: string;
}

@Component({
  selector: 'app-purchase-basket-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    CurrencyPipe,
  ],
  templateUrl: './purchase-basket-page.component.html',
  styleUrl: './purchase-basket-page.component.scss',
})
export class PurchaseBasketPageComponent implements OnInit {
  protected readonly basket = inject(PurchaseBasketService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly purchaseApi = inject(PurchaseApiService);
  private readonly referenceData = inject(ReferenceDataCacheService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ── Lists ──
  suppliers = signal<SupplierResponse[]>([]);
  categories = signal<FlatCategory[]>([]);
  colors = signal<ColorResponse[]>([]);
  materials = signal<string[]>([]);
  finishes = signal<string[]>([]);

  // ── Catalog state ──
  catalogPage = signal<PageResponse<SupplierCatalogItemResponse> | null>(null);
  catalogLoading = signal(false);
  currentPage = signal(0);

  // ── Filters ──
  filterQuery = '';
  filterCategoryId: number | null = null;
  filterMaterial = '';
  filterFinish = '';
  filterColor = '';
  filterPreferredOnly = false;

  // ── UI state ──
  clearConfirm = signal(false);
  submitting = signal(false);
  showDrafts = signal(false);

  // ── Drafts ──
  drafts = computed(() => this.basket.draftsIndex());

  private readonly querySubject = new Subject<void>();

  ngOnInit(): void {
    this.basket.resetActive();
    forkJoin({
      suppliers: this.referenceData.getActiveSuppliers(),
      categories: this.referenceData.getActiveCategoryTree(),
      colors: this.referenceData.getColors(),
    }).subscribe({
      next: ({ suppliers, categories, colors }) => {
        this.suppliers.set(suppliers);
        this.categories.set(this.flattenTree(categories, 0));
        this.colors.set(colors);
      },
      error: () => {
        this.notify.error('Error cargando datos de apoyo');
      },
    });
    this.basket.loadDraftsIndex();
    const drafts = this.basket.draftsIndex();
    if (drafts.length > 0) this.showDrafts.set(true);

    this.querySubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.currentPage.set(0);
      this.loadCatalog();
    });
  }

  private flattenTree(nodes: CategoryTreeResponse[], depth: number): FlatCategory[] {
    const result: FlatCategory[] = [];
    for (const node of nodes) {
      const prefix = '\u00a0\u00a0'.repeat(depth);
      result.push({ id: node.id, label: prefix + node.name });
      if (node.children?.length) result.push(...this.flattenTree(node.children, depth + 1));
    }
    return result;
  }

  onSupplierChange(supplierId: number | null): void {
    if (!supplierId) return;
    const s = this.suppliers().find((s) => s.id === +supplierId);
    if (s) {
      this.basket.setSupplier(s.id, s.name);
      this.currentPage.set(0);
      this.loadCatalog();
      this.catalogApi.getPurchaseOptions(s.id).subscribe({
        next: (opts) => {
          this.materials.set(opts.materials);
          this.finishes.set(opts.finishes);
        },
        error: () => {},
      });
    }
  }

  onQueryInput(): void {
    this.querySubject.next();
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadCatalog();
  }

  loadCatalog(): void {
    const sid = this.basket.activeSupplierId();
    if (!sid) return;
    this.catalogLoading.set(true);
    this.catalogApi
      .getPurchaseCatalog(sid, {
        query: this.filterQuery || undefined,
        material: this.filterMaterial || undefined,
        finish: this.filterFinish || undefined,
        color: this.filterColor || undefined,
        categoryId: this.filterCategoryId ?? undefined,
        preferredOnly: this.filterPreferredOnly || undefined,
        page: this.currentPage(),
        size: 24,
      })
      .subscribe({
        next: (page) => {
          this.catalogPage.set(page);
          this.catalogLoading.set(false);
        },
        error: () => {
          this.notify.error('Error cargando catálogo');
          this.catalogLoading.set(false);
        },
      });
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.loadCatalog();
    }
  }

  nextPage(): void {
    const page = this.catalogPage();
    if (page && !page.last) {
      this.currentPage.update((p) => p + 1);
      this.loadCatalog();
    }
  }

  addToCart(item: SupplierCatalogItemResponse): void {
    this.basket.addLine(item, 1);
  }

  isInCart(variantId: number): boolean {
    return this.basket.lines().some((l) => l.variantId === variantId);
  }

  getCartQty(variantId: number): number {
    return this.basket.lines().find((l) => l.variantId === variantId)?.quantityOrdered ?? 0;
  }

  saveDraft(): void {
    this.basket.saveDraftExplicit();
    this.notify.success('Borrador guardado');
    this.showDrafts.set(true);
  }

  loadDraft(meta: PurchaseDraftMeta): void {
    const s = this.suppliers().find((s) => s.id === meta.supplierId);
    this.basket.setSupplier(meta.supplierId, meta.supplierName);
    if (s) this.loadCatalog();
    this.notify.success(`Borrador de ${meta.supplierName} recuperado`);
  }

  deleteDraft(meta: PurchaseDraftMeta, event: Event): void {
    event.stopPropagation();
    this.basket.deleteDraft(meta.supplierId);
    this.notify.success('Borrador eliminado');
  }

  submitOrder(): void {
    if (!this.basket.supplierId()) {
      this.notify.warning('Selecciona un proveedor');
      return;
    }
    if (this.basket.lineCount() === 0) {
      this.notify.warning('Añade al menos una línea');
      return;
    }
    this.submitting.set(true);
    const b = this.basket.basket();
    this.purchaseApi
      .createPurchase({
        supplierId: b.supplierId!,
        documentDate: b.documentDate ?? undefined,
        expectedDeliveryDate: b.expectedDeliveryDate ?? undefined,
        internalNotes: b.internalNotes || undefined,
        lines: b.lines.map((l) => ({
          variantId: l.variantId,
          quantityOrdered: l.quantityOrdered,
          unitCostSnapshot: l.unitCostSnapshot,
          discountPercent: l.discountPercent || undefined,
          taxPercent: l.taxPercent || undefined,
          notes: l.notes || undefined,
        })),
      })
      .subscribe({
        next: (po) => {
          this.notify.success('Pedido de compra creado');
          this.basket.deleteDraft(b.supplierId!);
          this.submitting.set(false);
          this.router.navigate(['/purchases', po.id]);
        },
        error: (e) => {
          this.notify.error('Error creando pedido', e?.error?.message ?? e?.message);
          this.submitting.set(false);
        },
      });
  }
}
