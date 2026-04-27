import { TestBed } from '@angular/core/testing';
import {
  StatusBadgeComponent,
  getActiveStatusColor,
  getDocumentStatusColor,
} from './status-badge.component';

describe('getDocumentStatusColor()', () => {
  it.each([
    ['DRAFT', 'gray'],
    ['SENT', 'blue'],
    ['CONFIRMED', 'blue-deep'],
    ['RECEIVED_PARTIAL', 'amber'],
    ['RECEIVED_COMPLETE', 'green'],
    ['PREPARED', 'blue'],
    ['DELIVERED', 'green'],
    ['CANCELLED', 'red'],
  ])('maps %s → %s', (code, expected) => {
    expect(getDocumentStatusColor(code)).toBe(expected);
  });

  it('returns "gray" for unknown status codes', () => {
    expect(getDocumentStatusColor('UNKNOWN_STATUS')).toBe('gray');
    expect(getDocumentStatusColor('')).toBe('gray');
  });
});

describe('getActiveStatusColor()', () => {
  it('returns "active" when true', () => {
    expect(getActiveStatusColor(true)).toBe('active');
  });

  it('returns "inactive" when false', () => {
    expect(getActiveStatusColor(false)).toBe('inactive');
  });
});

// ─── StatusBadgeComponent ────────────────────────────────────────────────────

describe('StatusBadgeComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  function createFixture(label: string, colorClass: string) {
    TestBed.configureTestingModule({ imports: [StatusBadgeComponent] });
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('label', label);
    fixture.componentRef.setInput('colorClass', colorClass);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the label text inside the badge', () => {
    const fixture = createFixture('Borrador', 'gray');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge')!.textContent!.trim()).toBe('Borrador');
  });

  it('applies the colorClass as a CSS modifier class', () => {
    const fixture = createFixture('Confirmado', 'blue-deep');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge--blue-deep')).not.toBeNull();
  });

  it('uses empty label and gray colorClass as defaults', () => {
    TestBed.configureTestingModule({ imports: [StatusBadgeComponent] });
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge--gray')).not.toBeNull();
    expect(el.querySelector('.badge')!.textContent!.trim()).toBe('');
  });
});
