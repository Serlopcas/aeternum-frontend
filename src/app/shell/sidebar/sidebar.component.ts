import { ChangeDetectionStrategy, Component, inject, model, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStateService } from '../../core/state/auth-state.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  collapsed = model(false);
  mobileOpen = model(false);
  openAbout = output<void>();
  private readonly currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        this.currentUrl.set((e as NavigationEnd).urlAfterRedirects);
        this.mobileOpen.set(false);
      });
  }

  isItemActive(route: string): boolean {
    const url = this.currentUrl();
    // Variant detail reached from variants catalog: highlight Variantes, not Productos
    if (/\/products\/\d+\/variants\/\d+/.test(url) && url.includes('from=variants')) {
      if (route === '/variants') return true;
      if (route === '/products') return false;
    }
    if (route === '/') return url === '/' || url.startsWith('/?');
    return url === route || url.startsWith(route + '/') || url.startsWith(route + '?');
  }

  private readonly sections: NavSection[] = [
    {
      title: 'Principal',
      items: [{ label: 'Dashboard', icon: '📊', route: '/', roles: ['GESTOR'] }],
    },
    {
      title: 'Catálogo',
      items: [
        { label: 'Categorías', icon: '📁', route: '/categories' },
        { label: 'Productos', icon: '💎', route: '/products' },
        { label: 'Variantes', icon: '🏷️', route: '/variants' },
        { label: 'Colores', icon: '🎨', route: '/colors' },
        { label: 'Etiquetas', icon: '🔖', route: '/tags' },
      ],
    },
    {
      title: 'Maestros',
      items: [
        { label: 'Proveedores', icon: '🏭', route: '/suppliers' },
        { label: 'Clientes', icon: '🏪', route: '/clients' },
      ],
    },
    {
      title: 'Operaciones',
      items: [
        { label: 'Compras', icon: '📥', route: '/purchases' },
        { label: 'Ventas', icon: '📤', route: '/sales' },
        { label: 'Inventario', icon: '📦', route: '/inventory' },
      ],
    },
    {
      title: 'Informes',
      items: [
        { label: 'Alertas Stock', icon: '⚠️', route: '/reports/stock-alerts', roles: ['GESTOR'] },
        { label: 'Margen', icon: '📈', route: '/reports/margin', roles: ['GESTOR'] },
      ],
    },
    {
      title: 'Administración',
      items: [{ label: 'Usuarios', icon: '👥', route: '/users', roles: ['GESTOR'] }],
    },
  ];

  filteredSections(): NavSection[] {
    const userRoles = this.auth.roles();
    return this.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.roles) return true;
          return item.roles.some((r) => userRoles.includes(r));
        }),
      }))
      .filter((section) => section.items.length > 0);
  }
}
