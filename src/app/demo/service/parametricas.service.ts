import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ParametricasService {

  private apiUrl: string;
  private apiEstudiantes: string;
  private apiProfesor: string;

  constructor(private http: HttpClient) {
      this.apiUrl = environment.URL_API;
      this.apiEstudiantes = 'estudiante/';
      this.apiProfesor = 'profesor/';
  }

  listarEstudiantes(): Observable<any> {
    return this.http.get(this.apiUrl+this.apiEstudiantes+'listar');
  }

  listarProfesores(): Observable<any> {
    return this.http.get(this.apiUrl+this.apiProfesor+'listar');
  }

  resetPassword(usuarioId: number) {
    return this.http.post(`${this.apiUrl}usuario/reset-password/${usuarioId}`, {});
  }

}
