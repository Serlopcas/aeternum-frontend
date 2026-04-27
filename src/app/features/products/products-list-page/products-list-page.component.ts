import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoryTreeResponse, ProductResponse } from '../../../core/models/api.models';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ActiveFilterComponent } from '../../../shared/components/active-filter/active-filter.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
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

interface ProductGroup {
  categoryName: string;
  products: ProductResponse[];
}

@Component({
  selector: 'app-products-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    PaginationComponent,
    SearchInputComponent,
    ActiveFilterComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './products-list-page.component.html',
  styleUrl: './products-list-page.component.scss',
})
export class ProductsListPageComponent implements OnInit {
  private readonly api = inject(ProductApiService);
  private readonly catApi = inject(CategoryApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  products = signal<ProductResponse[]>([]);
  flatCategories = signal<FlatCategory[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = signal<number>(Number(localStorage.getItem('products.pageSize')) || 10);
  activeFilter = signal<boolean | null>(null);
  search = signal('');
  categoryFilter = signal<number | undefined>(undefined);
  separateByCategory = signal(false);
  view = signal<'table' | 'cards'>(
    (localStorage.getItem('products.view') as 'table' | 'cards') || 'table',
  );
  confirmItem = signal<ProductResponse | null>(null);

  groupedProducts = computed<ProductGroup[]>(() => {
    if (!this.separateByCategory()) return [];
    const map = new Map<string, ProductResponse[]>();
    for (const p of this.products()) {
      const key = p.categoryName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([categoryName, products]) => ({
      categoryName,
      products,
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
      .getProducts({
        query: this.search() || undefined,
        categoryId: this.categoryFilter(),
        active: this.activeFilter(),
        page: this.page(),
        size: this.pageSize(),
      })
      .subscribe({
        next: (r) => {
          this.products.set(r.content);
          this.totalPages.set(r.totalPages);
          this.totalElements.set(r.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(q: string): void {
    this.search.set(q);
    this.page.set(0);
    this.load();
  }

  onActiveChange(v: boolean | null): void {
    this.activeFilter.set(v);
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
      localStorage.setItem('products.pageSize', String(n));
    } catch {
      /* ignore */
    }
    this.page.set(0);
    this.load();
  }

  setView(v: 'table' | 'cards'): void {
    this.view.set(v);
    try {
      localStorage.setItem('products.view', v);
    } catch {
      /* ignore */
    }
  }

  getActiveColor(active: boolean): string {
    return getActiveStatusColor(active);
  }

  askToggle(p: ProductResponse): void {
    this.confirmItem.set(p);
  }

  doToggle(): void {
    const p = this.confirmItem();
    if (!p) return;
    this.api.updateProductStatus(p.id, { active: !p.active }).subscribe({
      next: () => {
        this.notify.success(p.active ? 'Desactivado' : 'Activado');
        this.confirmItem.set(null);
        this.load();
      },
      error: (e) => {
        this.notify.error('Error', e.message);
        this.confirmItem.set(null);
      },
    });
  }
}
