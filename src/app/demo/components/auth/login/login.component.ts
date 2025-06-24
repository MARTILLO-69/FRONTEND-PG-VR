import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LoginService } from 'src/app/demo/service/login.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styles: [`
        :host ::ng-deep .pi-eye,
        :host ::ng-deep .pi-eye-slash {
            transform:scale(1.6);
            margin-right: 1rem;
            color: var(--primary-color) !important;
        }
    `]
})
export class LoginComponent {

    loginForm: FormGroup;

    constructor(
        public layoutService: LayoutService,
        private api: LoginService,
        private router: Router,
        private accion: ActivatedRoute,
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.loginForm = this.fb.group({
            codigo: ['', Validators.required],
            contraseña: ['', Validators.required]
        });
    }

    
    /*onLogin() {
        if (this.loginForm.valid) {
            const { codigo, contraseña } = this.loginForm.value;

            this.api.postUsuarioLogin(codigo, contraseña).subscribe({
                next: (response) => {
                    const paginas = response.paginas || [];
                    const rol = response.roles[0]; // aún asumimos 1 rol
                    const token = response.access_token;

                    const usuario = {
                        usuario_id: response.usuarioId,
                        estudiante_id: response.estudianteId,
                        roles: response.roles,
                        paginas: response.paginas
                    };

                    // Guardar en localStorage
                    localStorage.setItem('loginSuccess', 'true');
                    localStorage.setItem('usuario', JSON.stringify(usuario));
                    localStorage.setItem('usuario_id', response.usuarioId.toString());
                    localStorage.setItem('rol', rol);
                    localStorage.setItem('paginas', JSON.stringify(paginas));
                    localStorage.setItem('token', token);

                    // Redirigir
                    if (paginas.length > 0) {
                        this.router.navigate([paginas[0].ruta]);
                    } else {
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Sin acceso',
                            detail: 'No tienes páginas asignadas. Contacta al administrador.'
                        });
                    }
                },
                error: (error) => {
                    console.error('Error en el login', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Credenciales incorrectas o problema de conexión.'
                    });
                }
            });
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Completa todos los campos'
            });
        }
    }*/
onLogin() {
  if (this.loginForm.valid) {
    const { codigo, contraseña } = this.loginForm.value;

    this.api.postUsuarioLogin(codigo, contraseña).subscribe({
      next: (response) => {
        const usuario = response.usuario;
        const paginas = usuario.paginas || [];
        const rol = usuario.roles?.[0] || 'sin-rol';

        // Guardar en localStorage
        localStorage.setItem('loginSuccess', 'true');
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('usuario_id', usuario.usuario_id.toString());
        localStorage.setItem('rol', rol);
        localStorage.setItem('paginas', JSON.stringify(paginas));
        localStorage.setItem('token', response.token);

        // Redirigir a la primera página
        if (paginas.length > 0) {
          this.router.navigate([paginas[0].ruta]);
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Sin acceso',
            detail: 'No tienes páginas asignadas. Contacta al administrador.'
          });
        }
      },
      error: (error) => {
        console.error('Error en el login', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Credenciales incorrectas o problema de conexión.'
        });
      }
    });
  } else {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Completa todos los campos'
    });
  }
}


    regresarLanding() {
        this.router.navigate(['/landing']);
    }
}
