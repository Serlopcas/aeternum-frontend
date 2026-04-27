import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;
  let component: PaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to page 0 of 0 with 0 elements', () => {
    expect(component.currentPage()).toBe(0);
    expect(component.totalPages()).toBe(0);
    expect(component.totalElements()).toBe(0);
  });

  it('reflects input values after binding', () => {
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.componentRef.setInput('totalElements', 50);
    fixture.detectChanges();
    expect(component.currentPage()).toBe(2);
    expect(component.totalPages()).toBe(5);
    expect(component.totalElements()).toBe(50);
  });

  it('exposes a pageChange output', () => {
    const emitted: number[] = [];
    component.pageChange.subscribe((p) => emitted.push(p));
    component.pageChange.emit(3);
    expect(emitted).toEqual([3]);
  });
});
