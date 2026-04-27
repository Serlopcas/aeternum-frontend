import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import {
  CategoryTreeResponse,
  ClientResponse,
  ColorResponse,
  SupplierResponse,
} from '../models/api.models';
import { CategoryApiService } from './category-api.service';
import { ClientApiService } from './client-api.service';
import { ColorApiService } from './color-api.service';
import { SupplierApiService } from './supplier-api.service';

@Injectable({ providedIn: 'root' })
export class ReferenceDataCacheService {
  private readonly clientApi = inject(ClientApiService);
  private readonly supplierApi = inject(SupplierApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly colorApi = inject(ColorApiService);

  private activeClients$?: Observable<ClientResponse[]>;
  private activeSuppliers$?: Observable<SupplierResponse[]>;
  private activeCategoryTree$?: Observable<CategoryTreeResponse[]>;
  private colors$?: Observable<ColorResponse[]>;

  getActiveClients(): Observable<ClientResponse[]> {
    if (!this.activeClients$) {
      this.activeClients$ = this.clientApi.getClients({ active: true, size: 200 }).pipe(
        map((page) => page.content),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.activeClients$;
  }

  getActiveSuppliers(): Observable<SupplierResponse[]> {
    if (!this.activeSuppliers$) {
      this.activeSuppliers$ = this.supplierApi.getSuppliers({ active: true, size: 200 }).pipe(
        map((page) => page.content),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.activeSuppliers$;
  }

  getActiveCategoryTree(): Observable<CategoryTreeResponse[]> {
    if (!this.activeCategoryTree$) {
      this.activeCategoryTree$ = this.categoryApi
        .getTree(true)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.activeCategoryTree$;
  }

  getColors(): Observable<ColorResponse[]> {
    if (!this.colors$) {
      this.colors$ = this.colorApi
        .getColors()
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.colors$;
  }
}
