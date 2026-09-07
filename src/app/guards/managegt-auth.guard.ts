import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const managegtAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('managegt_token');
  
  if (token) {
    return true;
  }
  
  // Not authenticated — redirect to login
  router.navigate(['/managegt/login']);
  return false;
};
