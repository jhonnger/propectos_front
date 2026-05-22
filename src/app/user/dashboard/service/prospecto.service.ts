import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ── Jornada RF-21 ────────────────────────────────────────────────────────────

export interface JornadaEstado {
  fecha: string;
  iniciada: boolean;
  finalizada: boolean;
  inicio: string | null;
  fin: string | null;
}

// ── Tipos de contacto (LEGACY — se mantienen para retrocompatibilidad) ────────

/** @deprecated Usar AtencionRequest en su lugar */
export interface ContactoRegistro {
  prospectoId: number;
  comentario: string;
  estadoResultado: string;
  fechaAgenda?: string;
  motivoNoContesto?: string;
}

/** @deprecated Usar HistorialContacto en su lugar */
export interface ContactoHistorial {
  id: number;
  fechaContacto: string;
  estadoResultado: string;
  comentario: string;
  motivoNoContesto?: string;
}

// ── Enums de resultado ────────────────────────────────────────────────────────

export type ResultadoAtencion =
  | 'NO_CONTESTO'
  | 'DATOS_INVALIDOS'
  | 'INTERESADO'
  | 'AGENDADO'
  | 'VOLVER_LLAMAR'
  | 'DERIVADO'
  | 'NO_VOLVER_LLAMAR';

export type SubmotivoNoContesto = 'NO_CONTESTA' | 'BUZON' | 'OCUPADO' | 'APAGADO';
export type QuienContesto = 'TITULAR' | 'TERCERO' | 'EQUIVOCADO';
export type ResultadoSbs = 'APTO' | 'OBSERVADO';

// ── Interfaces de API wizard (RF-04/13/14/15) ─────────────────────────────────

/** POST /api/contactos/apertura */
export interface AperturaRequest {
  prospectoId: number;
}

export interface AperturaResponse {
  aperturaId: number;
  inicio: string;
}

/** GET /api/contactos/historial/{prospectoId} */
export interface HistorialContacto {
  fechaContacto: string;
  resultado: string;
  submotivoNoContesto: string | null;
  quienContesto: string | null;
  verificacionSbs: string | null;
  comentario: string | null;
  duracionGestion: number | null;
}

/** POST /api/contactos/verificacion-sbs */
export interface VerificacionSbsRequest {
  prospectoId: number;
  resultado: ResultadoSbs;
  fechaReevaluacion?: string;
  comentario?: string;
}

export interface VerificacionSbsResponseApto {
  continuar: true;
}

export interface VerificacionSbsResponseObservado {
  continuar: false;
  estado: string;
  fechaReevaluacionSbs: string;
}

export type VerificacionSbsResponse =
  | VerificacionSbsResponseApto
  | VerificacionSbsResponseObservado;

/** POST /api/contactos */
export interface AtencionRequest {
  prospectoId: number;
  aperturaId: number;
  resultado: ResultadoAtencion;
  submotivoNoContesto?: SubmotivoNoContesto;
  quienContesto?: QuienContesto;
  fechaAgenda?: string;
  comentario?: string;
  duracionGestionSegundos: number;
}

export interface AtencionResponse {
  ok: boolean;
  estado: string;
  proximaLlamada: string | null;
}

// ── Filtros de la cola ────────────────────────────────────────────────────────

export type FiltroColaborador =
  | 'MI_COLA_HOY'
  | 'SIN_GESTIONAR'
  | 'AGENDADOS_HOY'
  | 'POR_REINTENTAR'
  | 'PROGRAMADOS'
  | 'OBSERVADO_SBS'
  | 'DERIVADOS'
  | 'INTERESADOS'
  | 'MIS_VENTAS'
  | 'DESCARTADOS'
  | 'TODOS';

export interface FiltroChip {
  valor: FiltroColaborador;
  etiqueta: string;
}

export const FILTROS_COLA: FiltroChip[] = [
  { valor: 'MI_COLA_HOY',    etiqueta: 'Mi cola de hoy'  },
  { valor: 'SIN_GESTIONAR',  etiqueta: 'Sin gestionar'   },
  { valor: 'AGENDADOS_HOY',  etiqueta: 'Agendados hoy'   },
  { valor: 'POR_REINTENTAR', etiqueta: 'Por reintentar'  },
  { valor: 'PROGRAMADOS',    etiqueta: 'Programados'      },
  { valor: 'OBSERVADO_SBS',  etiqueta: 'Observado SBS'   },
  { valor: 'DERIVADOS',      etiqueta: 'Derivados'        },
  { valor: 'INTERESADOS',    etiqueta: 'Interesados'      },
  { valor: 'MIS_VENTAS',     etiqueta: 'Mis cerrados'     },
  { valor: 'DESCARTADOS',    etiqueta: 'Descartados'      },
  { valor: 'TODOS',          etiqueta: 'Todos'            },
];

