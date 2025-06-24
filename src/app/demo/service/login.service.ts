import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = environment.URL_API;

  constructor(private http: HttpClient) {}

  /*postUsuarioLogin(codigo: string, contraseña: string): Observable<any> {
    return this.http.post(`${this.apiUrl}auth/login`, { codigo, contraseña }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        
        // construimos el objeto usuario
        const usuario = {
          usuario_id: res.usuarioId,
          estudiante_id: res.estudianteId,
          roles: res.roles,
          paginas: res.paginas
        };

        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('roles', JSON.stringify(res.roles));
        localStorage.setItem('paginas', JSON.stringify(res.paginas));
      })
    );
  }*/

  postUsuarioLogin(codigo: string, contraseña: string): Observable<any> {
    return this.http.post(`${this.apiUrl}usuario/login`, { codigo, contraseña }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);

        const usuario = res.usuario;

        const userData = {
          usuario_id: usuario.usuario_id,
          estudiante_id: usuario.estudiante_id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          roles: usuario.roles,
          paginas: usuario.paginas
        };

        localStorage.setItem('usuario', JSON.stringify(userData));
        localStorage.setItem('roles', JSON.stringify(usuario.roles));
        localStorage.setItem('paginas', JSON.stringify(usuario.paginas));
      })
    );
  }


  logout(): void {
    localStorage.clear();
  }

  getUsuarioActual(): any {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  getPaginasPermitidas(): any[] {
    const paginas = localStorage.getItem('paginas');
    return paginas ? JSON.parse(paginas) : [];
  }

  getRoles(): string[] {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
