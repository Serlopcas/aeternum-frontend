import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  DashboardResponse,
  DocumentStatusResponse,
  MarginReportResponse,
  PageResponse,
  StockAlertResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getDocumentStatuses(type: 'PURCHASE' | 'SALE'): Observable<DocumentStatusResponse[]> {
    return this.http.get<DocumentStatusResponse[]>(`${this.base}/document-statuses`, {
      params: new HttpParams().set('type', type),
    });
  }

  getDashboard(dateFrom?: string, dateTo?: string): Observable<DashboardResponse> {
    let hp = new HttpParams();
    if (dateFrom) hp = hp.set('dateFrom', dateFrom);
    if (dateTo) hp = hp.set('dateTo', dateTo);
    return this.http.get<DashboardResponse>(`${this.base}/reports/dashboard`, { params: hp });
  }

  getStockAlerts(params: {
    onlySellable?: boolean | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<StockAlertResponse>> {
    let hp = new HttpParams();
    if (params.onlySellable !== undefined && params.onlySellable !== null)
      hp = hp.set('onlySellable', String(params.onlySellable));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<StockAlertResponse>>(`${this.base}/reports/stock-alerts`, {
      params: hp,
    });
  }

  getMarginReport(params: {
    dateFrom?: string;
    dateTo?: string;
    clientId?: number;
    productId?: number;
    variantId?: number;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<MarginReportResponse> {
    let hp = new HttpParams();
    if (params.dateFrom) hp = hp.set('dateFrom', params.dateFrom);
    if (params.dateTo) hp = hp.set('dateTo', params.dateTo);
    if (params.clientId) hp = hp.set('clientId', String(params.clientId));
    if (params.productId) hp = hp.set('productId', String(params.productId));
    if (params.variantId) hp = hp.set('variantId', String(params.variantId));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<MarginReportResponse>(`${this.base}/reports/margin`, { params: hp });
  }
}
