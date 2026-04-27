import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('Confirmar');
  message = input('¿Estás seguro?');
  confirmLabel = input('Confirmar');
  destructive = input(false);
  confirm = output<void>();
  cancel = output<void>();
}
