import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  UpdateProfileRequest,
  UserResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, body);
  }

  getMe(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/auth/me`);
  }

  updateMe(body: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.base}/auth/me`, body);
  }

  changePassword(body: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/auth/change-password`, body);
  }

  uploadAvatar(file: File): Observable<UserResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserResponse>(`${this.base}/auth/me/avatar`, formData);
  }

  deleteAvatar(): Observable<UserResponse> {
    return this.http.delete<UserResponse>(`${this.base}/auth/me/avatar`);
  }
}
