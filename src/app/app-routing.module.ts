import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { AppLayoutComponent } from "./layout/app.layout.component";

@NgModule({
    imports: [
        RouterModule.forRoot([
            // Ruta por defecto redirige a 'landing'
            { path: '', redirectTo: 'landing', pathMatch: 'full' },
            // Ruta para el landing page (pantalla inicial)
            { path: 'landing', loadChildren: () => import('./demo/components/landing/landing.module').then(m => m.LandingModule) },
            {
                path: '', component: AppLayoutComponent,
                children: [ 
                    { path: 'actividades', loadChildren: () => import('./demo/components/actividades/actividades.module').then(m => m.ActividadesModule) },
                    { path: 'dashboard', loadChildren: () => import('./demo/components/dashboard/dashboard.module').then(m => m.DashboardModule) },
                    { path: 'usuarios', loadChildren: () => import('./demo/components/usuarios/usuarios.module').then(m => m.UsuariosModule) },
                ]
            },
            { path: 'auth', loadChildren: () => import('./demo/components/auth/auth.module').then(m => m.AuthModule) },
            { path: 'landing', loadChildren: () => import('./demo/components/landing/landing.module').then(m => m.LandingModule) },
            { path: '**', redirectTo: '/landing' },
        ], { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled', onSameUrlNavigation: 'reload' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
