import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  ChangeStatusRequest,
  CreateSalesOrderLineRequest,
  CreateSalesOrderRequest,
  PageResponse,
  SalesOrderDetailResponse,
  SalesOrderLineResponse,
  SalesOrderResponse,
  UpdateSalesOrderLineRequest,
  UpdateSalesOrderRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SalesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/sales`;

  getSales(params: {
    status?: string;
    clientId?: number;
    dateFrom?: string;
    dateTo?: string;
    active?: boolean | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<SalesOrderResponse>> {
    let hp = new HttpParams();
    if (params.status) hp = hp.set('status', params.status);
    if (params.clientId) hp = hp.set('clientId', String(params.clientId));
    if (params.dateFrom) hp = hp.set('dateFrom', params.dateFrom);
    if (params.dateTo) hp = hp.set('dateTo', params.dateTo);
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<SalesOrderResponse>>(this.base, { params: hp });
  }

  getSale(id: number): Observable<SalesOrderDetailResponse> {
    return this.http.get<SalesOrderDetailResponse>(`${this.base}/${id}`);
  }

  createSale(body: CreateSalesOrderRequest): Observable<SalesOrderResponse> {
    return this.http.post<SalesOrderResponse>(this.base, body);
  }

  updateSale(id: number, body: UpdateSalesOrderRequest): Observable<SalesOrderResponse> {
    return this.http.patch<SalesOrderResponse>(`${this.base}/${id}`, body);
  }

  changeStatus(id: number, body: ChangeStatusRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, body);
  }

  addLine(saleId: number, body: CreateSalesOrderLineRequest): Observable<SalesOrderLineResponse> {
    return this.http.post<SalesOrderLineResponse>(`${this.base}/${saleId}/lines`, body);
  }

  updateLine(
    saleId: number,
    lineId: number,
    body: UpdateSalesOrderLineRequest,
  ): Observable<SalesOrderLineResponse> {
    return this.http.patch<SalesOrderLineResponse>(`${this.base}/${saleId}/lines/${lineId}`, body);
  }
}
