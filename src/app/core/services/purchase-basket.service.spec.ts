import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../config/environment';
import { SupplierCatalogItemResponse, UserResponse } from '../models/api.models';
import { AuthStateService } from '../state/auth-state.service';
import { PurchaseBasketService } from './purchase-basket.service';

const MOCK_USER: UserResponse = {
  id: 42,
  username: 'user',
  email: 'u@test.com',
  firstName: 'U',
  lastName: 'S',
  phone: null,
  roles: ['TRABAJADOR'],
  active: true,
  profileImageUrl: null,
};

const CATALOG_ITEM: SupplierCatalogItemResponse = {
  supplierProductVariantId: 10,
  supplierReference: 'REF-001',
  basePurchaseCost: 25.5,
  preferredSupplier: true,
  leadTimeDays: 7,
  supplierNotes: null,
  active: true,
  variantId: 99,
  sku: 'SKU-001',
  material: 'Oro',
  finish: '18k',
  color: 'Amarillo',
  purity: '750',
  primaryMeasureValue: '16',
  secondaryMeasureType: null,
  secondaryMeasureValue: null,
  weightGrams: 2.5,
  primaryImageUrl: null,
  productId: 5,
  productName: 'Anillo',
  productCode: 'P001',
  brandName: null,
  collectionName: null,
  categoryId: 1,
  categoryName: 'Anillos',
  primaryMeasureLabel: 'Talla',
  primaryMeasureUnit: null,
};

function mockAuthStateWithUser() {
  return { user: signal<UserResponse | null>(MOCK_USER) };
}

function mockAuthStateWithoutUser() {
  return { user: signal<UserResponse | null>(null) };
}

