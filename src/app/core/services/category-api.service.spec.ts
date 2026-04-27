import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../config/environment';
import {
  CategoryDetailResponse,
  CategoryResponse,
  CategoryTreeResponse,
  CreateCategoryRequest,
} from '../models/api.models';
import { CategoryApiService } from './category-api.service';

const BASE = `${environment.apiBaseUrl}/categories`;

const MOCK_CATEGORY: CategoryResponse = {
  id: 1,
  categoryCode: 'CAT-001',
  name: 'Electrónica',
  description: null,
  parentCategoryId: null,
  parentCategoryName: null,
  primaryMeasureLabel: null,
  primaryMeasureUnit: null,
  requiresPrimaryMeasure: false,
  active: true,
};

describe('CategoryApiService', () => {
  let service: CategoryApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoryApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  // ─── getCategories ─────────────────────────────────────────────────────────

  describe('getCategories()', () => {
    it('sends GET with active and query params when provided', () => {
      service
        .getCategories({ active: true, query: 'electr', page: 1, size: 10, sort: 'name,asc' })
        .subscribe();
      const req = httpTesting.expectOne((r) => r.url === BASE);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('active')).toBe('true');
      expect(req.request.params.get('q')).toBe('electr');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('name,asc');
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
    });

    it('omits active param when active is null', () => {
      service.getCategories({ active: null }).subscribe();
      const req = httpTesting.expectOne((r) => r.url === BASE);
      expect(req.request.params.has('active')).toBe(false);
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
    });

    it('omits q param when query is empty string', () => {
      service.getCategories({ query: '' }).subscribe();
      const req = httpTesting.expectOne((r) => r.url === BASE);
      expect(req.request.params.has('q')).toBe(false);
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
    });

    it('omits q param when query is null', () => {
      service.getCategories({ query: null }).subscribe();
      const req = httpTesting.expectOne((r) => r.url === BASE);
      expect(req.request.params.has('q')).toBe(false);
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
    });

    it('uses defaults page=0 and size=20 when not provided', () => {
      service.getCategories({}).subscribe();
      const req = httpTesting.expectOne((r) => r.url === BASE);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.has('sort')).toBe(false);
      req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
    });
  });

  // ─── getTree ───────────────────────────────────────────────────────────────

  describe('getTree()', () => {
    it('sends GET to /categories/tree with active param when provided', () => {
      const mock: CategoryTreeResponse[] = [];
      service.getTree(true).subscribe();
      const req = httpTesting.expectOne((r) => r.url === `${BASE}/tree`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('active')).toBe('true');
      req.flush(mock);
    });

    it('omits active param when getTree called without argument', () => {
      service.getTree().subscribe();
      const req = httpTesting.expectOne((r) => r.url === `${BASE}/tree`);
      expect(req.request.params.has('active')).toBe(false);
      req.flush([]);
    });
  });

  // ─── getCategory ───────────────────────────────────────────────────────────

  describe('getCategory()', () => {
    it('sends GET to /categories/:id with include param when provided', () => {
      service.getCategory(1, 'children').subscribe();
      const req = httpTesting.expectOne((r) => r.url === `${BASE}/1`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('include')).toBe('children');
      req.flush({} as CategoryDetailResponse);
    });

    it('sends GET to /categories/:id without include param when omitted', () => {
      service.getCategory(1).subscribe();
      const req = httpTesting.expectOne((r) => r.url === `${BASE}/1`);
      expect(req.request.params.has('include')).toBe(false);
      req.flush({} as CategoryDetailResponse);
    });
  });

  // ─── createCategory ────────────────────────────────────────────────────────

  describe('createCategory()', () => {
    it('sends POST to /categories with the request body', () => {
      const body: CreateCategoryRequest = {
        categoryCode: 'NUE',
        name: 'Nueva',
        parentCategoryId: null,
      };
      let result!: CategoryResponse;
      service.createCategory(body).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(MOCK_CATEGORY);
      expect(result).toEqual(MOCK_CATEGORY);
    });
  });

  // ─── updateCategory ────────────────────────────────────────────────────────

  describe('updateCategory()', () => {
    it('sends PATCH to /categories/:id with the update body', () => {
      const body = { name: 'Actualizada' };
      service.updateCategory(1, body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(MOCK_CATEGORY);
    });
  });

  // ─── updateCategoryStatus ──────────────────────────────────────────────────

  describe('updateCategoryStatus()', () => {
    it('sends PATCH to /categories/:id/status', () => {
      service.updateCategoryStatus(1, { active: false }).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ active: false });
      req.flush(null);
    });
  });

  // ─── deleteCategory ────────────────────────────────────────────────────────

  describe('deleteCategory()', () => {
    it('sends DELETE to /categories/:id', () => {
      service.deleteCategory(1).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ─── getProposedCode ───────────────────────────────────────────────────────

  describe('getProposedCode()', () => {
    it('sends GET with name param only when parentId/excludeId are omitted', () => {
      service.getProposedCode('Test').subscribe();
      const req = httpTesting.expectOne((r) => r.url === `${BASE}/propose-code`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('name')).toBe('Test');
      expect(req.request.params.has('parentId')).toBe(false);
      expect(req.request.params.has('excludeId')).toBe(false);
      req.flush({ proposedCode: 'TES' });
    });

    it('includes parentId and excludeId when both are provided', () => {
      service.getProposedCode('Test', 5, 10).subscribe();
      const req = httpTesting.expectOne((r) => r.url === `${BASE}/propose-code`);
      expect(req.request.params.get('parentId')).toBe('5');
      expect(req.request.params.get('excludeId')).toBe('10');
      req.flush({ proposedCode: 'TES' });
    });

    it('omits parentId and excludeId when passed as null', () => {
      service.getProposedCode('Test', null, null).subscribe();
      const req = httpTesting.expectOne((r) => r.url === `${BASE}/propose-code`);
      expect(req.request.params.has('parentId')).toBe(false);
      expect(req.request.params.has('excludeId')).toBe(false);
      req.flush({ proposedCode: 'TES' });
    });
  });
});
