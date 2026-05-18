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

// ── RF-19: Nuevas interfaces tipadas para importación y asignación multi ──

export interface DetalleRechazo {
  fila: number;
  motivo: string;
}

export interface ImportacionResult {
  success: boolean;
  mensaje: string;
  cargaMasivaId: number;
  importados: number;
  rechazados: number;
  detalleRechazos: DetalleRechazo[];
}

export interface AsignacionMultiItem {
  usuarioId: number;
  usuarioNombre: string;
  asignados: number;
}

export interface AsignacionMultiResponse {
  success: boolean;
  mensaje: string;
  cargaMasivaId: number;
  cargaMasivaNombre: string;
  disponiblesAntes: number;
  totalAsignados: number;
  saldoSinAsignar: number;
  detalle: AsignacionMultiItem[];
  fechaAsignacion: string;
}

export interface MiProspectoAdmin {
  prospectoId: number;
  nombre: string;
  apellido: string;
  celular: string;
  documentoIdentidad: string;
  campania: string;
  estado: string;
  estadoResultado: string;
  fechaAgenda: string | null;
  ultimoContacto: string | null;
  totalContactos: number;
}

export interface ProspectosPorUsuarioResponse {
  resultados: MiProspectoAdmin[];
  pagina: number;
  tamanioPagina: number;
  total: number;
  totalPaginas: number;
}

export interface ContactoHistorialAdmin {
  id: number;
  fechaContacto: string;
  estadoResultado: string;
  comentario: string;
  motivoNoContesto?: string;
}

// ── Slice 1.5: Dashboard del dueño MVP (RF-18) ───────────────────────────────

export interface MetricasPeriodo {
  ventasCerradas: number;
  derivados: number;
  atenciones: number;
  contactabilidadReal?: number;
  colaboradoresActivos?: number;
  colaboradoresTotal?: number;
  citasHoy?: number;
  tasaConversion?: number;
  avanceBasesPct?: number;
  disponiblesSinAsignar?: number;
  [key: string]: unknown;
}

export interface RankingColaborador {
  usuarioId: number;
  nombre: string;
  ventasCerradas: number;
  derivados: number;
  atenciones: number;
  contactabilidad: number;
  ultimaActividad: string | null;
}

export interface Embudo {
  asignados: number;
  gestionados: number;
  contactadosTitular: number;
  interesados: number;
  derivados: number;
  ventas: number;
}

export interface BaseResumen {
  id: number;
  nombre: string;
  cantidad: number;
  asignados: number;
  sinAsignar: number;
  avancePct: number;
}

// ── Slice 2.4: Asistencia del día ────────────────────────────────────────────

export interface AsistenciaColaborador {
  usuarioId: number;
  nombre: string;
  jornadaIniciada: boolean;
  inicio: string | null;
  fin: string | null;
  ausente: boolean;
}

export interface AsistenciaDia {
  fecha: string;
  esLaborable: boolean;
  limiteAusencia: string;
  totalColaboradores: number;
  totalAusentes: number;
  colaboradores: AsistenciaColaborador[];
}

export interface DashboardResumen {
  dia: MetricasPeriodo;
  mes: MetricasPeriodo;
  ranking: RankingColaborador[];
  embudo: Embudo;
  porCerrar: number;
  bases: BaseResumen[];
  asistencia?: AsistenciaDia;
  porEnRiesgo?: number;
}

export interface DrillDownColaboradorItem {
  asignacionId: number;
  prospectoId: number;
  nombreProspecto: string;
  celular: string;
  documentoIdentidad: string;
  campania: string;
  estado: string;
  estadoResultado: string | null;
  fechaAgenda: string | null;
  fechaAsignacion: string | null;
  fechaCierre: string | null;
  totalContactos: number;
}

export interface DrillDownColaborador {
  colaborador: { id: number; nombre: string };
  resultados: DrillDownColaboradorItem[];
  pagina: number;
  tamanioPagina: number;
  total: number;
  totalPaginas: number;
}

// ── Slice 1.4: Derivación + cierre por el dueño ─────────────────────────────

export interface PorCerrarItem {
  asignacionId: number;
  prospectoId: number;
  nombre: string;
  apellido: string;
  celular: string;
  celularMasked: boolean;
  documentoIdentidad: string;
  campania: string;
  derivadoPorId: number;
  derivadoPorNombre: string;
  fechaDerivacion: string;
  nroPrestamosConcretados: number;
}

