import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  ChangeStatusRequest,
  CreatePurchaseOrderLineRequest,
  CreatePurchaseOrderRequest,
  PageResponse,
  PurchaseOrderDetailResponse,
  PurchaseOrderLineResponse,
  PurchaseOrderResponse,
  ReceivePurchaseOrderRequest,
  UpdatePurchaseOrderLineRequest,
  UpdatePurchaseOrderRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PurchaseApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/purchases`;

  getPurchases(params: {
    status?: string;
    supplierId?: number;
    dateFrom?: string;
    dateTo?: string;
    active?: boolean | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<PurchaseOrderResponse>> {
    let hp = new HttpParams();
    if (params.status) hp = hp.set('status', params.status);
    if (params.supplierId) hp = hp.set('supplierId', String(params.supplierId));
    if (params.dateFrom) hp = hp.set('dateFrom', params.dateFrom);
    if (params.dateTo) hp = hp.set('dateTo', params.dateTo);
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<PurchaseOrderResponse>>(this.base, { params: hp });
  }

  getPurchase(id: number): Observable<PurchaseOrderDetailResponse> {
    return this.http.get<PurchaseOrderDetailResponse>(`${this.base}/${id}`);
  }

  createPurchase(body: CreatePurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(this.base, body);
  }

  updatePurchase(id: number, body: UpdatePurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.http.patch<PurchaseOrderResponse>(`${this.base}/${id}`, body);
  }

  changeStatus(id: number, body: ChangeStatusRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, body);
  }

  addLine(
    purchaseId: number,
    body: CreatePurchaseOrderLineRequest,
  ): Observable<PurchaseOrderLineResponse> {
    return this.http.post<PurchaseOrderLineResponse>(`${this.base}/${purchaseId}/lines`, body);
  }

  updateLine(
    purchaseId: number,
    lineId: number,
    body: UpdatePurchaseOrderLineRequest,
  ): Observable<PurchaseOrderLineResponse> {
    return this.http.patch<PurchaseOrderLineResponse>(
      `${this.base}/${purchaseId}/lines/${lineId}`,
      body,
    );
  }

  receive(
    purchaseId: number,
    body: ReceivePurchaseOrderRequest,
  ): Observable<PurchaseOrderDetailResponse> {
    return this.http.post<PurchaseOrderDetailResponse>(`${this.base}/${purchaseId}/receive`, body);
  }
}
