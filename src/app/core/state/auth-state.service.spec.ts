import { TestBed } from '@angular/core/testing';
import { UserResponse } from '../models/api.models';
import { AuthStateService } from './auth-state.service';

const TOKEN_KEY = 'aeternum.accessToken';
const USER_KEY = 'aeternum.accessToken.user';

const MOCK_USER: UserResponse = {
  id: 1,
  username: 'jdoe',
  email: 'jdoe@test.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  roles: ['GESTOR'],
  active: true,
  profileImageUrl: null,
};

function createService(): AuthStateService {
  TestBed.configureTestingModule({});
  return TestBed.inject(AuthStateService);
}

describe('AuthStateService', () => {
  afterEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('hydrate() — on construction', () => {
    it('starts unauthenticated when sessionStorage is empty', () => {
      const service = createService();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isLoading()).toBe(false);
      expect(service.accessToken()).toBeNull();
    });

    it('restores authenticated state when valid token + user in sessionStorage', () => {
      sessionStorage.setItem(TOKEN_KEY, 'stored-token');
      sessionStorage.setItem(USER_KEY, JSON.stringify(MOCK_USER));
      const service = createService();
      expect(service.isAuthenticated()).toBe(true);
      expect(service.accessToken()).toBe('stored-token');
      expect(service.user()?.id).toBe(1);
      expect(service.isLoading()).toBe(false);
    });

    it('clears auth when user JSON is malformed', () => {
      sessionStorage.setItem(TOKEN_KEY, 'token');
      sessionStorage.setItem(USER_KEY, '{{invalid json}}');
      const service = createService();
      expect(service.isAuthenticated()).toBe(false);
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('clears auth when token is present but user key is missing', () => {
      sessionStorage.setItem(TOKEN_KEY, 'token-only');
      const service = createService();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('setAuth()', () => {
    it('marks session as authenticated and stores data in sessionStorage', () => {
      const service = createService();
      service.setAuth('my-jwt', MOCK_USER);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.accessToken()).toBe('my-jwt');
      expect(service.user()).toEqual(MOCK_USER);
      expect(sessionStorage.getItem(TOKEN_KEY)).toBe('my-jwt');
      expect(JSON.parse(sessionStorage.getItem(USER_KEY)!)).toEqual(MOCK_USER);
    });

    it('sets isLoading to false after login', () => {
      const service = createService();
      service.setAuth('token', MOCK_USER);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('clearAuth()', () => {
    it('resets signal state to unauthenticated', () => {
      const service = createService();
      service.setAuth('token', MOCK_USER);
      service.clearAuth();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.accessToken()).toBeNull();
      expect(service.user()).toBeNull();
      expect(service.isLoading()).toBe(false);
    });

    it('removes both keys from sessionStorage', () => {
      const service = createService();
      service.setAuth('token', MOCK_USER);
      service.clearAuth();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(USER_KEY)).toBeNull();
    });
  });

  describe('updateUser()', () => {
    it('updates user signal without touching the access token', () => {
      const service = createService();
      service.setAuth('token', MOCK_USER);
      const updated = { ...MOCK_USER, firstName: 'Jane', email: 'jane@test.com' };
      service.updateUser(updated);
      expect(service.user()?.firstName).toBe('Jane');
      expect(service.accessToken()).toBe('token');
    });

    it('persists updated user to sessionStorage', () => {
      const service = createService();
      service.setAuth('token', MOCK_USER);
      service.updateUser({ ...MOCK_USER, email: 'new@email.com' });
      const stored = JSON.parse(sessionStorage.getItem(USER_KEY)!);
      expect(stored.email).toBe('new@email.com');
    });
  });

  describe('computed signals', () => {
    it('displayName combines firstName and lastName', () => {
      const service = createService();
      service.setAuth('t', MOCK_USER);
      expect(service.displayName()).toBe('John Doe');
    });

    it('displayName is empty string when no user', () => {
      const service = createService();
      expect(service.displayName()).toBe('');
    });

    it('roles() returns empty array when not authenticated', () => {
      const service = createService();
      expect(service.roles()).toEqual([]);
    });

    it('isGestor true when roles includes GESTOR', () => {
      const service = createService();
      service.setAuth('t', { ...MOCK_USER, roles: ['GESTOR', 'TRABAJADOR'] });
      expect(service.isGestor()).toBe(true);
    });

    it('isGestor false when GESTOR absent', () => {
      const service = createService();
      service.setAuth('t', { ...MOCK_USER, roles: ['TRABAJADOR'] });
      expect(service.isGestor()).toBe(false);
    });

    it('isTrabajador true when roles includes TRABAJADOR', () => {
      const service = createService();
      service.setAuth('t', { ...MOCK_USER, roles: ['TRABAJADOR'] });
      expect(service.isTrabajador()).toBe(true);
    });

    it('isConsulta true when roles includes CONSULTA', () => {
      const service = createService();
      service.setAuth('t', { ...MOCK_USER, roles: ['CONSULTA'] });
      expect(service.isConsulta()).toBe(true);
    });

    it('isConsulta false when CONSULTA absent', () => {
      const service = createService();
      service.setAuth('t', { ...MOCK_USER, roles: ['GESTOR'] });
      expect(service.isConsulta()).toBe(false);
    });
  });
});
