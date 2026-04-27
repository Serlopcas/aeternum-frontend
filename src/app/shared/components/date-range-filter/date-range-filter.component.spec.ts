import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateRangeFilterComponent } from './date-range-filter.component';

describe('DateRangeFilterComponent', () => {
  let fixture: ComponentFixture<DateRangeFilterComponent>;
  let component: DateRangeFilterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangeFilterComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DateRangeFilterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('creates the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('initialises from and to signals to empty strings by default', () => {
    fixture.detectChanges();
    expect(component.from()).toBe('');
    expect(component.to()).toBe('');
  });

  it('applies initialFrom and initialTo inputs on ngOnInit', () => {
    fixture.componentRef.setInput('initialFrom', '2026-01-01');
    fixture.componentRef.setInput('initialTo', '2026-12-31');
    fixture.detectChanges();
    expect(component.from()).toBe('2026-01-01');
    expect(component.to()).toBe('2026-12-31');
  });

  describe('updateFrom()', () => {
    it('updates the from signal', () => {
      fixture.detectChanges();
      component.updateFrom('2026-03-01');
      expect(component.from()).toBe('2026-03-01');
    });

    it('emits rangeChange with updated from and current to after debounce', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      component.updateTo('2026-06-30');

      const emitted: Array<{ from: string; to: string }> = [];
      component.rangeChange.subscribe((r) => emitted.push(r));

      component.updateFrom('2026-06-01');
      vi.advanceTimersByTime(400);

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual({ from: '2026-06-01', to: '2026-06-30' });
    });
  });

  describe('updateTo()', () => {
    it('updates the to signal', () => {
      fixture.detectChanges();
      component.updateTo('2026-09-30');
      expect(component.to()).toBe('2026-09-30');
    });

    it('emits rangeChange with updated to and current from after debounce', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      component.updateFrom('2026-01-01');

      const emitted: Array<{ from: string; to: string }> = [];
      component.rangeChange.subscribe((r) => emitted.push(r));

      component.updateTo('2026-03-31');
      vi.advanceTimersByTime(400);

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual({ from: '2026-01-01', to: '2026-03-31' });
    });
  });

  it('does NOT emit if rapid changes occur within debounce window (last value wins)', () => {
    vi.useFakeTimers();
    fixture.detectChanges();

    const emitted: Array<{ from: string; to: string }> = [];
    component.rangeChange.subscribe((r) => emitted.push(r));

    component.updateFrom('2026-01-01');
    component.updateFrom('2026-02-01');
    component.updateFrom('2026-03-01');
    vi.advanceTimersByTime(400);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].from).toBe('2026-03-01');
  });
});
