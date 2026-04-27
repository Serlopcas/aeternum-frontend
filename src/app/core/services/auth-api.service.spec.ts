import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../config/environment';
import {
  AuthResponse,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserResponse,
} from '../models/api.models';
import { AuthApiService } from './auth-api.service';

const BASE = environment.apiBaseUrl;

const MOCK_USER: UserResponse = {
  id: 1,
  username: 'tester',
  email: 't@test.com',
  firstName: 'Test',
  lastName: 'Er',
  phone: null,
  roles: ['TRABAJADOR'],
  active: true,
  profileImageUrl: null,
};

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  describe('login()', () => {
    it('sends POST to /auth/login and returns AuthResponse', () => {
      const mockResponse: AuthResponse = { accessToken: 'tok', user: MOCK_USER };
      let result!: AuthResponse;
      service.login({ usernameOrEmail: 'tester', password: 'pass' }).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${BASE}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ usernameOrEmail: 'tester', password: 'pass' });
      req.flush(mockResponse);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMe()', () => {
    it('sends GET to /auth/me and returns UserResponse', () => {
      let result!: UserResponse;
      service.getMe().subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${BASE}/auth/me`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_USER);
      expect(result).toEqual(MOCK_USER);
    });
  });

  describe('updateMe()', () => {
    it('sends PATCH to /auth/me with the update body', () => {
      const body: UpdateProfileRequest = { firstName: 'Updated' };
      let result!: UserResponse;
      service.updateMe(body).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${BASE}/auth/me`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush({ ...MOCK_USER, firstName: 'Updated' });
      expect(result.firstName).toBe('Updated');
    });
  });

  describe('changePassword()', () => {
    it('sends PUT to /auth/change-password', () => {
      const body: ChangePasswordRequest = { currentPassword: 'old', newPassword: 'newPass1!' };
      service.changePassword(body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/auth/change-password`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(null);
    });
  });

  describe('deleteAvatar()', () => {
    it('sends DELETE to /auth/me/avatar', () => {
      service.deleteAvatar().subscribe();
      const req = httpTesting.expectOne(`${BASE}/auth/me/avatar`);
      expect(req.request.method).toBe('DELETE');
      req.flush(MOCK_USER);
    });
  });

  describe('uploadAvatar()', () => {
    it('sends POST to /auth/me/avatar with multipart FormData', () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      service.uploadAvatar(file).subscribe();
      const req = httpTesting.expectOne(`${BASE}/auth/me/avatar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush(MOCK_USER);
    });
  });
});
