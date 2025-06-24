import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class PreguntasService {

  private apiUrl: string;
  private apiPreguntas: string;

  constructor(private http: HttpClient) {
      this.apiUrl = environment.URL_API;
      this.apiPreguntas = 'preguntas/';
  }

  // 🔹 1. Crear una nueva pregunta
  crearPregunta(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}${this.apiPreguntas}crear`, data);
  }

  listarActividades(): Observable<any> {
    return this.http.get(`${this.apiUrl}${this.apiPreguntas}actividades`);
  }

  // 🔹 2. Editar una pregunta existente
  editarPregunta(data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}${this.apiPreguntas}editar`, data);
  }

  // 🔹 3. Eliminar una pregunta (baja lógica)
  eliminarPregunta(preguntaId: number): Observable<any> {
    let params = new HttpParams().set('pregunta_id', preguntaId);
    return this.http.delete(`${this.apiUrl}${this.apiPreguntas}eliminar`, { params });
  }

  // 🔹 4. Listar preguntas con respuestas, filtradas por nivel y/o actividad
  listarPreguntasSimples(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}preguntas/listar`);
  }
}