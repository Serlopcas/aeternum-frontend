import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import {
  CreateProductRequest,
  CreateProductVariantRequest,
  CreateSupplierProductVariantRequest,
  PageResponse,
  ProductDetailResponse,
  ProductImageResponse,
  ProductResponse,
  ProductVariantDetailResponse,
  ProductVariantResponse,
  ProposeProductCodeResponse,
  SupplierProductVariantResponse,
  SupplierVariantPurchaseCostHistoryResponse,
  UpdateProductImageRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpdateSupplierProductVariantRequest,
  VariantSalePriceHistoryResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/products`;

  // ─── Products ───
  getProducts(params: {
    categoryId?: number;
    query?: string;
    active?: boolean | null;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<PageResponse<ProductResponse>> {
    let hp = new HttpParams();
    if (params.categoryId) hp = hp.set('categoryId', String(params.categoryId));
    if (params.query) hp = hp.set('query', params.query);
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<ProductResponse>>(this.base, { params: hp });
  }

  getProduct(id: number, include?: string): Observable<ProductDetailResponse> {
    let hp = new HttpParams();
    if (include) hp = hp.set('include', include);
    return this.http.get<ProductDetailResponse>(`${this.base}/${id}`, { params: hp });
  }

  createProduct(body: CreateProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.base, body);
  }

  updateProduct(id: number, body: UpdateProductRequest): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.base}/${id}`, body);
  }

  updateProductStatus(id: number, body: { active: boolean }): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, body);
  }

  proposeProductCode(categoryId: number): Observable<ProposeProductCodeResponse> {
    const hp = new HttpParams().set('categoryId', String(categoryId));
    return this.http.get<ProposeProductCodeResponse>(`${this.base}/propose-code`, { params: hp });
  }

  // ─── Variants ───
  getVariants(
    productId: number,
    params: { active?: boolean | null; page?: number; size?: number; sort?: string },
  ): Observable<PageResponse<ProductVariantResponse>> {
    let hp = new HttpParams();
    if (params.active !== undefined && params.active !== null)
      hp = hp.set('active', String(params.active));
    hp = hp.set('page', String(params.page ?? 0));
    hp = hp.set('size', String(params.size ?? 20));
    if (params.sort) hp = hp.set('sort', params.sort);
    return this.http.get<PageResponse<ProductVariantResponse>>(
      `${this.base}/${productId}/variants`,
      { params: hp },
    );
  }

  getVariant(productId: number, variantId: number): Observable<ProductVariantDetailResponse> {
    return this.http.get<ProductVariantDetailResponse>(
      `${this.base}/${productId}/variants/${variantId}`,
    );
  }

  createVariant(
    productId: number,
    body: CreateProductVariantRequest,
  ): Observable<ProductVariantResponse> {
    return this.http.post<ProductVariantResponse>(`${this.base}/${productId}/variants`, body);
  }

  updateVariant(
    productId: number,
    variantId: number,
    body: UpdateProductVariantRequest,
  ): Observable<ProductVariantResponse> {
    return this.http.patch<ProductVariantResponse>(
      `${this.base}/${productId}/variants/${variantId}`,
      body,
    );
  }

  updateVariantStatus(
    productId: number,
    variantId: number,
    body: { active: boolean },
  ): Observable<void> {
    return this.http.patch<void>(`${this.base}/${productId}/variants/${variantId}/status`, body);
  }

  getVariantPriceHistory(
    productId: number,
    variantId: number,
  ): Observable<VariantSalePriceHistoryResponse[]> {
    return this.http.get<VariantSalePriceHistoryResponse[]>(
      `${this.base}/${productId}/variants/${variantId}/price-history`,
    );
  }

  // ─── Variant Supplier Links ───
  getVariantSuppliers(
    productId: number,
    variantId: number,
  ): Observable<SupplierProductVariantResponse[]> {
    return this.http.get<SupplierProductVariantResponse[]>(
      `${this.base}/${productId}/variants/${variantId}/suppliers`,
    );
  }

  createVariantSupplier(
    productId: number,
    variantId: number,
    body: CreateSupplierProductVariantRequest,
  ): Observable<SupplierProductVariantResponse> {
    return this.http.post<SupplierProductVariantResponse>(
      `${this.base}/${productId}/variants/${variantId}/suppliers`,
      body,
    );
  }

  updateVariantSupplier(
    productId: number,
    variantId: number,
    linkId: number,
    body: UpdateSupplierProductVariantRequest,
  ): Observable<SupplierProductVariantResponse> {
    return this.http.patch<SupplierProductVariantResponse>(
      `${this.base}/${productId}/variants/${variantId}/suppliers/${linkId}`,
      body,
    );
  }

  updateVariantSupplierStatus(
    productId: number,
    variantId: number,
    linkId: number,
    body: { active: boolean },
  ): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/${productId}/variants/${variantId}/suppliers/${linkId}/status`,
      body,
    );
  }

  getVariantSupplierCostHistory(
    productId: number,
    variantId: number,
    linkId: number,
  ): Observable<SupplierVariantPurchaseCostHistoryResponse[]> {
    return this.http.get<SupplierVariantPurchaseCostHistoryResponse[]>(
      `${this.base}/${productId}/variants/${variantId}/suppliers/${linkId}/purchase-cost-history`,
    );
  }

  // ─── Product Images ───
  createProductImage(
    productId: number,
    file: File,
    metadata: { altText?: string; displayOrder?: number; isPrimary?: boolean },
  ): Observable<ProductImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.altText) formData.append('altText', metadata.altText);
    if (metadata.displayOrder !== undefined)
      formData.append('displayOrder', String(metadata.displayOrder));
    if (metadata.isPrimary !== undefined) formData.append('isPrimary', String(metadata.isPrimary));
    return this.http.post<ProductImageResponse>(`${this.base}/${productId}/images`, formData);
  }

  updateProductImage(
    productId: number,
    imageId: number,
    body: UpdateProductImageRequest,
  ): Observable<ProductImageResponse> {
    return this.http.patch<ProductImageResponse>(
      `${this.base}/${productId}/images/${imageId}`,
      body,
    );
  }

  updateProductImageStatus(
    productId: number,
    imageId: number,
    body: { active: boolean },
  ): Observable<void> {
    return this.http.patch<void>(`${this.base}/${productId}/images/${imageId}/status`, body);
  }

  deleteProductImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${productId}/images/${imageId}`);
  }

  // ─── Variant Images ───
  createVariantImage(
    productId: number,
    variantId: number,
    file: File,
    metadata: { altText?: string; displayOrder?: number; isPrimary?: boolean },
  ): Observable<ProductImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.altText) formData.append('altText', metadata.altText);
    if (metadata.displayOrder !== undefined)
      formData.append('displayOrder', String(metadata.displayOrder));
    if (metadata.isPrimary !== undefined) formData.append('isPrimary', String(metadata.isPrimary));
    return this.http.post<ProductImageResponse>(
      `${this.base}/${productId}/variants/${variantId}/images`,
      formData,
    );
  }

  updateVariantImage(
    productId: number,
    variantId: number,
    imageId: number,
    body: UpdateProductImageRequest,
  ): Observable<ProductImageResponse> {
    return this.http.patch<ProductImageResponse>(
      `${this.base}/${productId}/variants/${variantId}/images/${imageId}`,
      body,
    );
  }

  updateVariantImageStatus(
    productId: number,
    variantId: number,
    imageId: number,
    body: { active: boolean },
  ): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/${productId}/variants/${variantId}/images/${imageId}/status`,
      body,
    );
  }

  deleteVariantImage(productId: number, variantId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/${productId}/variants/${variantId}/images/${imageId}`,
    );
  }
}
