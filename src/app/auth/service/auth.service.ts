import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
  })
  export class AuthService {
    private tokenKey = 'authToken'; // Llave para almacenar el token en localStorage
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  
    constructor(private http: HttpClient) {}
  
    login(username: string, password: string): Observable<boolean> {
      return this.http.post<{ token: string }>('http://localhost:8081/api/auth/login', { username, password })
        .pipe(
          map((response: any) => {
            console.log(response)
            if (response) {
              this.saveToken(response.token);
              this.isAuthenticatedSubject.next(true);
              return true;
            }
            return false;
          })
        );
    }

    isAuthenticatedSync(): boolean {
        // Verifica si el token existe en localStorage
        return !!localStorage.getItem(this.tokenKey);
      }
  
    logout(): void {
      this.clearToken();
      this.isAuthenticatedSubject.next(false);
    }
  
    isAuthenticated(): Observable<boolean> {
      return this.isAuthenticatedSubject.asObservable();
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