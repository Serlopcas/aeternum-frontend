import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError, AuthResponse, UserResponse } from '../../../core/models/api.models';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { LoginPageComponent } from './login-page.component';

const MOCK_USER: UserResponse = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  phone: null,
  roles: ['GESTOR'],
  active: true,
  profileImageUrl: null,
};

const AUTH_RESPONSE: AuthResponse = {
  accessToken: 'jwt-token',
  user: MOCK_USER,
};

const API_ERROR: ApiError = {
  status: 401,
  error: 'Unauthorized',
  message: 'Credenciales incorrectas',
  fieldErrors: null,
};

describe('LoginPageComponent', () => {
  let authApiSpy: { login: ReturnType<typeof vi.fn> };
  let authStateSpy: { setAuth: ReturnType<typeof vi.fn> };

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  function setup() {
    authApiSpy = { login: vi.fn() };
    authStateSpy = { setAuth: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: AuthStateService, useValue: authStateSpy },
        NotificationService,
      ],
    });

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return { component, router };
  }

  it('creates the component', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  it('starts with loading=false and no error', () => {
    const { component } = setup();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  describe('onSubmit() — successful login', () => {
    it('calls authApi.login with provided credentials', () => {
      const { component } = setup();
      authApiSpy.login.mockReturnValue(of(AUTH_RESPONSE));
      component.username = 'admin';
      component.password = 'secret';
      component.onSubmit();
      expect(authApiSpy.login).toHaveBeenCalledWith({
        usernameOrEmail: 'admin',
        password: 'secret',
      });
    });

    it('calls authState.setAuth with the response data', () => {
      const { component } = setup();
      authApiSpy.login.mockReturnValue(of(AUTH_RESPONSE));
      component.onSubmit();
      expect(authStateSpy.setAuth).toHaveBeenCalledWith('jwt-token', MOCK_USER);
    });

    it('navigates to / after successful login', () => {
      const { component, router } = setup();
      authApiSpy.login.mockReturnValue(of(AUTH_RESPONSE));
      component.onSubmit();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('sets loading to false after response', () => {
      const { component } = setup();
      authApiSpy.login.mockReturnValue(of(AUTH_RESPONSE));
      component.onSubmit();
      expect(component.loading()).toBe(false);
    });

    it('clears storage before login attempt', () => {
      sessionStorage.setItem('old-key', 'old-value');
      localStorage.setItem('another-key', 'data');
      const { component } = setup();
      authApiSpy.login.mockReturnValue(of(AUTH_RESPONSE));
      component.onSubmit();
      expect(sessionStorage.getItem('old-key')).toBeNull();
    });
  });

  describe('onSubmit() — failed login', () => {
    it('sets the error signal on API error', () => {
      const { component } = setup();
      authApiSpy.login.mockReturnValue(throwError(() => API_ERROR));
      component.onSubmit();
      expect(component.error()).toEqual(API_ERROR);
    });

    it('sets loading to false after error', () => {
      const { component } = setup();
      authApiSpy.login.mockReturnValue(throwError(() => API_ERROR));
      component.loading.set(true);
      component.onSubmit();
      expect(component.loading()).toBe(false);
    });

    it('does NOT call authState.setAuth on failure', () => {
      const { component } = setup();
      authApiSpy.login.mockReturnValue(throwError(() => API_ERROR));
      component.onSubmit();
      expect(authStateSpy.setAuth).not.toHaveBeenCalled();
    });

    it('clears a previous error before a new attempt', () => {
      const { component } = setup();
      component.error.set(API_ERROR);
      authApiSpy.login.mockReturnValue(of(AUTH_RESPONSE));
      component.onSubmit();
      expect(component.error()).toBeNull();
    });
  });
});
