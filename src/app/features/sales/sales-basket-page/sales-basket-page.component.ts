import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, forkJoin } from 'rxjs';
import {
  CategoryTreeResponse,
  ClientResponse,
  ColorResponse,
  PageResponse,
  SellableCatalogItemResponse,
} from '../../../core/models/api.models';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ReferenceDataCacheService } from '../../../core/services/reference-data-cache.service';
import { SalesApiService } from '../../../core/services/sales-api.service';
import { SalesBasketService } from '../../../core/services/sales-basket.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CurrencyPipe } from '../../../shared/pipes/format.pipes';

interface FlatCategory {
  id: number;
  label: string;
}

@Component({
  selector: 'app-sales-basket-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    CurrencyPipe,
  ],
  templateUrl: './sales-basket-page.component.html',
  styleUrl: './sales-basket-page.component.scss',
})
export class SalesBasketPageComponent implements OnInit {
  protected readonly basket = inject(SalesBasketService);
  private readonly salesApi = inject(SalesApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly referenceData = inject(ReferenceDataCacheService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ── Lists ──
  clients = signal<ClientResponse[]>([]);
  categories = signal<FlatCategory[]>([]);
  colors = signal<ColorResponse[]>([]);
  materials = signal<string[]>([]);
  finishes = signal<string[]>([]);

  // ── Catalog state ──
  catalogPage = signal<PageResponse<SellableCatalogItemResponse> | null>(null);
  catalogLoading = signal(false);
  currentPage = signal(0);

  // ── Filters ──
  filterQuery = '';
  filterCategoryId: number | null = null;
  filterMaterial = '';
  filterFinish = '';
  filterColor = '';
  filterStockOnly = false;

  // ── UI state ──
  clearConfirm = signal(false);
  submitting = signal(false);

  private readonly querySubject = new Subject<void>();

  ngOnInit(): void {
    this.basket.resetActive();
    forkJoin({
      clients: this.referenceData.getActiveClients(),
      categories: this.referenceData.getActiveCategoryTree(),
      colors: this.referenceData.getColors(),
      options: this.catalogApi.getSaleOptions(),
    }).subscribe({
      next: ({ clients, categories, colors, options }) => {
        this.clients.set(clients);
        this.categories.set(this.flattenTree(categories, 0));
        this.colors.set(colors);
        this.materials.set(options.materials);
        this.finishes.set(options.finishes);
      },
      error: () => {
        this.notify.error('Error cargando datos de apoyo');
      },
    });
    this.loadCatalog();

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

  onClientChange(clientId: number | null): void {
    if (!clientId) return;
    const c = this.clients().find((c) => c.id === +clientId);
    this.basket.setClientId(clientId, c?.name ?? '');
  }

  onQueryInput(): void {
    this.querySubject.next();
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.catalogLoading.set(true);
    this.catalogApi
      .getSellableCatalog({
        query: this.filterQuery || undefined,
        material: this.filterMaterial || undefined,
        finish: this.filterFinish || undefined,
        color: this.filterColor || undefined,
        categoryId: this.filterCategoryId ?? undefined,
        stockOnly: this.filterStockOnly || undefined,
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

  addToCart(item: SellableCatalogItemResponse): void {
    if (item.currentStock <= 0) {
      this.notify.warning('Sin stock disponible');
      return;
    }
    this.basket.addLine(item, 1);
  }

  isInCart(variantId: number): boolean {
    return this.basket.lines().some((l) => l.variantId === variantId);
  }

  getCartQty(variantId: number): number {
    return this.basket.lines().find((l) => l.variantId === variantId)?.quantitySold ?? 0;
  }

  submitOrder(): void {
    if (!this.basket.clientId()) {
      this.notify.warning('Selecciona un cliente');
      return;
    }
    if (this.basket.lineCount() === 0) {
      this.notify.warning('Añade al menos una línea');
      return;
    }
    this.submitting.set(true);
    const b = this.basket.basket();
    this.salesApi
      .createSale({
        clientId: b.clientId!,
        documentDate: b.documentDate ?? undefined,
        deliveryDate: b.deliveryDate ?? undefined,
        internalNotes: b.internalNotes || undefined,
        lines: b.lines.map((l) => ({
          variantId: l.variantId,
          quantitySold: l.quantitySold,
          unitPriceSnapshot: l.unitPriceSnapshot,
          unitCostSnapshot: l.unitCostSnapshot ?? undefined,
          discountPercent: l.discountPercent || undefined,
          taxPercent: l.taxPercent || undefined,
          notes: l.notes || undefined,
        })),
      })
      .subscribe({
        next: (so) => {
          this.notify.success('Pedido de venta creado');
          this.basket.clear();
          this.submitting.set(false);
          this.router.navigate(['/sales', so.id]);
        },
        error: (e) => {
          this.notify.error('Error creando pedido', e?.error?.message ?? e?.message);
          this.submitting.set(false);
        },
      });
  }
}
