import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { inject } from '@angular/core';
import { RoleEnum } from '../../enums/role.enum';

export const authGuard = (roles: Array<RoleEnum>): CanActivateChildFn => {
  return (_, state) => {
    const auth: AuthService = inject(AuthService);
    const router: Router = inject(Router);

    if (!auth.isAuthenticated) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });

      return false;
    }

    if (!auth.hasAnyRole(roles)) {
      router.navigate(['/application'], {
        queryParams: { returnUrl: state.url },
      });

      return false;
    }

    return true;
  }
}
