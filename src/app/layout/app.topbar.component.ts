import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { Router } from '@angular/router';
import { LoginService } from '../demo/service/login.service';

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html',
    styleUrls: ['./app.topbar.component.scss']
})
export class AppTopBarComponent implements OnInit {

    items!: MenuItem[];

    @ViewChild('menubutton') menuButton!: ElementRef;

    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    @ViewChild('topbarmenu') menu!: ElementRef;

    notificaciones: any[] = [];
    tieneNotificacionCambioPass: boolean = false;

    constructor(public layoutService: LayoutService, private loginService: LoginService, private router: Router) { }

    usuarioNombre: string = '';
    usuarioApellido: string = '';
    usuarioRol: string = '';

    dialogCambiarPass = false;

    formPass = {
        contrasena_actual: '',
        nueva_contrasena: '',
        confirmar_contrasena: ''
    };

    ngOnInit() {
        const usuarioString = localStorage.getItem('usuario');  // string
        const flag = localStorage.getItem('debe_cambiar_pass');

        let usuario: any = {};

        if (usuarioString) {
            usuario = JSON.parse(usuarioString);  // parsear UNA sola vez
            this.usuarioNombre = usuario.nombre || '';
            this.usuarioApellido = usuario.apellido || '';
            this.usuarioRol = usuario.roles?.[0] || '';
        }

        // Notificación del cambio de contraseña
        this.tieneNotificacionCambioPass = flag === 'true';

        if (this.tieneNotificacionCambioPass) {
            this.notificaciones.push({
                tipo: 'cambiar-pass',
                titulo: 'Cambio de contraseña requerido',
                mensaje: 'Por tu seguridad, debes actualizar tu contraseña.',
                icono: 'pi pi-exclamation-triangle',
                action: () => this.abrirDialogCambiarPass()
            });
        }
    }
    
    guardarNuevaPass() {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

        if (this.formPass.nueva_contrasena !== this.formPass.confirmar_contrasena) {
            alert('Las contraseñas nuevas no coinciden.');
            return;
        }

        const dto = {
            usuario_id: usuario.usuario_id,
            contraseña_actual: this.formPass.contrasena_actual,
            nueva_contraseña: this.formPass.nueva_contrasena
        };

        this.loginService.cambiarPassword(dto).subscribe({
            next: () => {
                this.dialogCambiarPass = false;

                // limpiar notificación
                this.tieneNotificacionCambioPass = false;
                this.notificaciones = [];
                localStorage.setItem('debe_cambiar_pass', 'false');

                // mensaje amigable
                alert('Tu contraseña fue actualizada correctamente. Serás redirigido al inicio de sesión.');

                // limpiar sesión
                localStorage.clear();

                // redirigir de forma amable
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 1500); // 1.5 segundos suave
            },
            error: (err) => {
                alert(err.error?.message || 'Error al cambiar contraseña.');
            }
        });
    }



    abrirDialogCambiarPass() {
        this.dialogCambiarPass = true;
    }

    abrirNotificacion(n: any) {
        n.action();
    }

    cerrarSesion() {
        localStorage.clear();

        // evitar volver atrás
        history.pushState(null, '', location.href);
        window.onpopstate = () => {
            history.go(1);
        };

        this.router.navigate(['/login']);
    }
}
