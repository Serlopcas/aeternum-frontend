import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api.models';
import { AuthStateService } from '../state/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const token = authState.accessToken();
  const isLoginRequest = req.url.includes('/auth/login');

  let authReq = req;
  if (token && !isLoginRequest) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLoginRequest) {
        authState.clearAuth();
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore storage errors */
        }
        router.navigate(['/login']);
      }

      const apiError: ApiError = error.error?.status
        ? error.error
        : {
            status: error.status,
            error: error.statusText || 'Error',
            message: error.error?.message || error.message || 'Error desconocido',
            fieldErrors: error.error?.fieldErrors || null,
          };

      return throwError(() => apiError);
    }),
  );
};
