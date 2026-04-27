import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  CreateSupplierAddressRequest,
  CreateSupplierContactRequest,
  CreateSupplierRequest,
  PageResponse,
  SupplierAddressResponse,
  SupplierCatalogItemResponse,
  SupplierContactResponse,
  SupplierDetailResponse,
  SupplierResponse,
  UpdateSupplierRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SupplierApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/suppliers`;

  getSuppliers(params: {
    active?: boolean | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<SupplierResponse>> {
    let hp = new HttpParams();
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<SupplierResponse>>(this.base, { params: hp });
  }

  getSupplier(id: number): Observable<SupplierDetailResponse> {
    return this.http.get<SupplierDetailResponse>(`${this.base}/${id}`);
  }

  createSupplier(body: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(this.base, body);
  }

  updateSupplier(id: number, body: UpdateSupplierRequest): Observable<SupplierResponse> {
    return this.http.patch<SupplierResponse>(`${this.base}/${id}`, body);
  }

  updateSupplierStatus(id: number, body: { active: boolean }): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, body);
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getSupplierCatalog(id: number): Observable<SupplierCatalogItemResponse[]> {
    return this.http.get<SupplierCatalogItemResponse[]>(`${this.base}/${id}/catalog`);
  }

  // Contacts
  createContact(
    supplierId: number,
    body: CreateSupplierContactRequest,
  ): Observable<SupplierContactResponse> {
    return this.http.post<SupplierContactResponse>(`${this.base}/${supplierId}/contacts`, body);
  }

  updateContact(
    supplierId: number,
    contactId: number,
    body: Partial<CreateSupplierContactRequest>,
  ): Observable<SupplierContactResponse> {
    return this.http.patch<SupplierContactResponse>(
      `${this.base}/${supplierId}/contacts/${contactId}`,
      body,
    );
  }

  updateContactStatus(
    supplierId: number,
    contactId: number,
    body: { active: boolean },
  ): Observable<void> {
    return this.http.patch<void>(`${this.base}/${supplierId}/contacts/${contactId}/status`, body);
  }

  // Addresses
  createAddress(
    supplierId: number,
    body: CreateSupplierAddressRequest,
  ): Observable<SupplierAddressResponse> {
    return this.http.post<SupplierAddressResponse>(`${this.base}/${supplierId}/addresses`, body);
  }

  updateAddress(
    supplierId: number,
    addressId: number,
    body: Partial<CreateSupplierAddressRequest>,
  ): Observable<SupplierAddressResponse> {
    return this.http.patch<SupplierAddressResponse>(
      `${this.base}/${supplierId}/addresses/${addressId}`,
      body,
    );
  }

  updateAddressStatus(
    supplierId: number,
    addressId: number,
    body: { active: boolean },
  ): Observable<void> {
    return this.http.patch<void>(`${this.base}/${supplierId}/addresses/${addressId}/status`, body);
  }
}
