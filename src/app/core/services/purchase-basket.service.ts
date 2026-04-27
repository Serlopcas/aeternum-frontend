import { computed, inject, Injectable, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../config/environment';
import {
  PurchaseBasket,
  PurchaseBasketLine,
  PurchaseDraftMeta,
  SupplierCatalogItemResponse,
} from '../models/api.models';
import { AuthStateService } from '../state/auth-state.service';

@Injectable({ providedIn: 'root' })
export class PurchaseBasketService {
  private readonly authState = inject(AuthStateService);

  private readonly _activeSupplierId = signal<number | null>(null);
  private readonly _basket = signal<PurchaseBasket>(this.emptyBasket());
  private readonly _draftsIndex = signal<PurchaseDraftMeta[]>([]);

  readonly activeSupplierId = this._activeSupplierId.asReadonly();
  readonly basket = this._basket.asReadonly();
  readonly lines = computed(() => this._basket().lines);
  readonly lineCount = computed(() => this._basket().lines.length);
  readonly total = computed(() =>
    this._basket().lines.reduce((sum, l) => sum + l.quantityOrdered * l.unitCostSnapshot, 0),
  );
  readonly supplierId = computed(() => this._basket().supplierId);
  readonly notes = computed(() => this._basket().internalNotes);
  readonly draftsIndex = this._draftsIndex.asReadonly();

  private get userId(): number | null {
    return this.authState.user()?.id ?? null;
  }

  private emptyBasket(
    supplierId: number | null = null,
    supplierName: string | null = null,
  ): PurchaseBasket {
    return {
      supplierId,
      supplierName,
      documentDate: null,
      expectedDeliveryDate: null,
      internalNotes: '',
      lines: [],
      updatedAt: new Date().toISOString(),
      createdByUserId: this.userId,
    };
  }

  loadDraftsIndex(): void {
    const uid = this.userId;
    if (!uid) {
      this._draftsIndex.set([]);
      return;
    }
    try {
      const raw = localStorage.getItem(environment.purchaseCartIndexKey(uid));
      if (raw) {
        const parsed = JSON.parse(raw) as PurchaseDraftMeta[];
        if (Array.isArray(parsed)) {
          this._draftsIndex.set(parsed);
          return;
        }
      }
    } catch {}
    this._draftsIndex.set([]);
  }

  private saveDraftsIndex(): void {
    const uid = this.userId;
    if (!uid) return;
    localStorage.setItem(
      environment.purchaseCartIndexKey(uid),
      JSON.stringify(this._draftsIndex()),
    );
  }

  setSupplier(supplierId: number, supplierName: string): void {
    this.persistCurrentCart();
    this._activeSupplierId.set(supplierId);
    const uid = this.userId;
    if (uid) {
      try {
        const raw = localStorage.getItem(environment.purchaseCartKey(uid, supplierId));
        if (raw) {
          const parsed = JSON.parse(raw) as PurchaseBasket;
          if (parsed && Array.isArray(parsed.lines)) {
            this._basket.set(parsed);
            return;
          }
        }
      } catch {}
    }
    this._basket.set(this.emptyBasket(supplierId, supplierName));
  }

  private persistCurrentCart(): void {
    const uid = this.userId;
    const sid = this._activeSupplierId();
    if (!uid || !sid) return;
    const basket = this._basket();
    if (basket.lines.length === 0) {
      localStorage.removeItem(environment.purchaseCartKey(uid, sid));
      this.removeDraftFromIndex(sid);
    } else {
      const updated: PurchaseBasket = { ...basket, updatedAt: new Date().toISOString() };
      localStorage.setItem(environment.purchaseCartKey(uid, sid), JSON.stringify(updated));
      this.upsertDraftIndex(updated);
    }
    this.saveDraftsIndex();
  }

  private upsertDraftIndex(basket: PurchaseBasket): void {
    const sid = basket.supplierId!;
    const meta: PurchaseDraftMeta = {
      supplierId: sid,
      supplierName: basket.supplierName ?? '',
      lineCount: basket.lines.length,
      unitTotal: basket.lines.reduce((s, l) => s + l.quantityOrdered * l.unitCostSnapshot, 0),
      updatedAt: basket.updatedAt,
    };
    this._draftsIndex.update((idx) => [...idx.filter((m) => m.supplierId !== sid), meta]);
  }

  private removeDraftFromIndex(supplierId: number): void {
    this._draftsIndex.update((idx) => idx.filter((m) => m.supplierId !== supplierId));
  }

  setDocumentDate(date: string | null): void {
    this._basket.update((b) => ({ ...b, documentDate: date }));
    this.persist();
  }

  setExpectedDeliveryDate(date: string | null): void {
    this._basket.update((b) => ({ ...b, expectedDeliveryDate: date }));
    this.persist();
  }

  setNotes(notes: string): void {
    this._basket.update((b) => ({ ...b, internalNotes: notes }));
    this.persist();
  }

  addLine(item: SupplierCatalogItemResponse, qty = 1): void {
    const existing = this._basket().lines.find((l) => l.variantId === item.variantId);
    if (existing) {
      this._basket.update((b) => ({
        ...b,
        lines: b.lines.map((l) =>
          l.variantId === item.variantId ? { ...l, quantityOrdered: l.quantityOrdered + qty } : l,
        ),
      }));
    } else {
      const line: PurchaseBasketLine = {
        localId: uuidv4(),
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        variantLabel: this.buildVariantLabel(item),
        categoryName: item.categoryName,
        finish: item.finish,
        color: item.color,
        purity: item.purity,
        primaryMeasureValue: item.primaryMeasureValue,
        imageUrl: item.primaryImageUrl,
        quantityOrdered: qty,
        unitCostSnapshot: item.basePurchaseCost ?? 0,
        basePurchaseCost: item.basePurchaseCost ?? null,
        supplierLinkId: item.supplierProductVariantId,
        supplierReference: item.supplierReference,
        leadTimeDays: item.leadTimeDays,
        discountPercent: 0,
        taxPercent: 0,
        subtotalExclTax: 0,
        totalInclTax: 0,
        notes: '',
        validationStatus: null,
      };
      this._basket.update((b) => ({ ...b, lines: [...b.lines, line] }));
    }
    this.persist();
  }

  private buildVariantLabel(item: SupplierCatalogItemResponse): string {
    const parts = [item.material, item.finish, item.color, item.purity, item.primaryMeasureValue]
      .filter(Boolean)
      .join(' ');
    return parts ? `${item.productName} – ${parts}` : item.productName;
  }

  updateLine(localId: string, updates: Partial<PurchaseBasketLine>): void {
    this._basket.update((b) => ({
      ...b,
      lines: b.lines.map((l) => (l.localId === localId ? { ...l, ...updates } : l)),
    }));
    this.persist();
  }

  removeLine(localId: string): void {
    this._basket.update((b) => ({
      ...b,
      lines: b.lines.filter((l) => l.localId !== localId),
    }));
    this.persist();
  }

  saveDraftExplicit(): void {
    this.persistCurrentCart();
  }

  deleteDraft(supplierId: number): void {
    const uid = this.userId;
    if (uid) localStorage.removeItem(environment.purchaseCartKey(uid, supplierId));
    this.removeDraftFromIndex(supplierId);
    this.saveDraftsIndex();
    if (this._activeSupplierId() === supplierId) {
      this._activeSupplierId.set(null);
      this._basket.set(this.emptyBasket());
    }
  }

  clear(): void {
    const uid = this.userId;
    const sid = this._activeSupplierId();
    if (uid && sid) {
      localStorage.removeItem(environment.purchaseCartKey(uid, sid));
      this.removeDraftFromIndex(sid);
      this.saveDraftsIndex();
    }
    this._basket.set(this.emptyBasket(sid, this._basket().supplierName));
  }

  resetActive(): void {
    this.persistCurrentCart();
    this._activeSupplierId.set(null);
    this._basket.set(this.emptyBasket());
    this.loadDraftsIndex();
  }

  private persist(): void {
    const uid = this.userId;
    const sid = this._activeSupplierId();
    if (!uid || !sid) return;
    const updated: PurchaseBasket = { ...this._basket(), updatedAt: new Date().toISOString() };
    localStorage.setItem(environment.purchaseCartKey(uid, sid), JSON.stringify(updated));
    this.upsertDraftIndex(updated);
    this.saveDraftsIndex();
  }
}
