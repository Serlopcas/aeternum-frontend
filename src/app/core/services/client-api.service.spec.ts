import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../config/environment';
import {
  ClientAddressResponse,
  ClientContactResponse,
  ClientDetailResponse,
  ClientResponse,
  CreateClientAddressRequest,
} from '../models/api.models';
import { ClientApiService } from './client-api.service';

const BASE = `${environment.apiBaseUrl}/clients`;

const MOCK_CLIENT: ClientResponse = {
  id: 1,
  name: 'Cliente Test',
  taxId: 'B12345678',
  notes: null,
  active: true,
};

describe('ClientApiService', () => {
  let service: ClientApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  // ─── getClients ────────────────────────────────────────────────────────────

  describe('getClients()', () => {
    it('sends GET with active and sort params when provided', () => {
      service.getClients({ active: true, page: 0, size: 10, sort: 'name,asc' }).subscribe();
      const req = httpTesting.expectOne((r) => r.url === BASE);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('active')).toBe('true');
      expect(req.request.params.get('sort')).toBe('name,asc');
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
    });

    it('omits active param when active is null, uses page/size defaults', () => {
      service.getClients({ active: null }).subscribe();
      const req = httpTesting.expectOne((r) => r.url === BASE);
      expect(req.request.params.has('active')).toBe(false);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.has('sort')).toBe(false);
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
    });
  });

  // ─── getClient ─────────────────────────────────────────────────────────────

  describe('getClient()', () => {
    it('sends GET to /clients/:id', () => {
      service.getClient(1).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('GET');
      req.flush({} as ClientDetailResponse);
    });
  });

  // ─── createClient ──────────────────────────────────────────────────────────

  describe('createClient()', () => {
    it('sends POST to /clients with the request body', () => {
      const body = { name: 'Nuevo', taxId: 'B00000001' };
      let result!: ClientResponse;
      service.createClient(body).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(MOCK_CLIENT);
      expect(result).toEqual(MOCK_CLIENT);
    });
  });

  // ─── updateClient ──────────────────────────────────────────────────────────

  describe('updateClient()', () => {
    it('sends PATCH to /clients/:id with the update body', () => {
      const body = { name: 'Actualizado' };
      service.updateClient(1, body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(MOCK_CLIENT);
    });
  });

  // ─── updateClientStatus ────────────────────────────────────────────────────

  describe('updateClientStatus()', () => {
    it('sends PATCH to /clients/:id/status', () => {
      service.updateClientStatus(1, { active: false }).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ active: false });
      req.flush(null);
    });
  });

  // ─── deleteClient ──────────────────────────────────────────────────────────

  describe('deleteClient()', () => {
    it('sends DELETE to /clients/:id', () => {
      service.deleteClient(1).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ─── Contacts ──────────────────────────────────────────────────────────────

  describe('createContact()', () => {
    it('sends POST to /clients/:clientId/contacts', () => {
      const body = { name: 'Contacto' };
      service.createContact(1, body as any).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/contacts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({} as ClientContactResponse);
    });
  });

  describe('updateContact()', () => {
    it('sends PATCH to /clients/:clientId/contacts/:contactId', () => {
      const body = { name: 'Actualizado' };
      service.updateContact(1, 2, body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/contacts/2`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush({} as ClientContactResponse);
    });
  });

  describe('updateContactStatus()', () => {
    it('sends PATCH to /clients/:clientId/contacts/:contactId/status', () => {
      service.updateContactStatus(1, 2, { active: true }).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/contacts/2/status`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });
  });

  // ─── Addresses ─────────────────────────────────────────────────────────────

  describe('createAddress()', () => {
    it('sends POST to /clients/:clientId/addresses', () => {
      const body: CreateClientAddressRequest = {
        addressOrder: 1,
        label: 'Principal',
        addressLine1: 'Calle 1',
        city: 'Madrid',
        country: 'ES',
      };
      service.createAddress(1, body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/addresses`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({} as ClientAddressResponse);
    });
  });

  describe('updateAddress()', () => {
    it('sends PATCH to /clients/:clientId/addresses/:addressId', () => {
      const body: Partial<CreateClientAddressRequest> = { addressLine1: 'Calle 2' };
      service.updateAddress(1, 3, body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/addresses/3`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush({} as ClientAddressResponse);
    });
  });

  describe('updateAddressStatus()', () => {
    it('sends PATCH to /clients/:clientId/addresses/:addressId/status', () => {
      service.updateAddressStatus(1, 3, { active: false }).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/addresses/3/status`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });
  });
});
