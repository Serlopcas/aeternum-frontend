import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ApiError } from '../../../core/models/api.models';

@Component({
  selector: 'app-api-error-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './api-error-alert.component.html',
  styleUrl: './api-error-alert.component.scss',
})
export class ApiErrorAlertComponent {
  error = input<ApiError | null>(null);
  severity = input<'error' | 'warning'>('error');
}
