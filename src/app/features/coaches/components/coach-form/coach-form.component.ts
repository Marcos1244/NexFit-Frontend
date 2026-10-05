import { Component, inject, OnInit } from '@angular/core';
import { CoachApiService } from '../../services/coach-api.service';
import { NotificationService } from '../../../../ui/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import Coach from '../../../../core/models/coach.model';
import MessageError from '../../../../core/dto/messageError.dto';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import { Observable } from 'rxjs/internal/Observable';
import { DynamicFormComponent } from '../../../../ui/components/dynamic-form/dynamic-form.component';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';

@Component({
  imports: [
    ModuleLayoutComponent,
    DynamicFormComponent
  ],
  selector: 'app-coach-form.component',
  styleUrl: './coach-form.component.css',
  templateUrl: './coach-form.component.html',
})
export class CoachFormComponent implements OnInit {
  private notification: NotificationService = inject(NotificationService);
  private coachApi: CoachApiService = inject(CoachApiService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);


  readonly menuElements: Array<MenuElementConfig> = [
      { label: 'Crear', route: '/application/coaches/save' },
      { label: 'Listar Activos', route: '/application/coaches/list/enable' },
      { label: 'Listar Inactivos', route: '/application/coaches/list/disable' }
    ];
  
    readonly coachFormFields: Array<TableFormConfig>  = [
      { key: 'name', label: 'Nombre' },
      { key: 'lastname', label: 'Apellido' }
    ];


    coachForm: FormGroup = this.formBuilder.group({
      personId: [null],
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          Validators.maxLength(50),
          Validators.minLength(3)
        ]
      ],
      lastname: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          Validators.maxLength(50),
          Validators.minLength(3)
        ]
      ]
    });


    ngOnInit(): void {
      const param: string | null = this.route.snapshot.paramMap.get('id');

      if (param !== null) {
        const coachId: number = Number(param);

        this.coachApi.getCoachById(coachId).subscribe({
          next: (res: Coach) => {
            this.coachForm.patchValue({
              personId: res.personId,
              name: res.name,
              lastname: res.lastname
            });
          },
          error: (info: { error: MessageError }) => {
            this.notification.alert({
              message: info.error.message,
              theme: DialogThemeEnum.Danger,
              returnTo: '/application/coaches/list/enable'
            });
          }
        });
      } else {
        this.coachFormFields.splice(0, 0, {
          key: 'ci',
          label: 'Cédula'
        });

        this.coachForm.addControl('ci', this.formBuilder.control('', [
          Validators.required,
          Validators.pattern(/^\d+$/),
          Validators.minLength(8),
          Validators.maxLength(8)
        ]));

      }
    }

    handleSave(): void {
      const formData = this.coachForm.value;

      this.notification.confirm({
        message: '¿Está seguro de guardar los cambios?',
        theme: DialogThemeEnum.Info,
        action: (confirm: any) => {
          if (confirm) {
            let request: Observable<Coach> = formData.personId
              ? this.coachApi.updateCoach(formData)
              : this.coachApi.saveCoach(formData);

            request.subscribe({
              next: () => {
                this.notification.alert({
                  message: 'Cambios guardados correctamente',
                  theme: DialogThemeEnum.Success,
                  returnTo: '/application/coaches/list/enable'
                });
              },
              error: (info: { error: MessageError }) => {
                this.notification.alert({
                  message: info.error.message,
                  theme: DialogThemeEnum.Danger
                });
              }
            });
          }
        }
      });
    }

    handleCancel(): void {
      this.router.navigate(['/application/coaches/list/enable']);
    }


}
