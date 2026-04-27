import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  ClientAddressResponse,
  ClientContactResponse,
  ClientDetailResponse,
  ClientResponse,
  CreateClientAddressRequest,
  CreateClientContactRequest,
  CreateClientRequest,
  PageResponse,
  UpdateClientRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ClientApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/clients`;

  getClients(params: {
    active?: boolean | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<ClientResponse>> {
    let hp = new HttpParams();
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<ClientResponse>>(this.base, { params: hp });
  }

  getClient(id: number): Observable<ClientDetailResponse> {
    return this.http.get<ClientDetailResponse>(`${this.base}/${id}`);
  }

  createClient(body: CreateClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(this.base, body);
  }

  updateClient(id: number, body: UpdateClientRequest): Observable<ClientResponse> {
    return this.http.patch<ClientResponse>(`${this.base}/${id}`, body);
  }

  updateClientStatus(id: number, body: { active: boolean }): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, body);
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Contacts
  createContact(
    clientId: number,
    body: CreateClientContactRequest,
  ): Observable<ClientContactResponse> {
    return this.http.post<ClientContactResponse>(`${this.base}/${clientId}/contacts`, body);
  }

  updateContact(
    clientId: number,
    contactId: number,
    body: Partial<CreateClientContactRequest>,
  ): Observable<ClientContactResponse> {
    return this.http.patch<ClientContactResponse>(
      `${this.base}/${clientId}/contacts/${contactId}`,
      body,
    );
  }

  updateContactStatus(
    clientId: number,
    contactId: number,
    body: { active: boolean },
  ): Observable<void> {
    return this.http.patch<void>(`${this.base}/${clientId}/contacts/${contactId}/status`, body);
  }

  // Addresses
  createAddress(
    clientId: number,
    body: CreateClientAddressRequest,
  ): Observable<ClientAddressResponse> {
    return this.http.post<ClientAddressResponse>(`${this.base}/${clientId}/addresses`, body);
  }

  updateAddress(
    clientId: number,
    addressId: number,
    body: Partial<CreateClientAddressRequest>,
  ): Observable<ClientAddressResponse> {
    return this.http.patch<ClientAddressResponse>(
      `${this.base}/${clientId}/addresses/${addressId}`,
      body,
    );
  }

  updateAddressStatus(
    clientId: number,
    addressId: number,
    body: { active: boolean },
  ): Observable<void> {
    return this.http.patch<void>(`${this.base}/${clientId}/addresses/${addressId}/status`, body);
  }
}
