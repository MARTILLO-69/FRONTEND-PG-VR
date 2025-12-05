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

  nivel1Animal = 0;
  nivel1Vegetal = 0;

  tiposPregunta = [
    { label: 'Definición', value: 'definicion' },
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

  mostrarVistaPrevia: boolean = false;

  formularioPregunta: FormGroup = this.fb.group({
    nivel_id: [null, Validators.required], // solo frontend
    actividad_id: [null, Validators.required], // esto sí va al SP
    enunciado: ['', Validators.required],
    tipo_pregunta: [null, Validators.required],
    nivel_dificultad: [null, Validators.required],
    categoria: [null],
    requiere_orden: [true],
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
        
        // 🔹 Validación dinámica de "categoría"
        const categoriaControl = this.formularioPregunta.get('categoria');
        if (nivelId === 1) {
          categoriaControl?.setValidators([Validators.required]);
        } else {
          categoriaControl?.clearValidators();
          categoriaControl?.setValue(null);
        }
        categoriaControl?.updateValueAndValidity();

        this.mostrarVistaPrevia = nivelId === 1;
      });
    });

    this.formularioPregunta.get('tipo_pregunta')?.valueChanges.subscribe(tipo => {
      this.onTipoPreguntaChange(tipo);

      const nivel = this.formularioPregunta.get('nivel_id')?.value;

      // 🔹 Nueva validación correcta para Nivel 1
      if (nivel === 1 && tipo !== 'definicion') {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'Para el Nivel 1 solo se permiten preguntas de tipo Definición'
        });
      }

      // 🔹 Nivel 2 ya no acepta opción múltiple
      if (nivel === 2 && tipo === 'definicion') {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'En el Nivel 2 no se permiten preguntas de tipo Definicion'
        });
        return;
      }
    });

    // 🔹 Recalcular orden cuando cambia la dificultad
    this.formularioPregunta.get('nivel_dificultad')?.valueChanges.subscribe(dificultad => {
      if (!this.editandoPreguntaId) return; // solo aplica cuando se está editando

      let respuestasProcesadas = [...this.respuestas.value];

      switch (dificultad) {
        case 'B': // 🟢 Baja → limpiar orden
          respuestasProcesadas = respuestasProcesadas.map(r => ({
            ...r,
            orden: null
          }));
          break;

        case 'M': // 🟡 Media → semi-aleatorio (1,2,3,4,5,6,...)
          respuestasProcesadas = this.semiShuffleArray(respuestasProcesadas).map((r, i) => ({
            ...r,
            orden: i + 1
          }));
          break;

        case 'A': // 🔴 Alta → secuencial solo correctas
          let contador = 1;
          respuestasProcesadas = respuestasProcesadas.map(r => {
            if (r.es_correcta) {
              return { ...r, orden: contador++ };
            } else {
              return { ...r, orden: null };
            }
          });
          break;
      }

      // 🔸 Actualizar el formArray directamente
      this.respuestas.clear();
      respuestasProcesadas.forEach(r => {
        this.respuestas.push(this.fb.group({
          texto: [r.texto, Validators.required],
          es_correcta: [r.es_correcta],
          orden: [r.orden]
        }));
      });

      console.log('🧩 Recalculado orden por cambio de dificultad:', this.respuestas.value);
    });
  }

  filtrarTiposPreguntaPorNivel(nivelId: number) {
    if (nivelId === 1) {
      // 🔹 Nivel 1 solo usa “Definición”
      this.tiposPregunta = [{ label: 'Definición', value: 'definicion' }];
    } else if (nivelId === 2) {
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
        { label: 'Definición', value: 'definicion' },
        { label: 'Falso/Verdadero', value: 'falso_verdadero' },
        { label: 'Acertijo', value: 'acertijo' }
      ];
    }

    this.formularioPregunta.get('tipo_pregunta')?.setValue(null);
  }

  abrirDialogoEditar(pregunta: any) {
    this.dialogCrearVisible = true;
    this.editandoPreguntaId = pregunta.pregunta_id;
    this.ordenSeleccionActual = 1;

    // Quitar validadores de nivel y actividad (ya fijos)
    this.formularioPregunta.get('nivel_id')?.clearValidators();
    this.formularioPregunta.get('actividad_id')?.clearValidators();
    this.formularioPregunta.get('nivel_id')?.updateValueAndValidity();
    this.formularioPregunta.get('actividad_id')?.updateValueAndValidity();

    // Establecer nivel y cargar actividades correspondientes
    this.formularioPregunta.get('nivel_id')?.setValue(pregunta.nivel_id);
    this.mostrarVistaPrevia = pregunta.nivel_id === 1;
    this.actividades = this.todasLasActividades.filter(a => a.nivel_id === pregunta.nivel_id);

    // 🟢 Configurar categoría visible solo para nivel 1
    const categoriaControl = this.formularioPregunta.get('categoria');
    if (pregunta.nivel_id === 1) categoriaControl?.setValidators([Validators.required]);
    else categoriaControl?.clearValidators();
    categoriaControl?.updateValueAndValidity();


    // Rellenar formulario
    this.formularioPregunta.patchValue({
      actividad_id: pregunta.actividad_id,
      enunciado: pregunta.enunciado,
      tipo_pregunta: pregunta.tipo_pregunta,
      nivel_dificultad: pregunta.nivel_dificultad,
      categoria: pregunta.categoria || null,
      requiere_orden: pregunta.requiere_orden ?? true // ✅
    });

    // 🔹 Cargar respuestas
    this.respuestas.clear();
    pregunta.respuestas.forEach((r: any) => {
      this.respuestas.push(this.fb.group({
        texto: [r.texto_respuesta, Validators.required],
        es_correcta: [r.es_correcta],
        orden: [r.orden ?? null]
      }));
    });

    // Reiniciar el contador al máximo orden actual
    const maxOrden = Math.max(...pregunta.respuestas.map((r: any) => r.orden || 0));
    this.ordenSeleccionActual = maxOrden > 0 ? maxOrden + 1 : 1;
  }

  get vistaPrevia(): string {
    const texto = this.formularioPregunta.get('enunciado')?.value || '';
    if (!texto.trim()) return '— Sin contenido —';
    return texto.replace(/\{(\d+)\}/g, "<span style='color:#888;font-weight:bold;'>[____]</span>");
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

  ordenSeleccionActual = 1; // Contador global del orden de selección

  actualizarOrdenRespuesta(index: number, event: any) {
    const respuestasArray = this.respuestas;
    const respuestaControl = respuestasArray.at(index);

    // Si se seleccionó (true)
    if (event.checked) {
      respuestaControl.patchValue({ orden: this.ordenSeleccionActual });
      this.ordenSeleccionActual++;
    } else {
      // Si se desmarca, eliminar su orden
      respuestaControl.patchValue({ orden: null });

      // 🔹 Reordenar las demás correctas
      const correctas = respuestasArray.controls
        .filter(r => r.value.es_correcta)
        .sort((a, b) => (a.value.orden ?? 0) - (b.value.orden ?? 0));

      correctas.forEach((r, idx) => {
        r.patchValue({ orden: idx + 1 }, { emitEvent: false });
      });

      this.ordenSeleccionActual = correctas.length + 1;
    }

    console.log('Orden actualizado:', this.respuestas.value.map(r => r.orden));
  }



  //funciones para el manejor de informacion de las preguntas
  abrirDialogoCrear() {
    this.dialogCrearVisible = true;
    this.editandoPreguntaId = null;
    this.ordenSeleccionActual = 1;

    this.formularioPregunta.reset();
    this.respuestas.clear();

    // Restaurar validadores
    this.formularioPregunta.get('nivel_id')?.setValidators(Validators.required);
    this.formularioPregunta.get('actividad_id')?.setValidators(Validators.required);
    this.formularioPregunta.get('nivel_id')?.updateValueAndValidity();
    this.formularioPregunta.get('actividad_id')?.updateValueAndValidity();

    // 🔔 Mostrar advertencia según estado
    let faltantesNivel1 = 40 - this.preguntasNivel1.length;
    const faltantesFV = Math.max(0, 12 - this.nivel2FalsoVerdadero);
    const faltantesAcertijo = Math.max(0, 8 - this.nivel2Acertijo);
    let faltantesNivel2 = faltantesFV + faltantesAcertijo;
    let faltantesNivel3 = 12 - this.nivel3Acertijo;

    if (faltantesNivel1 > 0 || faltantesNivel2 > 0 || faltantesNivel3 > 0) {
      let mensaje = '';

      if (faltantesNivel1 > 0) mensaje += `${faltantesNivel1} en Nivel 1`;
      if (faltantesNivel2 > 0) {
        if (mensaje) mensaje += ' y ';
        mensaje += `${faltantesNivel2} en Nivel 2 (F/V: ${faltantesFV}, Acertijo: ${faltantesAcertijo})`;
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
    const nivel = this.formularioPregunta.get('nivel_id')?.value;
    const tipo = this.formularioPregunta.get('tipo_pregunta')?.value;
    const dificultad = this.formularioPregunta.get('nivel_dificultad')?.value;
    let enunciado = this.formularioPregunta.get('enunciado')?.value;

    // 🧩 Conversión automática de "______" → "{1}", "{2}", etc.
    if (enunciado.includes("______")) {
      let contador = 0;
      enunciado = enunciado.replace(/______+/g, () => `{${++contador}}`);
    }

    const placeholders = enunciado.match(/\{\d+\}/g) || [];
    if (placeholders.length > 0) {
      let contador = 0;
      enunciado = enunciado.replace(/\{\d+\}/g, () => `{${++contador}}`);
    }

    this.formularioPregunta.get('enunciado')?.setValue(enunciado);

    // 🔎 Validaciones generales
    if (nivel === 1 && tipo !== 'definicion') {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'En el Nivel 1 solo se permiten preguntas de tipo Definición' });
      return;
    }
    // ✅ Nueva validación para nivel 1 por categoría
    if (nivel === 1) {
      const categoria = this.formularioPregunta.get('categoria')?.value?.toLowerCase();
      if (!categoria) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'Debes seleccionar si la definición corresponde a Célula Animal o Vegetal.'
        });
        return;
      }

      if (categoria === 'animal' && this.nivel1Animal >= 20 && !this.editandoPreguntaId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'Ya se registraron 20 definiciones para la Célula Animal.'
        });
        return;
      }

      if (categoria === 'vegetal' && this.nivel1Vegetal >= 20 && !this.editandoPreguntaId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'Ya se registraron 20 definiciones para la Célula Vegetal.'
        });
        return;
      }
    }


    if (nivel === 2) {
      if (tipo === 'falso_verdadero' && this.nivel2FalsoVerdadero >= 12 && !this.editandoPreguntaId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'Ya se registraron 12 preguntas de Falso/Verdadero para el Nivel 2.'
        });
        return;
      }
      if (tipo === 'acertijo' && this.nivel2Acertijo >= 8 && !this.editandoPreguntaId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'Ya se registraron 8 preguntas de Acertijo para el Nivel 2.'
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
      if (this.nivel3Acertijo >= 12 && !this.editandoPreguntaId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'Ya se registraron 12 preguntas de tipo Acertijo en el Nivel 3.'
        });
        return;
      }
    }


    // 🧩 Validar formulario completo y respuestas
    if (this.formularioPregunta.invalid || !this.validarRespuestas()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Formulario inválido o configuración incorrecta de respuestas' });
      return;
    }

    // =====================================================
    // 🔹 PROCESAR RESPUESTAS SEGÚN DIFICULTAD
    // =====================================================
    let respuestasProcesadas = [...this.respuestas.value];

    switch (dificultad) {
      case 'B': // 🟢 Baja → aleatorio
        respuestasProcesadas = this.shuffleArray(respuestasProcesadas).map(r => ({
          ...r,
          orden: null
        }));
        break;

      case 'M': // 🟡 Media → semi-aleatorio
        respuestasProcesadas = this.semiShuffleArray(respuestasProcesadas).map((r, i) => ({
          ...r,
          orden: i + 1
        }));
        break;

      case 'A': // 🔴 Alta → respetar orden de usuario
        respuestasProcesadas = respuestasProcesadas.map(r => ({
          ...r,
          orden: r.orden || null
        }));
        break;
    }

    this.respuestas.clear();
    respuestasProcesadas.forEach(r => {
      this.respuestas.push(this.fb.group({
        texto: [r.texto, Validators.required],
        es_correcta: [r.es_correcta],
        orden: [r.orden]
      }));
    });

    // =====================================================
    // 🔹 CONSTRUIR PAYLOAD FINAL
    // =====================================================
    const datos = this.formularioPregunta.value;
    const payload = {
      ...datos,
      enunciado,
      requiere_orden: !!this.formularioPregunta.get('requiere_orden')?.value,
      respuestas: respuestasProcesadas.map((r: any, i: number) => ({
        texto: r.texto,
        es_correcta: r.es_correcta,
        orden: r.orden ?? (i + 1)
      }))
    };

    const peticion = this.editandoPreguntaId
      ? this.preguntasService.editarPregunta({ pregunta_id: this.editandoPreguntaId, ...payload })
      : this.preguntasService.crearPregunta(payload);

    peticion.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.editandoPreguntaId ? 'Pregunta actualizada exitosamente' : 'Pregunta registrada exitosamente'
        });
        this.dialogCrearVisible = false;
        this.formularioPregunta.reset();
        this.respuestas.clear();
        this.editandoPreguntaId = null;
        this.cargarPreguntas();
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

    switch (tipo) {
      case 'falso_verdadero':
        this.respuestas.push(this.fb.group({ texto: 'Verdadero', es_correcta: [false] }));
        this.respuestas.push(this.fb.group({ texto: 'Falso', es_correcta: [false] }));
        break;

      case 'definicion':
        for (let i = 0; i < 6; i++) {
          this.agregarRespuesta();
        }
        break;

      case 'acertijo':
        for (let i = 0; i < 9; i++) {
          this.agregarRespuesta();
        }
        break;

      default:
        // Por si queda otro tipo
        this.agregarRespuesta();
    }
  }


  agregarRespuesta() {
    this.respuestas.push(this.fb.group({
      texto: ['', Validators.required],
      es_correcta: [false],
      orden: [null]
    }));
  }

  validarRespuestas(): boolean {
    const tipo = this.formularioPregunta.get('tipo_pregunta')?.value;
    const respuestas = this.respuestas.controls;

    const total = respuestas.length;
    const correctas = respuestas.filter(r => r.get('es_correcta')?.value).length;

    if (tipo === 'falso_verdadero') return total === 2 && correctas === 1;
    if (tipo === 'acertijo') return total === 9 && correctas === 3;
    if (tipo === 'definicion') return total === 6 && correctas >= 2 && correctas <= 3;

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
            nivel_id: item.nivel_id,
            enunciado: item.enunciado,
            tipo_pregunta: item.tipo_pregunta,
            nivel_dificultad: item.nivel_dificultad,
            categoria: item.categoria,
            actividad: item.nombre_actividad,
            requiere_orden: item.requiere_orden,   // 🟢 ← NUEVO
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

      this.nivel1Animal = this.preguntasNivel1.filter(p => p.categoria === 'animal').length;
      this.nivel1Vegetal = this.preguntasNivel1.filter(p => p.categoria === 'vegetal').length;

      // Ahora el nivel 1 se marca lleno solo si ambas categorías alcanzan 20
      this.nivel1Lleno = this.nivel1Animal >= 20 && this.nivel1Vegetal >= 20;

      this.nivel2FalsoVerdadero = this.preguntasNivel2.filter(p => p.tipo_pregunta === 'falso_verdadero').length;
      this.nivel2Acertijo = this.preguntasNivel2.filter(p => p.tipo_pregunta === 'acertijo').length;
      // Nivel 2 se considera “lleno” cuando alcanza 12 FV y 8 acertijo
      this.nivel2Lleno = this.nivel2FalsoVerdadero >= 12 && this.nivel2Acertijo >= 8;

      this.nivel3Acertijo = this.preguntasNivel3.filter(p => p.tipo_pregunta === 'acertijo').length;
      this.nivel3Lleno = this.nivel3Acertijo >= 12;

      this.actualizarNiveles();

    });
  }

  esNivelDeshabilitado(nivel: any): boolean {
    return nivel.disabled === true;
  }

  esTipoNivel2Deshabilitado = (opt: any) => {
    const nivel = this.formularioPregunta.get('nivel_id')?.value;
    if (nivel !== 2) return false; // solo aplica a nivel 2

    if (opt?.value === 'falso_verdadero') return this.nivel2FalsoVerdadero >= 12;
    if (opt?.value === 'acertijo') return this.nivel2Acertijo >= 8;

    return false;
  };

  actualizarNiveles() {
    this.niveles = [
      { nivel_id: 1, nombre: 'Nivel 1', disabled: this.nivel1Lleno },
      { nivel_id: 2, nombre: 'Nivel 2', disabled: this.nivel2Lleno },
      { nivel_id: 3, nombre: 'Nivel 3', disabled: this.nivel3Lleno }
    ];
  }

  // 🔹 Mezcla completamente un array
  shuffleArray(array: any[]): any[] {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  // 🔸 Mezcla parcial (semi-aleatoria)
  semiShuffleArray(array: any[]): any[] {
    const copia = [...array];
    const n = Math.min(2, copia.length - 1); // mezcla 1 o 2 elementos
    for (let i = 0; i < n; i++) {
      const idx1 = Math.floor(Math.random() * copia.length);
      const idx2 = Math.floor(Math.random() * copia.length);
      [copia[idx1], copia[idx2]] = [copia[idx2], copia[idx1]];
    }
    return copia;
  }
}
