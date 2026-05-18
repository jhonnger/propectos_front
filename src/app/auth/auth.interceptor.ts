import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/** Returns true when the request URL should receive the Bearer token.
 *  Matches:
 *  - Same-origin relative paths starting with /api/
 *  - Absolute URLs that start with the configured apiUrl (when non-empty and not a placeholder)
 */
function isApiRequest(url: string): boolean {
  if (url.startsWith('/api/')) {
    return true;
  }
  const base = environment.apiUrl;
  if (base && !base.includes('REPLACE_WITH') && url.startsWith(base)) {
    return true;
  }
  return false;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('authToken');

  let authReq = req;
  if (token && isApiRequest(req.url)) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
