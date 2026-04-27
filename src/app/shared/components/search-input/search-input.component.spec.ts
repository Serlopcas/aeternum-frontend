import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let fixture: ComponentFixture<SearchInputComponent>;
  let component: SearchInputComponent;
  const DEBOUNCE_MS = 350;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('starts with empty value', () => {
    expect(component.value).toBe('');
  });

  describe('onInput()', () => {
    it('emits searchChange after the debounce interval', () => {
      vi.useFakeTimers();
      const emitted: string[] = [];
      component.searchChange.subscribe((v) => emitted.push(v));

      component.onInput('hello');
      expect(emitted).toHaveLength(0); // still debouncing

      vi.advanceTimersByTime(DEBOUNCE_MS);
      expect(emitted).toEqual(['hello']);
    });

    it('does NOT emit if changed again within the debounce window', () => {
      vi.useFakeTimers();
      const emitted: string[] = [];
      component.searchChange.subscribe((v) => emitted.push(v));

      component.onInput('a');
      vi.advanceTimersByTime(100);
      component.onInput('ab');
      vi.advanceTimersByTime(DEBOUNCE_MS);

      // Only the latest value should be emitted
      expect(emitted).toEqual(['ab']);
    });

    it('does NOT emit duplicates (distinctUntilChanged)', () => {
      vi.useFakeTimers();
      const emitted: string[] = [];
      component.searchChange.subscribe((v) => emitted.push(v));

      component.onInput('same');
      vi.advanceTimersByTime(DEBOUNCE_MS);
      component.onInput('same');
      vi.advanceTimersByTime(DEBOUNCE_MS);

      expect(emitted).toHaveLength(1);
    });

    it('updates the component value immediately', () => {
      component.onInput('typed');
      expect(component.value).toBe('typed');
    });
  });

  describe('clear()', () => {
    it('resets value to empty string', () => {
      component.value = 'something';
      component.clear();
      expect(component.value).toBe('');
    });

    it('emits empty string immediately after clearing', () => {
      vi.useFakeTimers();
      const emitted: string[] = [];
      component.searchChange.subscribe((v) => emitted.push(v));

      component.onInput('old text');
      vi.advanceTimersByTime(DEBOUNCE_MS); // flush first emission

      component.clear();
      vi.advanceTimersByTime(DEBOUNCE_MS);

      expect(emitted[emitted.length - 1]).toBe('');
    });
  });
});
