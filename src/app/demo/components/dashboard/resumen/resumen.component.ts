import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

/* 🔹 PrimeNG */
import { ChartModule } from 'primeng/chart';
import { MenuModule } from 'primeng/menu';
import { ToolbarModule } from 'primeng/toolbar';
import { StepsModule } from 'primeng/steps';
import { AccordionModule } from 'primeng/accordion';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { MenuItem, MessageService } from 'primeng/api';

/* 🔹 Formularios */
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/* 🔹 Servicios */
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { DashboardService } from 'src/app/demo/service/dashboard.service';
import { debounceTime, Subscription } from 'rxjs';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    MenuModule,
    ToolbarModule,
    StepsModule,
    AccordionModule,
    ProgressBarModule,
    DividerModule,
    TagModule,
    TimelineModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './resumen.component.html',
  styleUrls: ['./resumen.component.scss']
})
export class ResumenComponent implements OnInit, OnDestroy {

  /* ============================
     📌 VARIABLES GENERALES
  ============================ */
  rol: string = '';
  usuarioId: number = 0;
  estudianteId: number = 0;
  nombreUsuario: string = '';

  subscription!: Subscription;

  /* ============================
     📊 ADMINISTRADOR / PROFESOR
  ============================ */
  chartData: any;
  chartOptions: any;

  avancePorParalelo: any[] = [];
  ultimasActividades: any[] = [];
  ultimasEntregas: any[] = [];

  paraleloCount!: number;
  estudiantesCount!: number;
  profesoresCount!: number;
  materiaCount!: number;

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

  /* ============================
     🎓 ESTUDIANTE (nuevo diseño)
  ============================ */
  studentSteps: MenuItem[] = [
    { label: 'Resumen', icon: 'pi pi-chart-line', command: () => (this.activeStep = 0) },
    { label: 'Actividades', icon: 'pi pi-list-check', command: () => (this.activeStep = 1) },
    { label: 'Por nivel', icon: 'pi pi-sitemap', command: () => (this.activeStep = 2) }
  ];
  activeStep = 0;

  nivelActual: string = '';
  porcentajeTotal: number = 0;
  ultimasActividadesEstudiante: Array<{ actividad: string; nivel: string; puntaje: number; fecha: string }> = [];
  actividadesPorNivel: Array<{
    nivel: string;
    items: { actividad: string; puntaje: number; fecha: string }[];
    promedioPuntaje: number;
  }> = [];

  /* ============================
     🔧 CONSTRUCTOR
  ============================ */
  constructor(
    private api: DashboardService,
    public layoutService: LayoutService,
    private messageService: MessageService
  ) {}

  /* ============================
     🚀 ON INIT
  ============================ */
  ngOnInit(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.nombreUsuario = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
    this.rol = localStorage.getItem('rol') || '';
    this.usuarioId = +(localStorage.getItem('usuario_id') || 0);
    this.estudianteId = usuario.estudiante_id || 0;

    this.subscription = this.layoutService.configUpdate$
      .pipe(debounceTime(25))
      .subscribe(() => this.initChart());

    /* === Roles === */
    if (this.rol === 'administrador') this.inicializarAdministrador();
    if (this.rol === 'profesor') this.inicializarProfesor();
    if (this.rol === 'estudiante') this.inicializarEstudiante();
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  /* ==============================================================
     🧩 ADMINISTRADOR
  ============================================================== */
  private inicializarAdministrador(): void {
    this.cargarGraficoAdmin();

    this.api.getAvancePorNivelYParalelo().subscribe({
      next: (res) => (this.avancePorParalelo = res),
      error: (err) => console.error('Error al obtener avance', err)
    });

    this.api.getUltimasActividadesAdmin().subscribe({
      next: (res) =>
        (this.ultimasActividades = res.map((item: any) => ({
          status: item.actividad_nombre,
          date: item.fecha_fin ? new Date(item.fecha_fin).toLocaleDateString() : 'Sin fecha',
          icon: 'pi pi-book',
          paralelo: item.paralelo,
          estudiante: item.nombre_estudiante,
          color: '#2196F3'
        }))),
      error: (err) => console.error('Error al cargar actividades', err)
    });

    this.centralizarConteo('paralelo');
    this.centralizarConteo('estudiantes');
    this.centralizarConteo('profesores');
    this.centralizarConteo('materia');
  }

  /* ==============================================================
     👨‍🏫 PROFESOR
  ============================================================== */
  private inicializarProfesor(): void {
    this.centralizarConteo('paralelo');
    this.centralizarConteo('estudiantes');

    this.api.getAvanceGeneral().subscribe({
      next: (res) => (this.avancePorParalelo = res),
      error: (err) => console.error('Error al obtener avance por nivel', err)
    });

    this.api.getUltimasEntregasProfesor(this.usuarioId).subscribe({
      next: (res) => (this.ultimasEntregas = res),
      error: (err) => console.error('Error al cargar entregas del profesor', err)
    });
  }

  /* ==============================================================
     🎓 ESTUDIANTE (nuevo diseño)
  ============================================================== */
  private inicializarEstudiante(): void {
    this.cargarResumenEstudiante();
    this.cargarActividadesEstudiante();
  }

  private cargarResumenEstudiante(): void {
    this.api.getResumenEstudiante(this.estudianteId).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const resumen = data[0];
          this.nivelActual = resumen.nivel_actual || 'Nivel no definido';
          this.porcentajeTotal = parseFloat(resumen.porcentaje_total || 0);
        } else {
          this.nivelActual = 'Nivel no encontrado';
          this.porcentajeTotal = 0;
        }
      },
      error: (err) => console.error('Error al cargar resumen del estudiante:', err)
    });
  }

  private cargarActividadesEstudiante(): void {
    this.api.getActividadesEstudiante(this.estudianteId).subscribe({
      next: (data) => {
        this.ultimasActividadesEstudiante = (data || []).map((a: any) => ({
          actividad: a.actividad_nombre,
          nivel: a.nivel_nombre,
          puntaje: Number(a.puntaje_obtenido ?? 0),
          fecha: a.fecha_fin ? new Date(a.fecha_fin).toLocaleDateString() : 'Sin fecha'
        }));

        this.construirAgrupacionPorNivel();
      },
      error: (err) => console.error('Error al cargar actividades del estudiante:', err)
    });
  }

  private construirAgrupacionPorNivel(): void {
    const map = new Map<string, { actividad: string; puntaje: number; fecha: string }[]>();

    for (const a of this.ultimasActividadesEstudiante) {
      if (!map.has(a.nivel)) map.set(a.nivel, []);
      map.get(a.nivel)!.push({ actividad: a.actividad, puntaje: a.puntaje, fecha: a.fecha });
    }

    this.actividadesPorNivel = Array.from(map.entries()).map(([nivel, items]) => {
      const promedio = items.length
        ? items.reduce((acc, it) => acc + (Number(it.puntaje) || 0), 0) / items.length
        : 0;
      return { nivel, items, promedioPuntaje: promedio };
    });

    this.actividadesPorNivel.sort((a, b) => a.nivel.localeCompare(b.nivel));
  }

  /* ==============================================================
     📊 FUNCIONES COMPARTIDAS
  ============================================================== */

  initChart() {}

  cargarGraficoAdmin() {
    this.api.getAvanceGeneral().subscribe((data) => {
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
        legend: { labels: { color: textColor } }
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

  /* ==============================================================
     🔢 CONTEOS GLOBALES
  ============================================================== */
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
}
