import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  CartValidationRequest,
  CartValidationResponse,
  PageResponse,
  SellableCatalogItemResponse,
  SupplierCatalogItemResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/catalog`;

  getPurchaseCatalog(
    supplierId: number,
    params: {
      query?: string;
      material?: string;
      finish?: string;
      color?: string;
      purity?: string;
      categoryId?: number | null;
      minCost?: number | null;
      maxCost?: number | null;
      preferredOnly?: boolean;
      page?: number;
      size?: number;
    },
  ): Observable<PageResponse<SupplierCatalogItemResponse>> {
    let hp = new HttpParams();
    if (params.query) hp = hp.set('query', params.query);
    if (params.material) hp = hp.set('material', params.material);
    if (params.finish) hp = hp.set('finish', params.finish);
    if (params.color) hp = hp.set('color', params.color);
    if (params.purity) hp = hp.set('purity', params.purity);
    if (params.categoryId != null) hp = hp.set('categoryId', String(params.categoryId));
    if (params.minCost != null) hp = hp.set('minCost', String(params.minCost));
    if (params.maxCost != null) hp = hp.set('maxCost', String(params.maxCost));
    if (params.preferredOnly) hp = hp.set('preferredOnly', 'true');
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 24));
    return this.http.get<PageResponse<SupplierCatalogItemResponse>>(
      `${this.base}/purchase/${supplierId}`,
      { params: hp },
    );
  }

  validatePurchaseCart(
    supplierId: number,
    body: CartValidationRequest,
  ): Observable<CartValidationResponse> {
    return this.http.post<CartValidationResponse>(
      `${this.base}/purchase/${supplierId}/validate`,
      body,
    );
  }

  getSellableCatalog(params: {
    query?: string;
    material?: string;
    finish?: string;
    color?: string;
    purity?: string;
    categoryId?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    stockOnly?: boolean;
    lowStockOnly?: boolean;
    page?: number;
    size?: number;
  }): Observable<PageResponse<SellableCatalogItemResponse>> {
    let hp = new HttpParams();
    if (params.query) hp = hp.set('query', params.query);
    if (params.material) hp = hp.set('material', params.material);
    if (params.finish) hp = hp.set('finish', params.finish);
    if (params.color) hp = hp.set('color', params.color);
    if (params.purity) hp = hp.set('purity', params.purity);
    if (params.categoryId != null) hp = hp.set('categoryId', String(params.categoryId));
    if (params.minPrice != null) hp = hp.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) hp = hp.set('maxPrice', String(params.maxPrice));
    if (params.stockOnly) hp = hp.set('stockOnly', 'true');
    if (params.lowStockOnly) hp = hp.set('lowStockOnly', 'true');
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 24));
    return this.http.get<PageResponse<SellableCatalogItemResponse>>(`${this.base}/sale`, {
      params: hp,
    });
  }

  validateSalesCart(body: CartValidationRequest): Observable<CartValidationResponse> {
    return this.http.post<CartValidationResponse>(`${this.base}/sale/validate`, body);
  }

  getSaleOptions(): Observable<{ materials: string[]; finishes: string[] }> {
    return this.http.get<{ materials: string[]; finishes: string[] }>(`${this.base}/sale/options`);
  }

  getPurchaseOptions(supplierId: number): Observable<{ materials: string[]; finishes: string[] }> {
    return this.http.get<{ materials: string[]; finishes: string[] }>(
      `${this.base}/purchase/${supplierId}/options`,
    );
  }
}
