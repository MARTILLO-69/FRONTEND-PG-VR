import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from 'src/app/demo/guards/auth.guard';
import { ActividadesComponent } from './actividades.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { MenuModule } from 'primeng/menu';
import { TableModule } from 'primeng/table';
import { StyleClassModule } from 'primeng/styleclass';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ButtonModule } from 'primeng/button';
import { ActividadesRoutingModule } from './actividades-routing.module';

const routes: Routes = [
  {
    path: 'progreso',
    canActivate: [authGuard],
    loadComponent: () => import('./progreso/progreso.component').then(m => m.ProgresoComponent)
  },
  {
    path: 'realizadas',
    canActivate: [authGuard],
    loadComponent: () => import('./realizadas/realizadas.component').then(m => m.RealizadasComponent)
  }
];

@NgModule({
  imports: [
        CommonModule,
        FormsModule,
        ChartModule,
        MenuModule,
        TableModule,
        StyleClassModule,
        PanelMenuModule,
        ButtonModule,
        ActividadesRoutingModule
    ],
  declarations: [ActividadesComponent,],
})
export class ActividadesModule {}
