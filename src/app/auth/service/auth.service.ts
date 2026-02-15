import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
  })
  export class AuthService {
    private tokenKey = 'authToken';
    private roleKey = 'userRole';
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());

    constructor(private http: HttpClient) {}

    login(username: string, password: string): Observable<string | null> {
      return this.http.post<{ token: string; rol: string }>('http://localhost:8081/api/auth/login', { username, password })
        .pipe(
          map((response) => {
            if (response) {
              this.saveToken(response.token);
              localStorage.setItem(this.roleKey, response.rol);
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
      this.isAuthenticatedSubject.next(false);
    }

    isAuthenticated(): Observable<boolean> {
      return this.isAuthenticatedSubject.asObservable();
    }
    getUsername(): string | null {
      return 'Juan';
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
