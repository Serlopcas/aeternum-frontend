import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  CreateInventoryAdjustmentRequest,
  InventoryAdjustmentReasonResponse,
  InventoryMovementResponse,
  PageResponse,
  VariantStockResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/inventory`;

  getVariantStock(variantId: number): Observable<VariantStockResponse> {
    return this.http.get<VariantStockResponse>(`${this.base}/variants/${variantId}/stock`);
  }

  getVariantMovements(
    variantId: number,
    params: { page?: number; size?: number },
  ): Observable<PageResponse<InventoryMovementResponse>> {
    let hp = new HttpParams();
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    return this.http.get<PageResponse<InventoryMovementResponse>>(
      `${this.base}/variants/${variantId}/movements`,
      { params: hp },
    );
  }

  getMovements(params: {
    variantId?: number;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<InventoryMovementResponse>> {
    let hp = new HttpParams();
    if (params.variantId) hp = hp.set('variantId', String(params.variantId));
    if (params.movementType) hp = hp.set('movementType', params.movementType);
    if (params.dateFrom) hp = hp.set('dateFrom', params.dateFrom + 'T00:00:00');
    if (params.dateTo) hp = hp.set('dateTo', params.dateTo + 'T23:59:59');
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<InventoryMovementResponse>>(`${this.base}/movements`, {
      params: hp,
    });
  }

  listVariantStocks(params: {
    query?: string;
    categoryId?: number;
    active?: boolean | null;
    page?: number;
    size?: number;
  }): Observable<PageResponse<VariantStockResponse>> {
    let hp = new HttpParams();
    if (params.query) hp = hp.set('query', params.query);
    if (params.categoryId) hp = hp.set('categoryId', String(params.categoryId));
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    hp = hp.set('sort', 'sku,asc');
    return this.http.get<PageResponse<VariantStockResponse>>(`${this.base}/stocks`, {
      params: hp,
    });
  }

  getAdjustmentReasons(): Observable<InventoryAdjustmentReasonResponse[]> {
    return this.http.get<InventoryAdjustmentReasonResponse[]>(`${this.base}/adjustment-reasons`);
  }

  createAdjustment(body: CreateInventoryAdjustmentRequest): Observable<InventoryMovementResponse> {
    return this.http.post<InventoryMovementResponse>(`${this.base}/adjustments`, body);
  }
}
