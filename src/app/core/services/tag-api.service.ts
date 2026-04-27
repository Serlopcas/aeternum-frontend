import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  CreateTagRequest,
  PageResponse,
  TagResponse,
  UpdateTagRequest,
  UpdateTagStatusRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TagApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/tags`;

  // ─── Tag CRUD ───

  getTags(params: {
    active?: boolean | null;
    query?: string | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<TagResponse>> {
    let hp = new HttpParams();
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    if (params.query !== undefined && params.query !== null && params.query !== '')
      hp = hp.set('q', params.query);
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 50));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<TagResponse>>(this.base, { params: hp });
  }

  getTagsByGroup(group: string, active?: boolean | null): Observable<TagResponse[]> {
    let hp = new HttpParams();
    if (active !== undefined && active !== null) hp = hp.set('active', String(active));
    return this.http.get<TagResponse[]>(`${this.base}/group/${group}`, { params: hp });
  }

  getTag(id: number): Observable<TagResponse> {
    return this.http.get<TagResponse>(`${this.base}/${id}`);
  }

  createTag(body: CreateTagRequest): Observable<TagResponse> {
    return this.http.post<TagResponse>(this.base, body);
  }

  updateTag(id: number, body: UpdateTagRequest): Observable<TagResponse> {
    return this.http.put<TagResponse>(`${this.base}/${id}`, body);
  }

  updateTagStatus(id: number, body: UpdateTagStatusRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, body);
  }

  // ─── Product Tags ───

  getProductTags(productId: number): Observable<TagResponse[]> {
    return this.http.get<TagResponse[]>(`${this.base}/products/${productId}`);
  }

  addProductTag(productId: number, tagId: number): Observable<TagResponse> {
    return this.http.post<TagResponse>(`${this.base}/products/${productId}/${tagId}`, null);
  }

  removeProductTag(productId: number, tagId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${productId}/${tagId}`);
  }

  // ─── Variant Tags ───

  getVariantTags(variantId: number): Observable<TagResponse[]> {
    return this.http.get<TagResponse[]>(`${this.base}/variants/${variantId}`);
  }

  getEffectiveVariantTags(variantId: number): Observable<TagResponse[]> {
    return this.http.get<TagResponse[]>(`${this.base}/variants/${variantId}/effective`);
  }

  addVariantTag(variantId: number, tagId: number): Observable<TagResponse> {
    return this.http.post<TagResponse>(`${this.base}/variants/${variantId}/${tagId}`, null);
  }

  removeVariantTag(variantId: number, tagId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/variants/${variantId}/${tagId}`);
  }
}
