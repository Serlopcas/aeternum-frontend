import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../config/environment';
import { ColorResponse, CreateColorRequest, UpdateColorRequest } from '../models/api.models';
import { ColorApiService } from './color-api.service';

const BASE = `${environment.apiBaseUrl}/colors`;

const MOCK_COLOR: ColorResponse = {
  id: 1,
  colorName: 'Rojo',
  colorCode: '#FF0000',
};

describe('ColorApiService', () => {
  let service: ColorApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ColorApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  describe('getColors()', () => {
    it('sends GET to /colors and returns list', () => {
      let result!: ColorResponse[];
      service.getColors().subscribe((r) => (result = r));
      const req = httpTesting.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush([MOCK_COLOR]);
      expect(result).toEqual([MOCK_COLOR]);
    });
  });

  describe('getColor()', () => {
    it('sends GET to /colors/:id', () => {
      let result!: ColorResponse;
      service.getColor(1).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_COLOR);
      expect(result).toEqual(MOCK_COLOR);
    });
  });

  describe('createColor()', () => {
    it('sends POST to /colors with the request body', () => {
      const body: CreateColorRequest = { colorName: 'Azul', colorCode: '#0000FF' };
      let result!: ColorResponse;
      service.createColor(body).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 2, ...body });
      expect(result.colorName).toBe('Azul');
    });
  });

  describe('updateColor()', () => {
    it('sends PATCH to /colors/:id with the update body', () => {
      const body: UpdateColorRequest = { colorName: 'Rojo Oscuro' };
      service.updateColor(1, body).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush(MOCK_COLOR);
    });
  });

  describe('deleteColor()', () => {
    it('sends DELETE to /colors/:id', () => {
      service.deleteColor(1).subscribe();
      const req = httpTesting.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
