import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../../core/models/api.models';
import { ApiErrorAlertComponent } from './api-error-alert.component';

function createFixture(error: ApiError | null, severity?: 'error' | 'warning') {
  TestBed.configureTestingModule({ imports: [ApiErrorAlertComponent] });
  const fixture = TestBed.createComponent(ApiErrorAlertComponent);
  fixture.componentRef.setInput('error', error);
  if (severity) fixture.componentRef.setInput('severity', severity);
  fixture.detectChanges();
  return fixture;
}

describe('ApiErrorAlertComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders nothing when error is null', () => {
    const fixture = createFixture(null);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-alert')).toBeNull();
  });

  it('renders the error message when error has no field errors', () => {
    const err: ApiError = { status: 400, error: 'Bad Request', message: 'Nombre requerido' };
    const fixture = createFixture(err);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-alert')).not.toBeNull();
    expect(el.querySelector('.error-alert__message')!.textContent).toContain('Nombre requerido');
    expect(el.querySelector('.error-alert__fields')).toBeNull();
  });

  it('renders field errors list when fieldErrors are present', () => {
    const err: ApiError = {
      status: 422,
      error: 'Unprocessable',
      message: 'Errores de validación',
      fieldErrors: [
        { field: 'email', message: 'Formato inválido' },
        { field: 'name', message: 'No puede estar vacío' },
      ],
    };
    const fixture = createFixture(err);
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.error-alert__fields li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('email');
    expect(items[0].textContent).toContain('Formato inválido');
  });

  it('does not render field errors list when fieldErrors is empty', () => {
    const err: ApiError = { status: 400, error: 'Bad Request', message: 'Error', fieldErrors: [] };
    const fixture = createFixture(err);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-alert__fields')).toBeNull();
  });

  it('applies the default error severity CSS class', () => {
    const err: ApiError = { status: 500, error: 'Internal', message: 'Fallo' };
    const fixture = createFixture(err);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-alert--error')).not.toBeNull();
  });

  it('applies warning severity CSS class when severity is "warning"', () => {
    const err: ApiError = { status: 400, error: 'Bad Request', message: 'Aviso' };
    const fixture = createFixture(err, 'warning');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error-alert--warning')).not.toBeNull();
    expect(el.querySelector('.error-alert--error')).toBeNull();
  });
});
