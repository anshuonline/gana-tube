import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const gtanalyticAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const pwd = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gtanalytic_pwd') : null;
  
  if (pwd) {
    return true;
  }
  
  // Not authenticated — redirect to login
  router.navigate(['/gtanalytic/login']);
  return false;
};