export interface PorCerrarResponse {
  resultados: PorCerrarItem[];
  pagina: number;
  tamanioPagina: number;
  total: number;
  totalPaginas: number;
}

export interface CierreVentaResponse {
  ok: boolean;
  estado: string;
  prospectoId: number;
  derivadoPorId: number;
  fechaElegibilidad: string;
  nroPrestamosConcretados: number;
}

export interface NoCerroResponse {
  ok: boolean;
  estado: string;
}

// ── Slice 2.2: Calendario laboral RF-22 ─────────────────────────────────────

export interface Feriado {
  id: number;
  fecha: string;
  esFeriado: boolean;
  descripcion: string;
}

// ── Slice 2.1: Configuración del dueño ───────────────────────────────────────

export interface ConfiguracionDueno {
  id: number;
  toggleEmailInstantaneo: boolean;
  toggleEmailDigest: boolean;
  toggleResumenDiario: boolean;
  metaVentasMensual: number;
  metaDerivadosPorColaborador: number;
  plazoReevaluacionSbsDias: number;
  maxIntentosNoContesto: number;
  reglaReintentoNoContesto: string;
  horaInicioJornada: string;
  minutosGraciaAusencia: number;
  ultimoEnvioResumenOk: boolean | null;
  ultimoEnvioResumenFecha: string | null;
  ultimoEnvioResumenDetalle: string | null;
}

/** Campos que se envían al PUT /api/reportes/config; null = no modificar. */
export interface ConfiguracionPatch {
  toggleEmailInstantaneo?: boolean | null;
  toggleEmailDigest?: boolean | null;
  toggleResumenDiario?: boolean | null;
  metaVentasMensual?: number | null;
  metaDerivadosPorColaborador?: number | null;
  plazoReevaluacionSbsDias?: number | null;
  maxIntentosNoContesto?: number | null;
  reglaReintentoNoContesto?: string | null;
  horaInicioJornada?: string | null;
  minutosGraciaAusencia?: number | null;
}

export interface EstadoEmail {
  ok: boolean;
  fecha: string | null;
  detalle: string | null;
  toggleResumenDiario: boolean;
  mailConfigurado: boolean;
}

// ── Slice 2.3: Reasignación + "En riesgo" (RF-23) ───────────────────────────

export interface EnRiesgoItem {
  asignacionId: number;
  prospectoId: number;
  nombre: string;
  celular: string;
  campania: string;
  estado: string;
  fechaAgenda: string | null;
  colaboradorAusenteId: number;
  colaboradorAusente: string;
}

export interface EnRiesgoResponse {
  total: number;
  resultados: EnRiesgoItem[];
  nota?: string;
}

export interface ReasignacionResponse {
  ok: boolean;
  reasignados: number;
  destinoId: number;
  destinoNombre: string;
}

// ── Slice 2.5: Bitácora global de atenciones (RF-20) ─────────────────────────

export interface BitacoraFiltros {
  desde?: string;
  hasta?: string;
  colaboradorId?: number | null;
  campania?: string;
  baseId?: number | null;
  resultado?: string;
  quienContesto?: string;
}

export interface BitacoraFila {
  contactoId: number;
  asignacionId: number;
  prospectoId: number;
  fecha: string;
  colaborador: string;
  prospecto: string;
  celular: string;
  campania: string;
  base: string;
  estadoResultado: string;
  submotivoNoContesto: string | null;
  quienContesto: string | null;
  verificacionSbs: string | null;
  duracionGestion: number | null;
  comentario: string | null;
}

export interface BitacoraResponse {
  total: number;
  totalPaginas: number;
  pagina: number;
  tamano: number;
  resultados: BitacoraFila[];
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

  uploadExcel(fileBase64: string, fileName: string): Observable<ImportacionResult> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    const payload = {
      fileContent: fileBase64,
      filename: fileName,
    };