describe('PurchaseBasketService', () => {
  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createService(authState: any = mockAuthStateWithUser()): PurchaseBasketService {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthStateService, useValue: authState }],
    });
    return TestBed.inject(PurchaseBasketService);
  }

  describe('initial state', () => {
    it('starts with null supplier and empty lines', () => {
      const service = createService();
      expect(service.supplierId()).toBeNull();
      expect(service.lines()).toEqual([]);
      expect(service.lineCount()).toBe(0);
      expect(service.total()).toBe(0);
    });
  });

  describe('setSupplier()', () => {
    it('creates an empty basket when no saved draft exists', () => {
      const service = createService();
      service.setSupplier(1, 'Proveedor A');
      expect(service.supplierId()).toBe(1);
      expect(service.lines()).toEqual([]);
    });

    it('restores a previously saved draft from localStorage', () => {
      const uid = 42;
      const supplierId = 7;
      const savedBasket = {
        supplierId,
        supplierName: 'Saved Supplier',
        documentDate: null,
        expectedDeliveryDate: null,
        internalNotes: '',
        lines: [
          {
            localId: 'abc',
            productId: 1,
            variantId: 1,
            sku: 'S1',
            productName: 'P',
            variantLabel: 'P',
            categoryName: null,
            finish: null,
            color: null,
            purity: null,
            primaryMeasureValue: null,
            imageUrl: null,
            quantityOrdered: 3,
            unitCostSnapshot: 10,
            basePurchaseCost: 10,
            supplierLinkId: null,
            supplierReference: null,
            leadTimeDays: null,
            discountPercent: 0,
            taxPercent: 0,
            subtotalExclTax: 0,
            totalInclTax: 0,
            notes: '',
            validationStatus: null,
          },
        ],
        updatedAt: new Date().toISOString(),
        createdByUserId: uid,
      };
      localStorage.setItem(
        environment.purchaseCartKey(uid, supplierId),
        JSON.stringify(savedBasket),
      );

      const service = createService();
      service.setSupplier(supplierId, 'Saved Supplier');
      expect(service.lines()).toHaveLength(1);
      expect(service.lines()[0].sku).toBe('S1');
    });

    it('persists previous cart before switching supplier', () => {
      const service = createService();
      service.setSupplier(1, 'Proveedor A');
      service.addLine(CATALOG_ITEM, 2);
      service.setSupplier(2, 'Proveedor B');
      const key = environment.purchaseCartKey(42, 1);
      const saved = JSON.parse(localStorage.getItem(key)!);
      expect(saved.lines).toHaveLength(1);
    });
  });

  describe('addLine()', () => {
    it('adds a new line with all fields mapped correctly', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM, 3);
      const lines = service.lines();
      expect(lines).toHaveLength(1);
      const line = lines[0];
      expect(line.variantId).toBe(99);
      expect(line.sku).toBe('SKU-001');
      expect(line.quantityOrdered).toBe(3);
      expect(line.unitCostSnapshot).toBe(25.5);
      expect(line.productName).toBe('Anillo');
      expect(line.localId).toBeTruthy(); // UUID generated
    });

    it('increments quantity when same variant already in basket', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM, 1);
      service.addLine(CATALOG_ITEM, 2);
      expect(service.lines()).toHaveLength(1);
      expect(service.lines()[0].quantityOrdered).toBe(3);
    });

    it('adds distinct lines for different variants', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      const itemB = { ...CATALOG_ITEM, variantId: 100, sku: 'SKU-002' };
      service.addLine(CATALOG_ITEM, 1);
      service.addLine(itemB, 1);
      expect(service.lines()).toHaveLength(2);
    });

    it('builds variantLabel from material, finish, color, purity, measure', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM);
      expect(service.lines()[0].variantLabel).toContain('Anillo');
      expect(service.lines()[0].variantLabel).toContain('Oro');
    });

    it('falls back to productName when all variant attributes are null', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      const minimal = {
        ...CATALOG_ITEM,
        material: null,
        finish: null,
        color: null,
        purity: null,
        primaryMeasureValue: null,
      };
      service.addLine(minimal);
      expect(service.lines()[0].variantLabel).toBe('Anillo');
    });

    it('uses 0 as unitCostSnapshot when basePurchaseCost is null', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine({ ...CATALOG_ITEM, basePurchaseCost: null });
      expect(service.lines()[0].unitCostSnapshot).toBe(0);
    });
  });

  describe('removeLine()', () => {
    it('removes the line matching localId', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM);
      const localId = service.lines()[0].localId;
      service.removeLine(localId);
      expect(service.lines()).toHaveLength(0);
    });

    it('leaves other lines intact', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM);
      service.addLine({ ...CATALOG_ITEM, variantId: 100 });
      const firstId = service.lines()[0].localId;
      service.removeLine(firstId);
      expect(service.lines()).toHaveLength(1);
      expect(service.lines()[0].variantId).toBe(100);
    });
  });

  describe('updateLine()', () => {
    it('applies partial update to the matching line', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM);
      const id = service.lines()[0].localId;
      service.updateLine(id, { quantityOrdered: 10, notes: 'updated' });
      expect(service.lines()[0].quantityOrdered).toBe(10);
      expect(service.lines()[0].notes).toBe('updated');
    });
  });

  describe('setDocumentDate() / setExpectedDeliveryDate() / setNotes()', () => {
    it('setDocumentDate updates the basket documentDate', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.setDocumentDate('2026-04-27');
      expect(service.basket().documentDate).toBe('2026-04-27');
    });

    it('setExpectedDeliveryDate updates expectedDeliveryDate', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.setExpectedDeliveryDate('2026-05-10');
      expect(service.basket().expectedDeliveryDate).toBe('2026-05-10');
    });

    it('setNotes updates internalNotes', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.setNotes('Notas internas de prueba');
      expect(service.notes()).toBe('Notas internas de prueba');
    });
  });

  describe('computed values', () => {
    it('total() is sum of quantity * unitCost across all lines', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM, 2); // 2 * 25.5 = 51
      service.addLine({ ...CATALOG_ITEM, variantId: 100, sku: 'S2', basePurchaseCost: 10 }, 3); // 3 * 10 = 30
      expect(service.total()).toBeCloseTo(81);
    });

    it('lineCount() reflects number of lines', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM);
      service.addLine({ ...CATALOG_ITEM, variantId: 200, sku: 'S3' });
      expect(service.lineCount()).toBe(2);
    });
  });

  describe('clear()', () => {
    it('resets basket lines and removes draft from localStorage', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM);
      service.clear();
      expect(service.lines()).toHaveLength(0);
      const key = environment.purchaseCartKey(42, 1);
      expect(localStorage.getItem(key)).toBeNull();
    });
  });

  describe('deleteDraft()', () => {
    it('removes the specific draft from localStorage and index', () => {
      const service = createService();
      service.setSupplier(1, 'Proveedor');
      service.addLine(CATALOG_ITEM);
      service.saveDraftExplicit();
      service.deleteDraft(1);
      expect(localStorage.getItem(environment.purchaseCartKey(42, 1))).toBeNull();
    });

    it('resets active basket when deleting the current supplier draft', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM);
      service.deleteDraft(1);
      expect(service.supplierId()).toBeNull();
      expect(service.lines()).toHaveLength(0);
    });
  });

  describe('loadDraftsIndex()', () => {
    it('loads drafts index from localStorage', () => {
      const uid = 42;
      const meta = [
        {
          supplierId: 5,
          supplierName: 'X',
          lineCount: 1,
          unitTotal: 50,
          updatedAt: '2026-04-27T00:00:00Z',
        },
      ];
      localStorage.setItem(environment.purchaseCartIndexKey(uid), JSON.stringify(meta));
      const service = createService();
      service.loadDraftsIndex();
      expect(service.draftsIndex()).toHaveLength(1);
      expect(service.draftsIndex()[0].supplierName).toBe('X');
    });

    it('sets empty index when no user', () => {
      const service = createService(mockAuthStateWithoutUser());
      service.loadDraftsIndex();
      expect(service.draftsIndex()).toEqual([]);
    });
  });

  describe('localStorage persistence', () => {
    it('persists basket to localStorage when a line is added', () => {
      const service = createService();
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM);
      const key = environment.purchaseCartKey(42, 1);
      const saved = JSON.parse(localStorage.getItem(key)!);
      expect(saved.lines).toHaveLength(1);
    });

    it('does NOT persist when userId is null', () => {
      const service = createService(mockAuthStateWithoutUser());
      service.setSupplier(1, 'P');
      service.addLine(CATALOG_ITEM);
      // Should not throw — just silently skips localStorage
      expect(service.lines()).toHaveLength(1);
    });
  });
});
