import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { AuthStateService } from '../state/auth-state.service';
import { authGuard, gestorGuard, guestGuard } from './auth.guard';

function mockAuth(overrides: { isAuthenticated?: boolean; isGestor?: boolean } = {}) {
  return {
    isAuthenticated: () => overrides.isAuthenticated ?? false,
    isGestor: () => overrides.isGestor ?? false,
  };
}

const DUMMY_ROUTE = {} as ActivatedRouteSnapshot;
const DUMMY_STATE = {} as RouterStateSnapshot;

describe('authGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns true when user is authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStateService, useValue: mockAuth({ isAuthenticated: true }) },
      ],
    });
    const result = TestBed.runInInjectionContext(() => authGuard(DUMMY_ROUTE, DUMMY_STATE));
    expect(result).toBe(true);
  });

  it('redirects to /login when not authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStateService, useValue: mockAuth({ isAuthenticated: false }) },
      ],
    });
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => authGuard(DUMMY_ROUTE, DUMMY_STATE));
    expect(router.serializeUrl(result as any)).toBe('/login');
  });
});

describe('guestGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns true when user is NOT authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStateService, useValue: mockAuth({ isAuthenticated: false }) },
      ],
    });
    const result = TestBed.runInInjectionContext(() => guestGuard(DUMMY_ROUTE, DUMMY_STATE));
    expect(result).toBe(true);
  });

  it('redirects to / when user IS authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStateService, useValue: mockAuth({ isAuthenticated: true }) },
      ],
    });
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => guestGuard(DUMMY_ROUTE, DUMMY_STATE));
    expect(router.serializeUrl(result as any)).toBe('/');
  });
});

describe('gestorGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns true when authenticated and is GESTOR', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStateService,
          useValue: mockAuth({ isAuthenticated: true, isGestor: true }),
        },
      ],
    });
    const result = TestBed.runInInjectionContext(() => gestorGuard(DUMMY_ROUTE, DUMMY_STATE));
    expect(result).toBe(true);
  });

  it('redirects to /forbidden when authenticated but NOT GESTOR', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStateService,
          useValue: mockAuth({ isAuthenticated: true, isGestor: false }),
        },
      ],
    });
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => gestorGuard(DUMMY_ROUTE, DUMMY_STATE));
    expect(router.serializeUrl(result as any)).toBe('/forbidden');
  });

  it('redirects to /login when NOT authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStateService,
          useValue: mockAuth({ isAuthenticated: false, isGestor: false }),
        },
      ],
    });
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => gestorGuard(DUMMY_ROUTE, DUMMY_STATE));
    expect(router.serializeUrl(result as any)).toBe('/login');
  });
});
