import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private endpoint = `${environment.URL_API}usuario/`;

  constructor(private http: HttpClient) {}

  postRegistrarUsuarios(body: any): Observable<any> {
    return this.http.post(`${this.endpoint}registrar`, body);
  }

  // ✔️ Editar usuario (PATCH)
  editarUsuario(id: number, body: any): Observable<any> {
    return this.http.patch(`${this.endpoint}${id}`, body);
  }

  // ✔️ Eliminar lógico (DELETE)
  eliminarUsuarioLogico(id: number): Observable<any> {
    return this.http.delete(`${this.endpoint}eliminadologico/${id}`);
  }

  // ✔️ Eliminar físico (DELETE)
  eliminarUsuarioFisico(id: number): Observable<any> {
    return this.http.delete(`${this.endpoint}eliminadofisico/${id}`);
  }
}