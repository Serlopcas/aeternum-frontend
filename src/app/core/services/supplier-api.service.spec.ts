import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../config/environment';
import {
  CreateSupplierAddressRequest,
  CreateSupplierRequest,
  SupplierAddressResponse,
  SupplierCatalogItemResponse,
  SupplierContactResponse,
  SupplierDetailResponse,
  SupplierResponse,
} from '../models/api.models';
import { SupplierApiService } from './supplier-api.service';

const BASE = `${environment.apiBaseUrl}/suppliers`;

const MOCK_SUPPLIER: SupplierResponse = {
  id: 1,
  name: 'Proveedor Test',
  taxId: 'B98765432',
  websiteUrl: null,
  notes: null,
  active: true,
};

describe('SupplierApiService', () => {
  let service: SupplierApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SupplierApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  // ─── getSuppliers ──────────────────────────────────────────────────────────

  describe('getSuppliers()', () => {
    it('sends GET with active and sort params when provided', () => {
      service.getSuppliers({ active: false, page: 0, size: 5, sort: 'name,asc' }).subscribe();
      const req = httpTesting.expectOne((r) => r.url === BASE);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('active')).toBe('false');
      expect(req.request.params.get('sort')).toBe('name,asc');
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 });
    });

    it('omits active param when active is null, uses page/size defaults', () => {
      service.getSuppliers({ active: null }).subscribe();
      const req = httpTesting.expectOne((r) => r.url === BASE);
      expect(req.request.params.has('active')).toBe(false);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.has('sort')).toBe(false);
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
    });
  });

  // ─── getSupplier ───────────────────────────────────────────────────────────

  describe('getSupplier()', () => {
    it('sends GET to /suppliers/:id', () => {
      service.getSupplier(1).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('GET');
      req.flush({} as SupplierDetailResponse);
    });
  });

  // ─── createSupplier ────────────────────────────────────────────────────────

  describe('createSupplier()', () => {
    it('sends POST to /suppliers with the request body', () => {
      const body: CreateSupplierRequest = { name: 'Nuevo', taxId: 'B00000002' };
      let result!: SupplierResponse;
      service.createSupplier(body).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(MOCK_SUPPLIER);
      expect(result).toEqual(MOCK_SUPPLIER);
    });
  });

  // ─── updateSupplier ────────────────────────────────────────────────────────

  describe('updateSupplier()', () => {
    it('sends PATCH to /suppliers/:id with the update body', () => {
      const body = { name: 'Actualizado' };
      service.updateSupplier(1, body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(MOCK_SUPPLIER);
    });
  });

  // ─── updateSupplierStatus ──────────────────────────────────────────────────

  describe('updateSupplierStatus()', () => {
    it('sends PATCH to /suppliers/:id/status', () => {
      service.updateSupplierStatus(1, { active: false }).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ active: false });
      req.flush(null);
    });
  });

  // ─── deleteSupplier ────────────────────────────────────────────────────────

  describe('deleteSupplier()', () => {
    it('sends DELETE to /suppliers/:id', () => {
      service.deleteSupplier(1).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ─── getSupplierCatalog ────────────────────────────────────────────────────

  describe('getSupplierCatalog()', () => {
    it('sends GET to /suppliers/:id/catalog', () => {
      let result!: SupplierCatalogItemResponse[];
      service.getSupplierCatalog(1).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${BASE}/1/catalog`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
      expect(result).toEqual([]);
    });
  });

  // ─── Contacts ──────────────────────────────────────────────────────────────

  describe('createContact()', () => {
    it('sends POST to /suppliers/:supplierId/contacts', () => {
      const body = { name: 'Contacto' };
      service.createContact(1, body as any).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/contacts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({} as SupplierContactResponse);
    });
  });

  describe('updateContact()', () => {
    it('sends PATCH to /suppliers/:supplierId/contacts/:contactId', () => {
      const body = { name: 'Actualizado' };
      service.updateContact(1, 2, body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/contacts/2`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush({} as SupplierContactResponse);
    });
  });

  describe('updateContactStatus()', () => {
    it('sends PATCH to /suppliers/:supplierId/contacts/:contactId/status', () => {
      service.updateContactStatus(1, 2, { active: true }).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/contacts/2/status`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });
  });

  // ─── Addresses ─────────────────────────────────────────────────────────────

  describe('createAddress()', () => {
    it('sends POST to /suppliers/:supplierId/addresses', () => {
      const body: CreateSupplierAddressRequest = {
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
      req.flush({} as SupplierAddressResponse);
    });
  });

  describe('updateAddress()', () => {
    it('sends PATCH to /suppliers/:supplierId/addresses/:addressId', () => {
      const body: Partial<CreateSupplierAddressRequest> = { addressLine1: 'Calle 2' };
      service.updateAddress(1, 3, body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/addresses/3`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush({} as SupplierAddressResponse);
    });
  });

  describe('updateAddressStatus()', () => {
    it('sends PATCH to /suppliers/:supplierId/addresses/:addressId/status', () => {
      service.updateAddressStatus(1, 3, { active: false }).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/addresses/3/status`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });
  });
});
