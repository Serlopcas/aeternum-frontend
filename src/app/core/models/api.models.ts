// ─── Auth ───
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: string[];
  active: boolean;
  profileImageUrl: string | null;
}

export interface UpdateProfileRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateUserStatusRequest {
  active: boolean;
}

export interface UpdateUserRolesRequest {
  roles: string[];
}

export interface RoleResponse {
  code: string;
  name: string;
  description: string;
}

// ─── Auth State ───
export interface AuthState {
  accessToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Pagination ───
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

export interface PageParams {
  page: number;
  size: number;
  sort?: string;
}

// ─── Errors ───
export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp?: string;
  fieldErrors?: FieldError[] | null;
}

export interface FieldError {
  field: string;
  message: string;
}

// ─── Categories ───
export interface CategoryResponse {
  id: number;
  categoryCode: string;
  name: string;
  description: string | null;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  primaryMeasureLabel: string | null;
  primaryMeasureUnit: string | null;
  requiresPrimaryMeasure: boolean;
  active: boolean;
}

export interface CategoryDetailResponse extends CategoryResponse {
  subcategories?: CategoryResponse[];
  products?: ProductResponse[];
}

export interface CategoryTreeResponse {
  id: number;
  categoryCode: string;
  name: string;
  description: string | null;
  primaryMeasureLabel: string | null;
  primaryMeasureUnit: string | null;
  requiresPrimaryMeasure: boolean;
  active: boolean;
  children: CategoryTreeResponse[];
}

export interface CreateCategoryRequest {
  categoryCode: string;
  name: string;
  description?: string;
  parentCategoryId?: number | null;
  primaryMeasureLabel?: string | null;
  primaryMeasureUnit?: string | null;
  requiresPrimaryMeasure?: boolean;
}

export interface UpdateCategoryRequest {
  categoryCode?: string;
  name?: string;
  description?: string;
  parentCategoryId?: number | null;
  primaryMeasureLabel?: string | null;
  primaryMeasureUnit?: string | null;
  requiresPrimaryMeasure?: boolean;
}

// ─── Products ───
export interface ProductResponse {
  id: number;
  productCode: string;
  categoryId: number;
  categoryName: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  brandName: string | null;
  collectionName: string | null;
  defaultMaterial: string | null;
  defaultFinish: string | null;
  internalNotes: string | null;
  active: boolean;
}

export interface ProductDetailResponse extends ProductResponse {
  variants?: ProductVariantResponse[];
  images?: ProductImageResponse[];
}

export interface CreateProductRequest {
  productCode: string;
  categoryId: number;
  name: string;
  shortDescription?: string;
  description?: string;
  brandName?: string;
  collectionName?: string;
  defaultMaterial?: string;
  defaultFinish?: string;
  internalNotes?: string;
}

export interface UpdateProductRequest {
  productCode?: string;
  categoryId?: number;
  name?: string;
  shortDescription?: string;
  description?: string;
  brandName?: string;
  collectionName?: string;
  defaultMaterial?: string;
  defaultFinish?: string;
  internalNotes?: string;
}

// ─── Product Variants ───
export interface ProductVariantResponse {
  id: number;
  sku: string;
  productId: number;
  productName: string;
  productCode: string;
  categoryId: number;
  categoryName: string;
  material: string | null;
  finish: string | null;
  color: string | null;
  purity: string | null;
  primaryMeasureValue: string | null;
  secondaryMeasureType: string | null;
  secondaryMeasureValue: string | null;
  weightGrams: number | null;
  baseSalePrice: number | null;
  minimumStock: number;
  isSellable: boolean;
  internalNotes: string | null;
  active: boolean;
  primaryImageUrl: string | null;
}

export interface ProductVariantDetailResponse extends ProductVariantResponse {
  supplierLinks?: SupplierProductVariantResponse[];
  images?: ProductImageResponse[];
}

export interface CreateProductVariantRequest {
  sku: string;
  material?: string;
  finish?: string;
  color?: string;
  purity?: string;
  primaryMeasureValue?: string;
  secondaryMeasureType?: string;
  secondaryMeasureValue?: string;
  weightGrams?: number;
  baseSalePrice?: number;
  minimumStock: number;
  isSellable?: boolean;
  internalNotes?: string;
}

