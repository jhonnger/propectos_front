import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
  })
  export class AuthService {
    private tokenKey = 'authToken';
    private roleKey = 'userRole';
    private nameKey = 'userName';
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());

    constructor(private http: HttpClient) {}

    login(username: string, password: string): Observable<string | null> {
      return this.http.post<{ token: string; rol: string; nombre: string }>(`${environment.apiUrl}/api/auth/login`, { username, password })
        .pipe(
          map((response) => {
            if (response) {
              this.saveToken(response.token);
              localStorage.setItem(this.roleKey, response.rol);
              localStorage.setItem(this.nameKey, response.nombre);
              this.isAuthenticatedSubject.next(true);
              return response.rol;
            }
            return null;
          })
        );
    }

    isAuthenticatedSync(): boolean {
        // Verifica si el token existe en localStorage
        return !!localStorage.getItem(this.tokenKey);
      }

    logout(): void {
      this.clearToken();
      localStorage.removeItem(this.roleKey);
      localStorage.removeItem(this.nameKey);
      this.isAuthenticatedSubject.next(false);
    }

    isAuthenticated(): Observable<boolean> {
      return this.isAuthenticatedSubject.asObservable();
    }
    getUsername(): string | null {
      return localStorage.getItem(this.nameKey);
    }

    getRole(): string | null {
      return localStorage.getItem(this.roleKey);
    }

    private saveToken(token: string): void {
        console.log(token)
      localStorage.setItem(this.tokenKey, token);
    }

    private clearToken(): void {
      localStorage.removeItem(this.tokenKey);
    }

    private hasToken(): boolean {
      return !!localStorage.getItem(this.tokenKey);
    }


  }
