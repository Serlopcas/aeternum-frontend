import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-active-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './active-filter.component.html',
  styleUrl: './active-filter.component.scss',
})
export class ActiveFilterComponent {
  value = input<boolean | null>(null);
  valueChange = output<boolean | null>();
}
