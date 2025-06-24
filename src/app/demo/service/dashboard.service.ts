import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
  })
export class DashboardService {

    private apiUrl: string;
    private apiDashboard: string;
    private apiDashboard2: string;
    private apiDashboard3: string;
    private apiDashboard4: string;

    constructor(private http: HttpClient) {
        this.apiUrl = environment.URL_API;
        this.apiDashboard = 'estudiante/';
        this.apiDashboard2 = 'profesor/';
        this.apiDashboard3 = 'materia/';
        this.apiDashboard4 = 'historial-progreso';
    }

    countParalelo(): Observable<any> {
        return this.http.get(this.apiUrl+this.apiDashboard+'CountParalelo');
      }
    
    countEstudiantes(): Observable<any> {
        return this.http.get(this.apiUrl+this.apiDashboard+'CountEstudiantes');
    }

    countProfesores(): Observable<any> {
      return this.http.get(this.apiUrl+this.apiDashboard2+'CountProfesores');
    }

    countMaterias(): Observable<any> {
      return this.http.get(this.apiUrl+this.apiDashboard3+'CountMaterias');
    }

    // ADMIN
    getAvanceGeneral(): Observable<any> {
      return this.http.get(`${this.apiUrl+this.apiDashboard4}/avance-niveles`);
    }

    getAvancePorNivelYParalelo(): Observable<any> {
      return this.http.get(`${this.apiUrl+this.apiDashboard4}/avance-nivel-paralelo`);
    }

    getUltimasActividadesAdmin(): Observable<any> {
      return this.http.get(`${this.apiUrl+this.apiDashboard4}/ultimas-actividades`);
    }

    // PROFESOR
    getUltimasEntregasProfesor(usuarioId: number): Observable<any> {
      return this.http.get(`${this.apiUrl+this.apiDashboard4}/ultimas-entregas-profesor/${usuarioId}`);
    }

    // ESTUDIANTE
    getResumenEstudiante(estudianteId: number): Observable<any> {
      return this.http.get(`${this.apiUrl+this.apiDashboard4}/resumen-estudiante/${estudianteId}`);
    }

    getActividadesEstudiante(estudianteId: number): Observable<any> {
      return this.http.get(`${this.apiUrl+this.apiDashboard4}/actividades-estudiante/${estudianteId}`);
    }
}
