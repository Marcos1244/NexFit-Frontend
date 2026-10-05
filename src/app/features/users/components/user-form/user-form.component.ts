import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserApiService } from '../../services/user-api.service';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import User from '../../../../core/models/user.model';
import MessageError from '../../../../core/dto/messageError.dto';
import { NotificationService } from '../../../../ui/services/notification.service';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import { Observable } from 'rxjs';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import { RoleEnum } from '../../../../core/enums/role.enum';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import { DynamicFormComponent } from '../../../../ui/components/dynamic-form/dynamic-form.component';


@Component({
  imports: [ModuleLayoutComponent, DynamicFormComponent],
  selector: 'app-user-form',
  styleUrl: './user-form.component.css',
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  private userApi: UserApiService = inject(UserApiService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private notification: NotificationService = inject(NotificationService);
  private router: Router = inject(Router);

  readonly menuElements: Array<MenuElementConfig> = [
    {
      label: 'Crear',
      route: '/application/users/save',
    },
    {
      label: 'Listar Activos',
      route: '/application/users/list/enable',
    },
    {
      label: 'Listar Inactivos',
      route: '/application/users/list/disable',
    }
  ];

  formFields: Array<TableFormConfig> = [
    {
      key: 'name',
      label: 'Nombre',
      requirements: ['Debe contener solo letras', 'Mínimo 3 caracteres', 'Máximo 50 caracteres'],
      errorMessages: {
        pattern: 'El nombre debe contener solo letras'
      }
    },
    {
      key: 'lastname',
      label: 'Apellido',
      requirements: ['Debe contener solo letras', 'Mínimo 3 caracteres', 'Máximo 50 caracteres'],
      errorMessages: {
        pattern: 'El apellido debe contener solo letras'
      }
    },
    {
      key: 'role',
      label: 'Rol',
      requirements: ['Debe seleccionar un rol'],
      type: FieldColumnTypeEnum.Select,
      options: [
        {
          label: 'Administrador',
          value: RoleEnum.ADMINISTRATOR,
        },
        {
          label: 'Supervisor',
          value: RoleEnum.SUPERVISOR,
        },
      ],
    },
  ];

  userForm: FormGroup = this.formBuilder.group({
    personId: [null],
    ci: ['', 
      [
        Validators.required, 
        Validators.pattern(/^\d+$/), 
        Validators.maxLength(8),
        Validators.minLength(8)
      ]
    ],
    name: ['', 
      [
        Validators.required,
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
        Validators.maxLength(50),
        Validators.minLength(3)
      ]
    ],
    lastname: ['', 
      [
        Validators.required,
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
        Validators.maxLength(50),
        Validators.minLength(3)
      ]
    ],
    role: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const param: string | null = p.get('id');

      if (param !== null) {
        const id: number = Number(param);

        this.userApi.getUserById(id).subscribe({
          next: (res: User) => {
            this.userForm.patchValue(res);
          },
          error: (err: MessageError) => {
            this.notification.alert({
              message: err.message,
              theme: DialogThemeEnum.Danger,
              returnTo: '/application/users/list/enable',
            });
          },
        });
      } else {
        this.formFields.splice(0, 0, {
          key: 'ci',
          label: 'Cédula',
          requirements: ['Debe ser un número', 'Máximo 8 dígitos'],
          errorMessages: {
            pattern: 'La cédula debe ser un número'
          }
        });

        this.formFields.push({
          key: 'password',
          label: 'Contraseña',
          type: FieldColumnTypeEnum.Password,
          errorMessages: {
            pattern: 'La contraseña debe contener al menos una letra mayúscula, minúscula, caracter especial y un número'
          },
          requirements: [
            'Debe tener al menos una letra mayúscula, minúscula, caracter especial y un número',
            'Mínimo 8 caracteres',
            'Máximo 30 caracteres'
          ]
        });

        this.userForm.addControl('password', new FormControl('', 
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(30),
            Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,30}$/)
          ]
        ));
      }
    });
  }

  handleSave() {
    if (this.userForm.valid) {
      const formData = this.userForm.value;

      this.notification.confirm({
        message: formData.personId
          ? 'Esto afectará al usuario seleccionado.'
          : 'Esto le concederá al usuario regitrado acceso al sistema.',
        theme: DialogThemeEnum.Info,
        action: (confirm) => {
          if (confirm) {
            let request: Observable<User>;

            if (formData.personId) {
              request = this.userApi.updateUser(formData);
            } else {
              request = this.userApi.saveUser(formData);
            }

            request.subscribe({
              next: () => {
                this.notification.alert({
                  message: 'Se ha guardado correctamente el usuario proveido',
                  theme: DialogThemeEnum.Success,
                  returnTo: '/application/users/list/enable',
                });
              },
              error: (err: MessageError) => {
                this.notification.alert({
                  message: err.message,
                  theme: DialogThemeEnum.Danger,
                });
              },
            });
          }
        },
      });
    }
  }

  handleCancel(): void {
    this.router.navigate(['/application/users/list/enable']);
  }
}