// ── Modelos de respuesta ──────────────────────────────────────────────────────

export interface MiProspecto {
  asignacionId: number;
  prospectoId: number;
  nombre: string;
  apellido: string;
  celular: string;
  celularMasked: boolean;
  documentoIdentidad: string;
  campania: string;
  estado: string;
  estadoResultado: string | null;
  fechaAgenda: string | null;
  verificacionSbs: string | null;
  fechaReevaluacionSbs: string | null;
  proximaLlamada: string | null;
  intentosFallidos: number;
  ultimoContacto: string | null;
  totalContactos: number;
  nroPrestamosConcretados: number;
  vencido: boolean;
  futuro: boolean;
}

export interface MisProspectosResponse {
  filtro: FiltroColaborador;
  pagina: number;
  tamanioPagina: number;
  total: number;
  totalPaginas: number;
  resultados: MiProspecto[];
}

export interface GestionResumen {
  contactoId: number;
  asignacionId: number;
  prospectoId: number;
  nombreProspecto: string;
  celular: string;
  fechaContacto: string;
  estadoResultado: string | null;
  /** VerificacionSbs (p. ej. OBSERVADO) para eventos SBS sin resultado de llamada. */
  verificacionSbs?: string | null;
  comentario: string;
  duracionGestion: number | null;
}

export interface MiActividad {
  generadoEn: string;
  totalGestiones: number;
  resumenPorResultado: Record<string, number>;
  gestiones: GestionResumen[];
}

export interface MisEstadisticas {
  sinGestionar: number;
  enGestion: number;
  enSeguimiento: number;
  derivados: number;
  ganados: number;
  descartados: number;
  // campos legacy que pueden o no venir del backend
  finalizados?: number;
  agendados?: number;
  noContesto?: number;
  prospectos?: number;
  concretos?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProspectoService {

  private readonly tokenKey = 'authToken';
  private readonly baseUrl = `${environment.apiUrl}/api/prospectos`;
  private readonly contactoBaseUrl = `${environment.apiUrl}/api/contactos`;
  private readonly asignacionUrl = `${environment.apiUrl}/api/asignaciones`;

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

  // ── Wizard RF-04/13/14/15 ─────────────────────────────────────────────────

  /**
   * POST /api/contactos/apertura
   * Abre la gestión y arranca el cronómetro en el backend.
   * Llamar al abrir el modal de atención.
   */
  abrirModal(prospectoId: number): Observable<AperturaResponse> {
    const body: AperturaRequest = { prospectoId };
    return this.http.post<AperturaResponse>(
      `${this.contactoBaseUrl}/apertura`,
      body,
      { headers: this.getAuthHeaders() },
    );
  }

  /**
   * POST /api/contactos/apertura/{id}/cerrar
   * Registra un cierre sin gestión (RF-14).
   * Llamar si el modal se cierra sin registrar atención.
   */
  cerrarApertura(aperturaId: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `${this.contactoBaseUrl}/apertura/${aperturaId}/cerrar`,
      {},
      { headers: this.getAuthHeaders() },
    );
  }

  /**
   * GET /api/contactos/historial/{prospectoId}
   * Historial de contactos previos del prospecto.
   */
  getHistorialWizard(prospectoId: number): Observable<HistorialContacto[]> {
    return this.http.get<HistorialContacto[]>(
      `${this.contactoBaseUrl}/historial/${prospectoId}`,
      { headers: this.getAuthHeaders() },
    );
  }

