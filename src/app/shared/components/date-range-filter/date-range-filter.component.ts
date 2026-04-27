import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-date-range-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './date-range-filter.component.html',
  styleUrl: './date-range-filter.component.scss',
})
export class DateRangeFilterComponent implements OnInit, OnDestroy {
  initialFrom = input('');
  initialTo = input('');

  from = signal('');
  to = signal('');
  rangeChange = output<{ from: string; to: string }>();

  private change$ = new Subject<{ from: string; to: string }>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.initialFrom()) this.from.set(this.initialFrom());
    if (this.initialTo()) this.to.set(this.initialTo());
    this.change$
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe((r) => this.rangeChange.emit(r));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateFrom(val: string): void {
    this.from.set(val);
    this.change$.next({ from: val, to: this.to() });
  }

  updateTo(val: string): void {
    this.to.set(val);
    this.change$.next({ from: this.from(), to: val });
  }
}
