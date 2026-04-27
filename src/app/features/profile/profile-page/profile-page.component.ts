import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError, UserResponse } from '../../../core/models/api.models';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ApiErrorAlertComponent } from '../../../shared/components/api-error-alert/api-error-alert.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ApiErrorAlertComponent, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  error = signal<ApiError | null>(null);
  user = signal<UserResponse | null>(null);
  avatarPreview = signal<string | null>(null);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';

  ngOnInit(): void {
    this.authApi.getMe().subscribe({
      next: (u) => {
        this.user.set(u);
        this.firstName = u.firstName;
        this.lastName = u.lastName;
        this.email = u.email;
        this.phone = u.phone ?? '';
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  onSave(): void {
    this.saving.set(true);
    this.error.set(null);

    this.authApi
      .updateMe({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone || null,
      })
      .subscribe({
        next: (u) => {
          this.user.set(u);
          this.authState.updateUser(u);
          this.notify.success('Perfil actualizado');
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(err);
          this.saving.set(false);
        },
      });
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return '?';
    return (u.firstName.charAt(0) + u.lastName.charAt(0)).toUpperCase();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    this.authApi.uploadAvatar(file).subscribe({
      next: (u) => {
        this.user.set(u);
        this.authState.updateUser(u);
        this.avatarPreview.set(null);
        this.notify.success('Foto de perfil actualizada');
      },
      error: (err) => {
        this.avatarPreview.set(null);
        this.notify.error('Error subiendo imagen', err.message);
      },
    });
  }

  deleteAvatar(): void {
    this.authApi.deleteAvatar().subscribe({
      next: (u) => {
        this.user.set(u);
        this.authState.updateUser(u);
        this.notify.success('Foto de perfil eliminada');
      },
      error: (err) => this.notify.error('Error eliminando imagen', err.message),
    });
  }
}
