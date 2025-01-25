import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
  })
  export class ProspectoService {

    private tokenKey = 'authToken'; 
    private baseUrl = 'http://localhost:8081/api/prospectos'; // Cambia por tu URL base de la API private 

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    console.log(localStorage.getItem(this.tokenKey));
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtiene la lista de prospectos
   * @param token Token de autenticación del usuario
   * @returns Observable con los datos de los prospectos
   */
  getProspects(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    return this.http.get(`${this.baseUrl}/busqueda`, { headers });
  }
  }