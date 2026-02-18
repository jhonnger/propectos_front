import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ContactoRegistro {
  prospectoId: number;
  comentario: string;
  estadoResultado: string;
  fechaAgenda?: string;
}

export interface MiProspecto {
  prospectoId: number;
  nombre: string;
  apellido: string;
  celular: string;
  documentoIdentidad: string;
  campania: string;
  estado: string;
  estadoResultado: string | null;
  fechaAgenda: string | null;
  ultimoContacto: string | null;
  totalContactos: number;
}

export interface MisProspectosResponse {
  resultados: MiProspecto[];
  pagina: number;
  tamanioPagina: number;
  total: number;
  totalPaginas: number;
}

export interface MisEstadisticas {
  sinGestionar: number;
  enGestion: number;
  finalizados: number;
  agendados: number;
  noContesto: number;
  prospectos: number;
  concretos: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProspectoService {

  private tokenKey = 'authToken';
  private baseUrl = `${environment.apiUrl}/api/prospectos`;
  private contactoBaseUrl = `${environment.apiUrl}/api/contactos`;
  private asignacionUrl = `${environment.apiUrl}/api/asignaciones`;

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getToken()}`,
    });
  }

  getMisProspectos(pagina: number, tamanioPagina: number, estado?: string, estadoResultado?: string): Observable<MisProspectosResponse> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamanioPagina.toString());

    if (estado) {
      params = params.set('estado', estado);
    }
    if (estadoResultado) {
      params = params.set('estadoResultado', estadoResultado);
    }

    return this.http.get<MisProspectosResponse>(
      `${this.asignacionUrl}/mis-prospectos`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  getMisEstadisticas(): Observable<MisEstadisticas> {
    return this.http.get<MisEstadisticas>(
      `${this.asignacionUrl}/mis-estadisticas`,
      { headers: this.getAuthHeaders() }
    );
  }

  registrarContacto(contactoData: ContactoRegistro): Observable<any> {
    return this.http.post(this.contactoBaseUrl, contactoData, { headers: this.getAuthHeaders() });
  }

  getProspects(busqueda: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: busqueda });
    return this.http.get(`${this.baseUrl}/busqueda`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      params: httpParams
    });
  }

  getProspectosInteresados(busqueda: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: busqueda });
    return this.http.get(`${this.baseUrl}/interesados`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      params: httpParams
    });
  }
}
