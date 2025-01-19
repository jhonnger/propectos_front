import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './service/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Inyecta el servicio de autenticación
  const router = inject(Router); // Inyecta el router

  if (authService.isAuthenticatedSync()) {
    return true; // Permite acceso si el usuario está autenticado
  } else {
    // Redirige al login si no está autenticado
    router.navigate(['/login']);
    return false;
  }
};
