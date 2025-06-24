import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const paginas = JSON.parse(localStorage.getItem('paginas') || '[]');
  const rutaSolicitada = state.url;

  const tieneAcceso = paginas.some((p: any) => p.ruta === rutaSolicitada);

  if (!tieneAcceso) {
    // Redirigir a /no-autorizado
    window.location.href = '/no-autorizado';
    return false;
  }

  return true;
};
