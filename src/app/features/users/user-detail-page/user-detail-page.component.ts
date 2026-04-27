import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoleResponse, UserResponse } from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  StatusBadgeComponent,
  getActiveStatusColor,
} from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-user-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './user-detail-page.component.html',
  styleUrl: './user-detail-page.component.scss',
})
export class UserDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userApi = inject(UserApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  user = signal<UserResponse | null>(null);
  allRoles = signal<RoleResponse[]>([]);
  loading = signal(true);
  confirmToggle = signal(false);
  showResetDialog = signal(false);
  newPassword = '';
  userRoles = signal<string[]>([]);
  private originalRoles: string[] = [];

  rolesDirty = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userApi.getUser(id).subscribe({
      next: (u) => {
        this.user.set(u);
        this.userRoles.set([...u.roles]);
        this.originalRoles = [...u.roles];
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Usuario no encontrado');
        this.router.navigate(['/users']);
      },
    });
    this.userApi.getRoles().subscribe({
      next: (r) => this.allRoles.set(r),
      error: () => this.notify.error('Error cargando roles'),
    });
  }

  getActiveColor(active: boolean): string {
    return getActiveStatusColor(active);
  }

  toggleRole(code: string): void {
    const current = this.userRoles();
    if (current.includes(code)) {
      this.userRoles.set(current.filter((r) => r !== code));
    } else {
      this.userRoles.set([...current, code]);
    }
    this.rolesDirty.set(
      JSON.stringify([...this.userRoles()].sort()) !==
        JSON.stringify([...this.originalRoles].sort()),
    );
  }

  saveRoles(): void {
    const u = this.user();
    if (!u) return;
    this.userApi.updateUserRoles(u.id, { roles: this.userRoles() }).subscribe({
      next: () => {
        this.originalRoles = [...this.userRoles()];
        this.rolesDirty.set(false);
        this.notify.success('Roles actualizados');
        this.userApi.getUser(u.id).subscribe({
          next: (updated) => this.user.set(updated),
          error: () => this.notify.error('Error recargando usuario'),
        });
      },
      error: (err) => this.notify.error('Error', err.message),
    });
  }

  toggleStatus(): void {
    const u = this.user();
    if (!u) return;
    this.userApi.updateUserStatus(u.id, { active: !u.active }).subscribe({
      next: () => {
        this.confirmToggle.set(false);
        this.notify.success(u.active ? 'Usuario desactivado' : 'Usuario activado');
        this.userApi.getUser(u.id).subscribe({
          next: (updated) => this.user.set(updated),
          error: () => this.notify.error('Error recargando usuario'),
        });
      },
      error: (err) => {
        this.notify.error('Error', err.message);
        this.confirmToggle.set(false);
      },
    });
  }

  resetPassword(): void {
    const u = this.user();
    if (!u) return;
    this.userApi.resetPassword(u.id, this.newPassword).subscribe({
      next: () => {
        this.notify.success('Contraseña restablecida correctamente');
        this.showResetDialog.set(false);
        this.newPassword = '';
      },
      error: (err) => this.notify.error('Error', err.message),
    });
  }
}
