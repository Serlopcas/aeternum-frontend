import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('has sane default inputs', () => {
    expect(component.open()).toBe(false);
    expect(component.title()).toBe('Confirmar');
    expect(component.message()).toBe('¿Estás seguro?');
    expect(component.confirmLabel()).toBe('Confirmar');
    expect(component.destructive()).toBe(false);
  });

  it('emits confirm event when confirm output fires', () => {
    let confirmed = false;
    component.confirm.subscribe(() => (confirmed = true));
    component.confirm.emit();
    expect(confirmed).toBe(true);
  });

  it('emits cancel event when cancel output fires', () => {
    let cancelled = false;
    component.cancel.subscribe(() => (cancelled = true));
    component.cancel.emit();
    expect(cancelled).toBe(true);
  });

  it('accepts open=true without error', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(component.open()).toBe(true);
  });

  it('accepts destructive flag', () => {
    fixture.componentRef.setInput('destructive', true);
    fixture.detectChanges();
    expect(component.destructive()).toBe(true);
  });
});
