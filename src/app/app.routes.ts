import { Routes } from '@angular/router';
import { authGuard, gestorGuard, guestGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './shell/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [gestorGuard],
        loadComponent: () =>
          import('./features/users/users-list-page/users-list-page.component').then(
            (m) => m.UsersListPageComponent,
          ),
      },
      {
        path: 'users/:id',
        canActivate: [gestorGuard],
        loadComponent: () =>
          import('./features/users/user-detail-page/user-detail-page.component').then(
            (m) => m.UserDetailPageComponent,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories-page/categories-page.component').then(
            (m) => m.CategoriesPageComponent,
          ),
      },
      {
        path: 'tags',
        loadComponent: () =>
          import('./features/tags/tags-page/tags-page.component').then((m) => m.TagsPageComponent),
      },
      {
        path: 'colors',
        loadComponent: () =>
          import('./features/colors/colors-page/colors-page.component').then(
            (m) => m.ColorsPageComponent,
          ),
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/suppliers/suppliers-list-page/suppliers-list-page.component').then(
            (m) => m.SuppliersListPageComponent,
          ),
      },
      {
        path: 'suppliers/:id',
        loadComponent: () =>
          import('./features/suppliers/supplier-detail-page/supplier-detail-page.component').then(
            (m) => m.SupplierDetailPageComponent,
          ),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/clients-list-page/clients-list-page.component').then(
            (m) => m.ClientsListPageComponent,
          ),
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./features/clients/client-detail-page/client-detail-page.component').then(
            (m) => m.ClientDetailPageComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products-list-page/products-list-page.component').then(
            (m) => m.ProductsListPageComponent,
          ),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/products/product-detail-page/product-detail-page.component').then(
            (m) => m.ProductDetailPageComponent,
          ),
      },
      {
        path: 'products/:productId/variants/:variantId',
        loadComponent: () =>
          import('./features/products/variant-detail-page/variant-detail-page.component').then(
            (m) => m.VariantDetailPageComponent,
          ),
      },
      {
        path: 'variants',
        loadComponent: () =>
          import('./features/products/variants-catalog-page/variants-catalog-page.component').then(
            (m) => m.VariantsCatalogPageComponent,
          ),
      },
      {
        path: 'purchases',
        loadComponent: () =>
          import('./features/purchases/purchases-list-page/purchases-list-page.component').then(
            (m) => m.PurchasesListPageComponent,
          ),
      },
      {
        path: 'purchases/basket',
        loadComponent: () =>
          import('./features/purchases/purchase-basket-page/purchase-basket-page.component').then(
            (m) => m.PurchaseBasketPageComponent,
          ),
      },
      {
        path: 'purchases/:id',
        loadComponent: () =>
          import('./features/purchases/purchase-detail-page/purchase-detail-page.component').then(
            (m) => m.PurchaseDetailPageComponent,
          ),
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./features/sales/sales-list-page/sales-list-page.component').then(
            (m) => m.SalesListPageComponent,
          ),
      },
      {
        path: 'sales/basket',
        loadComponent: () =>
          import('./features/sales/sales-basket-page/sales-basket-page.component').then(
            (m) => m.SalesBasketPageComponent,
          ),
      },
      {
        path: 'sales/:id',
        loadComponent: () =>
          import('./features/sales/sale-detail-page/sale-detail-page.component').then(
            (m) => m.SaleDetailPageComponent,
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory-page/inventory-page.component').then(
            (m) => m.InventoryPageComponent,
          ),
      },
      {
        path: 'reports/stock-alerts',
        loadComponent: () =>
          import('./features/reports/stock-alerts-page/stock-alerts-page.component').then(
            (m) => m.StockAlertsPageComponent,
          ),
      },
      {
        path: 'reports/margin',
        canActivate: [gestorGuard],
        loadComponent: () =>
          import('./features/reports/margin-report-page/margin-report-page.component').then(
            (m) => m.MarginReportPageComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./features/profile/change-password-page/change-password-page.component').then(
            (m) => m.ChangePasswordPageComponent,
          ),
      },
      {
        path: 'forbidden',
        loadComponent: () =>
          import('./features/auth/forbidden-page/forbidden-page.component').then(
            (m) => m.ForbiddenPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
