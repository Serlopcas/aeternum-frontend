import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-outlet.component.html',
  styleUrl: './toast-outlet.component.scss',
})
export class ToastOutletComponent {
  protected readonly notifications = inject(NotificationService);
}
