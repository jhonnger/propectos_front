import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {BusquedaRequest} from '../../../common/types/BusquedaRequest.interface';
import { environment } from '../../../../environments/environment';

export interface ContactoRegistro {
  prospectoId: number;
  comentario: string;
  contestoLlamada: boolean;
  interesado: boolean;
}

@Injectable({
    providedIn: 'root'
  })
  export class ProspectoService {

    private tokenKey = 'authToken';
    private baseUrl = `${environment.apiUrl}/api/prospectos`;
    private contactoBaseUrl = `${environment.apiUrl}/api/contactos`;

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
  getProspects(busqueda: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: busqueda });
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    return this.http.get(`${this.baseUrl}/busqueda`, { headers, params: httpParams });
  }

  /**
   * Registra un contacto para un prospecto
   * @param contactoData Datos del contacto a registrar
   * @returns Observable con la respuesta del servidor
   */
  registrarContacto(contactoData: ContactoRegistro): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getToken()}`,
    });

    return this.http.post(this.contactoBaseUrl, contactoData, { headers });
  }

  /**
   * Obtiene la lista de prospectos interesados
   * @param busqueda Parámetros de búsqueda
   * @returns Observable con los datos de los prospectos interesados
   */
  getProspectosInteresados(busqueda: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: busqueda });
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    return this.http.get(`${this.baseUrl}/interesados`, { headers, params: httpParams });
  }
  }
