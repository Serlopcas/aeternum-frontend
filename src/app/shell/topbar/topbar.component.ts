import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/state/auth-state.service';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  protected readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  menuOpen = signal(false);

  initials(): string {
    const u = this.auth.user();
    if (!u) return '?';
    return (u.firstName.charAt(0) + u.lastName.charAt(0)).toUpperCase();
  }

  logout(): void {
    this.auth.clearAuth();
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore storage errors */
    }
    this.menuOpen.set(false);
    this.router.navigate(['/login']);
  }
}
