import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CreateSupplierProductVariantRequest,
  ProductResponse,
  ProductVariantResponse,
  SupplierAddressResponse,
  SupplierCatalogItemResponse,
  SupplierContactResponse,
  SupplierDetailResponse,
} from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { SupplierApiService } from '../../../core/services/supplier-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  StatusBadgeComponent,
  getActiveStatusColor,
} from '../../../shared/components/status-badge/status-badge.component';
import { PurchasesListPageComponent } from '../../purchases/purchases-list-page/purchases-list-page.component';

@Component({
  selector: 'app-supplier-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    PurchasesListPageComponent,
  ],
  templateUrl: './supplier-detail-page.component.html',
  styleUrl: './supplier-detail-page.component.scss',
})
export class SupplierDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SupplierApiService);
  private readonly productApi = inject(ProductApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  supplier = signal<SupplierDetailResponse | null>(null);
  loading = signal(true);
  tab = signal<'info' | 'contacts' | 'addresses' | 'catalog' | 'purchases'>('info');
  editMode = signal(false);

  editData = { name: '', taxId: '', websiteUrl: '', notes: '' };

  // Catalog
  catalogItems = signal<SupplierCatalogItemResponse[]>([]);
  catalogLoading = signal(false);

  catalogGrouped = computed(() => {
    const items = this.catalogItems();
    const categories = new Map<
      number,
      {
        id: number;
        name: string;
        measureLabel: string;
        products: Map<
          number,
          { id: number; name: string; code: string; variants: SupplierCatalogItemResponse[] }
        >;
      }
    >();
    for (const item of items) {
      let cat = categories.get(item.categoryId);
      if (!cat) {
        const label = item.primaryMeasureUnit
          ? `${item.primaryMeasureLabel} (${item.primaryMeasureUnit})`
          : (item.primaryMeasureLabel ?? 'Medida');
        cat = {
          id: item.categoryId,
          name: item.categoryName,
          measureLabel: label,
          products: new Map(),
        };
        categories.set(item.categoryId, cat);
      }
      let prod = cat.products.get(item.productId);
      if (!prod) {
        prod = { id: item.productId, name: item.productName, code: item.productCode, variants: [] };
        cat.products.set(item.productId, prod);
      }
      prod.variants.push(item);
    }
    return [...categories.values()].map((c) => ({
      ...c,
      products: [...c.products.values()],
    }));
  });

  contactDialogOpen = signal(false);
  editContactId = signal<number | null>(null);
  contactForm = { name: '', email: '', phone: '', positionName: '' };

  addressDialogOpen = signal(false);
  editAddressId = signal<number | null>(null);
  addressForm = {
    label: '',
    addressLine1: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
  };

  private supplierId = 0;
  isNew = false;

  // Add variant link dialog
  linkDialogOpen = signal(false);
  linkProducts = signal<ProductResponse[]>([]);
  linkVariants = signal<ProductVariantResponse[]>([]);
  linkSelectedProduct = signal<ProductResponse | null>(null);
  linkForm = { variantId: 0, supplierReference: '', basePurchaseCost: 0 };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === 'new') {
      this.isNew = true;
      this.loading.set(false);
      this.editMode.set(true);
      this.supplier.set({
        id: 0,
        name: '',
        taxId: '',
        websiteUrl: '',
        notes: '',
        active: true,
        contacts: [],
        addresses: [],
      } as any);
      return;
    }
    this.supplierId = Number(idParam);
    this.loadSupplier();
  }

  private loadSupplier(): void {
    this.api.getSupplier(this.supplierId).subscribe({
      next: (s) => {
        this.supplier.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Proveedor no encontrado');
        this.router.navigate(['/suppliers']);
      },
    });
  }

  switchTab(t: 'info' | 'contacts' | 'addresses' | 'catalog' | 'purchases'): void {
    this.tab.set(t);
    if (t === 'catalog' && this.catalogItems().length === 0) {
      this.loadCatalog();
    }
  }

  private loadCatalog(): void {
    this.catalogLoading.set(true);
    this.api.getSupplierCatalog(this.supplierId).subscribe({
      next: (items) => {
        this.catalogItems.set(items);
        this.catalogLoading.set(false);
      },
      error: () => this.catalogLoading.set(false),
    });
  }

  getActiveColor(active: boolean): string {
    return getActiveStatusColor(active);
  }

  startEdit(): void {
    const s = this.supplier()!;
    this.editData = {
      name: s.name,
      taxId: s.taxId ?? '',
      websiteUrl: s.websiteUrl ?? '',
      notes: s.notes ?? '',
    };
    this.editMode.set(true);
  }

  saveInfo(): void {
    if (this.isNew) {
      this.api.createSupplier(this.editData).subscribe({
        next: (s) => {
          this.notify.success('Proveedor creado');
          this.router.navigate(['/suppliers', s.id]);
        },
        error: (e) => this.notify.error('Error', e.message),
      });
    } else {
      this.api.updateSupplier(this.supplierId, this.editData).subscribe({
        next: (s) => {
          this.supplier.set(s as SupplierDetailResponse);
          this.editMode.set(false);
          this.notify.success('Proveedor actualizado');
        },
        error: (e) => this.notify.error('Error', e.message),
      });
    }
  }

  // Contacts
  openContactDialog(c?: SupplierContactResponse): void {
    if (c) {
      this.editContactId.set(c.id);
      this.contactForm = {
        name: c.name,
        email: c.email ?? '',
        phone: c.phone ?? '',
        positionName: c.positionName ?? '',
      };
    } else {
      this.editContactId.set(null);
      this.contactForm = { name: '', email: '', phone: '', positionName: '' };
    }
    this.contactDialogOpen.set(true);
  }

  saveContact(): void {
    const obs = this.editContactId()
      ? this.api.updateContact(this.supplierId, this.editContactId()!, this.contactForm)
      : this.api.createContact(this.supplierId, { ...this.contactForm, contactOrder: 0 });
    obs.subscribe({
      next: () => {
        this.notify.success(this.editContactId() ? 'Contacto actualizado' : 'Contacto creado');
        this.contactDialogOpen.set(false);
        this.loadSupplier();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  deleteContact(id: number): void {
    this.api.updateContactStatus(this.supplierId, id, { active: false }).subscribe({
      next: () => {
        this.notify.success('Contacto eliminado');
        this.loadSupplier();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  // Addresses
  openAddressDialog(a?: SupplierAddressResponse): void {
    if (a) {
      this.editAddressId.set(a.id);
      this.addressForm = {
        label: a.label ?? '',
        addressLine1: a.addressLine1,
        city: a.city,
        province: a.province ?? '',
        postalCode: a.postalCode ?? '',
        country: a.country ?? '',
      };
    } else {
      this.editAddressId.set(null);
      this.addressForm = {
        label: '',
        addressLine1: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
      };
    }
    this.addressDialogOpen.set(true);
  }

  saveAddress(): void {
    const obs = this.editAddressId()
      ? this.api.updateAddress(this.supplierId, this.editAddressId()!, this.addressForm)
      : this.api.createAddress(this.supplierId, { ...this.addressForm, addressOrder: 0 });
    obs.subscribe({
      next: () => {
        this.notify.success(this.editAddressId() ? 'Dirección actualizada' : 'Dirección creada');
        this.addressDialogOpen.set(false);
        this.loadSupplier();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  deleteAddress(id: number): void {
    this.api.updateAddressStatus(this.supplierId, id, { active: false }).subscribe({
      next: () => {
        this.notify.success('Dirección eliminada');
        this.loadSupplier();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  // Catalog link toggle
  toggleCatalogLink(v: SupplierCatalogItemResponse): void {
    this.productApi
      .updateVariantSupplierStatus(v.productId, v.variantId, v.supplierProductVariantId, {
        active: !v.active,
      })
      .subscribe({
        next: () => {
          this.notify.success(v.active ? 'Vínculo desactivado' : 'Vínculo activado');
          this.loadCatalog();
        },
        error: (e) => this.notify.error('Error', e.message),
      });
  }

  // Add variant link
  openLinkDialog(): void {
    this.linkForm = { variantId: 0, supplierReference: '', basePurchaseCost: 0 };
    this.linkSelectedProduct.set(null);
    this.linkVariants.set([]);
    this.linkDialogOpen.set(true);
    if (this.linkProducts().length > 0) {
      return;
    }
    this.productApi.getProducts({ active: true, size: 200 }).subscribe({
      next: (page) => this.linkProducts.set(page.content),
    });
  }

  onLinkProductChange(productId: number): void {
    if (!productId) {
      this.linkVariants.set([]);
      this.linkSelectedProduct.set(null);
      return;
    }
    const prod = this.linkProducts().find((p) => p.id === productId) ?? null;
    this.linkSelectedProduct.set(prod);
    this.linkForm.variantId = 0;
    this.productApi.getVariants(productId, { active: true, size: 200 }).subscribe({
      next: (page) => this.linkVariants.set(page.content),
    });
  }

  variantLabel(v: ProductVariantResponse): string {
    return [v.sku, v.material, v.color].filter(Boolean).join(' · ');
  }

  saveLinkVariant(): void {
    const prod = this.linkSelectedProduct();
    if (!prod || !this.linkForm.variantId) return;
    const body: CreateSupplierProductVariantRequest = {
      supplierId: this.supplierId,
      supplierReference: this.linkForm.supplierReference || undefined,
      basePurchaseCost: this.linkForm.basePurchaseCost,
    };
    this.productApi.createVariantSupplier(prod.id, this.linkForm.variantId, body).subscribe({
      next: () => {
        this.notify.success('Variante vinculada al proveedor');
        this.linkDialogOpen.set(false);
        this.loadCatalog();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }
}
