import { Component, inject, OnInit } from '@angular/core';
import { ScheduleApiService } from '../../services/schedule-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import { DaysOfWeekEnum } from '../../../../core/enums/daysOfWeek.enum';
import SelectOption from '../../../../ui/models/selectOption.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import MessageError from '../../../../core/dto/messageError.dto';
import Schedule from '../../../../core/models/schedule.model';
import { NotificationService } from '../../../../ui/services/notification.service';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import { DynamicFormComponent } from '../../../../ui/components/dynamic-form/dynamic-form.component';
import { ScheduleValidators } from '../../../../core/utils/validators/scheduleValidators';

@Component({
  imports: [ModuleLayoutComponent, DynamicFormComponent],
  selector: 'app-schedule-form',
  styleUrl: './schedule-form.component.css',
  templateUrl: './schedule-form.component.html',
})
export class ScheduleFormComponent implements OnInit {
  private scheduleApi: ScheduleApiService = inject(ScheduleApiService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private fb: FormBuilder = inject(FormBuilder);
  private notification: NotificationService = inject(NotificationService);

  private currentScheduleId: number | null = null;

  readonly menuElements: Array<MenuElementConfig> = [
    { label: 'Crear', route: '/application/schedules/save' },
    { label: 'Listar Activos', route: '/application/schedules/list/enable' },
    { label: 'Listar Inactivos', route: '/application/schedules/list/disable' }
  ];

  readonly formFields: Array<TableFormConfig> = [
    { key: 'startTime', label: 'Hora de Inicio', type: FieldColumnTypeEnum.Time },
    { key: 'endTime', label: 'Hora de Fin', type: FieldColumnTypeEnum.Time }
  ];

  scheduleForm: FormGroup = this.fb.group({
    scheduleId: [null],
    startTime: ['', [
      Validators.required,
      ScheduleValidators.validTimeFormat(),
      ScheduleValidators.withinAllowedTimeRanges()
    ]],
    endTime: ['', [
      Validators.required,
      ScheduleValidators.validTimeFormat(),
      ScheduleValidators.withinAllowedTimeRanges()
    ]]
  }, {
    validators: [ScheduleValidators.startTimeBeforeEndTime()],
    asyncValidators: [],
    updateOn: 'change'
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const param: string | null = p.get("id");

      if (param !== null) {
        this.currentScheduleId = Number(param);

        this.scheduleApi.getScheduleById(this.currentScheduleId).subscribe({
          next: (res: Schedule) => {
            this.scheduleForm.patchValue(res);
          },
          error: (info: {error: MessageError}) => {
            this.notification.alert({
              message: info.error.message,
              theme: DialogThemeEnum.Danger,
              returnTo: '/application/schedules/list/enable'
            });
          }
        });
      } else {
        this.currentScheduleId = null;
      }
    });
  }

  handleSave(): void {
    if (this.scheduleForm.invalid) {
      Object.keys(this.scheduleForm.controls).forEach(key => {
        this.scheduleForm.get(key)?.markAsTouched();
        this.scheduleForm.get(key)?.markAsDirty();
      });
      return;
    }

    const formData = this.scheduleForm.value;

    this.notification.confirm({
      message: this.currentScheduleId
        ? 'Actualizar el horario puede causar alteraciones con los registros de clientes.'
        : 'Crear un horario puede habilitar nuevas opciones del registro de clientes.',
      theme: DialogThemeEnum.Info,
      action: (confirm) => {
        if (confirm) {
          const request = this.currentScheduleId
            ? this.scheduleApi.updateSchedule(formData)
            : this.scheduleApi.saveSchedule(formData);

          request.subscribe({
            next: () => {
              this.notification.alert({
                message: 'Se ha guardado correctamente el horario.',
                theme: DialogThemeEnum.Success,
                returnTo: '/application/schedules/list/enable'
              });
            },
            error: (info: {error: MessageError}) => {
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
    this.router.navigate(['/application/schedules/list/enable']);
  }
}