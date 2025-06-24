import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ActividadesComponent } from "./actividades.component";
import { ProgresoComponent } from "./progreso/progreso.component";
import { authGuard } from "../../guards/auth.guard";
import { RealizadasComponent } from "./realizadas/realizadas.component";

const routes = [
    {
        path: "",
        component: ActividadesComponent,
        children: [
            {path: 'progreso', component: ProgresoComponent, canActivate: [authGuard]},
            {path: 'realizadas', component: RealizadasComponent, canActivate: [authGuard]},
        ]
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActividadesRoutingModule {}
