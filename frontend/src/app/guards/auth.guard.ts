import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Aguarda carregar a sessão
  await new Promise<void>(resolve => {
    const check = setInterval(() => {
      if (!auth.carregando()) { clearInterval(check); resolve(); }
    }, 50);
  });

  if (!auth.estaLogado) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

export const roleGuard = (roles: string[]): CanActivateFn => async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await new Promise<void>(resolve => {
    const check = setInterval(() => {
      if (!auth.carregando()) { clearInterval(check); resolve(); }
    }, 50);
  });

  if (!auth.estaLogado) {
    router.navigate(['/login']);
    return false;
  }

  if (!roles.includes(auth.perfil ?? '')) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};