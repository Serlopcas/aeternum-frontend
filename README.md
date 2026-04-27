# Aeternum — Frontend

> Angular 21 SPA for **Aeternum** — an internal management platform for a B2B jewellery intermediary.

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)

---

## Overview

Aeternum centralises the operations of a jewellery intermediary: product catalogue with multi-level categories, multi-supplier pricing, purchase and sales document workflows, real-time inventory, margin analysis reports, and role-based UI access control. This repository is the **frontend only** — an Angular 21 SPA that consumes the Aeternum REST API. For the Spring Boot backend see [aeternum-backend](https://github.com/Serlopcas/aeternum-backend).

## Features

- **Signals-first state** — all component state via `signal()` / `computed()`, no `BehaviorSubject`
- **OnPush everywhere** — `ChangeDetectionStrategy.OnPush` on all components
- **Lazy-loaded features** — each domain feature loads via `loadComponent()` on navigation
- **Purchase & sales baskets** — multi-draft purchase baskets (per supplier) and a sales basket, both persisted in `localStorage`
- **3-step product creation** — locked tab flow (Info → Images → Variants) with auto code suggestion from category
- **Real-time inventory view** — paginated stock grid with category filter and manual adjustment
- **Role-gated UI** — `gestorGuard`, `authGuard` and `guestGuard`; GESTOR-only actions hidden from other roles
- **Toast notifications** — signal-based, auto-dismiss, four severity levels
- **Colour catalogue CRUD** — visual colour picker with hex input

## Tech Stack

| Layer            | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Framework        | Angular 21                                     |
| Language         | TypeScript 5                                   |
| Styling          | SCSS (standalone component styles)             |
| State            | Angular Signals + `signal()` / `computed()`    |
| Change Detection | `ChangeDetectionStrategy.OnPush` throughout    |
| HTTP             | `HttpClient` with `AuthInterceptor`            |
| Forms            | Template-driven (`ngModel`)                    |
| Routing          | `RouterModule` with lazy-loaded feature routes |
| Build            | Angular CLI / esbuild                          |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 11+
- Backend running at `http://localhost:8080`

### Local Development

```bash
npm install
npm start        # serves at http://localhost:4200 with proxy to backend
```

The dev server proxies all `/api` requests to `http://localhost:8080` via `proxy.conf.json`, so CORS is transparent in development.

### Build

```bash
npm run build            # development build (dist/)
npm run build:prod       # production build (optimized, tree-shaken)
```

### Tests

```bash
npm test
```

## Project Structure

```
src/
└── app/
    ├── app.ts                  # Root component (RouterOutlet)
    ├── app.config.ts           # App-level providers (HttpClient, Router, ErrorHandler)
    ├── app.routes.ts           # Top-level lazy route definitions
    │
    ├── core/                   # Singleton services, models, guards, interceptors
    │   ├── config/
    │   │   ├── environment.ts            # Dev environment (apiBaseUrl, tokenKey)
    │   │   └── environment.production.ts # Prod environment
    │   ├── error/
    │   │   └── global-error-handler.ts   # GlobalErrorHandler
    │   ├── guards/
    │   │   └── auth.guard.ts             # Route guard (redirects to /login)
    │   ├── interceptors/
    │   │   └── auth.interceptor.ts       # Attaches Bearer token to all API requests
    │   ├── models/
    │   │   └── api.models.ts             # All TypeScript interfaces mirroring backend DTOs
    │   ├── services/                     # One service per backend resource
    │   │   ├── auth-api.service.ts
    │   │   ├── category-api.service.ts
    │   │   ├── client-api.service.ts
    │   │   ├── color-api.service.ts
    │   │   ├── inventory-api.service.ts
    │   │   ├── notification.service.ts   # Toast notifications (signal-based)
    │   │   ├── product-api.service.ts
    │   │   ├── purchase-api.service.ts
    │   │   ├── purchase-basket.service.ts
    │   │   ├── report-api.service.ts
    │   │   ├── sales-api.service.ts
    │   │   ├── sales-basket.service.ts
    │   │   ├── supplier-api.service.ts
    │   │   ├── tag-api.service.ts
    │   │   ├── user-api.service.ts
    │   │   └── variant-catalog-api.service.ts
    │   └── state/
    │       └── auth-state.service.ts     # Authentication state (signal-based)
    │
    ├── features/               # Lazy-loaded feature modules (one folder per domain)
    │   ├── auth/
    │   │   ├── login-page/
    │   │   └── forbidden-page/
    │   ├── categories/
    │   │   └── categories-page/
    │   ├── clients/
    │   │   ├── client-detail-page/
    │   │   └── clients-list-page/
    │   ├── colors/
    │   │   └── colors-page/              # Color catalog CRUD
    │   ├── dashboard/
    │   │   └── dashboard-page/
    │   ├── inventory/
    │   │   └── inventory-page/
    │   ├── products/
    │   │   ├── product-detail-page/      # 3-step creation flow (Info → Images → Variants)
    │   │   ├── products-list-page/
    │   │   ├── variant-detail-page/
    │   │   └── variants-catalog-page/
    │   ├── profile/
    │   │   ├── change-password-page/
    │   │   └── profile-page/
    │   ├── purchases/
    │   │   ├── purchase-basket-page/
    │   │   ├── purchase-detail-page/
    │   │   └── purchases-list-page/
    │   ├── reports/
    │   │   ├── margin-report-page/
    │   │   └── stock-alerts-page/
    │   ├── sales/
    │   │   ├── sale-detail-page/
    │   │   ├── sales-basket-page/
    │   │   └── sales-list-page/
    │   ├── suppliers/
    │   │   ├── supplier-detail-page/
    │   │   └── suppliers-list-page/
    │   ├── tags/
    │   │   └── tags-page/
    │   └── users/
    │       ├── user-detail-page/
    │       └── users-list-page/
    │
    ├── shared/                 # Reusable components and pipes
    │   ├── components/
    │   │   ├── active-filter/        # Active/inactive toggle filter
    │   │   ├── api-error-alert/      # Displays API error messages
    │   │   ├── confirm-dialog/       # Generic confirmation modal
    │   │   ├── date-range-filter/    # Date range picker
    │   │   ├── empty-state/          # Empty list / no results
    │   │   ├── loading-spinner/      # Loading indicator
    │   │   ├── page-header/          # Page title + action buttons
    │   │   ├── pagination/           # Paginator with page size selector
    │   │   ├── search-input/         # Debounced search field
    │   │   ├── status-badge/         # Active/inactive badge
    │   │   └── toast-outlet/         # Toast notification outlet
    │   └── pipes/
    │       └── format.pipes.ts       # Currency, date, percentage formatters
    │
    └── shell/                  # Application chrome
        ├── app-shell/          # Main layout (sidebar + topbar + router-outlet)
        ├── sidebar/            # Navigation sidebar with section grouping
        └── topbar/             # Top bar (breadcrumb, user menu)
```

## Architecture Patterns

### Signals-First State Management

All component state uses Angular Signals (`signal()`, `computed()`, `effect()`). No `BehaviorSubject` or `Observable` state streams in components.

```typescript
// Example pattern used throughout
readonly items = signal<ItemResponse[]>([]);
readonly loading = signal(false);
readonly filter = signal('');

readonly filtered = computed(() =>
  this.items().filter(i => i.name.includes(this.filter()))
);
```

### OnPush Change Detection

All components use `ChangeDetectionStrategy.OnPush`. Data flows through signal reads; `markForCheck()` is called after async callbacks when needed.

### Lazy Loading

Every feature route is lazy-loaded via `loadComponent()`:

```typescript
{
  path: 'products',
  loadComponent: () => import('./features/products/products-list-page/...')
                        .then(m => m.ProductsListPageComponent)
}
```

### API Layer

One service per backend resource, injected at root (`providedIn: 'root'`). Methods return `Observable<T>` directly from `HttpClient`.

```typescript
getProducts(params: { categoryId?: number; query?: string; page?: number }): Observable<Page<ProductResponse>> {
  return this.http.get<Page<ProductResponse>>(`${this.base}/products`, { params: ... });
}
```

### Auth Interceptor

`AuthInterceptor` reads the token from `AuthStateService` and attaches `Authorization: Bearer <token>` to every outgoing request. On `401`, the state is cleared and the user is redirected to `/login`.

## Routes

| Path                                       | Component                      | Auth          | Notes                                                                    |
| ------------------------------------------ | ------------------------------ | ------------- | ------------------------------------------------------------------------ |
| `/login`                                   | `LoginPageComponent`           | Public        | Redirects to `/dashboard` if already logged in                           |
| `/dashboard`                               | `DashboardPageComponent`       | Authenticated | KPI cards + low-stock alerts                                             |
| `/categories`                              | `CategoriesPageComponent`      | Authenticated | Tree-view, measure fields                                                |
| `/products`                                | `ProductsListPageComponent`    | Authenticated | Tree category filter, cards/table view, page size, separar-por-categoría |
| `/products/:id`                            | `ProductDetailPageComponent`   | Authenticated | Tab flow: Info → Images → Variants; locked until product saved           |
| `/products/:productId/variants/:variantId` | `VariantDetailPageComponent`   | Authenticated |                                                                          |
| `/variants`                                | `VariantsCatalogPageComponent` | Authenticated | Cross-product variant search                                             |
| `/colors`                                  | `ColorsPageComponent`          | Authenticated | Color catalog CRUD with color picker                                     |
| `/tags`                                    | `TagsPageComponent`            | Authenticated |                                                                          |
| `/clients`                                 | `ClientsListPageComponent`     | Authenticated |                                                                          |
| `/clients/:id`                             | `ClientDetailPageComponent`    | Authenticated |                                                                          |
| `/suppliers`                               | `SuppliersListPageComponent`   | Authenticated |                                                                          |
| `/suppliers/:id`                           | `SupplierDetailPageComponent`  | Authenticated |                                                                          |
| `/inventory`                               | `InventoryPageComponent`       | Authenticated |                                                                          |
| `/purchases`                               | `PurchasesListPageComponent`   | Authenticated |                                                                          |
| `/purchases/basket`                        | `PurchaseBasketPageComponent`  | Authenticated | Persistent basket in localStorage                                        |
| `/purchases/:id`                           | `PurchaseDetailPageComponent`  | Authenticated |                                                                          |
| `/sales`                                   | `SalesListPageComponent`       | Authenticated |                                                                          |
| `/sales/basket`                            | `SalesBasketPageComponent`     | Authenticated | Persistent basket in localStorage                                        |
| `/sales/:id`                               | `SaleDetailPageComponent`      | Authenticated |                                                                          |
| `/reports/stock-alerts`                    | `StockAlertsPageComponent`     | Authenticated |                                                                          |
| `/reports/margin`                          | `MarginReportPageComponent`    | GESTOR        |                                                                          |
| `/profile`                                 | `ProfilePageComponent`         | Authenticated |                                                                          |
| `/change-password`                         | `ChangePasswordPageComponent`  | Authenticated |                                                                          |
| `/users`                                   | `UsersListPageComponent`       | GESTOR        | User management                                                          |
| `/users/:id`                               | `UserDetailPageComponent`      | GESTOR        | User detail + roles assignment                                           |
| `/forbidden`                               | `ForbiddenPageComponent`       | Public        | 403 page                                                                 |

## Key Feature Details

### Product Detail — 3-Step Creation Flow

Creating a product follows a locked tab flow:

1. **Información** — save basic info + code suggestion from category
2. **Imágenes** — upload images; first image auto-marks as primary
3. **Variantes** — add variants; pre-filled from product defaults

Tabs 2 and 3 are locked (🔒) until the product is saved for the first time. After save, the app navigates to `?tab=images` automatically.

### Product Code Suggestion

When a category is selected on a new product, the app calls `GET /api/products/propose-code?categoryId={id}` and pre-fills the code field. If the user has manually typed a code, the suggestion is not applied. The suggested code is shown as a hint below the field.

### Products List — View Options

- **View toggle**: table (default) / cards grid
- **Page size**: 10 / 20 / 50 / 100 — persisted in `localStorage`
- **Tree category dropdown**: shows full category hierarchy with indentation
- **Separar por categoría**: groups results visually by category name

### Colors Page

Full CRUD for color catalog:

- Color swatch preview using the stored hex code
- Inline color picker (`<input type="color">`) + manual hex input
- Edit name/hex code and delete colors

## Configuration

### Environment Files

| File                                            | Purpose              |
| ----------------------------------------------- | -------------------- |
| `src/app/core/config/environment.ts`            | Development settings |
| `src/app/core/config/environment.production.ts` | Production settings  |

```typescript
// environment.ts
export const environment = {
  apiBaseUrl: 'http://localhost:8080/api',
  tokenKey: 'aeternum.accessToken',
  purchaseBasketKey: 'aeternum.purchaseBasket.v1',
  salesBasketKey: 'aeternum.salesBasket.v1',
};
```

For production, set `apiBaseUrl` to the deployed API URL.

### Proxy (Development Only)

`proxy.conf.json` proxies `/api/**` to `http://localhost:8080` so that the Angular dev server and the backend can run on different ports without CORS issues.

## Security Notes

- The JWT token is stored in `sessionStorage` (cleared on tab close).
- `AuthGuard` redirects unauthenticated users to `/login`.
- Role-based UI elements are hidden client-side; the backend enforces authorization server-side.
- The `AuthInterceptor` automatically attaches the token and handles `401` responses.

## Related

- [aeternum-backend](https://github.com/Serlopcas/aeternum-backend) — Spring Boot 3.5 REST API (Java 21, PostgreSQL 15)

## Author

**Sergio López Casado**

[![GitHub](https://img.shields.io/badge/GitHub-Serlopcas-181717?logo=github)](https://github.com/Serlopcas)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-sergiolopezcasado-0A66C2?logo=linkedin)](https://www.linkedin.com/in/sergiolopezcasado)
[![Email](https://img.shields.io/badge/Email-serlopcas.5%40gmail.com-D14836?logo=gmail&logoColor=white)](mailto:serlopcas.5@gmail.com)

## License

Copyright © 2026 Sergio López Casado. All rights reserved.

This source code is the exclusive property of the author. No part of this repository may be reproduced, distributed, modified, or used in any form or by any means without the prior written permission of the author.
