import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { PasswordModule } from 'primeng/password';
import { RadioButtonModule } from 'primeng/radiobutton';
import { StyleClassModule } from 'primeng/styleclass';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { ParametricasService } from 'src/app/demo/service/parametricas.service';
import { RegisterService } from 'src/app/demo/service/register.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { Observable } from 'rxjs';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule,
        FormsModule,
        ChartModule,
        MenuModule,
        TableModule,
        StyleClassModule,
        PanelMenuModule,
        FormsModule,
        RadioButtonModule,
        ReactiveFormsModule,
        ButtonModule,
        PasswordModule,
        TabViewModule,
        DialogModule,
        InputTextModule,
        CheckboxModule,
        DropdownModule,
        ToastModule, 
        ConfirmDialogModule],
  templateUrl: './profesores.component.html',
  styleUrl: './profesores.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class ProfesoresComponent implements OnInit{

  registerForm!: FormGroup;
  profesores$!: Observable<any[]>;
  editForm!: FormGroup;
  dialogVisible = false;
  profesorSeleccionado: any = null;
  paralelosDisponibles = ['A', 'B', 'C', 'D'];
  materias = [{ label: 'Biología', value: 1 }];
  paralelosSeleccionadosEdit: string[] = [];

  constructor(
    private apiService: ParametricasService,
    public layoutService: LayoutService,
    private api: RegisterService,
    private routers: Router,
    private accion: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarProfesores();

    // Escucha cambios para generar contraseña automática
    this.registerForm.valueChanges.subscribe((values) => {
      const { nombre, apellido, codigo } = values;
      if (nombre && apellido && codigo) {
        this.generarContrasena();
      }
    });
  }

  initForm() {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      codigo: ['', Validators.required],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      materia_id: [1, Validators.required],
      paralelos: this.fb.array([])
    });

    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      codigo: ['', Validators.required],
      materia_id: [1, Validators.required],
      paralelos: this.fb.array([])
    });
  }

  // ⚙️ Generador automático de contraseñas
  generarContrasena(): void {
    const nombre = this.registerForm.get('nombre')?.value?.trim().toLowerCase() || '';
    const apellido = this.registerForm.get('apellido')?.value?.trim().toLowerCase() || '';
    const codigo = this.registerForm.get('codigo')?.value?.toString() || '';
    const aleatorio = Math.random().toString(36).substring(2, 4).toUpperCase();

    const sugerencia = `${nombre.slice(0, 3)}${apellido.slice(0, 3)}-${codigo}-${aleatorio}`;
    this.registerForm.patchValue({ contrasena: sugerencia }, { emitEvent: false });
  }

  get paralelosEditFormArray(): FormArray {
    return this.editForm.get('paralelos') as FormArray;
  }

  get paralelosFormArray(): FormArray {
    return this.registerForm.get('paralelos') as FormArray;
  }

  abrirDialogoEditar(profesor: any): void {
    this.profesorSeleccionado = profesor;
    this.dialogVisible = true;

    const paralelosArray = profesor.paralelos_asignados
      ? profesor.paralelos_asignados.split(',').map((p) => p.trim())
      : [];

    this.paralelosSeleccionadosEdit = [...paralelosArray];

    const formArray = this.paralelosEditFormArray;
    formArray.clear();
    paralelosArray.forEach((p) => formArray.push(new FormControl(p)));

    this.editForm.patchValue({
      nombre: profesor.nombre,
      apellido: profesor.apellido,
      codigo: profesor.codigo,
      materia_id: 1
    });
  }

  onParaleloChange(nuevosParalelos: string[]): void {
    const formArray = this.paralelosEditFormArray;
    formArray.clear();
    nuevosParalelos.forEach((p) => formArray.push(new FormControl(p)));
  }

  toggleParalelo(event: any, paralelo: string): void {
    if (event.checked) {
      this.paralelosFormArray.push(new FormControl(paralelo));
    } else {
      const index = this.paralelosFormArray.controls.findIndex((c) => c.value === paralelo);
      if (index >= 0) this.paralelosFormArray.removeAt(index);
    }
  }

  cargarProfesores() {
    this.profesores$ = this.apiService.listarProfesores();
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Formulario inválido', detail: 'Completa todos los campos' });
      return;
    }

    const { nombre, apellido, codigo, contrasena, materia_id, paralelos } = this.registerForm.value;

    const asignaciones = paralelos.map((p: string) => ({
      materia_id,
      paralelo: p
    }));

    const payload = {
      nombre,
      apellido,
      codigo,
      contraseña: contrasena, // 👈 backend sigue esperando “contraseña”
      tipo_usuario: 'P',
      asignaciones
    };

    this.api.postRegistrarUsuarios(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Profesor registrado correctamente' });
        this.registerForm.reset();
        this.paralelosFormArray.clear();
        this.cargarProfesores();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el profesor' });
      }
    });
  }

  guardarCambios(): void {
    const datosActualizados = {
      ...this.profesorSeleccionado,
      ...this.editForm.value,
      asignaciones: this.paralelosEditFormArray.value.map((paralelo: string) => ({
        materia_id: this.editForm.get('materia_id')?.value || 1,
        paralelo
      }))
    };

    this.api.editarUsuario(this.profesorSeleccionado.usuario_id, datosActualizados).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Profesor editado correctamente'
        });
        this.dialogVisible = false;
        this.cargarProfesores();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar al profesor'
        });
      }
    });
  }

  confirmarEliminarProfesor(profesor: any): void {
    this.confirmationService.confirm({
      key: 'confirmarEliminarProfesor',
      message: `¿Deseas eliminar al profesor ${profesor.nombre} ${profesor.apellido}?`,
      accept: () => {
        this.api.eliminarUsuarioLogico(profesor.usuario_id).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: res.message || 'Profesor eliminado correctamente'
            });
            this.cargarProfesores();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el profesor'
            });
          }
        });
      }
    });
  }

}
