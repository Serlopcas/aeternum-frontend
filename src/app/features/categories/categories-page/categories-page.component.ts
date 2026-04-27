import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryResponse, CategoryTreeResponse } from '../../../core/models/api.models';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { NotificationService } from '../../../core/services/notification.service';
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

@Component({
  selector: 'app-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    PageHeaderComponent,
    PaginationComponent,
    SearchInputComponent,
    ActiveFilterComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  private readonly catApi = inject(CategoryApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  view = signal<'table' | 'tree'>(
    (localStorage.getItem('categories.view') as 'table' | 'tree') || 'table',
  );
  loading = signal(true);
  categories = signal<CategoryResponse[]>([]);
  allCategories = signal<CategoryResponse[]>([]);
  tree = signal<CategoryTreeResponse[]>([]);
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = signal<number>(Number(localStorage.getItem('categories.pageSize')) || 10);
  activeFilter = signal<boolean | null>(null);
  search = signal('');

  dialogOpen = signal(false);
  editing = signal(false);
  editId = signal<number | null>(null);
  formData = { name: '', categoryCode: '', parentId: null as number | null };
  private originalParentId: number | null = null;
  originalCategoryCode: string | null = null;
  parentLocked = false;

  codeLoading = signal(false);
  codeEdited = false;
  userTouchedCode = false;
  private codeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  suggestedCode = signal<string | null>(null);

  confirmCat = signal<CategoryResponse | null>(null);
  confirmDelete = signal<CategoryResponse | null>(null);

  ngOnInit(): void {
    this.loadAllCategories();
    // Load initial view depending on stored preference
    if (this.view() === 'tree') {
      this.loadTree();
    } else {
      this.loadCategories();
    }
  }

  ngOnDestroy(): void {
    if (this.codeDebounceTimer) {
      clearTimeout(this.codeDebounceTimer);
      this.codeDebounceTimer = null;
    }
  }

  private loadAllCategories(): void {
    this.catApi.getCategories({ size: 200, active: true }).subscribe({
      next: (r) => this.allCategories.set(r.content),
      error: () => this.notify.error('Error cargando listado de categorías'),
    });
  }

  loadCategories(): void {
    this.loading.set(true);
    this.catApi
      .getCategories({
        active: this.activeFilter(),
        page: this.page(),
        size: this.pageSize(),
        sort: 'name,asc',
        query: this.search() || null,
      })
      .subscribe({
        next: (res) => {
          this.categories.set(res.content);
          this.totalPages.set(res.totalPages);
          this.totalElements.set(res.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageSizeChange(n: number): void {
    this.pageSize.set(n);
    try {
      localStorage.setItem('categories.pageSize', String(n));
    } catch (e) {
      // ignore storage errors
    }
    this.page.set(0);
    this.loadCategories();
  }

  loadTree(): void {
    this.loading.set(true);
    this.catApi.getTree().subscribe({
      next: (t) => {
        this.tree.set(t);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setView(v: 'table' | 'tree'): void {
    this.view.set(v);
    try {
      localStorage.setItem('categories.view', v);
    } catch {}
    if (v === 'tree') {
      this.loadTree();
    } else {
      this.loadCategories();
    }
  }

  onSearch(q: string): void {
    this.search.set(q);
    this.page.set(0);
    this.loadCategories();
  }

  onActiveChange(val: boolean | null): void {
    this.activeFilter.set(val);
    this.page.set(0);
    this.loadCategories();
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadCategories();
  }

  getActiveColor(active: boolean): string {
    return getActiveStatusColor(active);
  }

  /**
   * Build the category path (excluding the category's own name).
   * Example: parent -> grandparent => "Grandparent / Parent"
   */
  getCategoryPath(cat: { parentCategoryId?: number | null }): string {
    const parts: string[] = [];
    let pid = cat.parentCategoryId ?? null;
    const seen = new Set<number>();
    const all = this.allCategories();
    while (pid != null && !seen.has(pid)) {
      seen.add(pid);
      const p = all.find((c) => c.id === pid);
      if (!p) break;
      parts.push(p.name);
      pid = p.parentCategoryId ?? null;
      if (parts.length > 20) break; // safeguard
    }
    return parts.reverse().join(' / ');
  }

  openCreateDialog(parentId?: number): void {
    this.editing.set(false);
    this.editId.set(null);
    this.formData = { name: '', categoryCode: '', parentId: parentId ?? null };
    this.codeEdited = false;
    this.userTouchedCode = false;
    this.originalCategoryCode = '';
    // clear any previous suggestion and pending debounce when opening
    this.suggestedCode.set(null);
    this.codeLoading.set(false);
    if (this.codeDebounceTimer) {
      clearTimeout(this.codeDebounceTimer);
      this.codeDebounceTimer = null;
    }
    // If a parentId is provided (from Añadir Subcategoría), lock the parent select in the modal
    this.parentLocked = parentId != null;
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    // clear suggestion and cancel any pending propose requests
    this.suggestedCode.set(null);
    this.codeLoading.set(false);
    this.userTouchedCode = false;
    if (this.codeDebounceTimer) {
      clearTimeout(this.codeDebounceTimer);
      this.codeDebounceTimer = null;
    }
    this.parentLocked = false;
  }

  openEditDialog(cat: CategoryResponse | CategoryTreeResponse): void {
    this.editing.set(true);
    this.editId.set(cat.id);
    // Load full details from API to ensure we have parentCategoryId
    this.catApi.getCategory(cat.id).subscribe({
      next: (full) => {
        const parentId = full.parentCategoryId ?? null;
        this.formData = {
          name: full.name,
          categoryCode: full.categoryCode ?? '',
          parentId: parentId,
        };
        // mark codeEdited true if there is an existing code, otherwise allow proposals to fill it
        this.codeEdited = !!(
          this.formData.categoryCode && this.formData.categoryCode.trim().length > 0
        );
        // remember original code so we don't show a "Sugerido" that matches it
        this.originalCategoryCode = this.formData.categoryCode ?? '';
        // clear any previous suggestion when editing an entry
        this.suggestedCode.set(null);
        this.codeLoading.set(false);
        if (this.codeDebounceTimer) {
          clearTimeout(this.codeDebounceTimer);
          this.codeDebounceTimer = null;
        }
        this.originalParentId = parentId;
        this.parentLocked = false;
        this.dialogOpen.set(true);
      },
      error: () => {
        // fallback to shallow data if API call fails
        const parentId = 'parentCategoryId' in cat ? (cat.parentCategoryId ?? null) : null;
        this.formData = {
          name: cat.name,
          categoryCode: cat.categoryCode ?? '',
          parentId: parentId,
        };
        this.codeEdited = !!(
          this.formData.categoryCode && this.formData.categoryCode.trim().length > 0
        );
        this.originalCategoryCode = this.formData.categoryCode ?? '';
        this.suggestedCode.set(null);
        this.codeLoading.set(false);
        if (this.codeDebounceTimer) {
          clearTimeout(this.codeDebounceTimer);
          this.codeDebounceTimer = null;
        }
        this.originalParentId = parentId;
        this.parentLocked = false;
        this.dialogOpen.set(true);
      },
    });
  }

  saveCategory(): void {
    if (!this.formData.name) {
      this.notify.error('El nombre es obligatorio');
      return;
    }
    const generatedCode = this.formData.categoryCode?.trim()
      ? this.formData.categoryCode.trim()
      : this.slugify(this.formData.name);
    const payload = {
      name: this.formData.name,
      categoryCode: generatedCode,
      parentCategoryId: this.formData.parentId,
    };
    const obs = this.editing()
      ? this.catApi.updateCategory(this.editId()!, payload)
      : this.catApi.createCategory(payload);
    obs.subscribe({
      next: () => {
        this.notify.success(this.editing() ? 'Categoría actualizada' : 'Categoría creada');
        // use centralized close to clear suggestion state
        this.closeDialog();
        this.loadCategories();
        this.loadAllCategories();
        if (this.view() === 'tree') this.loadTree();
      },
      error: (err) => this.notify.error('Error', err.message),
    });
  }

  onNameChange(value: string): void {
    this.formData.name = value;
    // reset codeEdited only when user cleared code explicitly
    // debounce propose
    if (this.codeDebounceTimer) clearTimeout(this.codeDebounceTimer);
    if (!value || value.trim().length < 3) {
      this.codeLoading.set(false);
      this.suggestedCode.set(null);
      return;
    }
    this.codeLoading.set(true);
    this.codeDebounceTimer = setTimeout(() => {
      this.proposeCode();
    }, 600);
  }

  onCodeInputChange(value: string): void {
    this.formData.categoryCode = value;
    // mark that the user interacted with the input
    this.userTouchedCode = true;
    if (!value || value.trim() === '') {
      this.codeEdited = false;
    } else {
      this.codeEdited = true;
    }
  }

  private proposeCode(): void {
    const name = this.formData.name?.trim();
    if (!name || name.length < 3) {
      this.codeLoading.set(false);
      return;
    }
    const parentId = this.formData.parentId;
    const excludeId = this.editing() ? this.editId() : null;
    this.catApi.getProposedCode(name, parentId, excludeId).subscribe({
      next: (r) => {
        this.suggestedCode.set(r.proposedCode);
        // auto-fill (or replace) only if user hasn't manually edited the code
        if (!this.codeEdited) {
          this.formData.categoryCode = r.proposedCode;
        }
        this.codeLoading.set(false);
      },
      error: () => {
        this.codeLoading.set(false);
        this.suggestedCode.set(null);
      },
    });
  }

  applySuggested(): void {
    const s = this.suggestedCode();
    if (!s) return;
    this.formData.categoryCode = s;
    // Treat applying the suggestion as not a manual edit so future proposals may overwrite
    this.codeEdited = false;
    this.suggestedCode.set(null);
    this.userTouchedCode = false;
  }

  /**
   * Whether the Código input should be enabled.
   * Keeps template expressions simple to avoid compiler warnings.
   */
  canEditCode(): boolean {
    const name = this.formData?.name;
    return !!(name && name.trim && name.trim().length >= 3);
  }

  onParentChange(newParentId: number | null): void {
    this.formData.parentId = newParentId;

    // If name is already filled, always trigger a code proposal for the new parent
    // (debounced like name changes). The proposal will not overwrite the Código
    // field when the user has manually edited it; it will update `suggestedCode`.
    if (this.formData.name && this.formData.name.trim().length >= 3) {
      if (this.codeDebounceTimer) clearTimeout(this.codeDebounceTimer);
      this.codeLoading.set(true);
      this.codeDebounceTimer = setTimeout(() => this.proposeCode(), 600);
    }
  }

  private slugify(input: string): string {
    if (!input) return '';
    return input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .slice(0, 30);
  }

  toggleStatus(cat: CategoryResponse): void {
    this.confirmCat.set(cat);
  }

  confirmToggle(): void {
    const cat = this.confirmCat();
    if (!cat) return;
    this.catApi.updateCategoryStatus(cat.id, { active: !cat.active }).subscribe({
      next: () => {
        this.notify.success(cat.active ? 'Categoría desactivada' : 'Categoría activada');
        this.confirmCat.set(null);
        this.loadCategories();
        this.loadAllCategories();
        if (this.view() === 'tree') this.loadTree();
      },
      error: (err) => {
        this.notify.error('Error', err.message);
        this.confirmCat.set(null);
      },
    });
  }

  deleteCategory(id: number): void {
    // open app confirm dialog instead of browser confirm
    const found =
      this.categories().find((c) => c.id === id) ||
      this.allCategories().find((c) => c.id === id) ||
      null;
    const payload: CategoryResponse = found
      ? found
      : ({
          id,
          categoryCode: '',
          name: '',
          description: null,
          parentCategoryId: null,
          parentCategoryName: null,
          active: true,
        } as CategoryResponse);
    this.confirmDelete.set(payload);
  }

  confirmDeleteAction(): void {
    const cat = this.confirmDelete();
    if (!cat) return;
    this.catApi.deleteCategory(cat.id).subscribe({
      next: () => {
        this.notify.success('Categoría borrada');
        this.confirmDelete.set(null);
        this.loadCategories();
        this.loadAllCategories();
        if (this.view() === 'tree') this.loadTree();
      },
      error: (err) => {
        this.notify.error('Error', err.message);
        this.confirmDelete.set(null);
      },
    });
  }
}
