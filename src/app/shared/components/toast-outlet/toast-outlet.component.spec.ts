import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService, ToastMessage } from '../../../core/services/notification.service';
import { ToastOutletComponent } from './toast-outlet.component';

function makeNotificationService(toasts: ToastMessage[] = []) {
  return {
    toasts: signal<ToastMessage[]>(toasts),
    dismiss: vi.fn(),
  };
}

describe('ToastOutletComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  function createFixture(toasts: ToastMessage[] = []) {
    const notifService = makeNotificationService(toasts);
    TestBed.configureTestingModule({
      imports: [ToastOutletComponent],
      providers: [{ provide: NotificationService, useValue: notifService }],
    });
    const fixture = TestBed.createComponent(ToastOutletComponent);
    fixture.detectChanges();
    return { fixture, notifService };
  }

  it('renders an empty container when there are no toasts', () => {
    const { fixture } = createFixture([]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.toast').length).toBe(0);
  });

  it('renders one toast per item in the toasts signal', () => {
    const toasts: ToastMessage[] = [
      { id: 1, type: 'success', title: 'OK', duration: 3000 },
      { id: 2, type: 'error', title: 'Error', duration: 8000 },
    ];
    const { fixture } = createFixture(toasts);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.toast').length).toBe(2);
  });

  it('applies the correct type CSS class to each toast', () => {
    const toasts: ToastMessage[] = [{ id: 1, type: 'warning', title: 'Aviso', duration: 6000 }];
    const { fixture } = createFixture(toasts);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.toast--warning')).not.toBeNull();
  });

  it('renders the toast title', () => {
    const toasts: ToastMessage[] = [{ id: 1, type: 'info', title: 'Información', duration: 3000 }];
    const { fixture } = createFixture(toasts);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('strong')!.textContent).toContain('Información');
  });

  it('renders the optional message paragraph when message is present', () => {
    const toasts: ToastMessage[] = [
      {
        id: 1,
        type: 'success',
        title: 'Guardado',
        message: 'Operación completada',
        duration: 3000,
      },
    ];
    const { fixture } = createFixture(toasts);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.toast__content p')!.textContent).toContain('Operación completada');
  });

  it('does not render the message paragraph when message is absent', () => {
    const toasts: ToastMessage[] = [{ id: 1, type: 'success', title: 'OK', duration: 3000 }];
    const { fixture } = createFixture(toasts);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.toast__content p')).toBeNull();
  });

  it('calls dismiss with the toast id when close button is clicked', () => {
    const toasts: ToastMessage[] = [{ id: 42, type: 'error', title: 'Error', duration: 8000 }];
    const { fixture, notifService } = createFixture(toasts);
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('.toast__close') as HTMLButtonElement).click();
    expect(notifService.dismiss).toHaveBeenCalledWith(42);
  });
});
