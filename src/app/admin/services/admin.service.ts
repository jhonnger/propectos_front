import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AsignacionResumenDTO {
  usuarioId: number;
  usuarioNombre: string;
  usuarioApellidos: string;
  usuarioNombreCompleto: string;
  cantidadAsignada: number;
}

export interface AssignmentResponse {
  success: boolean;
  mensaje: string;
  cargaMasivaId: number;
  cargaMasivaNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  totalProspectos: number;
  nuevasAsignaciones: number;
  prospectosSinAsignar: number;
  fechaAsignacion: string;
}

export interface AssignmentStatistics {
  totalAsignaciones: number;
  pendientes: number;
  reasignadas: number;
  completadas: number;
  totalProspectos: number;
  totalCargasMasivas: number;
  totalUsuarios: number;
  porcentajeAsignado: number;
}

export interface CargaMasivaDTO {
  id: number;
  nombrearchivo: string;
  fecha: string;
  cantidadProspectos: number;
  estadoAsignacion: string;
  fechaAsignacion: string | null;
  usuarioAsignadoId: number | null;
  usuarioAsignadoNombre: string | null;
  usuarioAsignadoApellidos: string | null;
  usuarioAsignadoCompleto: string | null;
  prospectosAsignados: number;
  prospectosSinAsignar: number;
  resumenAsignaciones: AsignacionResumenDTO[];
}

export interface UsuarioDTO {
  id: number;
  nombre: string;
  apellidos: string;
  usuario: string;
  email: string;
  estado: boolean;
  nombreCompleto: string;
  rolId: number;
  rolNombre: string;
}

export interface RolDTO {
  id: number;
  nombre: string;
}

export interface CreateUsuarioRequest {
  nombre: string;
  apellidos: string;
  usuario: string;
  email: string;
  password: string;
  rolId: number;
}

export interface UpdateUsuarioRequest {
  nombre: string;
  apellidos: string;
  email: string;
  password?: string;
  rolId: number;
  estado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private baseUrl = `${environment.apiUrl}/api/prospectos`;
  private assignmentUrl = `${environment.apiUrl}/api/asignaciones`;
  private cargaMasivaUrl = `${environment.apiUrl}/api/cargas-masivas`;
  private usuarioUrl = `${environment.apiUrl}/api/usuarios`;
  private tokenKey = 'authToken';

  constructor(private http: HttpClient) {}

  uploadExcel(fileBase64: string, fileName: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    const payload = {
      fileContent: fileBase64,
      filename: fileName,
    };

    return this.http.post(`${this.baseUrl}/importar`, payload, { headers });
  }

  assignMassiveLoadToUser(cargaMasivaId: number, usuarioId: number, cantidad?: number): Observable<AssignmentResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    let params = new HttpParams()
      .set('cargaMasivaId', cargaMasivaId.toString())
      .set('usuarioId', usuarioId.toString());

    if (cantidad !== undefined && cantidad !== null) {
      params = params.set('cantidad', cantidad.toString());
    }

    return this.http.post<AssignmentResponse>(
      `${this.assignmentUrl}/asignar-carga-masiva`,
      params.toString(),
      { headers }
    );
  }

  getAssignmentStatistics(): Observable<AssignmentStatistics> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<AssignmentStatistics>(
      `${this.assignmentUrl}/estadisticas`,
      { headers }
    );
  }

  getCargasMasivas(): Observable<CargaMasivaDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<CargaMasivaDTO[]>(
      `${this.cargaMasivaUrl}`,
      { headers }
    );
  }

  getCargasMasivasByEstado(estadoAsignacion: string): Observable<CargaMasivaDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    const params = new HttpParams().set('estadoAsignacion', estadoAsignacion);

    return this.http.get<CargaMasivaDTO[]>(
      `${this.cargaMasivaUrl}`,
      { headers, params }
    );
  }

  getUsuariosNoAdministradores(): Observable<UsuarioDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<UsuarioDTO[]>(
      `${this.usuarioUrl}/no-admins`,
      { headers }
    );
  }

  getUsuariosPorRol(rolId: number): Observable<UsuarioDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<UsuarioDTO[]>(
      `${this.usuarioUrl}/por-rol/${rolId}`,
      { headers }
    );
  }

  getUsuariosActivos(): Observable<UsuarioDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<UsuarioDTO[]>(
      `${this.usuarioUrl}/activos`,
      { headers }
    );
  }

  getRoles(): Observable<RolDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<RolDTO[]>(
      `${this.usuarioUrl}/roles`,
      { headers }
    );
  }

  getUserById(id: number): Observable<UsuarioDTO> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<UsuarioDTO>(
      `${this.usuarioUrl}/${id}`,
      { headers }
    );
  }

  createUser(userData: CreateUsuarioRequest): Observable<UsuarioDTO> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.post<UsuarioDTO>(
      `${this.usuarioUrl}`,
      userData,
      { headers }
    );
  }

  updateUser(id: number, userData: UpdateUsuarioRequest): Observable<UsuarioDTO> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.put<UsuarioDTO>(
      `${this.usuarioUrl}/${id}`,
      userData,
      { headers }
    );
  }

  deleteUser(id: number): Observable<UsuarioDTO> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.delete<UsuarioDTO>(
      `${this.usuarioUrl}/${id}`,
      { headers }
    );
  }

  eliminarUser(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.delete<any>(
      `${this.usuarioUrl}/${id}/eliminar`,
      { headers }
    );
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
