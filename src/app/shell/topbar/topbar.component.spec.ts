import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { UserResponse } from '../../core/models/api.models';
import { AuthStateService } from '../../core/state/auth-state.service';
import { TopbarComponent } from './topbar.component';

const MOCK_USER: UserResponse = {
  id: 1,
  username: 'marta',
  email: 'marta@test.com',
  firstName: 'Marta',
  lastName: 'García',
  phone: null,
  roles: ['GESTOR'],
  active: true,
  profileImageUrl: null,
};

function makeAuthState(user: UserResponse | null = MOCK_USER) {
  return {
    user: signal<UserResponse | null>(user),
    displayName: signal<string>(user ? `${user.firstName} ${user.lastName}` : ''),
    clearAuth: vi.fn(),
  };
}

describe('TopbarComponent — initials()', () => {
  afterEach(() => TestBed.resetTestingModule());

  function createComponent(authState: ReturnType<typeof makeAuthState>) {
    TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [provideRouter([]), { provide: AuthStateService, useValue: authState }],
    });
    const fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('returns uppercased first letters of firstName and lastName', () => {
    const component = createComponent(makeAuthState(MOCK_USER));
    expect(component.initials()).toBe('MG');
  });

  it('returns "?" when there is no authenticated user', () => {
    const component = createComponent(makeAuthState(null));
    expect(component.initials()).toBe('?');
  });

  it('correctly handles single-character names', () => {
    const component = createComponent(
      makeAuthState({ ...MOCK_USER, firstName: 'J', lastName: 'D' }),
    );
    expect(component.initials()).toBe('JD');
  });
});

describe('TopbarComponent — logout()', () => {
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('calls clearAuth and navigates to /login', async () => {
    const authState = makeAuthState(MOCK_USER);
    TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [provideRouter([]), { provide: AuthStateService, useValue: authState }],
    });
    const fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.logout();

    expect(authState.clearAuth).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('sets menuOpen to false on logout', () => {
    const authState = makeAuthState(MOCK_USER);
    TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [provideRouter([]), { provide: AuthStateService, useValue: authState }],
    });
    const fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.menuOpen.set(true);
    component.logout();
    expect(component.menuOpen()).toBe(false);
  });
});

// ─── TopbarComponent — template ───────────────────────────────────────────────

describe('TopbarComponent — template', () => {
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  function setup(user: UserResponse | null) {
    const authState = makeAuthState(user);
    TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [provideRouter([]), { provide: AuthStateService, useValue: authState }],
    });
    const fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, authState };
  }

  it('shows initials span when user has no profileImageUrl', () => {
    const { fixture } = setup(MOCK_USER);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('img.topbar__avatar-img')).toBeNull();
    expect(el.querySelector('.topbar__avatar')!.textContent!.trim()).toBe('MG');
  });

  it('shows avatar img when user has profileImageUrl', () => {
    const userWithImage = { ...MOCK_USER, profileImageUrl: 'https://example.com/avatar.jpg' };
    const { fixture } = setup(userWithImage);
    const el = fixture.nativeElement as HTMLElement;
    const img = el.querySelector('img.topbar__avatar-img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('avatar.jpg');
  });

  it('does not render the dropdown menu when menuOpen is false', () => {
    const { fixture } = setup(MOCK_USER);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.topbar__menu')).toBeNull();
  });

  it('renders the dropdown menu when menuOpen is true', () => {
    const { fixture, component } = setup(MOCK_USER);
    component.menuOpen.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.topbar__menu')).not.toBeNull();
  });

  it('toggles menuOpen when the profile div is clicked', () => {
    const { fixture, component } = setup(MOCK_USER);
    const el = fixture.nativeElement as HTMLElement;
    expect(component.menuOpen()).toBe(false);
    (el.querySelector('.topbar__profile') as HTMLElement).click();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(true);
    (el.querySelector('.topbar__profile') as HTMLElement).click();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(false);
  });
});