  /**
   * POST /api/contactos/verificacion-sbs
   * Verifica el estado SBS del prospecto (paso 0, bloqueante).
   */
  verificarSbs(payload: VerificacionSbsRequest): Observable<VerificacionSbsResponse> {
    return this.http.post<VerificacionSbsResponse>(
      `${this.contactoBaseUrl}/verificacion-sbs`,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  /**
   * POST /api/contactos
   * Registra la atención completa del prospecto.
   */
  registrarAtencion(payload: AtencionRequest): Observable<AtencionResponse> {
    return this.http.post<AtencionResponse>(
      this.contactoBaseUrl,
      payload,
      { headers: this.getAuthHeaders() },
    );
  }

  // ── Cola del colaborador ──────────────────────────────────────────────────

  /**
   * GET /api/asignaciones/mis-prospectos
   * Retorna la cola del colaborador filtrada y paginada.
   */
  getMisProspectos(
    filtro: FiltroColaborador = 'MI_COLA_HOY',
    busqueda?: string,
    pagina: number = 1,
    tamanioPagina: number = 10,
  ): Observable<MisProspectosResponse> {
    let params = new HttpParams()
      .set('filtro', filtro)
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamanioPagina.toString());

    if (busqueda && busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }

    return this.http.get<MisProspectosResponse>(
      `${this.asignacionUrl}/mis-prospectos`,
      { headers: this.getAuthHeaders(), params },
    );
  }

  /** GET /api/asignaciones/mis-estadisticas */
  getMisEstadisticas(): Observable<MisEstadisticas> {
    return this.http.get<MisEstadisticas>(
      `${this.asignacionUrl}/mis-estadisticas`,
      { headers: this.getAuthHeaders() },
    );
  }

  /** GET /api/asignaciones/mi-actividad */
  getMiActividad(): Observable<MiActividad> {
    return this.http.get<MiActividad>(
      `${this.asignacionUrl}/mi-actividad`,
      { headers: this.getAuthHeaders() },
    );
  }

  // ── WhatsApp (RF-WA) ──────────────────────────────────────────────────────

  /**
   * GET /api/whatsapp/plantilla
   * Devuelve la plantilla de mensaje configurada por el admin.
   */
  getPlantillaWhatsapp(): Observable<{ plantilla: string }> {
    return this.http.get<{ plantilla: string }>(
      `${environment.apiUrl}/api/whatsapp/plantilla`,
      { headers: this.getAuthHeaders() },
    );
  }

  /**
   * GET /api/whatsapp/mi-tarjeta/existe
   * Devuelve si el colaborador tiene tarjeta de presentación cargada.
   */
  miTarjetaWhatsappExiste(): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(
      `${environment.apiUrl}/api/whatsapp/mi-tarjeta/existe`,
      { headers: this.getAuthHeaders() },
    );
  }

  /**
   * GET /api/whatsapp/mi-tarjeta
   * Descarga los bytes de la imagen de tarjeta del colaborador (404 si no hay).
   */
  descargarMiTarjetaWhatsapp(): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/api/whatsapp/mi-tarjeta`,
      {
        headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
        responseType: 'blob',
      },
    );
  }

  /**
   * POST /api/contactos/enviar-banco
   * Envía el prospecto OBSERVADO al banco destino configurado.
   * Errores: 400 { message } (sin banco destino o estado incorrecto), 403 (sin permiso).
   */
  enviarABanco(prospectoId: number): Observable<{ ok: true; bancoDestino: string }> {
    return this.http.post<{ ok: true; bancoDestino: string }>(
      `${this.contactoBaseUrl}/enviar-banco`,
      { prospectoId },
      { headers: this.getAuthHeaders() },
    );
  }

  /** @deprecated Usar registrarAtencion() */
  registrarContacto(contactoData: ContactoRegistro): Observable<unknown> {
    return this.http.post(this.contactoBaseUrl, contactoData, { headers: this.getAuthHeaders() });
  }

  /** @deprecated Usar getHistorialWizard() */
  getHistorial(prospectoId: number): Observable<ContactoHistorial[]> {
    return this.http.get<ContactoHistorial[]>(
      `${this.contactoBaseUrl}/historial/${prospectoId}`,
      { headers: this.getAuthHeaders() },
    );
  }

  exportarMisProspectos(filtro?: FiltroColaborador): Observable<Blob> {
    let params = new HttpParams();
    if (filtro) params = params.set('filtro', filtro);

    return this.http.get(`${environment.apiUrl}/api/reportes/exportar-mis-prospectos`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      params,
      responseType: 'blob',
    });
  }

  getProspects(busqueda: Record<string, string | number>): Observable<unknown> {
    const httpParams = new HttpParams({ fromObject: busqueda as Record<string, string> });
    return this.http.get(`${this.baseUrl}/busqueda`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      params: httpParams,
    });
  }

  getProspectosInteresados(busqueda: Record<string, string | number>): Observable<unknown> {
    const httpParams = new HttpParams({ fromObject: busqueda as Record<string, string> });
    return this.http.get(`${this.baseUrl}/interesados`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` }),
      params: httpParams,
    });
  }

  // ── Jornada RF-21 ─────────────────────────────────────────────────────────

  /** GET /api/jornada/hoy */
  getJornadaHoy(): Observable<JornadaEstado> {
    return this.http.get<JornadaEstado>(
      `${environment.apiUrl}/api/jornada/hoy`,
      { headers: this.getAuthHeaders() },
    );
  }

  /** POST /api/jornada/iniciar (body vacío, idempotente) */
  iniciarJornada(): Observable<JornadaEstado> {
    return this.http.post<JornadaEstado>(
      `${environment.apiUrl}/api/jornada/iniciar`,
      {},
      { headers: this.getAuthHeaders() },
    );
  }

  /** POST /api/jornada/finalizar (body vacío; 400 si no inició) */
  finalizarJornada(): Observable<JornadaEstado> {
    return this.http.post<JornadaEstado>(
      `${environment.apiUrl}/api/jornada/finalizar`,
      {},
      { headers: this.getAuthHeaders() },
    );
  }
}
