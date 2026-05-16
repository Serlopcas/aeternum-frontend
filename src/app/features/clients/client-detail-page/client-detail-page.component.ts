import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ClientAddressResponse,
  ClientContactResponse,
  ClientDetailResponse,
} from '../../../core/models/api.models';
import { ClientApiService } from '../../../core/services/client-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SalesListPageComponent } from '../../sales/sales-list-page/sales-list-page.component';

@Component({
  selector: 'app-client-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    SalesListPageComponent,
  ],
  templateUrl: './client-detail-page.component.html',
  styleUrl: './client-detail-page.component.scss',
})
export class ClientDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ClientApiService);
  protected readonly auth = inject(AuthStateService);
  private readonly notify = inject(NotificationService);

  client = signal<ClientDetailResponse | null>(null);
  loading = signal(true);
  tab = signal<'info' | 'contacts' | 'addresses' | 'sales'>('info');
  editMode = signal(false);
  editData = { name: '', taxId: '', notes: '' };

  contactDialogOpen = signal(false);
  editContactId = signal<number | null>(null);
  contactForm = { name: '', email: '', phone: '', positionName: '' };

  addressDialogOpen = signal(false);
  editAddressId = signal<number | null>(null);
  addressForm = {
    label: '',
    addressLine1: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
  };

  private clientId = 0;
  isNew = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === 'new') {
      this.isNew = true;
      this.loading.set(false);
      this.editMode.set(true);
      this.client.set({ id: 0, name: '', active: true, contacts: [], addresses: [] } as any);
      return;
    }
    this.clientId = Number(idParam);
    this.loadClient();
  }

  private loadClient(): void {
    this.api.getClient(this.clientId).subscribe({
      next: (c) => {
        this.client.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Cliente no encontrado');
        this.router.navigate(['/clients']);
      },
    });
  }

  startEdit(): void {
    const c = this.client()!;
    this.editData = { name: c.name, taxId: c.taxId ?? '', notes: c.notes ?? '' };
    this.editMode.set(true);
  }

  saveInfo(): void {
    if (this.isNew) {
      this.api.createClient(this.editData).subscribe({
        next: (c) => {
          this.notify.success('Cliente creado');
          this.router.navigate(['/clients', c.id]);
        },
        error: (e) => this.notify.error('Error', e.message),
      });
    } else {
      this.api.updateClient(this.clientId, this.editData).subscribe({
        next: (c) => {
          this.client.set(c as ClientDetailResponse);
          this.editMode.set(false);
          this.notify.success('Cliente actualizado');
        },
        error: (e) => this.notify.error('Error', e.message),
      });
    }
  }

  openContactDialog(c?: ClientContactResponse): void {
    if (c) {
      this.editContactId.set(c.id);
      this.contactForm = {
        name: c.name,
        email: c.email ?? '',
        phone: c.phone ?? '',
        positionName: c.positionName ?? '',
      };
    } else {
      this.editContactId.set(null);
      this.contactForm = { name: '', email: '', phone: '', positionName: '' };
    }
    this.contactDialogOpen.set(true);
  }

  saveContact(): void {
    const obs = this.editContactId()
      ? this.api.updateContact(this.clientId, this.editContactId()!, this.contactForm)
      : this.api.createContact(this.clientId, { ...this.contactForm, contactOrder: 0 });
    obs.subscribe({
      next: () => {
        this.notify.success(this.editContactId() ? 'Contacto actualizado' : 'Contacto creado');
        this.contactDialogOpen.set(false);
        this.loadClient();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  deleteContact(id: number): void {
    this.api.updateContactStatus(this.clientId, id, { active: false }).subscribe({
      next: () => {
        this.notify.success('Contacto eliminado');
        this.loadClient();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  openAddressDialog(a?: ClientAddressResponse): void {
    if (a) {
      this.editAddressId.set(a.id);
      this.addressForm = {
        label: a.label ?? '',
        addressLine1: a.addressLine1,
        city: a.city,
        province: a.province ?? '',
        postalCode: a.postalCode ?? '',
        country: a.country ?? '',
      };
    } else {
      this.editAddressId.set(null);
      this.addressForm = {
        label: '',
        addressLine1: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
      };
    }
    this.addressDialogOpen.set(true);
  }

  saveAddress(): void {
    const obs = this.editAddressId()
      ? this.api.updateAddress(this.clientId, this.editAddressId()!, this.addressForm)
      : this.api.createAddress(this.clientId, { ...this.addressForm, addressOrder: 0 });
    obs.subscribe({
      next: () => {
        this.notify.success(this.editAddressId() ? 'Dirección actualizada' : 'Dirección creada');
        this.addressDialogOpen.set(false);
        this.loadClient();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }

  deleteAddress(id: number): void {
    this.api.updateAddressStatus(this.clientId, id, { active: false }).subscribe({
      next: () => {
        this.notify.success('Dirección eliminada');
        this.loadClient();
      },
      error: (e) => this.notify.error('Error', e.message),
    });
  }
}
