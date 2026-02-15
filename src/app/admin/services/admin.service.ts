import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface AssignmentResponse {
  success: boolean;
  mensaje: string;
  cargaMasivaId: number;
  cargaMasivaNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  totalProspectos: number;
  nuevasAsignaciones: number;
  reasignaciones: number;
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
  descripcion: string;
}

export interface CreateUserRequest {
  nombre: string;
  apellidos: string;
  usuario: string;
  email: string;
  password: string;
  rolId: number;
}

export interface CreateUserResponse {
  success: boolean;
  mensaje: string;
  usuarioId?: number;
}

export interface UpdateUserRequest {
  nombre: string;
  apellidos: string;
  email: string;
  password?: string;
  rolId: number;
}

export interface UpdateUserResponse {
  success: boolean;
  mensaje: string;
}

export interface DeleteUserResponse {
  success: boolean;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private baseUrl = 'http://localhost:8081/api/prospectos';
  private assignmentUrl = 'http://localhost:8081/api/asignaciones';
  private cargaMasivaUrl = 'http://localhost:8081/api/cargas-masivas';
  private usuarioUrl = 'http://localhost:8081/api/usuarios';
  private tokenKey = 'authToken';
  
  constructor(private http: HttpClient) {}

  /**
   * Subir el archivo Excel en formato Base64
   * @param fileBase64 Archivo en formato Base64
   * @returns Observable del resultado
   */
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

  /**
   * Asignar una carga masiva a un usuario
   * @param cargaMasivaId ID de la carga masiva
   * @param usuarioId ID del usuario
   * @returns Observable con el resultado de la asignación
   */
  assignMassiveLoadToUser(cargaMasivaId: number, usuarioId: number): Observable<AssignmentResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    const params = new HttpParams()
      .set('cargaMasivaId', cargaMasivaId.toString())
      .set('usuarioId', usuarioId.toString());

    return this.http.post<AssignmentResponse>(
      `${this.assignmentUrl}/asignar-carga-masiva`, 
      params.toString(), 
      { headers }
    );
  }

  /**
   * Obtener estadísticas de asignaciones
   * @returns Observable con las estadísticas
   */
  getAssignmentStatistics(): Observable<AssignmentStatistics> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<AssignmentStatistics>(
      `${this.assignmentUrl}/estadisticas`, 
      { headers }
    );
  }

  /**
   * Obtener todas las cargas masivas
   * @returns Observable con la lista de cargas masivas
   */
  getCargasMasivas(): Observable<CargaMasivaDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<CargaMasivaDTO[]>(
      `${this.cargaMasivaUrl}`, 
      { headers }
    );
  }

  /**
   * Obtener cargas masivas filtradas por estado de asignación
   * @param estadoAsignacion Estado de asignación a filtrar
   * @returns Observable con la lista de cargas masivas filtradas
   */
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

  /**
   * Obtener usuarios que no son administradores
   * @returns Observable con la lista de usuarios no administradores
   */
  getUsuariosNoAdministradores(): Observable<UsuarioDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<UsuarioDTO[]>(
      `${this.usuarioUrl}/no-admins`, 
      { headers }
    );
  }

  /**
   * Obtener usuarios por rol
   * @param rolId ID del rol a filtrar
   * @returns Observable con la lista de usuarios del rol especificado
   */
  getUsuariosPorRol(rolId: number): Observable<UsuarioDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<UsuarioDTO[]>(
      `${this.usuarioUrl}/por-rol/${rolId}`, 
      { headers }
    );
  }

  /**
   * Obtener todos los usuarios activos
   * @returns Observable con la lista de usuarios activos
   */
  getUsuariosActivos(): Observable<UsuarioDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<UsuarioDTO[]>(
      `${this.usuarioUrl}/activos`,
      { headers }
    );
  }

  /**
   * Crear un nuevo usuario
   * @param userData Datos del usuario a crear
   * @returns Observable con la respuesta de creación
   */
  createUser(userData: CreateUserRequest): Observable<CreateUserResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.post<CreateUserResponse>(
      `${this.usuarioUrl}`,
      userData,
      { headers }
    );
  }

  /**
   * Obtener todos los roles disponibles
   * @returns Observable con la lista de roles
   */
  getRoles(): Observable<RolDTO[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<RolDTO[]>(
      `${this.usuarioUrl}/roles`,
      { headers }
    );
  }

  /**
   * Obtener un usuario por ID
   * @param id ID del usuario
   * @returns Observable con los datos del usuario
   */
  getUserById(id: number): Observable<UsuarioDTO> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<UsuarioDTO>(
      `${this.usuarioUrl}/${id}`,
      { headers }
    );
  }

  /**
   * Actualizar un usuario existente
   * @param id ID del usuario a actualizar
   * @param userData Datos actualizados del usuario
   * @returns Observable con la respuesta de actualización
   */
  updateUser(id: number, userData: UpdateUserRequest): Observable<UpdateUserResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.put<UpdateUserResponse>(
      `${this.usuarioUrl}/${id}`,
      userData,
      { headers }
    );
  }

  /**
   * Desactivar un usuario (soft delete)
   * @param id ID del usuario a desactivar
   * @returns Observable con la respuesta de eliminación
   */
  deleteUser(id: number): Observable<DeleteUserResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.delete<DeleteUserResponse>(
      `${this.usuarioUrl}/${id}`,
      { headers }
    );
  }

  private getToken(): string | null {
    console.log(localStorage.getItem(this.tokenKey));
    return localStorage.getItem(this.tokenKey);
  }
}
