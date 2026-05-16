import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RoleResponse, UserResponse } from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ActiveFilterComponent } from '../../../shared/components/active-filter/active-filter.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-users-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    PaginationComponent,
    ActiveFilterComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './users-list-page.component.html',
  styleUrl: './users-list-page.component.scss',
})
export class UsersListPageComponent implements OnInit {
  private readonly userApi = inject(UserApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  users = signal<UserResponse[]>([]);
  roles = signal<RoleResponse[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  activeFilter = signal<boolean | null>(null);
  roleFilter = signal('');
  showCreateDialog = signal(false);
  confirmToggle = signal<UserResponse | null>(null);
  newPassword = signal('');

  newUser = { username: '', email: '', password: '', firstName: '', lastName: '' };

  ngOnInit(): void {
    this.loadUsers();
    this.userApi.getRoles().subscribe({
      next: (r) => this.roles.set(r),
      error: () => this.notify.error('Error cargando roles'),
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userApi
      .getUsers({
        active: this.activeFilter(),
        role: this.roleFilter() || undefined,
        page: this.page(),
        size: 20,
        sort: 'username,asc',
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.content);
          this.totalPages.set(res.totalPages);
          this.totalElements.set(res.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onActiveChange(val: boolean | null): void {
    this.activeFilter.set(val);
    this.page.set(0);
    this.loadUsers();
  }

  onRoleChange(val: string): void {
    this.roleFilter.set(val);
    this.page.set(0);
    this.loadUsers();
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadUsers();
  }

  toggleUserStatus(user: UserResponse): void {
    this.confirmToggle.set(user);
  }

  confirmStatusChange(): void {
    const user = this.confirmToggle();
    if (!user) return;
    this.userApi.updateUserStatus(user.id, { active: !user.active }).subscribe({
      next: () => {
        this.notify.success(user.active ? 'Usuario desactivado' : 'Usuario activado');
        this.confirmToggle.set(null);
        this.loadUsers();
      },
      error: (err) => {
        this.notify.error('Error', err.message);
        this.confirmToggle.set(null);
      },
    });
  }

  createUser(): void {
    this.userApi.createUser(this.newUser).subscribe({
      next: (u) => {
        this.notify.success('Usuario creado');
        this.showCreateDialog.set(false);
        this.newUser = { username: '', email: '', password: '', firstName: '', lastName: '' };
        this.loadUsers();
      },
      error: (err) => this.notify.error('Error', err.message),
    });
  }
}
