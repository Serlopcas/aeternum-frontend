import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import {
  CategoryTreeResponse,
  InventoryAdjustmentReasonResponse,
  InventoryMovementResponse,
  PageResponse,
  ProductVariantResponse,
  VariantStockResponse,
} from '../../../core/models/api.models';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { InventoryApiService } from '../../../core/services/inventory-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { VariantCatalogApiService } from '../../../core/services/variant-catalog-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ActiveFilterComponent } from '../../../shared/components/active-filter/active-filter.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { DateTimeFormatPipe } from '../../../shared/pipes/format.pipes';

interface FlatCategory {
  id: number;
  label: string;
}

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-inventory-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    PaginationComponent,
    SearchInputComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ActiveFilterComponent,
    DateTimeFormatPipe,
  ],
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss',
})
export class InventoryPageComponent implements OnInit, OnDestroy {
  private readonly invApi = inject(InventoryApiService);
  private readonly varApi = inject(VariantCatalogApiService);
  private readonly catApi = inject(CategoryApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  tab = signal<'movements' | 'stock'>('movements');

  // ── Movements ──
  movLoading = signal(false);
  movPage = signal<PageResponse<InventoryMovementResponse> | null>(null);
  movQuery = '';
  movType = '';
  movDateFrom = '';
  movDateTo = '';
  movPageNum = 0;
  movPageSize = 10;
  protected movDate$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  // ── Stock tab ──
  stockLoading = signal(false);
  stockPage = signal<PageResponse<VariantStockResponse> | null>(null);
  stockSearch = '';
  stockCategoryFilter = signal<number | undefined>(undefined);
  stockActiveFilter = signal<boolean | null>(null);
  stockPageNum = 0;
  stockPageSize = 10;
  flatCategories = signal<FlatCategory[]>([]);

  // ── Legacy (kept for single-variant lookup backward compat) ──
  stockResult = signal<VariantStockResponse | null>(null);
  stockVariants = signal<ProductVariantResponse[]>([]);
  stockQuery = '';

  showAdjustDialog = false;
  adjustmentReasons = signal<InventoryAdjustmentReasonResponse[]>([]);
  adjQuery = '';
  adjVariants = signal<ProductVariantResponse[]>([]);
  adjSelectedVariant = signal<ProductVariantResponse | null>(null);
  adjType: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' = 'ADJUSTMENT_IN';
  adjQty = 1;
  adjReasonId: number | null = null;
  adjNotes = '';
  private readonly reasonRef = viewChild<NgModel>('reasonRef');

  ngOnInit(): void {
    this.movDate$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => {
      this.movPageNum = 0;
      this.loadMovements();
    });
    this.loadMovements();
    this.loadStocks();
    this.invApi.getAdjustmentReasons().subscribe({
      next: (r) => this.adjustmentReasons.set(r),
      error: () => this.notify.error('Error cargando motivos de ajuste'),
    });
    this.catApi.getTree(true).subscribe({
      next: (tree) => this.flatCategories.set(this.flattenTree(tree, 0)),
      error: () => this.notify.error('Error cargando categorías'),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchTab(t: 'movements' | 'stock'): void {
    this.tab.set(t);
  }

  loadMovements(): void {
    this.movLoading.set(true);
    this.invApi
      .getMovements({
        movementType: this.movType || undefined,
        dateFrom: this.movDateFrom || undefined,
        dateTo: this.movDateTo || undefined,
        page: this.movPageNum,
        size: this.movPageSize,
        sort: 'movementDate,desc',
      })
      .subscribe({
        next: (p) => {
          this.movPage.set(p);
          this.movLoading.set(false);
        },
        error: () => {
          this.movLoading.set(false);
          this.notify.error('Error cargando movimientos');
        },
      });
  }

  loadStocks(): void {
    this.stockLoading.set(true);
    this.invApi
      .listVariantStocks({
        query: this.stockSearch || undefined,
        categoryId: this.stockCategoryFilter(),
        active: this.stockActiveFilter(),
        page: this.stockPageNum,
        size: this.stockPageSize,
      })
      .subscribe({
        next: (p) => {
          this.stockPage.set(p);
          this.stockLoading.set(false);
        },
        error: () => {
          this.stockLoading.set(false);
          this.notify.error('Error cargando stock');
        },
      });
  }

  onStockSearch(val: string): void {
    this.stockSearch = val;
    this.stockPageNum = 0;
    this.loadStocks();
  }

  onStockCategoryChange(id: number | undefined): void {
    this.stockCategoryFilter.set(id);
    this.stockPageNum = 0;
    this.loadStocks();
  }

  onStockActiveFilter(val: boolean | null): void {
    this.stockActiveFilter.set(val);
    this.stockPageNum = 0;
    this.loadStocks();
  }

  onStockPageChange(p: number): void {
    this.stockPageNum = p;
    this.loadStocks();
  }

  private flattenTree(nodes: CategoryTreeResponse[], depth: number): FlatCategory[] {
    const result: FlatCategory[] = [];
    for (const node of nodes) {
      const prefix = '\u00a0\u00a0'.repeat(depth);
      result.push({ id: node.id, label: prefix + node.name });
      if (node.children?.length) {
        result.push(...this.flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }

  setCurrentMonth(): void {
    const now = new Date();
    this.movDateFrom = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    this.movDateTo = toDateStr(now);
    this.movPageNum = 0;
    this.loadMovements();
  }

  setLastMonth(): void {
    const now = new Date();
    this.movDateFrom = toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    this.movDateTo = toDateStr(new Date(now.getFullYear(), now.getMonth(), 0));
    this.movPageNum = 0;
    this.loadMovements();
  }

  setCurrentQuarter(): void {
    const now = new Date();
    const qStart = Math.floor(now.getMonth() / 3) * 3;
    this.movDateFrom = toDateStr(new Date(now.getFullYear(), qStart, 1));
    this.movDateTo = toDateStr(now);
    this.movPageNum = 0;
    this.loadMovements();
  }

  setCurrentYear(): void {
    this.movDateFrom = `${new Date().getFullYear()}-01-01`;
    this.movDateTo = toDateStr(new Date());
    this.movPageNum = 0;
    this.loadMovements();
  }

  getMovLabel(type: string): string {
    const map: Record<string, string> = {
      PURCHASE_IN: 'Entrada compra',
      SALE_OUT: 'Salida venta',
      ADJUSTMENT_IN: 'Ajuste +',
      ADJUSTMENT_OUT: 'Ajuste −',
    };
    return map[type] ?? type;
  }

  searchAdjVariant(): void {
    if (this.adjQuery.length < 2) {
      this.adjVariants.set([]);
      return;
    }
    this.varApi.search({ query: this.adjQuery, size: 8 }).subscribe({
      next: (p) => this.adjVariants.set(p.content),
      error: () => this.notify.error('Error buscando variantes'),
    });
  }

  selectAdjVariant(v: ProductVariantResponse): void {
    this.adjSelectedVariant.set(v);
    this.adjVariants.set([]);
    this.adjQuery = v.sku;
  }

  submitAdjustment(): void {
    this.reasonRef()?.control.markAsTouched();
    if (!this.adjSelectedVariant()) {
      this.notify.warning('Selecciona una variante');
      return;
    }
    if (!this.adjReasonId) {
      this.notify.warning('Selecciona un motivo');
      return;
    }
    if (this.adjQty < 1) {
      this.notify.warning('La cantidad debe ser al menos 1');
      return;
    }
    this.invApi
      .createAdjustment({
        variantId: this.adjSelectedVariant()!.id,
        movementType: this.adjType,
        quantity: this.adjQty,
        adjustmentReasonId: this.adjReasonId!,
        notes: this.adjNotes || undefined,
      })
      .subscribe({
        next: () => {
          this.notify.success('Ajuste creado');
          this.showAdjustDialog = false;
          this.adjSelectedVariant.set(null);
          this.adjQuery = '';
          this.adjQty = 1;
          this.adjReasonId = null;
          this.adjNotes = '';
          this.loadMovements();
          this.loadStocks();
        },
        error: (e) => this.notify.error('Error', e.message),
      });
  }
}
