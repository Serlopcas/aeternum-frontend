import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent implements OnInit, OnDestroy {
  placeholder = input('Buscar...');
  debounceMs = input(350);
  searchChange = output<string>();

  value = '';
  private input$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.input$
      .pipe(debounceTime(this.debounceMs()), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => this.searchChange.emit(q));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(val: string): void {
    this.value = val;
    this.input$.next(val);
  }

  clear(): void {
    this.value = '';
    this.input$.next('');
  }
}
