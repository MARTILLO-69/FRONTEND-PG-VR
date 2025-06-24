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
  materias = [ { label: 'Biología', value: 1 } ];
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
  }

  initForm() {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      codigo: ['', Validators.required],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
      materia_id: [1, Validators.required], // ← valor por defecto = Biología
      paralelos: this.fb.array([])          // ← array de paralelos seleccionados
    });

    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      codigo: ['', Validators.required],
      materia_id: [1, Validators.required],
      paralelos: this.fb.array([])  // 👈 importante que esté con nombre 'paralelos'
    });
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
      ? profesor.paralelos_asignados.split(',').map(p => p.trim())
      : [];

    // Reemplazamos el FormArray (internamente puede mantenerse si aún lo usas para enviar)
    this.paralelosSeleccionadosEdit = [...paralelosArray]; // 👈 esta será la fuente visual

    // También puedes llenar el FormArray para cuando hagas submit
    const formArray = this.paralelosEditFormArray;
    formArray.clear();
    paralelosArray.forEach(paralelo => {
      formArray.push(new FormControl(paralelo));
    });

    this.editForm.patchValue({
      nombre: profesor.nombre,
      apellido: profesor.apellido,
      codigo: profesor.codigo,
      materia_id: 1
    });

    console.log('🧾 FormArray precargado con paralelos:', formArray.value);
  }

  onParaleloChange(nuevosParalelos: string[]): void {
    const formArray = this.paralelosEditFormArray;
    formArray.clear();

    nuevosParalelos.forEach(p => {
      formArray.push(new FormControl(p));
    });

    console.log('✅ FormArray actualizado desde UI:', formArray.value);
  }


  getParaleloIndex(paralelo: string): number {
    return this.paralelosEditFormArray.controls.findIndex(c => c.value === paralelo);
  }

  toggleParaleloEdit(event: any, paralelo: string): void {
    const formArray = this.paralelosEditFormArray;
    const index = formArray.controls.findIndex(ctrl => ctrl.value === paralelo);

    if (event.checked && index === -1) {
      formArray.push(new FormControl(paralelo));
      console.log('☑️ Añadido:', paralelo);
    } else if (!event.checked && index !== -1) {
      formArray.removeAt(index);
      console.log('❌ Removido:', paralelo);
    }

    console.log('🧾 Estado actualizado:', formArray.value);
  }


  toggleParalelo(event: any, paralelo: string) {
    if (event.checked) {
      this.paralelosFormArray.push(new FormControl(paralelo));
    } else {
      const index = this.paralelosFormArray.controls.findIndex(ctrl => ctrl.value === paralelo);
      if (index >= 0) this.paralelosFormArray.removeAt(index);
    }
  }

  cargarProfesores() {
    this.profesores$ = this.apiService.listarProfesores();
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

        this.dialogVisible = false; // 👈 Cierra el formulario
        this.cargarProfesores();    // 👈 Actualiza tabla
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

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Formulario inválido', detail: 'Completa todos los campos' });
      return;
    }

    const { nombre, apellido, codigo, contraseña, materia_id, paralelos } = this.registerForm.value;
    const asignaciones = paralelos.map((paralelo: string) => ({
      materia_id,
      paralelo
    }));

    const payload = {
      nombre,
      apellido,
      codigo,
      contraseña,
      tipo_usuario: 'P',
      asignaciones
    };

    this.api.postRegistrarUsuarios(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Profesor registrado correctamente' });

        // ✅ Limpieza total del formulario y paralelos
        this.registerForm.reset();
        this.paralelosFormArray.clear(); // <-- Esto es clave

        this.cargarProfesores();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el profesor' });
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
