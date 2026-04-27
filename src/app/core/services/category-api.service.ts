import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  CategoryDetailResponse,
  CategoryResponse,
  CategoryTreeResponse,
  CreateCategoryRequest,
  PageResponse,
  UpdateCategoryRequest,
  UpdateUserStatusRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/categories`;

  getCategories(params: {
    active?: boolean | null;
    page?: number;
    size?: number;
    sort?: string;
    query?: string | null;
  }): Observable<PageResponse<CategoryResponse>> {
    let hp = new HttpParams();
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    if (params.query !== undefined && params.query !== null && params.query !== '')
      hp = hp.set('q', params.query);
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<CategoryResponse>>(this.base, { params: hp });
  }

  getTree(active?: boolean | null): Observable<CategoryTreeResponse[]> {
    let hp = new HttpParams();
    if (active !== undefined && active !== null) hp = hp.set('active', String(active));
    return this.http.get<CategoryTreeResponse[]>(`${this.base}/tree`, { params: hp });
  }

  getCategory(id: number, include?: string): Observable<CategoryDetailResponse> {
    let hp = new HttpParams();
    if (include) hp = hp.set('include', include);
    return this.http.get<CategoryDetailResponse>(`${this.base}/${id}`, { params: hp });
  }

  createCategory(body: CreateCategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.base, body);
  }

  updateCategory(id: number, body: UpdateCategoryRequest): Observable<CategoryResponse> {
    return this.http.patch<CategoryResponse>(`${this.base}/${id}`, body);
  }

  updateCategoryStatus(id: number, body: UpdateUserStatusRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, body);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getProposedCode(
    name: string,
    parentId?: number | null,
    excludeId?: number | null,
  ): Observable<{ proposedCode: string }> {
    let hp = new HttpParams().set('name', name);
    if (parentId !== undefined && parentId !== null) hp = hp.set('parentId', String(parentId));
    if (excludeId !== undefined && excludeId !== null) hp = hp.set('excludeId', String(excludeId));
    return this.http.get<{ proposedCode: string }>(`${this.base}/propose-code`, { params: hp });
  }
}
