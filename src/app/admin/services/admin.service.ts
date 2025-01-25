import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private baseUrl = 'http://localhost:8081/api/prospectos'; // Cambia esto por la URL de tu API
  private tokenKey = 'authToken';
  constructor(private http: HttpClient) {}

  /**
   * Subir el archivo Excel en formato Base64
   * @param fileBase64 Archivo en formato Base64
   * @returns Observable del resultado
   */
  uploadExcel(fileBase64: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    });

    const payload = {
      fileContent: fileBase64,
    };

    return this.http.post(`${this.baseUrl}/importar`, payload, { headers });
  }

  getToken(): string | null {
    console.log(localStorage.getItem(this.tokenKey));
    return localStorage.getItem(this.tokenKey);
  }
}