    return this.http.post<ImportacionResult>(`${this.baseUrl}/importar`, payload, { headers });
  }

  asignarMulti(
    cargaMasivaId: number,
    asignaciones: { usuarioId: number; cantidad: number }[],
  ): Observable<AsignacionMultiResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    const body = { cargaMasivaId, asignaciones };

    return this.http.post<AsignacionMultiResponse>(
      `${this.assignmentUrl}/asignar-multi`,
      body,
      { headers },
    );
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

  eliminarUser(id: number): Observable<{ ok: boolean }> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.delete<{ ok: boolean }>(
      `${this.usuarioUrl}/${id}/eliminar`,
      { headers }
    );
  }

  // === Reportes ===

  getDashboardAdmin(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(`${environment.apiUrl}/api/reportes/dashboard`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` })
    });
  }

  getColaboradorDrilldown(
    usuarioId: number,
    pagina: number = 1,
    tamanioPagina: number = 10,
  ): Observable<DrillDownColaborador> {
    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamanioPagina.toString());

    return this.http.get<DrillDownColaborador>(
      `${environment.apiUrl}/api/reportes/colaborador/${usuarioId}`,
      {
        headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
        params,
      },
    );
  }

  exportarProspectos(campania?: string, estado?: string, estadoResultado?: string): Observable<Blob> {
    let params = new HttpParams();
    if (campania) params = params.set('campania', campania);
    if (estado) params = params.set('estado', estado);
    if (estadoResultado) params = params.set('estadoResultado', estadoResultado);

    return this.http.get(`${environment.apiUrl}/api/reportes/exportar-prospectos`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      params,
      responseType: 'blob'
    });
  }

  getProspectosPorUsuario(userId: number, pagina: number = 1, tamanioPagina: number = 10): Observable<ProspectosPorUsuarioResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamanioPagina.toString());

    return this.http.get<ProspectosPorUsuarioResponse>(
      `${this.assignmentUrl}/prospectos-por-usuario/${userId}`,
      { headers, params }
    );
  }

  getHistorialContactos(prospectoId: number): Observable<ContactoHistorialAdmin[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
    });

    return this.http.get<ContactoHistorialAdmin[]>(
      `${environment.apiUrl}/api/contactos/historial/${prospectoId}`,
      { headers }
    );
  }

  reasignarProspecto(prospectoId: number, nuevoUsuarioId: number): Observable<{ ok: boolean }> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${this.getToken()}`
    });
    const params = new HttpParams()
      .set('prospectoId', prospectoId.toString())
      .set('nuevoUsuarioId', nuevoUsuarioId.toString());

    return this.http.post<{ ok: boolean }>(`${this.assignmentUrl}/reasignar`, params.toString(), { headers });
  }

  // ── Slice 1.4: Derivación + cierre por el dueño ────────────────────────────

  getPorCerrar(pagina: number, tamanioPagina: number): Observable<PorCerrarResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamanioPagina.toString());

    return this.http.get<PorCerrarResponse>(
      `${environment.apiUrl}/api/cierre/por-cerrar`,
      { headers, params },
    );
  }

  registrarVenta(
    asignacionId: number,
    fechaElegibilidad: string,
    comentario?: string,
  ): Observable<CierreVentaResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getToken()}`,
    });
    const body: { fechaElegibilidad: string; comentario?: string } = { fechaElegibilidad };
    if (comentario) body['comentario'] = comentario;

    return this.http.post<CierreVentaResponse>(
      `${environment.apiUrl}/api/cierre/${asignacionId}/venta`,
      body,
      { headers },
    );
  }

  noCerro(
    asignacionId: number,
    accion: 'REINTENTAR' | 'DESCARTAR',
    fecha?: string,
    comentario?: string,
  ): Observable<NoCerroResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getToken()}`,
    });
    const body: { accion: string; fecha?: string; comentario?: string } = { accion };
    if (fecha) body['fecha'] = fecha;
    if (comentario) body['comentario'] = comentario;

    return this.http.post<NoCerroResponse>(
      `${environment.apiUrl}/api/cierre/${asignacionId}/no-cerro`,
      body,
      { headers },
    );
  }

  // ── Slice 2.1: Configuración del dueño (RF-08) ────────────────────────────

  getConfiguracion(): Observable<ConfiguracionDueno> {
    return this.http.get<ConfiguracionDueno>(`${environment.apiUrl}/api/reportes/config`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
    });
  }

  actualizarConfiguracion(patch: ConfiguracionPatch): Observable<ConfiguracionDueno> {
    return this.http.put<ConfiguracionDueno>(`${environment.apiUrl}/api/reportes/config`, patch, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
      }),
    });
  }

  getEstadoEmail(): Observable<EstadoEmail> {
    return this.http.get<EstadoEmail>(`${environment.apiUrl}/api/reportes/estado-email`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
    });
  }

  // ── Slice 2.2: Calendario laboral RF-22 ────────────────────────────────────

  /** GET /api/calendario?anio={anio} — sin `anio` lista todo */
  getCalendario(anio?: number): Observable<Feriado[]> {
    let params = new HttpParams();
    if (anio !== undefined) {
      params = params.set('anio', anio.toString());
    }
    return this.http.get<Feriado[]>(`${environment.apiUrl}/api/calendario`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      params,
    });
  }

  /** POST /api/calendario — 400 si duplicado o fecha inválida */
  agregarFeriado(fecha: string, descripcion: string): Observable<Feriado> {
    return this.http.post<Feriado>(
      `${environment.apiUrl}/api/calendario`,
      { fecha, descripcion },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`,
        }),
      },
    );
  }

  // ── Slice 2.3: Reasignación + "En riesgo" (RF-23) ────────────────────────

  /** GET /api/reasignacion/en-riesgo */
  getEnRiesgo(): Observable<EnRiesgoResponse> {
    return this.http.get<EnRiesgoResponse>(`${environment.apiUrl}/api/reasignacion/en-riesgo`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
    });
  }

  /** POST /api/reasignacion — reasigna asignaciones individuales seleccionadas */
  reasignar(
    asignacionIds: number[],
    nuevoUsuarioId: number,
    motivo: string,
  ): Observable<ReasignacionResponse> {
    return this.http.post<ReasignacionResponse>(
      `${environment.apiUrl}/api/reasignacion`,
      { asignacionIds, nuevoUsuarioId, motivo },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`,
        }),
      },
    );
  }

  /** POST /api/reasignacion/colaborador/{origenId} — reasigna todos los casos activos de un colaborador */
  reasignarTodoColaborador(
    origenId: number,
    nuevoUsuarioId: number,
    motivo: string,
  ): Observable<ReasignacionResponse> {
    return this.http.post<ReasignacionResponse>(
      `${environment.apiUrl}/api/reasignacion/colaborador/${origenId}`,
      { nuevoUsuarioId, motivo },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`,
        }),
      },
    );
  }

  // ── Slice 2.5: Bitácora global de atenciones (RF-20) ─────────────────────

  /** GET /api/reportes/bitacora (paginado) */
  getBitacora(
    filtros: BitacoraFiltros,
    pagina: number = 1,
    tamano: number = 50,
  ): Observable<BitacoraResponse> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamano', tamano.toString());

    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros.colaboradorId != null) params = params.set('colaboradorId', filtros.colaboradorId.toString());
    if (filtros.campania) params = params.set('campania', filtros.campania);
    if (filtros.baseId != null) params = params.set('baseId', filtros.baseId.toString());
    if (filtros.resultado) params = params.set('resultado', filtros.resultado);
    if (filtros.quienContesto) params = params.set('quienContesto', filtros.quienContesto);

    return this.http.get<BitacoraResponse>(`${environment.apiUrl}/api/reportes/bitacora`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      params,
    });
  }

  /** GET /api/reportes/bitacora/exportar — devuelve Blob xlsx */
  exportarBitacora(filtros: BitacoraFiltros): Observable<Blob> {
    let params = new HttpParams();
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros.colaboradorId != null) params = params.set('colaboradorId', filtros.colaboradorId.toString());
    if (filtros.campania) params = params.set('campania', filtros.campania);
    if (filtros.baseId != null) params = params.set('baseId', filtros.baseId.toString());
    if (filtros.resultado) params = params.set('resultado', filtros.resultado);
    if (filtros.quienContesto) params = params.set('quienContesto', filtros.quienContesto);

    return this.http.get(`${environment.apiUrl}/api/reportes/bitacora/exportar`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      params,
      responseType: 'blob',
    });
  }

  /** DELETE /api/calendario/{id} — 400 si no existe */
  eliminarFeriado(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(
      `${environment.apiUrl}/api/calendario/${id}`,
      {
        headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      },
    );
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
