import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { MenuModule } from "primeng/menu";
import { PanelMenuModule } from "primeng/panelmenu";
import { StyleClassModule } from "primeng/styleclass";
import { TableModule } from "primeng/table";
import { UsuariosComponent } from "./usuarios.component";
import { UsuariosRoutingModule } from "./usuarios-routing.module";
import { PasswordModule } from "primeng/password";
import { TabViewModule } from "primeng/tabview";
import { EstudiantesComponent } from "./estudiantes/estudiantes.component";




@NgModule({
  imports: [
        CommonModule,
        FormsModule,
        ChartModule,
        MenuModule,
        TableModule,
        StyleClassModule,
        PanelMenuModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        PasswordModule,
        TabViewModule,
        UsuariosRoutingModule
    ],
  declarations: [UsuariosComponent],
})
export class UsuariosModule {}