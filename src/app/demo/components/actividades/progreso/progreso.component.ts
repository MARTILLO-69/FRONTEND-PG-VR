import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { RippleModule } from 'primeng/ripple';
import { SliderModule } from 'primeng/slider';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToolbarModule } from 'primeng/toolbar';
import { ReporteService } from 'src/app/demo/service/reporte.service';


@Component({
  selector: 'app-progreso',
  standalone: true,
  imports: [CommonModule,
        ToolbarModule,
        FormsModule,
        TableModule,
        ButtonModule,
        SliderModule,
        InputTextModule,
        ToggleButtonModule,
        RippleModule,
        MultiSelectModule,
        DropdownModule,
        ProgressBarModule,
        ToastModule,
        DialogModule,
        CalendarModule,
        InputTextareaModule,
    ],
  templateUrl: './progreso.component.html',
  styleUrl: './progreso.component.scss'
})

export class ProgresoComponent implements OnInit {

    estudiantes: any[] = [];

    dialogVisible: boolean = false;
    estudianteSeleccionado: any = null;
    fechaInicio!: Date;
    fechaFin!: Date;
    observaciones: string = '';

    // 🔹 Reporte general por paralelo
    dialogParaleloVisible: boolean = false;
    fechaInicioParalelo!: Date;
    fechaFinParalelo!: Date;
    observacionesParalelo: string = '';

    @ViewChild('filter') filter!: ElementRef;

    constructor(private reporteService : ReporteService) { }

    ngOnInit() {
        this.reporteService.getAvanceEstudiantes().subscribe(data => {
            this.estudiantes = data.filter(e => e && e.nombre && e.apellido);
            console.log('Estudiantes cargados:', data);
        });
        
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    abrirDialogo(estudiante: any) {
        this.estudianteSeleccionado = estudiante;
        this.fechaInicio = null;
        this.fechaFin = null;
        this.observaciones = '';
        this.dialogVisible = true;
    }

    generarReporte() {
    this.reporteService.generarReporteAvance(
        this.estudianteSeleccionado.usuario_id,
        this.fechaInicio,
        this.fechaFin,
        this.observaciones
    );
        this.dialogVisible = false;
    }

    abrirDialogoParalelo() {
        this.fechaInicioParalelo = null!;
        this.fechaFinParalelo = null!;
        this.observacionesParalelo = '';
        this.dialogParaleloVisible = true;
    }

    generarReportePorParalelo() {
        this.reporteService.generarReportePorParalelo(
        this.fechaInicioParalelo,
        this.fechaFinParalelo,
        this.observacionesParalelo
        );
        this.dialogParaleloVisible = false;
    }

    formatDateToString(date: Date): string {
        return date.toISOString().split('T')[0]; // devuelve 'YYYY-MM-DD'
    }

}


