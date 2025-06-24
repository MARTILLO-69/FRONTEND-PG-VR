import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { SplitButtonModule } from 'primeng/splitbutton';
import { AccordionModule } from 'primeng/accordion';
import { TabViewModule } from 'primeng/tabview';
import { FieldsetModule } from 'primeng/fieldset';
import { MenuModule } from 'primeng/menu';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { SplitterModule } from 'primeng/splitter';
import { PanelModule } from 'primeng/panel';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { PreguntasService } from 'src/app/demo/service/preguntas.service';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'app-realizadas',
  standalone: true,
  imports: [CommonModule,
      FormsModule,
      ReactiveFormsModule,
      DropdownModule,
      DialogModule,
      CheckboxModule,
      InputTextModule,
      ToolbarModule,
      ButtonModule,
      RippleModule,
      SplitButtonModule,
      AccordionModule,
      TabViewModule,
      FieldsetModule,
      MenuModule,
      InputTextModule,
      DividerModule,
      SplitterModule,
      PanelModule,
      ToastModule,
      TableModule,
      TagModule,
      ConfirmDialogModule,
      InputTextareaModule,
    ],
  templateUrl: './realizadas.component.html',
  styleUrl: './realizadas.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class RealizadasComponent implements OnInit {

  actividadesPermitidasPorNivel: { [key: number]: number[] } = {
    1: [], // vacío = todas las del nivel 1 están permitidas
    2: [2, 3],
    3: [7] // por ejemplo, puedes ajustar esto luego
  };

  dialogCrearVisible: boolean = false;
  todasLasActividades: any[] = []; // todas
  actividades: any[] = [];  
  niveles: any[] = [];

  editandoPreguntaId: number | null = null;

  tiposPregunta = [
    { label: 'Opción Múltiple', value: 'opcion_multiple' },
    { label: 'Falso/Verdadero', value: 'falso_verdadero' },
    { label: 'Acertijo', value: 'acertijo' }
  ];

  nivelesDificultad = [
    { label: 'Baja', value: 'B' },
    { label: 'Media', value: 'M' },
    { label: 'Alta', value: 'A' }
  ];

  constructor(
    private preguntasService: PreguntasService, 
    private fb: FormBuilder, 
    private messageService: MessageService,
    private confirmationService: ConfirmationService ) {}

  preguntasNivel1: any[] = [];
  preguntasNivel2: any[] = [];
  preguntasNivel3: any[] = [];

  nivel3Acertijo = 0;
  nivel3Lleno = false;
  nivel2FalsoVerdadero = 0;
  nivel2Acertijo = 0;
  nivel2Lleno = false;
  nivel1Lleno = false;

  formularioPregunta: FormGroup = this.fb.group({
    nivel_id: [null, Validators.required], // solo frontend
    actividad_id: [null, Validators.required], // esto sí va al SP
    enunciado: ['', Validators.required],
    tipo_pregunta: [null, Validators.required],
    nivel_dificultad: [null, Validators.required],
    respuestas: this.fb.array([]),
  });

  get respuestas(): FormArray {
    return this.formularioPregunta.get('respuestas') as FormArray;
  }

  ngOnInit(): void {
    this.cargarPreguntas();
    this.preguntasService.listarPreguntasSimples().subscribe(data => {

      const map1 = new Map();
      const map2 = new Map();
      const map3 = new Map();

      data.forEach(item => {
        let targetMap: Map<number, any>;

        if (item.nivel_id == 1) targetMap = map1;
        else if (item.nivel_id == 2) targetMap = map2;
        else if (item.nivel_id == 3) targetMap = map3;
        else return;

        if (!targetMap.has(item.pregunta_id)) {
          targetMap.set(item.pregunta_id, {
            pregunta_id: item.pregunta_id,
            enunciado: item.enunciado,
            tipo_pregunta: item.tipo_pregunta,
            nivel_dificultad: item.nivel_dificultad,
            actividad: item.nombre_actividad,
            respuestas: []
          });
        }

        targetMap.get(item.pregunta_id).respuestas.push({
          respuesta_id: item.respuesta_id,
          texto_respuesta: item.texto_respuesta,
          es_correcta: item.es_correcta
        });
      });

      this.preguntasNivel1 = Array.from(map1.values());
      this.preguntasNivel2 = Array.from(map2.values());
      this.preguntasNivel3 = Array.from(map3.values());

      console.log('Preguntas nivel 1:', Array.from(map1.values()));
      console.log('Preguntas nivel 2:', Array.from(map2.values()));
      console.log('Preguntas nivel 3:', Array.from(map3.values()));

    });
    this.preguntasService.listarActividades().subscribe(data => {
      this.todasLasActividades = data;

      this.formularioPregunta.get('nivel_id')?.valueChanges.subscribe(nivelId => {
        this.actividades = this.todasLasActividades.filter(a => {
          if (a.nivel_id !== nivelId) return false;

          const permitidas = this.actividadesPermitidasPorNivel[nivelId];

          // Si no se definieron restricciones para el nivel, dejar todas las del nivel
          if (!permitidas || permitidas.length === 0) return true;

          // Solo permitir las actividades cuyo ID esté en la lista
          return permitidas.includes(a.actividad_id);
        });
        this.formularioPregunta.get('actividad_id')?.setValue(null); // Limpia selección previa
        this.filtrarTiposPreguntaPorNivel(nivelId); 
      });
    });
    this.formularioPregunta.get('tipo_pregunta')?.valueChanges.subscribe(tipo => {
      this.onTipoPreguntaChange(tipo);
    });
    this.cargarPreguntas();

    this.preguntasService.listarActividades().subscribe(data => {
      this.todasLasActividades = data;

      this.formularioPregunta.get('nivel_id')?.valueChanges.subscribe(nivelId => {
        this.actividades = this.todasLasActividades.filter(a => {
          if (a.nivel_id !== nivelId) return false;

          const permitidas = this.actividadesPermitidasPorNivel[nivelId];

          // Si no se definieron restricciones para el nivel, dejar todas las del nivel
          if (!permitidas || permitidas.length === 0) return true;

          // Solo permitir las actividades cuyo ID esté en la lista
          return permitidas.includes(a.actividad_id);
        });
        this.formularioPregunta.get('actividad_id')?.setValue(null);
        this.filtrarTiposPreguntaPorNivel(nivelId); 
      });
    });

    this.formularioPregunta.get('tipo_pregunta')?.valueChanges.subscribe(tipo => {
      this.onTipoPreguntaChange(tipo);

      const nivel = this.formularioPregunta.get('nivel_id')?.value;
      if (nivel === 1 && tipo !== 'opcion_multiple') {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'Para el Nivel 1 solo se permiten preguntas de tipo Opción Múltiple'
        });
      }
      if (nivel === 2 && tipo === 'opcion_multiple') {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'En el Nivel 2 no se permiten preguntas de tipo Opción Múltiple'
        });
        return;
      }
    });
  }

  filtrarTiposPreguntaPorNivel(nivelId: number) {
    if (nivelId === 2) {
      this.tiposPregunta = [
        { label: 'Falso/Verdadero', value: 'falso_verdadero' },
        { label: 'Acertijo', value: 'acertijo' }
      ];
    } else if (nivelId === 3) {
      this.tiposPregunta = [
        { label: 'Acertijo', value: 'acertijo' }
      ];
    } else {
      this.tiposPregunta = [
        { label: 'Opción Múltiple', value: 'opcion_multiple' },
        { label: 'Falso/Verdadero', value: 'falso_verdadero' },
        { label: 'Acertijo', value: 'acertijo' }
      ];
    }

    this.formularioPregunta.get('tipo_pregunta')?.setValue(null);
  }

  abrirDialogoEditar(pregunta: any) {
    this.dialogCrearVisible = true;
    this.editandoPreguntaId = pregunta.pregunta_id;

    // Quitar validadores
    this.formularioPregunta.get('nivel_id')?.clearValidators();
    this.formularioPregunta.get('actividad_id')?.clearValidators();
    this.formularioPregunta.get('nivel_id')?.updateValueAndValidity();
    this.formularioPregunta.get('actividad_id')?.updateValueAndValidity();

    this.formularioPregunta.get('nivel_id')?.setValue(pregunta.nivel_id);
    this.actividades = this.todasLasActividades.filter(a => a.nivel_id === pregunta.nivel_id);
    this.formularioPregunta.patchValue({
      actividad_id: pregunta.actividad_id,
      enunciado: pregunta.enunciado,
      tipo_pregunta: pregunta.tipo_pregunta,
      nivel_dificultad: pregunta.nivel_dificultad,
    });

    this.respuestas.clear();
    pregunta.respuestas.forEach((r: any) => {
      this.respuestas.push(this.fb.group({
        texto: [r.texto_respuesta, Validators.required],
        es_correcta: [r.es_correcta]
      }));
    });
  }


  confirmarEliminar(pregunta: any) {
    this.confirmationService.confirm({
      key: 'confirmarEliminar',
      message: '¿Estás seguro de que deseas eliminar esta pregunta?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.preguntasService.eliminarPregunta(pregunta.pregunta_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Pregunta eliminada',
              detail: 'La pregunta fue marcada como inactiva.'
            });
            this.cargarPreguntas();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la pregunta'
            });
            console.error(err);
          }
        });
      }
    });
  }


  //funciones para el manejor de informacion de las preguntas
  abrirDialogoCrear() {
    this.dialogCrearVisible = true;
    this.editandoPreguntaId = null;

    this.formularioPregunta.reset();
    this.respuestas.clear();

    // Restaurar validadores
    this.formularioPregunta.get('nivel_id')?.setValidators(Validators.required);
    this.formularioPregunta.get('actividad_id')?.setValidators(Validators.required);
    this.formularioPregunta.get('nivel_id')?.updateValueAndValidity();
    this.formularioPregunta.get('actividad_id')?.updateValueAndValidity();

    // 🔔 Mostrar advertencia según estado
    let faltantesNivel1 = 13 - this.preguntasNivel1.length;
    let faltantesNivel2 = 6 - (this.nivel2FalsoVerdadero + this.nivel2Acertijo);
    let faltantesNivel3 = 4 - this.nivel3Acertijo;

    if (faltantesNivel1 > 0 || faltantesNivel2 > 0 || faltantesNivel3 > 0) {
      let mensaje = '';

      if (faltantesNivel1 > 0) mensaje += `${faltantesNivel1} en Nivel 1`;
      if (faltantesNivel2 > 0) {
        if (mensaje) mensaje += ' y ';
        mensaje += `${faltantesNivel2} en Nivel 2`;
      }
      if (faltantesNivel3 > 0) {
        if (mensaje) mensaje += ' y ';
        mensaje += `${faltantesNivel3} en Nivel 3`;
      }

      this.messageService.add({
        severity: 'warn',
        summary: 'Preguntas pendientes',
        detail: `Aún faltan ${mensaje}.`,
        life: 7000
      });
    }
  }

  cerrarDialogo() {
    this.dialogCrearVisible = false;
    this.editandoPreguntaId = null;
    this.formularioPregunta.reset();
    this.respuestas.clear();
  }

  guardarPregunta() {
    const nivelSeleccionado = this.formularioPregunta.get('nivel_id')?.value;
    const tipoSeleccionado = this.formularioPregunta.get('tipo_pregunta')?.value;

    const nivel = this.formularioPregunta.get('nivel_id')?.value;
    const tipo = this.formularioPregunta.get('tipo_pregunta')?.value;

    if (nivel === 1 && tipo !== 'opcion_multiple') {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'En el Nivel 1 solo se permiten preguntas de tipo Opción Múltiple'
      });
      return;
    }

    if (nivelSeleccionado == 2) {
      if (tipoSeleccionado === 'falso_verdadero' && this.nivel2FalsoVerdadero >= 4) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'Ya se registraron 4 preguntas de Falso/Verdadero para Nivel 2.'
        });
        return;
      }
      if (tipoSeleccionado === 'acertijo' && this.nivel2Acertijo >= 2) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'Ya se registraron 2 preguntas de Acertijo para Nivel 2.'
        });
        return;
      }
    }

    if (nivel === 3) {
      if (tipo !== 'acertijo') {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'En el Nivel 3 solo se permiten preguntas de tipo Acertijo'
        });
        return;
      }

      if (this.nivel3Acertijo >= 4 && !this.editandoPreguntaId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'Ya se registraron 4 preguntas de tipo Acertijo en el Nivel 3'
        });
        return;
      }
    }
      
    if (this.formularioPregunta.invalid || !this.validarRespuestas()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Formulario inválido o configuración incorrecta de respuestas'
      });
      return;
    }

    const datos = this.formularioPregunta.value;

    const peticion = this.editandoPreguntaId
        ? this.preguntasService.editarPregunta({
            pregunta_id: this.editandoPreguntaId,
            enunciado: datos.enunciado,
            tipo_pregunta: datos.tipo_pregunta,
            nivel_dificultad: datos.nivel_dificultad,
            respuestas: datos.respuestas
          })
        : this.preguntasService.crearPregunta(datos);

      peticion.subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: this.editandoPreguntaId ? 'Pregunta actualizada' : 'Pregunta registrada exitosamente'
          });
          this.dialogCrearVisible = false;
          this.formularioPregunta.reset();
          this.respuestas.clear();
          this.editandoPreguntaId = null;
          this.cargarPreguntas(); // Recarga todas las preguntas y actualiza reglas
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ocurrió un error al guardar la pregunta'
          });
          console.error(err);
        }
      });
  }


  onTipoPreguntaChange(tipo: string) {
    this.respuestas.clear();

    if (tipo === 'falso_verdadero') {
      this.respuestas.push(this.fb.group({ texto: 'Verdadero', es_correcta: [false] }));
      this.respuestas.push(this.fb.group({ texto: 'Falso', es_correcta: [false] }));
    } else if (tipo === 'opcion_multiple') {
      for (let i = 0; i < 3; i++) {
        this.agregarRespuesta();
      }
    } else if (tipo === 'acertijo') {
      for (let i = 0; i < 9; i++) {
        this.agregarRespuesta();
      }
    }
  }

  agregarRespuesta() {
    this.respuestas.push(this.fb.group({
      texto: ['', Validators.required],
      es_correcta: [false]
    }));
  }

  validarRespuestas(): boolean {
    const tipo = this.formularioPregunta.get('tipo_pregunta')?.value;
    const respuestas = this.respuestas.controls;

    const total = respuestas.length;
    const correctas = respuestas.filter(r => r.get('es_correcta')?.value).length;

    if (tipo === 'opcion_multiple') {
      return total === 3 && correctas === 1;
    }

    if (tipo === 'falso_verdadero') {
      return total === 2 && correctas === 1;
    }

    if (tipo === 'acertijo') {
      return total === 9 && correctas === 3;
    }

    return false;
  }

  cargarPreguntas() {
    this.preguntasService.listarPreguntasSimples().subscribe(data => {
      const map1 = new Map();
      const map2 = new Map();
      const map3 = new Map();

      data.forEach(item => {
        let targetMap: Map<number, any>;

        if (item.nivel_id == 1) targetMap = map1;
        else if (item.nivel_id == 2) targetMap = map2;
        else if (item.nivel_id == 3) targetMap = map3;
        else return;

        if (!targetMap.has(item.pregunta_id)) {
          targetMap.set(item.pregunta_id, {
            pregunta_id: item.pregunta_id,
            enunciado: item.enunciado,
            tipo_pregunta: item.tipo_pregunta,
            nivel_dificultad: item.nivel_dificultad,
            actividad: item.nombre_actividad,
            respuestas: []
          });
        }

        targetMap.get(item.pregunta_id).respuestas.push({
          respuesta_id: item.respuesta_id,
          texto_respuesta: item.texto_respuesta,
          es_correcta: item.es_correcta
        });
      });

      this.preguntasNivel1 = Array.from(map1.values());
      this.preguntasNivel2 = Array.from(map2.values());
      this.preguntasNivel3 = Array.from(map3.values());

      this.nivel1Lleno = this.preguntasNivel1.length >= 13;

      this.nivel2FalsoVerdadero = this.preguntasNivel2.filter(p => p.tipo_pregunta === 'falso_verdadero').length;
      this.nivel2Acertijo = this.preguntasNivel2.filter(p => p.tipo_pregunta === 'acertijo').length;

      this.nivel2Lleno = this.nivel2FalsoVerdadero >= 4 && this.nivel2Acertijo >= 2;

      this.nivel3Acertijo = this.preguntasNivel3.filter(p => p.tipo_pregunta === 'acertijo').length;
      this.nivel3Lleno = this.nivel3Acertijo >= 4;

      this.actualizarNiveles();

    });
  }

  esNivelDeshabilitado(nivel: any): boolean {
    return nivel.disabled === true;
  }

  actualizarNiveles() {
    this.niveles = [
      { nivel_id: 1, nombre: 'Nivel 1', disabled: this.nivel1Lleno },
      { nivel_id: 2, nombre: 'Nivel 2', disabled: this.nivel2Lleno },
      { nivel_id: 3, nombre: 'Nivel 3', disabled: this.nivel3Lleno }
    ];
  }
}
