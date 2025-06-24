import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
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
import { Observable } from 'rxjs';
import { ParametricasService } from 'src/app/demo/service/parametricas.service';
import { RegisterService } from 'src/app/demo/service/register.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';

@Component({
  selector: 'app-estudiantes',
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
      DropdownModule,
      ToastModule, 
      ConfirmDialogModule],
  templateUrl: './estudiantes.component.html',
  styleUrl: './estudiantes.component.scss',
  providers: [ConfirmationService, MessageService]
})
export class EstudiantesComponent implements OnInit{

  registerForm: FormGroup;
  estudiantes$: Observable<any[]>;
  dialogVisible: boolean = false;
  estudianteSeleccionado: any = null;
  editForm!: FormGroup;
  paralelos = [
    { label: 'Paralelo A', value: 'A' },
    { label: 'Paralelo B', value: 'B' },
    { label: 'Paralelo C', value: 'C' },
    { label: 'Paralelo D', value: 'D' },
  ];

  constructor(
    private apiService: ParametricasService,
    public layoutService: LayoutService,
    private api: RegisterService,
    private routers: Router,
    private accion: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
      codigo: ['', Validators.required],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
      paralelo: ['', Validators.required]  // Ahora obligatorio por defecto
    });
  }

  ngOnInit(): void {
    this.cargarEstudiantes();
    this.editForm = this.fb.group({
        nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
        apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)]],
        codigo: ['', Validators.required],
        paralelo: ['', Validators.required]
      }
    );
  }

  cargarEstudiantes() {
    this.estudiantes$ = this.apiService.listarEstudiantes();
  }

  onRegister(): void {
      if (this.registerForm.valid) {
        const { nombre, apellido, codigo, contraseña, paralelo } = this.registerForm.value;
        const payload = {
          nombre,
          apellido,
          codigo,
          contraseña,
          paralelo,
          tipo_usuario: 'E' // siempre estudiante
        };

        this.api.postRegistrarUsuarios(payload).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estudiante registrado' });
            this.registerForm.reset();
            this.cargarEstudiantes();
          },
          error: (error) => {
            console.error('Error en el registro', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar' });
          }
        });
      } else {
        this.messageService.add({ severity: 'warn', summary: 'Formulario inválido', detail: 'Revisa los campos requeridos' });
      }
  }

  abrirDialogoEditar(est: any) {
    this.estudianteSeleccionado = est;
    this.dialogVisible = true;
    this.editForm.patchValue(est);
  }

  cerrarDialogo(): void {
    this.dialogVisible = false;
  }

  guardarCambios(): void {
    const usuarioId = this.estudianteSeleccionado?.usuario_id;

    if (!usuarioId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID de usuario no disponible' });
      return;
    }

    const datosActualizados = {
      nombre: this.editForm.value.nombre,
      apellido: this.editForm.value.apellido,
      codigo: this.editForm.value.codigo,
      paralelo: this.editForm.value.paralelo
    };

    this.api.editarUsuario(usuarioId, datosActualizados).subscribe({
      next: (res) => {
        // Asegura que recibes algo válido
        console.log('Respuesta exitosa', res);

        // ✅ Mostrar toast de éxito
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estudiante actualizado correctamente'
        });

        // ✅ Cerrar diálogo
        this.dialogVisible = false;

        // ✅ Recargar listado
        this.cargarEstudiantes();
      },
      error: (err) => {
        console.error('Error en el backend', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estudiante'
        });
      }
    });
  }

  confirmarEliminar(estudiante: any): void {
    this.confirmationService.confirm({
      key: 'confirmarEliminar',
      message: `¿Estás seguro de que deseas eliminar a ${estudiante.nombre} ${estudiante.apellido}?`,
      accept: () => {
        this.api.eliminarUsuarioLogico(estudiante.usuario_id).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: res.message || 'Estudiante eliminado correctamente'
            });
            this.cargarEstudiantes();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el estudiante'
            });
          }
        });
      }
    });
  }
}
