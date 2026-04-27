import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import { PageResponse, ProductVariantResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class VariantCatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/variants`;

  search(params: {
    query?: string;
    categoryId?: number;
    active?: boolean | null;
    sellable?: boolean | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<ProductVariantResponse>> {
    let hp = new HttpParams();
    if (params.query) hp = hp.set('query', params.query);
    if (params.categoryId) hp = hp.set('categoryId', String(params.categoryId));
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    if (params.sellable !== undefined && params.sellable !== null)
      hp = hp.set('sellable', String(params.sellable));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<ProductVariantResponse>>(this.base, { params: hp });
  }
}
