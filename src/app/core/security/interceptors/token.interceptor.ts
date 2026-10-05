import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { skipAuthToken } from '../auth/token/skipAuth.token';

export const TokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(skipAuthToken)) return next(req);

  const auth: AuthService = inject(AuthService);
  const token = auth.getToken();

  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};
