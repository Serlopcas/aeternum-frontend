import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiError } from '../../../core/models/api.models';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { AboutDialogComponent } from '../../../shared/components/about-dialog/about-dialog.component';
import { ApiErrorAlertComponent } from '../../../shared/components/api-error-alert/api-error-alert.component';
import { ToastOutletComponent } from '../../../shared/components/toast-outlet/toast-outlet.component';
import { FooterComponent } from '../../../shell/footer/footer.component';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ApiErrorAlertComponent, ToastOutletComponent, FooterComponent, AboutDialogComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal<ApiError | null>(null);
  aboutOpen = signal(false);

  onSubmit(): void {
    // Clear all cached data before starting the login process
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore storage errors */
    }

    this.loading.set(true);
    this.error.set(null);

    this.authApi
      .login({
        usernameOrEmail: this.username,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.authState.setAuth(res.accessToken, res.user);
          this.loading.set(false);
          this.router.navigate(['/']);
        },
        error: (err: ApiError) => {
          this.error.set(err);
          this.loading.set(false);
        },
      });
  }
}
