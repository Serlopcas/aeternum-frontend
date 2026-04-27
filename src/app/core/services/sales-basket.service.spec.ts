import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../config/environment';
import { SellableCatalogItemResponse, UserResponse } from '../models/api.models';
import { AuthStateService } from '../state/auth-state.service';
import { SalesBasketService } from './sales-basket.service';

const MOCK_USER: UserResponse = {
  id: 7,
  username: 'sales',
  email: 's@test.com',
  firstName: 'S',
  lastName: 'T',
  phone: null,
  roles: ['TRABAJADOR'],
  active: true,
  profileImageUrl: null,
};

const SELLABLE_ITEM: SellableCatalogItemResponse = {
  variantId: 55,
  sku: 'VAR-055',
  material: 'Plata',
  finish: '925',
  color: null,
  purity: null,
  primaryMeasureValue: '40',
  secondaryMeasureType: null,
  secondaryMeasureValue: null,
  weightGrams: 1.5,
  baseSalePrice: 80,
  minimumStock: 2,
  isSellable: true,
  isActive: true,
  primaryImageUrl: null,
  productId: 10,
  productName: 'Collar',
  productCode: 'C001',
  brandName: null,
  collectionName: null,
  categoryId: 3,
  categoryName: 'Collares',
  primaryMeasureLabel: 'Largo',
  primaryMeasureUnit: 'cm',
  currentStock: 10,
  isBelowMinimum: false,
};

describe('SalesBasketService', () => {
  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createService(user: UserResponse | null = MOCK_USER): SalesBasketService {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStateService, useValue: { user: signal<UserResponse | null>(user) } },
      ],
    });
    return TestBed.inject(SalesBasketService);
  }

  describe('initial state', () => {
    it('starts with empty basket when no localStorage data', () => {
      const service = createService();
      expect(service.lines()).toHaveLength(0);
      expect(service.lineCount()).toBe(0);
      expect(service.total()).toBe(0);
      expect(service.clientId()).toBeNull();
    });

    it('loads from localStorage on construction when user is present', () => {
      const saved = {
        clientId: 3,
        clientName: 'Cliente Guardado',
        documentDate: null,
        deliveryDate: null,
        internalNotes: '',
        lines: [
          {
            localId: 'x1',
            productId: 10,
            variantId: 55,
            sku: 'VAR-055',
            productName: 'Collar',
            variantLabel: 'Collar',
            categoryName: null,
            finish: null,
            color: null,
            purity: null,
            primaryMeasureValue: null,
            imageUrl: null,
            quantitySold: 2,
            unitPriceSnapshot: 80,
            baseSalePrice: 80,
            unitCostSnapshot: null,
            currentStock: 10,
            isBelowMinimum: false,
            discountPercent: 0,
            taxPercent: 0,
            subtotalExclTax: 0,
            totalInclTax: 0,
            notes: '',
            validationStatus: null,
          },
        ],
        updatedAt: new Date().toISOString(),
        createdByUserId: 7,
      };
      localStorage.setItem(environment.salesCartKey(7), JSON.stringify(saved));
      const service = createService();
      expect(service.lines()).toHaveLength(1);
      expect(service.clientId()).toBe(3);
    });
  });

  describe('addLine()', () => {
    it('adds a new line with correct fields', () => {
      const service = createService();
      service.addLine(SELLABLE_ITEM, 2);
      expect(service.lines()).toHaveLength(1);
      const line = service.lines()[0];
      expect(line.variantId).toBe(55);
      expect(line.sku).toBe('VAR-055');
      expect(line.quantitySold).toBe(2);
      expect(line.unitPriceSnapshot).toBe(80);
      expect(line.localId).toBeTruthy();
    });

    it('increments quantity when same variant added again', () => {
      const service = createService();
      service.addLine(SELLABLE_ITEM, 1);
      service.addLine(SELLABLE_ITEM, 3);
      expect(service.lines()).toHaveLength(1);
      expect(service.lines()[0].quantitySold).toBe(4);
    });

    it('uses 0 as unitPriceSnapshot when baseSalePrice is null', () => {
      const service = createService();
      service.addLine({ ...SELLABLE_ITEM, baseSalePrice: null });
      expect(service.lines()[0].unitPriceSnapshot).toBe(0);
    });

    it('builds variantLabel including material and finish', () => {
      const service = createService();
      service.addLine(SELLABLE_ITEM);
      expect(service.lines()[0].variantLabel).toContain('Collar');
      expect(service.lines()[0].variantLabel).toContain('Plata');
    });

    it('falls back to productName when all variant attributes are null', () => {
      const service = createService();
      service.addLine({
        ...SELLABLE_ITEM,
        material: null,
        finish: null,
        color: null,
        purity: null,
        primaryMeasureValue: null,
      });
      expect(service.lines()[0].variantLabel).toBe('Collar');
    });
  });

  describe('removeLine()', () => {
    it('removes line by localId', () => {
      const service = createService();
      service.addLine(SELLABLE_ITEM);
      const id = service.lines()[0].localId;
      service.removeLine(id);
      expect(service.lines()).toHaveLength(0);
    });
  });

  describe('updateLine()', () => {
    it('applies partial updates to a line', () => {
      const service = createService();
      service.addLine(SELLABLE_ITEM);
      const id = service.lines()[0].localId;
      service.updateLine(id, { unitPriceSnapshot: 100, notes: 'promo' });
      expect(service.lines()[0].unitPriceSnapshot).toBe(100);
      expect(service.lines()[0].notes).toBe('promo');
    });
  });

  describe('setClientId()', () => {
    it('updates clientId and clientName on the basket', () => {
      const service = createService();
      service.setClientId(5, 'Taller Nuevo');
      expect(service.clientId()).toBe(5);
      expect(service.basket().clientName).toBe('Taller Nuevo');
    });
  });

  describe('computed values', () => {
    it('total() is sum of quantitySold * unitPriceSnapshot', () => {
      const service = createService();
      service.addLine(SELLABLE_ITEM, 2); // 2 * 80 = 160
      service.addLine({ ...SELLABLE_ITEM, variantId: 56, sku: 'V2', baseSalePrice: 50 }, 1); // 50
      expect(service.total()).toBeCloseTo(210);
    });

    it('lineCount() equals number of distinct lines', () => {
      const service = createService();
      service.addLine(SELLABLE_ITEM);
      service.addLine({ ...SELLABLE_ITEM, variantId: 60, sku: 'X' });
      expect(service.lineCount()).toBe(2);
    });
  });

  describe('clear()', () => {
    it('resets basket to empty and removes localStorage entry', () => {
      const service = createService();
      service.addLine(SELLABLE_ITEM);
      service.clear();
      expect(service.lines()).toHaveLength(0);
      expect(localStorage.getItem(environment.salesCartKey(7))).toBeNull();
    });
  });

  describe('localStorage persistence', () => {
    it('persists basket when a line is added', () => {
      const service = createService();
      service.addLine(SELLABLE_ITEM);
      const raw = localStorage.getItem(environment.salesCartKey(7));
      expect(raw).not.toBeNull();
      const saved = JSON.parse(raw!);
      expect(saved.lines).toHaveLength(1);
    });
  });
});
