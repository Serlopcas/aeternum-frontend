import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthStateService } from '../../core/state/auth-state.service';
import { SidebarComponent } from './sidebar.component';

function makeAuthState(roles: string[] = []) {
  return { roles: () => roles };
}

describe('SidebarComponent — isItemActive()', () => {
  afterEach(() => TestBed.resetTestingModule());

  function createComponent(url: string, roles: string[] = ['GESTOR']) {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), { provide: AuthStateService, useValue: makeAuthState(roles) }],
    });
    // Prime the router URL before the component is created
    const router = TestBed.inject(Router);
    // Manually set the current URL via router navigation would require a real route,
    // so we test isItemActive by directly calling the method with a mocked currentUrl via
    // the router events—or by navigating to a route after setup.
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    // Override internal signal via the router's NavigationEnd emission
    (component as any).currentUrl.set(url);
    return component;
  }

  it('marks "/" as active when url is exactly "/"', () => {
    const c = createComponent('/');
    expect(c.isItemActive('/')).toBe(true);
  });

  it('does NOT mark "/" as active for other routes', () => {
    const c = createComponent('/products');
    expect(c.isItemActive('/')).toBe(false);
  });

  it('marks "/products" as active for the exact path', () => {
    const c = createComponent('/products');
    expect(c.isItemActive('/products')).toBe(true);
  });

  it('marks "/products" as active for a sub-path like "/products/123"', () => {
    const c = createComponent('/products/123');
    expect(c.isItemActive('/products')).toBe(true);
  });

  it('does NOT mark "/products" as active for "/purchases"', () => {
    const c = createComponent('/purchases');
    expect(c.isItemActive('/products')).toBe(false);
  });

  it('marks "/variants" as active when on variant detail reached from variants catalog', () => {
    const c = createComponent('/products/1/variants/5?from=variants');
    expect(c.isItemActive('/variants')).toBe(true);
  });

  it('does NOT mark "/products" as active when variant detail reached from variants catalog', () => {
    const c = createComponent('/products/1/variants/5?from=variants');
    expect(c.isItemActive('/products')).toBe(false);
  });

  it('marks "/products" as active when variant detail reached from products (no from=variants)', () => {
    const c = createComponent('/products/1/variants/5');
    expect(c.isItemActive('/products')).toBe(true);
  });
});

describe('SidebarComponent — filteredSections()', () => {
  afterEach(() => TestBed.resetTestingModule());

  function createComponent(roles: string[]) {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), { provide: AuthStateService, useValue: makeAuthState(roles) }],
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('GESTOR sees all sections including Administración', () => {
    const c = createComponent(['GESTOR']);
    const sections = c.filteredSections();
    const sectionTitles = sections.map((s) => s.title);
    expect(sectionTitles).toContain('Administración');
    expect(sectionTitles).toContain('Principal');
  });

  it('TRABAJADOR does NOT see Administración section', () => {
    const c = createComponent(['TRABAJADOR']);
    const sections = c.filteredSections();
    const sectionTitles = sections.map((s) => s.title);
    expect(sectionTitles).not.toContain('Administración');
  });

  it('TRABAJADOR does NOT see Dashboard item (GESTOR only)', () => {
    const c = createComponent(['TRABAJADOR']);
    const sections = c.filteredSections();
    const principal = sections.find((s) => s.title === 'Principal');
    // Principal section is filtered out entirely because Dashboard is GESTOR-only
    expect(principal).toBeUndefined();
  });

  it('sections with all items filtered are removed entirely', () => {
    const c = createComponent(['CONSULTA']);
    const sections = c.filteredSections();
    // Administración section has only GESTOR-only items → removed
    expect(sections.find((s) => s.title === 'Administración')).toBeUndefined();
  });

  it('non-role-restricted items are visible to all authenticated users', () => {
    const c = createComponent(['CONSULTA']);
    const sections = c.filteredSections();
    const catálogo = sections.find((s) => s.title === 'Catálogo');
    expect(catálogo).toBeDefined();
    expect(catálogo!.items.length).toBeGreaterThan(0);
  });
});
