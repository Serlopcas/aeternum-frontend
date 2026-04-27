import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  CategoryTreeResponse,
  ClientResponse,
  ColorResponse,
  PageResponse,
  SupplierResponse,
} from '../models/api.models';
import { CategoryApiService } from './category-api.service';
import { ClientApiService } from './client-api.service';
import { ColorApiService } from './color-api.service';
import { ReferenceDataCacheService } from './reference-data-cache.service';
import { SupplierApiService } from './supplier-api.service';

function makeClientPage(items: ClientResponse[]): PageResponse<ClientResponse> {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 200,
    first: true,
    last: true,
    empty: items.length === 0,
    numberOfElements: items.length,
  };
}

function makeSupplierPage(items: SupplierResponse[]): PageResponse<SupplierResponse> {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 200,
    first: true,
    last: true,
    empty: items.length === 0,
    numberOfElements: items.length,
  };
}

describe('ReferenceDataCacheService', () => {
  let service: ReferenceDataCacheService;
  let mockClientApi: { getClients: ReturnType<typeof vi.fn> };
  let mockSupplierApi: { getSuppliers: ReturnType<typeof vi.fn> };
  let mockCategoryApi: { getTree: ReturnType<typeof vi.fn> };
  let mockColorApi: { getColors: ReturnType<typeof vi.fn> };

  const CLIENTS: ClientResponse[] = [
    { id: 1, name: 'Acme', taxId: 'B12345678', notes: null, active: true },
  ];
  const SUPPLIERS: SupplierResponse[] = [
    { id: 2, name: 'Supplier Co', taxId: 'A87654321', websiteUrl: null, notes: null, active: true },
  ];
  const TREE: CategoryTreeResponse[] = [
    {
      id: 1,
      categoryCode: 'JOY',
      name: 'Joyería',
      description: null,
      primaryMeasureLabel: null,
      primaryMeasureUnit: null,
      requiresPrimaryMeasure: false,
      active: true,
      children: [],
    },
  ];
  const COLORS: ColorResponse[] = [{ id: 1, colorName: 'Oro', colorCode: '#FFD700' }];

  beforeEach(() => {
    mockClientApi = { getClients: vi.fn().mockReturnValue(of(makeClientPage(CLIENTS))) };
    mockSupplierApi = { getSuppliers: vi.fn().mockReturnValue(of(makeSupplierPage(SUPPLIERS))) };
    mockCategoryApi = { getTree: vi.fn().mockReturnValue(of(TREE)) };
    mockColorApi = { getColors: vi.fn().mockReturnValue(of(COLORS)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: ClientApiService, useValue: mockClientApi },
        { provide: SupplierApiService, useValue: mockSupplierApi },
        { provide: CategoryApiService, useValue: mockCategoryApi },
        { provide: ColorApiService, useValue: mockColorApi },
      ],
    });
    service = TestBed.inject(ReferenceDataCacheService);
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('getActiveClients()', () => {
    it('calls clientApi.getClients with active:true on first subscription', () => {
      let result: ClientResponse[] = [];
      service.getActiveClients().subscribe((data) => (result = data));
      expect(result).toEqual(CLIENTS);
      expect(mockClientApi.getClients).toHaveBeenCalledTimes(1);
      expect(mockClientApi.getClients).toHaveBeenCalledWith({ active: true, size: 200 });
    });

    it('returns cached result on subsequent subscriptions (no extra HTTP call)', () => {
      service.getActiveClients().subscribe();
      service.getActiveClients().subscribe();
      expect(mockClientApi.getClients).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveSuppliers()', () => {
    it('calls supplierApi on first subscription and returns suppliers', () => {
      let result: SupplierResponse[] = [];
      service.getActiveSuppliers().subscribe((data) => (result = data));
      expect(result).toEqual(SUPPLIERS);
      expect(mockSupplierApi.getSuppliers).toHaveBeenCalledTimes(1);
    });

    it('does not re-fetch on second subscription', () => {
      service.getActiveSuppliers().subscribe();
      service.getActiveSuppliers().subscribe();
      expect(mockSupplierApi.getSuppliers).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveCategoryTree()', () => {
    it('returns the category tree on first subscription', () => {
      let result: CategoryTreeResponse[] = [];
      service.getActiveCategoryTree().subscribe((data) => (result = data));
      expect(result).toEqual(TREE);
      expect(mockCategoryApi.getTree).toHaveBeenCalledTimes(1);
    });

    it('uses cache on second subscription', () => {
      service.getActiveCategoryTree().subscribe();
      service.getActiveCategoryTree().subscribe();
      expect(mockCategoryApi.getTree).toHaveBeenCalledTimes(1);
    });
  });

  describe('getColors()', () => {
    it('returns colors on first subscription', () => {
      let result: ColorResponse[] = [];
      service.getColors().subscribe((data) => (result = data));
      expect(result).toEqual(COLORS);
    });

    it('uses cache on second subscription', () => {
      service.getColors().subscribe();
      service.getColors().subscribe();
      expect(mockColorApi.getColors).toHaveBeenCalledTimes(1);
    });
  });
});
