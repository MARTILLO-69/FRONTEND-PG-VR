import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { UsuariosComponent } from "./usuarios.component";
import { EstudiantesComponent } from "./estudiantes/estudiantes.component";
import { ProfesoresComponent } from "./profesores/profesores.component";
import { RolesPermisosComponent } from "./roles-permisos/roles-permisos.component";
import { authGuard } from "../../guards/auth.guard";

const routes = [
    {
        path: "",
        component: UsuariosComponent,
        children: [
            {path: 'estudiantes', component: EstudiantesComponent, canActivate: [authGuard]},
            {path: 'profesores', component: ProfesoresComponent, canActivate: [authGuard]},
            {path: 'roles-permisos', component: RolesPermisosComponent, canActivate: [authGuard]},
        ]
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsuariosRoutingModule {
  // This class is empty, but it is used to define the routing for the Usuarios module.
  // The routing configuration is defined in the routes array, which is imported into the RouterModule.
  // The RouterModule is then exported so that it can be used in other parts of the application.
}