import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

    private endpoint = `${environment.URL_API}reportes/`;

    constructor(private http: HttpClient) {}

    getAvanceEstudiantes(): Observable<any[]> {
        return this.http.get<any[]>(`${this.endpoint}estudiantes/avance`);
    }

    generarReporteAvance(usuarioId: number, fechaInicio: Date, fechaFin: Date, observaciones: string): void {
      const formatoFecha = (fecha: Date): string => {
        return fecha.toISOString().split('T')[0]; // resultado: '2025-06-10'
      };

      const params = new URLSearchParams({
        usuarioId: usuarioId.toString(),
        fechaInicio: formatoFecha(fechaInicio),
        fechaFin: formatoFecha(fechaFin),
        observaciones
      });

      const url = `${this.endpoint}avance?${params.toString()}`;
      window.open(url, '_blank');
    }

    generarReportePorParalelo(fechaInicio: Date, fechaFin: Date, observaciones: string): void {
      const formato = (f: Date) => f.toISOString().split('T')[0];
      const params = new URLSearchParams({
        fechaInicio: formato(fechaInicio),
        fechaFin: formato(fechaFin),
        observaciones,
      });

      const url = `${this.endpoint}avance/paralelo?${params.toString()}`;
      window.open(url, '_blank'); // abre el PDF en nueva pestaña
    }

    generarReporteCredenciales(paralelo: string): void {
      const url = `${this.endpoint}reporte/credenciales/${paralelo}`;
      window.open(url, '_blank');
    }
}