import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  PageResponse,
  RegisterRequest,
  RoleResponse,
  UpdateUserRolesRequest,
  UpdateUserStatusRequest,
  UserResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/users`;

  getUsers(params: {
    active?: boolean | null;
    role?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<UserResponse>> {
    let hp = new HttpParams();
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    if (params.role) hp = hp.set('role', params.role);
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<UserResponse>>(this.base, { params: hp });
  }

  getUser(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/${id}`);
  }

  createUser(body: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.base, body);
  }

  updateUserStatus(id: number, body: UpdateUserStatusRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, body);
  }

  updateUserRoles(id: number, body: UpdateUserRolesRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/roles`, body);
  }

  resetPassword(id: number, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/reset-password`, { newPassword });
  }

  getRoles(): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>(`${environment.apiBaseUrl}/roles`);
  }
}
