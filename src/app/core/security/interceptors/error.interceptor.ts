import { NotificationService } from '../../../ui/services/notification.service';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../auth/services/auth.service';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification: NotificationService = inject(NotificationService);
  const auth: AuthService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 0:
          notification.error('Sin conexión al servisor.');
          break
        case 401:
          auth.clearSession();
          break
        case 403:
          notification.error(err.message, { returnTo: '/application' });
          break
        case 503:
          notification.error(err.message, { returnTo: '/application/forbidden' });
          break
      }

      return throwError(() => err);
    })
  )
};
