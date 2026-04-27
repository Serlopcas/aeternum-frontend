import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthStateService } from '../state/auth-state.service';
import { authInterceptor } from './auth.interceptor';

const TEST_URL = 'http://localhost:8080/api/products';
const LOGIN_URL = 'http://localhost:8080/api/auth/login';

function makeAuthState(token: string | null, clearAuth = vi.fn()) {
  return { accessToken: () => token, clearAuth };
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let router: Router;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clearAuthSpy: any;

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  function setup(token: string | null) {
    clearAuthSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStateService, useValue: makeAuthState(token, clearAuthSpy) },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }

  describe('Authorization header', () => {
    it('adds Bearer token to non-login requests when token is present', () => {
      setup('my-jwt');
      http.get(TEST_URL).subscribe();
      const req = httpTesting.expectOne(TEST_URL);
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt');
      req.flush({});
    });

    it('does NOT add Authorization header when token is null', () => {
      setup(null);
      http.get(TEST_URL).subscribe();
      const req = httpTesting.expectOne(TEST_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('does NOT add Authorization header for login requests (even with token)', () => {
      setup('existing-token');
      http.post(LOGIN_URL, {}).subscribe();
      const req = httpTesting.expectOne(LOGIN_URL);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ accessToken: 'new-token', user: {} });
    });
  });

  describe('401 handling', () => {
    it('calls clearAuth and navigates to /login on 401 from a non-login endpoint', () => {
      setup('expired-token');
      let errorCaught = false;
      http.get(TEST_URL).subscribe({ error: () => (errorCaught = true) });
      httpTesting.expectOne(TEST_URL).flush('Unauthorized', {
        status: 401,
        statusText: 'Unauthorized',
      });
      expect(clearAuthSpy).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(errorCaught).toBe(true);
    });

    it('does NOT call clearAuth on 401 from the login endpoint', () => {
      setup(null);
      http.post(LOGIN_URL, {}).subscribe({ error: () => {} });
      httpTesting.expectOne(LOGIN_URL).flush('Bad credentials', {
        status: 401,
        statusText: 'Unauthorized',
      });
      expect(clearAuthSpy).not.toHaveBeenCalled();
    });
  });

  describe('error normalization', () => {
    it('wraps HTTP error into ApiError shape when no .status field on body', () => {
      setup('token');
      let apiError: any;
      http.get(TEST_URL).subscribe({ error: (e) => (apiError = e) });
      httpTesting
        .expectOne(TEST_URL)
        .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
      expect(apiError.status).toBe(404);
      expect(apiError.message).toBe('Not Found');
    });

    it('passes through the error body as-is when it already has a .status field', () => {
      setup('token');
      let apiError: any;
      http.get(TEST_URL).subscribe({ error: (e) => (apiError = e) });
      const preFormatted = {
        status: 422,
        error: 'Unprocessable',
        message: 'Variant inactive',
        fieldErrors: null,
      };
      httpTesting.expectOne(TEST_URL).flush(preFormatted, {
        status: 422,
        statusText: 'Unprocessable Entity',
      });
      expect(apiError.status).toBe(422);
      expect(apiError.message).toBe('Variant inactive');
    });
  });
});
