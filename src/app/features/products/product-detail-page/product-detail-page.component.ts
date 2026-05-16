import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CategoryTreeResponse,
  ColorResponse,
  CreateColorRequest,
  CreateProductRequest,
  CreateProductVariantRequest,
  ProductDetailResponse,
  ProductImageResponse,
  ProductVariantResponse,
  UpdateProductImageRequest,
  UpdateProductRequest,
} from '../../../core/models/api.models';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { ColorApiService } from '../../../core/services/color-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyPipe } from '../../../shared/pipes/format.pipes';

interface FlatCategory {
  id: number;
  label: string;
  primaryMeasureLabel: string | null;
  primaryMeasureUnit: string | null;
}

@Component({
  selector: 'app-product-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    CurrencyPipe,
    ConfirmDialogComponent,
  ],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ProductApiService);
  private readonly catApi = inject(CategoryApiService);
  private readonly colorApi = inject(ColorApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  product = signal<ProductDetailResponse | null>(null);
  flatCategories = signal<FlatCategory[]>([]);
  loading = signal(true);
  tab = signal<'info' | 'images' | 'variants'>('info');
  editMode = signal(false);
  isNew = false;
  private productId = 0;

  form: CreateProductRequest | UpdateProductRequest = {} as CreateProductRequest;

  // Product code suggestion (create mode)
  codeEdited = signal(false);
  suggestedCode = signal<string | null>(null);

  // Computed to find current category info
  selectedCategory = computed<FlatCategory | null>(() => {
    const catId = this.isNew
      ? (this.form as CreateProductRequest).categoryId
      : this.product()?.categoryId;
    if (!catId) return null;
    return this.flatCategories().find((c) => c.id === catId) ?? null;
  });

  variantDialogOpen = signal(false);
  variantForm: CreateProductVariantRequest = {} as CreateProductVariantRequest;

  // ─── Color dropdown with caching ───
  colors = signal<ColorResponse[]>([]);
  colorsLoaded = false;
  colorDropdownOpen = signal(false);
  colorDialogOpen = signal(false);
  newColorForm = { colorName: '', colorCode: '#000000' };

  imageDialogOpen = signal(false);
  editImageId = signal<number | null>(null);
  imageForm = { altText: '', displayOrder: 1, isPrimary: false };
  isFirstImage = signal(false);
  selectedFile: File | null = null;
  imagePreview = signal<string | null>(null);
  confirmDeleteImage = signal<ProductImageResponse | null>(null);

  // ─── Display order ───
  private originalCategoryId: number | null = null;

  ngOnInit(): void {
    this.catApi.getTree(true).subscribe({
      next: (tree) => {
        this.flatCategories.set(this.flattenTree(tree, 0));
        this.cdr.markForCheck();
      },
      error: () => this.notify.error('Error cargando categorías'),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === 'new') {
      this.isNew = true;
      this.loading.set(false);
      this.editMode.set(true);
      this.product.set({
        id: 0,
        productCode: '',
        name: '',
        categoryId: null,
        categoryName: '',
        active: true,
        variants: [],
        images: [],
      } as any);
      this.form = { productCode: '', name: '', categoryId: null } as any;
      return;
    }
    this.productId = Number(idParam);
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'images' || tabParam === 'variants') {
      this.tab.set(tabParam as 'images' | 'variants');
    }
    this.loadProduct();
  }

  private flattenTree(nodes: CategoryTreeResponse[], depth: number): FlatCategory[] {
    const result: FlatCategory[] = [];
    for (const node of nodes) {
      const prefix = '\u00a0\u00a0'.repeat(depth);
      result.push({
        id: node.id,
        label: prefix + node.name,
        primaryMeasureLabel: node.primaryMeasureLabel ?? null,
        primaryMeasureUnit: node.primaryMeasureUnit ?? null,
      });
      if (node.children?.length) {
        result.push(...this.flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }

  private loadProduct(): void {
    this.api.getProduct(this.productId, 'variants,images').subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
        if (this.route.snapshot.queryParamMap.get('newVariant') === 'true') {
          this.openVariantDialog();
        }
      },
      error: () => {
        this.notify.error('Producto no encontrado');
        this.router.navigate(['/products']);
      },
    });
  }

  variantName(v: ProductVariantResponse): string {
    return [v.material, v.color, v.finish].filter(Boolean).join(' · ') || v.sku;
  }

  primaryMeasureLabel(): string {
    const cat = this.selectedCategory();
    if (!cat?.primaryMeasureLabel) return 'Medida principal';
    return cat.primaryMeasureUnit
      ? `${cat.primaryMeasureLabel} (${cat.primaryMeasureUnit})`
      : cat.primaryMeasureLabel;
  }

  // ─── Tab navigation with locking for new products ───
  trySetTab(t: 'info' | 'images' | 'variants'): void {
    if (this.isNew && (t === 'images' || t === 'variants')) {
      this.notify.error('Guarda el producto primero para acceder a esta sección');
      return;
    }
    this.tab.set(t);
  }

  // ─── Category change → propose code ───
  onCategoryChange(catId: number): void {
    (this.form as CreateProductRequest).categoryId = catId;
    if (this.isNew) {
      this.api.proposeProductCode(catId).subscribe({
        next: (r) => {
          this.suggestedCode.set(r.proposedCode);
          if (!this.codeEdited()) {
            (this.form as CreateProductRequest).productCode = r.proposedCode;
          }
          this.cdr.markForCheck();
        },
      });
    }
  }

  onProductCodeInput(): void {
    this.codeEdited.set(true);
  }

  applySuggestedCode(): void {
    const s = this.suggestedCode();
    if (!s) return;
    (this.form as CreateProductRequest).productCode = s;
    this.codeEdited.set(false);
    this.suggestedCode.set(null);
  }

  startEdit(): void {
    const p = this.product()!;
    this.form = {
      productCode: p.productCode,
      name: p.name,
      categoryId: p.categoryId,
      brandName: p.brandName ?? '',
      collectionName: p.collectionName ?? '',
      defaultMaterial: p.defaultMaterial ?? '',
      defaultFinish: p.defaultFinish ?? '',
      shortDescription: p.shortDescription ?? '',
      description: p.description ?? '',
      internalNotes: p.internalNotes ?? '',
    };
    this.originalCategoryId = p.categoryId;
    this.editMode.set(true);
  }

  saveProduct(): void {
    if (this.isNew) {
      this.api.createProduct(this.form as CreateProductRequest).subscribe({
        next: (p) => {
          this.notify.success('Producto creado');
          // Transition to existing product mode without navigation
          this.isNew = false;
          this.productId = p.id;
          this.editMode.set(false);
          this.suggestedCode.set(null);
          this.codeEdited.set(false);
          this.loadProduct();
        },
        error: (e) => this.notify.error('Error', e.message),
      });
    } else {
      this.api.updateProduct(this.productId, this.form).subscribe({
        next: () => {
          this.notify.success('Producto actualizado');
          this.editMode.set(false);
          this.loadProduct();
        },
        error: (e) => this.notify.error('Error', e.message),
      });
    }
  }

  // ─── Variants ───
  openVariantDialog(): void {
    this.variantForm = {
      sku: '',
      material: '',
      finish: '',
      color: '',
      purity: '',
      weightGrams: undefined,
      baseSalePrice: undefined,
      minimumStock: 0,
      isSellable: true,
      primaryMeasureValue: '',
    };
    this.colorDropdownOpen.set(false);
    this.variantDialogOpen.set(true);
  }

  get defaultMaterialPlaceholder(): string {
    return this.product()?.defaultMaterial || '';
  }

  get defaultFinishPlaceholder(): string {
    return this.product()?.defaultFinish || '';
  }

  // ─── Color dropdown ───
  loadColorsIfNeeded(): void {
    if (this.colorsLoaded) return;
    this.colorApi.getColors().subscribe({
      next: (list) => {
        this.colors.set(list);
        this.colorsLoaded = true;
        this.cdr.markForCheck();
      },
    });
  }

  toggleColorDropdown(): void {
    const open = !this.colorDropdownOpen();
    this.colorDropdownOpen.set(open);
    if (open) {
      this.loadColorsIfNeeded();
    }
  }

  selectColor(color: ColorResponse): void {
    this.variantForm.color = color.colorName;
    this.colorDropdownOpen.set(false);
  }

  openNewColorDialog(): void {
    this.colorDropdownOpen.set(false);
    this.newColorForm = { colorName: '', colorCode: '#000000' };
    this.colorDialogOpen.set(true);
  }

  saveNewColor(): void {
    const name = this.newColorForm.colorName.trim();
    const code = this.newColorForm.colorCode.trim();
    if (!name) {
      this.notify.error('El nombre del color es obligatorio');
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(code)) {
      this.notify.error('El código debe ser hexadecimal (ej. #FF0000)');
      return;
    }
    this.colorApi
      .createColor({ colorName: name, colorCode: code } as CreateColorRequest)
      .subscribe({
        next: () => {
          this.notify.success('Color creado');
          this.colorDialogOpen.set(false);
          this.colorsLoaded = false; // Invalidate cache
        },
        error: (e) => this.notify.error('Error creando color', e.message),
      });
  }

  getColorHex(colorName: string): string {
    const c = this.colors().find((x) => x.colorName === colorName);
    return c?.colorCode ?? '#ccc';
  }

  saveVariant(): void {
    this.api.createVariant(this.productId, this.variantForm).subscribe({
      next: () => {
        this.notify.success('Variante creada');
        this.variantDialogOpen.set(false);
        this.loadProduct();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  toggleVariant(v: ProductVariantResponse): void {
    this.api.updateVariantStatus(this.productId, v.id, { active: !v.active }).subscribe({
      next: () => {
        this.notify.success(v.active ? 'Variante desactivada' : 'Variante activada');
        this.loadProduct();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  // ─── Images ───
  openImageDialog(): void {
    const activeImages = this.product()?.images?.filter((i) => i.active) ?? [];
    const first = activeImages.length === 0;
    this.isFirstImage.set(first);
    this.editImageId.set(null);
    const nextOrder =
      activeImages.length > 0 ? Math.max(...activeImages.map((i) => i.displayOrder)) + 1 : 1;
    this.imageForm = { altText: '', displayOrder: nextOrder, isPrimary: first };
    this.selectedFile = null;
    this.imagePreview.set(null);
    this.imageDialogOpen.set(true);
  }

  editImage(img: ProductImageResponse): void {
    this.isFirstImage.set(false);
    this.editImageId.set(img.id);
    this.imageForm = {
      altText: img.altText ?? '',
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary,
    };
    this.selectedFile = null;
    this.imagePreview.set(img.publicUrl);
    this.imageDialogOpen.set(true);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  saveImage(): void {
    if (this.editImageId()) {
      this.api
        .updateProductImage(
          this.productId,
          this.editImageId()!,
          this.imageForm as UpdateProductImageRequest,
        )
        .subscribe({
          next: () => {
            this.notify.success('Imagen actualizada');
            this.imageDialogOpen.set(false);
            this.loadProduct();
          },
          error: (e) => this.notify.error('Error', e.message),
        });
    } else {
      if (!this.selectedFile) {
        this.notify.error('Selecciona un archivo de imagen');
        return;
      }
      this.api.createProductImage(this.productId, this.selectedFile, this.imageForm).subscribe({
        next: () => {
          this.notify.success('Imagen añadida');
          this.imageDialogOpen.set(false);
          this.loadProduct();
        },
        error: (e) => this.notify.error('Error', e.message),
      });
    }
  }

  askDeleteImage(img: ProductImageResponse): void {
    this.confirmDeleteImage.set(img);
  }

  doDeleteImage(): void {
    const img = this.confirmDeleteImage();
    if (!img) return;
    this.api.deleteProductImage(this.productId, img.id).subscribe({
      next: () => {
        this.notify.success('Imagen eliminada');
        this.confirmDeleteImage.set(null);
        this.loadProduct();
      },
      error: (e) => {
        this.notify.error('Error al eliminar imagen', e.message);
        this.confirmDeleteImage.set(null);
      },
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="140" fill="%23E5E7EB"><rect width="180" height="140"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236B7280" font-size="12">Sin imagen</text></svg>';
  }
}
