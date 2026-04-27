import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CategoryTreeResponse,
  ProductResponse,
  ProductVariantResponse,
} from '../../../core/models/api.models';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { VariantCatalogApiService } from '../../../core/services/variant-catalog-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ActiveFilterComponent } from '../../../shared/components/active-filter/active-filter.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import {
  StatusBadgeComponent,
  getActiveStatusColor,
} from '../../../shared/components/status-badge/status-badge.component';

interface FlatCategory {
  id: number;
  label: string;
}

interface VariantGroup {
  categoryName: string;
  variants: ProductVariantResponse[];
}

@Component({
  selector: 'app-variants-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    DecimalPipe,
    PageHeaderComponent,
    SearchInputComponent,
    ActiveFilterComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './variants-catalog-page.component.html',
  styleUrl: './variants-catalog-page.component.scss',
})
export class VariantsCatalogPageComponent implements OnInit {
  private readonly api = inject(VariantCatalogApiService);
  private readonly catApi = inject(CategoryApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  variants = signal<ProductVariantResponse[]>([]);
  flatCategories = signal<FlatCategory[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = signal<number>(Number(localStorage.getItem('variants.pageSize')) || 10);
  activeFilter = signal<boolean | null>(null);
  search = signal('');
  categoryFilter = signal<number | undefined>(undefined);
  separateByCategory = signal(false);

  // Product selector dialog for creating variants
  productSelectorOpen = signal(false);
  productList = signal<ProductResponse[]>([]);
  productSearch = signal('');
  productSelectorCategory = signal<number | undefined>(undefined);

  groupedVariants = computed<VariantGroup[]>(() => {
    if (!this.separateByCategory()) return [];
    const map = new Map<string, ProductVariantResponse[]>();
    for (const v of this.variants()) {
      const key = v.categoryName ?? 'Sin categoría';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return Array.from(map.entries()).map(([categoryName, variants]) => ({
      categoryName,
      variants,
    }));
  });

  ngOnInit(): void {
    this.load();
    this.catApi.getTree(true).subscribe({
      next: (tree) => this.flatCategories.set(this.flattenTree(tree, 0)),
      error: () => this.notify.error('Error cargando categorías'),
    });
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

  load(): void {
    this.loading.set(true);
    this.api
      .search({
        query: this.search() || undefined,
        categoryId: this.categoryFilter(),
        active: this.activeFilter(),
        page: this.page(),
        size: this.pageSize(),
        sort: 'sku,asc',
      })
      .subscribe({
        next: (r) => {
          this.variants.set(r.content);
          this.totalPages.set(r.totalPages);
          this.totalElements.set(r.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.notify.error('Error cargando variantes');
          this.loading.set(false);
        },
      });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
    this.load();
  }

  onActiveFilter(value: boolean | null): void {
    this.activeFilter.set(value);
    this.page.set(0);
    this.load();
  }

  onCategoryChange(v: number | undefined): void {
    this.categoryFilter.set(v);
    this.page.set(0);
    this.load();
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.load();
  }

  onPageSizeChange(n: number): void {
    this.pageSize.set(n);
    try {
      localStorage.setItem('variants.pageSize', String(n));
    } catch {
      /* ignore */
    }
    this.page.set(0);
    this.load();
  }

  getActiveColor(active: boolean): string {
    return getActiveStatusColor(active);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="140" fill="%23E5E7EB"><rect width="180" height="140"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236B7280" font-size="12">Sin imagen</text></svg>';
  }

  openProductSelector(): void {
    this.productSearch.set('');
    // initialize modal category from page filter
    this.productSelectorCategory.set(this.categoryFilter());
    this.productSelectorOpen.set(true);
    this.loadProducts();
  }

  loadProducts(): void {
    // Load all matching products (no pagination) using a large size and current modal category
    this.productApi
      .getProducts({
        active: true,
        categoryId: this.productSelectorCategory() ?? undefined,
        query: this.productSearch() || undefined,
        size: 10000,
        sort: 'name,asc',
      })
      .subscribe({
        next: (r) => this.productList.set(r.content),
        error: () => this.notify.error('Error cargando productos'),
      });
  }

  onProductSelectorCategoryChange(catId: number | undefined): void {
    this.productSelectorCategory.set(catId);
    this.loadProducts();
  }

  onProductSearch(q: string): void {
    this.productSearch.set(q);
    this.loadProducts();
  }

  selectProduct(product: ProductResponse): void {
    this.productSelectorOpen.set(false);
    this.router.navigate(['/products', product.id], {
      queryParams: { tab: 'variants', newVariant: true },
    });
  }
}
