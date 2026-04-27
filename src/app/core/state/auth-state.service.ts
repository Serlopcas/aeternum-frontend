import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../config/environment';
import { AuthState, UserResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly state = signal<AuthState>({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  readonly accessToken = computed(() => this.state().accessToken);
  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => this.state().isAuthenticated);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly roles = computed(() => this.state().user?.roles ?? []);
  readonly isGestor = computed(() => this.roles().includes('GESTOR'));
  readonly isTrabajador = computed(() => this.roles().includes('TRABAJADOR'));
  readonly isConsulta = computed(() => this.roles().includes('CONSULTA'));
  readonly displayName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  constructor() {
    this.hydrate();
  }

  setAuth(token: string, user: UserResponse): void {
    sessionStorage.setItem(environment.tokenKey, token);
    sessionStorage.setItem(environment.tokenKey + '.user', JSON.stringify(user));
    this.state.set({
      accessToken: token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }

  updateUser(user: UserResponse): void {
    sessionStorage.setItem(environment.tokenKey + '.user', JSON.stringify(user));
    this.state.update((s) => ({ ...s, user }));
  }

  clearAuth(): void {
    sessionStorage.removeItem(environment.tokenKey);
    sessionStorage.removeItem(environment.tokenKey + '.user');
    this.state.set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }

  private hydrate(): void {
    const token = sessionStorage.getItem(environment.tokenKey);
    const userJson = sessionStorage.getItem(environment.tokenKey + '.user');
    if (token && userJson) {
      try {
        const user: UserResponse = JSON.parse(userJson);
        this.state.set({
          accessToken: token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        this.clearAuth();
      }
    } else {
      this.state.update((s) => ({ ...s, isLoading: false }));
    }
  }
}
