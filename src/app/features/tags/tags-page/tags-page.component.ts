import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TagResponse } from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { TagApiService } from '../../../core/services/tag-api.service';
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
  selector: 'app-tags-page',
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
  templateUrl: './tags-page.component.html',
  styleUrl: './tags-page.component.scss',
})
export class TagsPageComponent implements OnInit {
  private readonly tagApi = inject(TagApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  loading = signal(true);
  tags = signal<TagResponse[]>([]);
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = signal<number>(Number(localStorage.getItem('tags.pageSize')) || 25);
  activeFilter = signal<boolean | null>(null);
  search = signal('');
  groupFilter = signal<string | null>(null);

  dialogOpen = signal(false);
  editing = signal(false);
  editId = signal<number | null>(null);
  formData = {
    tagCode: '',
    name: '',
    tagGroup: '',
    description: '',
  };

  confirmTag = signal<TagResponse | null>(null);

  /** Known tag groups for the dropdown */
  tagGroups = signal<string[]>([]);

  ngOnInit(): void {
    this.loadTags();
    this.loadAllGroups();
  }

  /** Load all tag groups independently of current filters for the dialog dropdown */
  private loadAllGroups(): void {
    this.tagApi.getTags({ size: 200, sort: 'tagGroup,asc' }).subscribe({
      next: (res) => {
        const groups = new Set<string>(res.content.map((t) => t.tagGroup).filter(Boolean));
        const prev = this.tagGroups();
        prev.forEach((g) => groups.add(g));
        this.tagGroups.set([...groups].sort());
      },
    });
  }

  loadTags(): void {
    this.loading.set(true);
    this.tagApi
      .getTags({
        active: this.activeFilter(),
        query: this.search() || null,
        page: this.page(),
        size: this.pageSize(),
        sort: 'tagGroup,asc',
      })
      .subscribe({
        next: (res) => {
          this.tags.set(res.content);
          this.totalPages.set(res.totalPages);
          this.totalElements.set(res.totalElements);
          // Extract unique groups from loaded tags
          const groups = new Set<string>();
          res.content.forEach((t) => {
            if (t.tagGroup) groups.add(t.tagGroup);
          });
          // Merge with existing known groups
          const prev = this.tagGroups();
          prev.forEach((g) => groups.add(g));
          this.tagGroups.set([...groups].sort());
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageSizeChange(n: number): void {
    this.pageSize.set(n);
    try {
      localStorage.setItem('tags.pageSize', String(n));
    } catch {
      // ignore
    }
    this.page.set(0);
    this.loadTags();
  }

  onSearch(q: string): void {
    this.search.set(q);
    this.page.set(0);
    this.loadTags();
  }

  onActiveChange(val: boolean | null): void {
    this.activeFilter.set(val);
    this.page.set(0);
    this.loadTags();
  }

  onGroupChange(group: string | null): void {
    this.groupFilter.set(group);
    this.page.set(0);
    this.loadTags();
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadTags();
  }

  getActiveColor(active: boolean): string {
    return getActiveStatusColor(active);
  }

  // ─── Dialog ───

  openCreateDialog(): void {
    this.editing.set(false);
    this.editId.set(null);
    this.formData = { tagCode: '', name: '', tagGroup: '', description: '' };
    this.dialogOpen.set(true);
  }

  openEditDialog(tag: TagResponse): void {
    this.editing.set(true);
    this.editId.set(tag.id);
    this.formData = {
      tagCode: tag.tagCode,
      name: tag.name,
      tagGroup: tag.tagGroup,
      description: tag.description ?? '',
    };
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
  }

  saveTag(): void {
    if (!this.formData.name || !this.formData.tagGroup) {
      this.notify.error('El nombre y el grupo son obligatorios');
      return;
    }

    const payload = {
      tagCode: this.formData.tagCode.trim() || this.slugify(this.formData.name),
      name: this.formData.name,
      tagGroup: this.formData.tagGroup.trim(),
      description: this.formData.description || undefined,
    };

    const obs = this.editing()
      ? this.tagApi.updateTag(this.editId()!, payload)
      : this.tagApi.createTag(payload);

    obs.subscribe({
      next: () => {
        this.notify.success(this.editing() ? 'Etiqueta actualizada' : 'Etiqueta creada');
        this.closeDialog();
        this.loadTags();
      },
      error: (err) => this.notify.error('Error', err.message),
    });
  }

  // ─── Status toggle ───

  toggleStatus(tag: TagResponse): void {
    this.confirmTag.set(tag);
  }

  confirmToggle(): void {
    const tag = this.confirmTag();
    if (!tag) return;
    this.tagApi.updateTagStatus(tag.id, { active: !tag.active }).subscribe({
      next: () => {
        this.notify.success(tag.active ? 'Etiqueta desactivada' : 'Etiqueta activada');
        this.confirmTag.set(null);
        this.loadTags();
      },
      error: (err) => {
        this.notify.error('Error', err.message);
        this.confirmTag.set(null);
      },
    });
  }

  private slugify(input: string): string {
    if (!input) return '';
    return input
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '')
      .slice(0, 50);
  }
}
