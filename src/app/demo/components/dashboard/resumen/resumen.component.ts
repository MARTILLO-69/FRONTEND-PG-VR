import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';
import { DashboardService } from 'src/app/demo/service/dashboard.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { debounceTime, Subscription } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Chart } from 'chart.js';
import { MenuModule } from 'primeng/menu';
import { TimelineModule } from 'primeng/timeline';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule, ChartModule, FormsModule, ReactiveFormsModule, MenuModule, TimelineModule, ToolbarModule],
  templateUrl: './resumen.component.html',
  styleUrls: ['./resumen.component.scss']
})
export class ResumenComponent implements OnInit {

  rol: string = '';
  usuarioId: number = 0;
  estudianteId: number = 0;
  items!: MenuItem[];
  chartData: any;
  chartOptions: any;
  subscription!: Subscription;

  avancePorParalelo: any[] = [];
  ultimasActividades: any[] = [];

  ultimasEntregas: any[] = [];

  nivelActual: string = '';
  porcentajeTotal: number = 0;


  paraleloCount!: number;
  estudiantesCount!: number;
  profesoresCount!: number;
  materiaCount!: number;

  nombreUsuario: string = '';

  cardsAdmin = [
    { label: 'Paralelos', valueKey: 'paraleloCount', icon: 'pi-microsoft', color: 'indigo', bg: 'blue' },
    { label: 'Estudiantes', valueKey: 'estudiantesCount', icon: 'pi-user', color: 'orange', bg: 'orange' },
    { label: 'Profesores', valueKey: 'profesoresCount', icon: 'pi-user', color: 'orange', bg: 'orange' },
    { label: 'Materias', valueKey: 'materiaCount', icon: 'pi-inbox', color: 'cyan', bg: 'cyan' }
  ];

  cardsProfesor = [
    { label: 'Paralelos', valueKey: 'paraleloCount', icon: 'pi-microsoft', color: 'indigo', bg: 'blue' },
    { label: 'Estudiantes', valueKey: 'estudiantesCount', icon: 'pi-user', color: 'orange', bg: 'orange' }
  ];

  constructor(
    private api: DashboardService,
    public layoutService: LayoutService,
    private messageService: MessageService
  ) {}


  ngOnInit() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.nombreUsuario = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
    console.log('Nombre completo cargado:', this.nombreUsuario);

    this.initChart();
    this.rol = localStorage.getItem('rol') || '';
    this.usuarioId = +localStorage.getItem('usuario_id')!;
    this.estudianteId = usuario.estudiante_id || 0;

    if (this.rol === 'administrador') {
      this.cargarGraficoAdmin();

      this.api.getAvancePorNivelYParalelo().subscribe({
        next: (res) => this.avancePorParalelo = res,
        error: (err) => console.error('Error al obtener avance', err)
      });

      this.api.getUltimasActividadesAdmin().subscribe({
        next: (res) => {
          this.ultimasActividades = res.map((item: any) => ({
            status: item.actividad_nombre,
            date: item.fecha_fin ? new Date(item.fecha_fin).toLocaleDateString() : 'Sin fecha',
            icon: 'pi pi-book',
            paralelo: item.paralelo,
            estudiante: item.nombre_estudiante,
            color: '#2196F3'
          }));
        },
        error: (err) => console.error('Error al cargar actividades', err)
      });

      this.centralizarConteo('paralelo');
      this.centralizarConteo('estudiantes');
      this.centralizarConteo('profesores');
      this.centralizarConteo('materia');
    }

    if (this.rol === 'profesor') {
      this.centralizarConteo('paralelo');
      this.centralizarConteo('estudiantes');

      this.api.getAvanceGeneral().subscribe({
        next: (res) => this.avancePorParalelo = res,
        error: (err) => console.error('Error al obtener avance por nivel', err)
      });

      this.api.getUltimasEntregasProfesor(this.usuarioId).subscribe({
        next: (res) => this.ultimasEntregas = res,
        error: (err) => console.error('Error al cargar entregas del profesor', err)
      });
    }

    if (this.rol === 'estudiante') {
      console.log('ID del estudiante:', this.estudianteId);

      this.api.getResumenEstudiante(this.estudianteId).subscribe(data => {
        if (data && data.length > 0) {
          const resumen = data[0];
          this.nivelActual = resumen.nivel_actual;
          this.porcentajeTotal = parseFloat(resumen.porcentaje_total);
        } else {
          this.nivelActual = 'Nivel no encontrado';
          this.porcentajeTotal = 0;
        }
      }, error => {
        console.error('Error al cargar resumen del estudiante:', error);
      });

      // ⬅️ AÑADE ESTO
      this.api.getActividadesEstudiante(this.estudianteId).subscribe(data => {
        this.ultimasActividades = data.map((a: any) => ({
          actividad: a.actividad_nombre,
          nivel: a.nivel_nombre,
          puntaje: a.puntaje_obtenido,
          fecha: a.fecha_fin ? new Date(a.fecha_fin).toLocaleDateString() : 'Sin fecha'
        }));
      }, err => {
        console.error('Error al cargar actividades del estudiante:', err);
      });
    }

    // Actualización del gráfico al cambiar tema
    this.subscription = this.layoutService.configUpdate$
      .pipe(debounceTime(25))
      .subscribe(() => this.initChart());
  }

  initChart() {}


  centralizarConteo(tipo: 'paralelo' | 'estudiantes' | 'profesores' | 'materia') {
    let servicio;

    switch (tipo) {
      case 'paralelo': servicio = this.api.countParalelo(); break;
      case 'estudiantes': servicio = this.api.countEstudiantes(); break;
      case 'profesores': servicio = this.api.countProfesores(); break;
      case 'materia': servicio = this.api.countMaterias(); break;
    }

    servicio.subscribe(
      (resp: any[]) => {
        const valor = resp[0] || {};
        if (tipo === 'paralelo') this.paraleloCount = valor.contar_paralelos_registrados || 0;
        if (tipo === 'estudiantes') this.estudiantesCount = valor.contar_usuarios_estudiantes || 0;
        if (tipo === 'profesores') this.profesoresCount = valor.contar_usuarios_profesores || 0;
        if (tipo === 'materia') this.materiaCount = valor.contar_materias_activas || 0;
      },
      (error) => console.error(`Error al contar ${tipo}`, error)
    );
  }

  cargarGraficoAdmin() {
    this.api.getAvanceGeneral().subscribe(data => {
      this.chartData = {
        labels: data.map((d: any) => d.nivel_nombre),
        datasets: [
          {
            label: 'Promedio de Avance (%)',
            data: data.map((d: any) => +d.promedio_avance),
            backgroundColor: '#42A5F5',
            borderColor: '#1E88E5',
            fill: false
          }
        ]
      };
      this.initChartOptions();
    });
  }

  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false }
        },
        y: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false }
        }
      }
    };
  }
}