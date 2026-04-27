import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../../core/models/api.models';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiErrorAlertComponent } from '../../../shared/components/api-error-alert/api-error-alert.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-change-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ApiErrorAlertComponent, PageHeaderComponent],
  templateUrl: './change-password-page.component.html',
  styleUrl: './change-password-page.component.scss',
})
export class ChangePasswordPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly notify = inject(NotificationService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  saving = signal(false);
  error = signal<ApiError | null>(null);

  onSubmit(): void {
    if (this.newPassword !== this.confirmPassword) return;
    this.saving.set(true);
    this.error.set(null);

    this.authApi
      .changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.notify.success('Contraseña cambiada correctamente');
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(err);
          this.saving.set(false);
        },
      });
  }
}
