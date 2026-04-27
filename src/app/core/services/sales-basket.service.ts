import { computed, inject, Injectable, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../config/environment';
import { SalesBasket, SalesBasketLine, SellableCatalogItemResponse } from '../models/api.models';
import { AuthStateService } from '../state/auth-state.service';

@Injectable({ providedIn: 'root' })
export class SalesBasketService {
  private readonly authState = inject(AuthStateService);

  private readonly _basket = signal<SalesBasket>(this.load());

  readonly basket = this._basket.asReadonly();
  readonly lines = computed(() => this._basket().lines);
  readonly lineCount = computed(() => this._basket().lines.length);
  readonly total = computed(() =>
    this._basket().lines.reduce((sum, l) => sum + l.quantitySold * l.unitPriceSnapshot, 0),
  );
  readonly clientId = computed(() => this._basket().clientId);
  readonly notes = computed(() => this._basket().internalNotes);

  private get userId(): number | null {
    return this.authState.user()?.id ?? null;
  }

  private storageKey(): string | null {
    const uid = this.userId;
    return uid ? environment.salesCartKey(uid) : null;
  }

  private load(): SalesBasket {
    try {
      const uid = this.authState.user()?.id;
      if (uid) {
        const raw = localStorage.getItem(environment.salesCartKey(uid));
        if (raw) {
          const parsed = JSON.parse(raw) as SalesBasket;
          if (parsed && Array.isArray(parsed.lines)) return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    return this.emptyBasket();
  }

  private emptyBasket(): SalesBasket {
    return {
      clientId: null,
      clientName: null,
      documentDate: null,
      deliveryDate: null,
      internalNotes: '',
      lines: [],
      updatedAt: new Date().toISOString(),
      createdByUserId: this.userId,
    };
  }

  private persist(): void {
    const key = this.storageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(this._basket()));
  }

  setClientId(id: number | null, name?: string): void {
    this._basket.update((b) => ({ ...b, clientId: id, clientName: name ?? b.clientName }));
    this.persist();
  }

  setDocumentDate(date: string | null): void {
    this._basket.update((b) => ({ ...b, documentDate: date }));
    this.persist();
  }

  setDeliveryDate(date: string | null): void {
    this._basket.update((b) => ({ ...b, deliveryDate: date }));
    this.persist();
  }

  setNotes(notes: string): void {
    this._basket.update((b) => ({ ...b, internalNotes: notes }));
    this.persist();
  }

  addLine(item: SellableCatalogItemResponse, qty = 1): void {
    const existing = this._basket().lines.find((l) => l.variantId === item.variantId);
    if (existing) {
      this._basket.update((b) => ({
        ...b,
        lines: b.lines.map((l) =>
          l.variantId === item.variantId ? { ...l, quantitySold: l.quantitySold + qty } : l,
        ),
      }));
    } else {
      const line: SalesBasketLine = {
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
        quantitySold: qty,
        unitPriceSnapshot: item.baseSalePrice ?? 0,
        baseSalePrice: item.baseSalePrice ?? null,
        unitCostSnapshot: null,
        currentStock: item.currentStock,
        isBelowMinimum: item.isBelowMinimum,
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

  private buildVariantLabel(item: SellableCatalogItemResponse): string {
    const parts = [item.material, item.finish, item.color, item.purity, item.primaryMeasureValue]
      .filter(Boolean)
      .join(' ');
    return parts ? `${item.productName} – ${parts}` : item.productName;
  }

  updateLine(localId: string, updates: Partial<SalesBasketLine>): void {
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

  clear(): void {
    const key = this.storageKey();
    if (key) localStorage.removeItem(key);
    this._basket.set(this.emptyBasket());
  }

  resetActive(): void {
    this._basket.set(this.emptyBasket());
  }
}
