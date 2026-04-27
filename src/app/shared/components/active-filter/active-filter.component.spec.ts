import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveFilterComponent } from './active-filter.component';

describe('ActiveFilterComponent', () => {
  let fixture: ComponentFixture<ActiveFilterComponent>;
  let component: ActiveFilterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveFilterComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ActiveFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('defaults value to null', () => {
    expect(component.value()).toBeNull();
  });

  it('accepts true as value input', () => {
    fixture.componentRef.setInput('value', true);
    fixture.detectChanges();
    expect(component.value()).toBe(true);
  });

  it('accepts false as value input', () => {
    fixture.componentRef.setInput('value', false);
    fixture.detectChanges();
    expect(component.value()).toBe(false);
  });

  it('exposes valueChange output', () => {
    const values: Array<boolean | null> = [];
    component.valueChange.subscribe((v) => values.push(v));
    component.valueChange.emit(true);
    component.valueChange.emit(false);
    component.valueChange.emit(null);
    expect(values).toEqual([true, false, null]);
  });
});