export interface UpdateProductVariantRequest {
  sku?: string;
  material?: string;
  finish?: string;
  color?: string;
  purity?: string;
  primaryMeasureValue?: string;
  secondaryMeasureType?: string;
  secondaryMeasureValue?: string;
  weightGrams?: number;
  baseSalePrice?: number;
  minimumStock?: number;
  isSellable?: boolean;
  internalNotes?: string;
}

// ─── Product Images ───
export interface ProductImageResponse {
  id: number;
  productId: number;
  variantId: number | null;
  publicUrl: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
  active: boolean;
}

export interface UpdateProductImageRequest {
  altText?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

// ─── Price History ───
export interface VariantSalePriceHistoryResponse {
  id: number;
  variantId: number;
  oldBaseSalePrice: number | null;
  newBaseSalePrice: number;
  changedAt: string;
  changedByUserId: number;
  changedByUsername: string;
}

export interface SupplierVariantPurchaseCostHistoryResponse {
  id: number;
  supplierProductVariantId: number;
  oldBasePurchaseCost: number | null;
  newBasePurchaseCost: number;
  changedAt: string;
  changedByUserId: number;
  changedByUsername: string;
}

// ─── Suppliers ───
export interface SupplierResponse {
  id: number;
  name: string;
  taxId: string;
  websiteUrl: string | null;
  notes: string | null;
  active: boolean;
}

export interface SupplierDetailResponse extends SupplierResponse {
  contacts: SupplierContactResponse[];
  addresses: SupplierAddressResponse[];
}

export interface CreateSupplierRequest {
  name: string;
  taxId: string;
  websiteUrl?: string;
  notes?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  taxId?: string;
  websiteUrl?: string;
  notes?: string;
}

export interface SupplierContactResponse {
  id: number;
  supplierId: number;
  contactOrder: number;
  name: string;
  email: string | null;
  phone: string | null;
  positionName: string | null;
  notes: string | null;
  active: boolean;
}

export interface CreateSupplierContactRequest {
  contactOrder: number;
  name: string;
  email?: string;
  phone?: string;
  positionName?: string;
  notes?: string;
}

export interface SupplierAddressResponse {
  id: number;
  supplierId: number;
  addressOrder: number;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string | null;
  province: string | null;
  country: string;
  isPrimary: boolean;
  notes: string | null;
  active: boolean;
}

export interface CreateSupplierAddressRequest {
  addressOrder: number;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  province?: string;
  country: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface SupplierCatalogItemResponse {
  // supplier-variant link
  supplierProductVariantId: number;
  supplierReference: string | null;
  basePurchaseCost: number | null;
  preferredSupplier: boolean;
  leadTimeDays: number | null;
  supplierNotes: string | null;
  active: boolean;
  // variant
  variantId: number;
  sku: string;
  material: string | null;
  finish: string | null;
  color: string | null;
  purity: string | null;
  primaryMeasureValue: string | null;
  secondaryMeasureType: string | null;
  secondaryMeasureValue: string | null;
  weightGrams: number | null;
  primaryImageUrl: string | null;
  // product
  productId: number;
  productName: string;
  productCode: string;
  brandName: string | null;
  collectionName: string | null;
  // category
  categoryId: number;
  categoryName: string;
  primaryMeasureLabel: string | null;
  primaryMeasureUnit: string | null;
}

export interface SellableCatalogItemResponse {
  // variant
  variantId: number;
  sku: string;
  material: string | null;
  finish: string | null;
  color: string | null;
  purity: string | null;
  primaryMeasureValue: string | null;
  secondaryMeasureType: string | null;
  secondaryMeasureValue: string | null;
  weightGrams: number | null;
  baseSalePrice: number | null;
  minimumStock: number;
  isSellable: boolean;
  isActive: boolean;
  primaryImageUrl: string | null;
  // product
  productId: number;
  productName: string;
  productCode: string;
  brandName: string | null;
  collectionName: string | null;
  // category
  categoryId: number;
  categoryName: string;
  primaryMeasureLabel: string | null;
  primaryMeasureUnit: string | null;
  // stock
  currentStock: number;
  isBelowMinimum: boolean;
}

export interface CartValidationLineRequest {
  variantId: number;
  unitSnapshot: number;
}

export interface CartValidationRequest {
  lines: CartValidationLineRequest[];
}

export type CartLineStatus =
  | 'VALID'
  | 'PRICE_CHANGED'
  | 'INACTIVE_VARIANT'
  | 'INACTIVE_PRODUCT'
  | 'INACTIVE_SUPPLIER_LINK'
  | 'OUT_OF_STOCK';

export interface CartValidationLineResult {
  variantId: number;
  sku: string;
  productName: string;
  status: CartLineStatus;
  snapshotValue: number;
  currentValue: number | null;
  currentStock: number | null;
  message: string;
}

export interface CartValidationResponse {
  lines: CartValidationLineResult[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

// ─── Supplier-Product Variant Links ───
export interface SupplierProductVariantResponse {
  id: number;
  variantId: number;
  supplierId: number;
  supplierName: string;
  supplierReference: string | null;
  basePurchaseCost: number;
  isPreferredSupplier: boolean;
  leadTimeDays: number | null;
  notes: string | null;
  active: boolean;
}

export interface CreateSupplierProductVariantRequest {
  supplierId: number;
  supplierReference?: string;
  basePurchaseCost: number;
  isPreferredSupplier?: boolean;
  leadTimeDays?: number;
  notes?: string;
}

export interface UpdateSupplierProductVariantRequest {
  supplierReference?: string;
  basePurchaseCost?: number;
  isPreferredSupplier?: boolean;
  leadTimeDays?: number;
  notes?: string;
}

// ─── Clients ───
export interface ClientResponse {
  id: number;
  name: string;
  taxId: string;
  notes: string | null;
  active: boolean;
}

export interface ClientDetailResponse extends ClientResponse {
  contacts: ClientContactResponse[];
  addresses: ClientAddressResponse[];
}

export interface CreateClientRequest {
  name: string;
  taxId: string;
  notes?: string;
}

export interface UpdateClientRequest {
  name?: string;
  taxId?: string;
  notes?: string;
}

export interface ClientContactResponse {
  id: number;
  clientId: number;
  contactOrder: number;
  name: string;
  email: string | null;
  phone: string | null;
  positionName: string | null;
  notes: string | null;
  active: boolean;
}

export interface CreateClientContactRequest {
  contactOrder: number;
  name: string;
  email?: string;
  phone?: string;
  positionName?: string;
  notes?: string;
}

export interface ClientAddressResponse {
  id: number;
  clientId: number;
  addressOrder: number;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string | null;
  province: string | null;
  country: string;
  isPrimary: boolean;
  notes: string | null;
  active: boolean;
}

export interface CreateClientAddressRequest {
  addressOrder: number;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  province?: string;
  country: string;
  isPrimary?: boolean;
  notes?: string;
}

// ─── Purchase Orders ───
export interface PurchaseOrderResponse {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  statusCode: string;
  statusName: string;
  documentDate: string;
  expectedDeliveryDate: string | null;
  receivedDate: string | null;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  internalNotes: string | null;
  supplierNotes: string | null;
  active: boolean;
}

export interface PurchaseOrderDetailResponse extends PurchaseOrderResponse {
  lines: PurchaseOrderLineResponse[];
  statusHistory: StatusHistoryResponse[];
}

export interface PurchaseOrderLineResponse {
  id: number;
  purchaseOrderId: number;
  lineNumber: number;
  variantId: number;
  sku: string;
  descriptionSnapshot: string;
  supplierReferenceSnapshot: string | null;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostSnapshot: number;
  discountPercent: number;
  taxPercent: number;
  lineSubtotal: number;
  lineTotal: number;
  notes: string | null;
}

export interface CreatePurchaseOrderRequest {
  supplierId: number;
  documentDate?: string;
  expectedDeliveryDate?: string;
  internalNotes?: string;
  supplierNotes?: string;
  lines?: CreatePurchaseOrderLineRequest[];
}

export interface UpdatePurchaseOrderRequest {
  expectedDeliveryDate?: string;
  internalNotes?: string;
  supplierNotes?: string;
}

export interface CreatePurchaseOrderLineRequest {
  variantId: number;
  quantityOrdered: number;
  unitCostSnapshot: number;
  discountPercent?: number;
  taxPercent?: number;
  notes?: string;
}

export interface UpdatePurchaseOrderLineRequest {
  quantityOrdered?: number;
  unitCostSnapshot?: number;
  discountPercent?: number;
  taxPercent?: number;
  notes?: string;
}

export interface ReceivePurchaseOrderRequest {
  comment?: string;
  lines: ReceiveLineRequest[];
}

export interface ReceiveLineRequest {
  lineId: number;
  quantityReceivedNow: number;
}

export interface ChangeStatusRequest {
  statusCode: string;
  comment?: string;
}

// ─── Sales Orders ───
export interface SalesOrderResponse {
  id: number;
  saleNumber: string;
  clientId: number;
  clientName: string;
  statusCode: string;
  statusName: string;
  documentDate: string;
  deliveryDate: string | null;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  internalNotes: string | null;
  clientNotes: string | null;
  active: boolean;
}

export interface SalesOrderDetailResponse extends SalesOrderResponse {
  lines: SalesOrderLineResponse[];
  statusHistory: StatusHistoryResponse[];
}

export interface SalesOrderLineResponse {
  id: number;
  salesOrderId: number;
  lineNumber: number;
  variantId: number;
  sku: string;
  descriptionSnapshot: string;
  quantitySold: number;
  unitPriceSnapshot: number;
  unitCostSnapshot: number;
  discountPercent: number;
  taxPercent: number;
  lineSubtotal: number;
  lineTotal: number;
  marginAmount: number;
  marginPercent: number;
  notes: string | null;
}

export interface CreateSalesOrderRequest {
  clientId: number;
  documentDate?: string;
  deliveryDate?: string;
  internalNotes?: string;
  clientNotes?: string;
  lines?: CreateSalesOrderLineRequest[];
}

export interface UpdateSalesOrderRequest {
  internalNotes?: string;
  clientNotes?: string;
}

export interface CreateSalesOrderLineRequest {
  variantId: number;
  quantitySold: number;
  unitPriceSnapshot: number;
  unitCostSnapshot?: number | null;
  discountPercent?: number;
  taxPercent?: number;
  notes?: string;
}

export interface UpdateSalesOrderLineRequest {
  quantitySold?: number;
  unitPriceSnapshot?: number;
  unitCostSnapshot?: number | null;
  discountPercent?: number;
  taxPercent?: number;
  notes?: string;
}

// ─── Status History ───
export interface StatusHistoryResponse {
  id: number;
  fromStatusCode: string | null;
  fromStatusName: string | null;
  toStatusCode: string;
  toStatusName: string;
  changedAt: string;
  changedByUserId: number;
  changedByUsername: string;
  comment: string | null;
}

// ─── Document Statuses ───
export interface DocumentStatusResponse {
  id: number;
  documentType: string;
  statusCode: string;
  statusName: string;
  description: string | null;
  isFinal: boolean;
  active: boolean;
}

// ─── Inventory ───
export interface VariantStockResponse {
  variantId: number;
  sku: string;
  productId: number;
  productName: string;
  currentStock: number;
  minimumStock: number;
  isBelowMinimum: boolean;
  isSellable: boolean;
  active: boolean;
}

export interface InventoryMovementResponse {
  id: number;
  variantId: number;
  variantSku: string;
  productId: number;
  productName: string;
  movementType: string;
  quantity: number;
  movementDate: string;
  purchaseOrderId: number | null;
  salesOrderId: number | null;
  adjustmentReasonCode: string | null;
  adjustmentReasonName: string | null;
  notes: string | null;
  performedByUserId: number;
  performedByUsername: string;
}

export interface InventoryAdjustmentReasonResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface CreateInventoryAdjustmentRequest {
  variantId: number;
  movementType: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
  quantity: number;
  adjustmentReasonId: number;
  notes?: string;
}

// ─── Reports ───
export interface DashboardResponse {
  totalActiveProducts: number;
  totalActiveClients: number;
  totalActiveSuppliers: number;
  lowStockVariantsCount: number;
  purchaseOrdersCountInPeriod: number;
  purchaseAmountTotalInPeriod: number;
  salesOrdersCountInPeriod: number;
  salesRevenueTotalInPeriod: number;
  marginTotalInPeriod: number;
}

export interface StockAlertResponse {
  variantId: number;
  sku: string;
  productId: number;
  productName: string;
  categoryId: number;
  categoryName: string;
  currentStock: number;
  minimumStock: number;
  differenceToMinimum: number;
  isSellable: boolean;
  isActive: boolean;
}

export interface MarginReportResponse {
  revenueTotal: number;
  costTotal: number;
  marginTotal: number;
  marginPercent: number;
  lines: MarginLineResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface MarginLineResponse {
  salesOrderId: number;
  saleNumber: string;
  deliveryDate: string;
  clientId: number;
  clientName: string;
  productId: number;
  productName: string;
  variantId: number;
  sku: string;
  quantitySold: number;
  unitPriceSnapshot: number;
  unitCostSnapshot: number;
  lineRevenue: number;
  lineCost: number;
  lineMargin: number;
  lineMarginPercent: number;
}

// ─── Baskets (local) ───
export interface PurchaseDraftMeta {
  supplierId: number;
  supplierName: string;
  lineCount: number;
  unitTotal: number;
  updatedAt: string;
}

export interface PurchaseBasket {
  supplierId: number | null;
  supplierName: string | null;
  documentDate: string | null;
  expectedDeliveryDate: string | null;
  internalNotes: string;
  lines: PurchaseBasketLine[];
  updatedAt: string;
  createdByUserId: number | null;
}

export interface PurchaseBasketLine {
  localId: string;
  productId: number;
  variantId: number;
  sku: string;
  productName: string;
  variantLabel: string;
  categoryName: string | null;
  finish: string | null;
  color: string | null;
  purity: string | null;
  primaryMeasureValue: string | null;
  imageUrl: string | null;
  quantityOrdered: number;
  unitCostSnapshot: number;
  basePurchaseCost: number | null;
  supplierLinkId: number | null;
  supplierReference: string | null;
  leadTimeDays: number | null;
  discountPercent: number;
  taxPercent: number;
  subtotalExclTax: number;
  totalInclTax: number;
  notes: string;
  validationStatus: string | null;
}

export interface SalesBasket {
  clientId: number | null;
  clientName: string | null;
  documentDate: string | null;
  deliveryDate: string | null;
  internalNotes: string;
  lines: SalesBasketLine[];
  updatedAt: string;
  createdByUserId: number | null;
}

export interface SalesBasketLine {
  localId: string;
  productId: number;
  variantId: number;
  sku: string;
  productName: string;
  variantLabel: string;
  categoryName: string | null;
  finish: string | null;
  color: string | null;
  purity: string | null;
  primaryMeasureValue: string | null;
  imageUrl: string | null;
  quantitySold: number;
  unitPriceSnapshot: number;
  baseSalePrice: number | null;
  unitCostSnapshot: number | null;
  currentStock: number;
  isBelowMinimum: boolean;
  discountPercent: number;
  taxPercent: number;
  subtotalExclTax: number;
  totalInclTax: number;
  notes: string;
  validationStatus: string | null;
}

// ─── Tags ───
export interface TagResponse {
  id: number;
  tagCode: string;
  name: string;
  tagGroup: string;
  description: string | null;
  active: boolean;
}

export interface CreateTagRequest {
  tagCode: string;
  name: string;
  tagGroup: string;
  description?: string;
}

export interface UpdateTagRequest {
  tagCode?: string;
  name?: string;
  tagGroup?: string;
  description?: string;
}

export interface UpdateTagStatusRequest {
  active: boolean;
}

// ─── Colors ───
export interface ColorResponse {
  id: number;
  colorName: string;
  colorCode: string;
}

export interface CreateColorRequest {
  colorName: string;
  colorCode: string;
}

export interface UpdateColorRequest {
  colorName?: string;
  colorCode?: string;
}

// ─── Product Code Suggestion ───
export interface ProposeProductCodeResponse {
  proposedCode: string;
}
