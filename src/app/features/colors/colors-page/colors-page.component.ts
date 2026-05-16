import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorResponse } from '../../../core/models/api.models';
import { ColorApiService } from '../../../core/services/color-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-colors-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './colors-page.component.html',
  styleUrl: './colors-page.component.scss',
})
export class ColorsPageComponent implements OnInit {
  private readonly api = inject(ColorApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  loading = signal(true);
  colors = signal<ColorResponse[]>([]);

  dialogOpen = signal(false);
  editing = signal(false);
  editId = signal<number | null>(null);
  formData = { colorName: '', colorCode: '#000000' };

  confirmColor = signal<ColorResponse | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getColors().subscribe({
      next: (list) => {
        this.colors.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ─── Dialog ───

  openCreateDialog(): void {
    this.editing.set(false);
    this.editId.set(null);
    this.formData = { colorName: '', colorCode: '#000000' };
    this.dialogOpen.set(true);
  }

  openEditDialog(color: ColorResponse): void {
    this.editing.set(true);
    this.editId.set(color.id);
    this.formData = { colorName: color.colorName, colorCode: color.colorCode };
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
  }

  isValidHex(code: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(code);
  }

  save(): void {
    const name = this.formData.colorName.trim();
    const code = this.formData.colorCode.trim();
    if (!name) {
      this.notify.error('El nombre es obligatorio');
      return;
    }
    if (!this.isValidHex(code)) {
      this.notify.error('El código de color debe ser un valor hexadecimal válido (ej. #FF0000)');
      return;
    }

    const obs = this.editing()
      ? this.api.updateColor(this.editId()!, { colorName: name, colorCode: code })
      : this.api.createColor({ colorName: name, colorCode: code });

    obs.subscribe({
      next: () => {
        this.notify.success(this.editing() ? 'Color actualizado' : 'Color creado');
        this.closeDialog();
        this.load();
      },
      error: (err) => this.notify.error('Error', err.message),
    });
  }

  // ─── Delete ───

  askDelete(color: ColorResponse): void {
    this.confirmColor.set(color);
  }

  confirmDelete(): void {
    const c = this.confirmColor();
    if (!c) return;
    this.api.deleteColor(c.id).subscribe({
      next: () => {
        this.notify.success('Color eliminado');
        this.confirmColor.set(null);
        this.load();
      },
      error: (err) => {
        this.notify.error('Error al eliminar', err.message);
        this.confirmColor.set(null);
      },
    });
  }
}
