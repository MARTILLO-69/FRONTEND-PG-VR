import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html',
})
export class AppTopBarComponent implements OnInit {

    items!: MenuItem[];

    @ViewChild('menubutton') menuButton!: ElementRef;

    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(public layoutService: LayoutService) { }

    usuarioNombre: string = '';
    usuarioApellido: string = '';
    usuarioRol: string = '';

    ngOnInit() {
    const usuario = localStorage.getItem('usuario');
        if (usuario) {
            const parsed = JSON.parse(usuario);
            this.usuarioNombre = parsed.nombre || '';
            this.usuarioApellido = parsed.apellido || '';
            this.usuarioRol = parsed.roles?.[0] || '';
        }
    }

    cerrarSesion() {
        localStorage.clear();
        window.location.href = '/login';
    }
}
