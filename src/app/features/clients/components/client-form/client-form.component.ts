import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { ClientApiService } from '../../services/client-api.service';
import { NotificationService } from '../../../../ui/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import MessageError from '../../../../core/dto/messageError.dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DynamicFormComponent } from '../../../../ui/components/dynamic-form/dynamic-form.component';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import { ScheduleApiService } from '../../../schedules/services/schedule-api.service';
import { CoachApiService } from '../../../coaches/services/coach-api.service';
import { SettingsService } from '../../../settings/services/settings.service';
import Schedule from '../../../../core/models/schedule.model';
import Coach from '../../../../core/models/coach.model';
import Settings from '../../../../core/models/settings.model';
import { EnrichedSelectOption } from '../../../../ui/models/EnrichedSelectOption.model';
import PaginationResultDto from '../../../../core/dto/PaginationResult.dto';

@Component({
  imports: [ModuleLayoutComponent, DynamicFormComponent],
  selector: 'app-client-form',
  styleUrl: './client-form.component.css',
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent implements OnInit {
  private notification: NotificationService = inject(NotificationService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private clientApi: ClientApiService = inject(ClientApiService);
  private scheduleApi: ScheduleApiService = inject(ScheduleApiService);
  private coachApi: CoachApiService = inject(CoachApiService);
  private settingsService: SettingsService = inject(SettingsService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private router: Router = inject(Router);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  private maxClientsPerSchedule = 35;
  private thresholdGreen = 70;
  private thresholdYellow = 90;

  private clientId: number | null = null;
  private isInitialLoad = true;

  readonly menuElements: Array<MenuElementConfig> = [
    { label: 'Crear', route: '/application/clients/save' },
    { label: 'Listar Activos', route: '/application/clients/list/enable' },
    { label: 'Listar Inactivos', route: '/application/clients/list/disable' },
    { label: 'Listar Pendientes', route: '/application/clients/list/pending' }
  ];

  scheduleOptions = signal<Array<EnrichedSelectOption>>([]);
  coachOptions = signal<Array<EnrichedSelectOption>>([]);

  clientFormFields: Array<TableFormConfig> = [
    { 
      key: 'name', 
      label: 'Nombre',
      requirements: ['Debe contener solo letras', 'Mínimo 3 caracteres', 'Máximo 50 caracteres'],
      errorMessages: { pattern: 'El nombre solo puede contener letras.' }
    },
    { 
      key: 'lastname', 
      label: 'Apellido',
      requirements: ['Debe contener solo letras', 'Mínimo 3 caracteres', 'Máximo 50 caracteres'],
      errorMessages: { pattern: 'El apellido solo puede contener letras.' }
    },
    { 
      key: 'phone', 
      label: 'Teléfono',
      requirements: ['El teléfono debe tener entre 10 y 11 dígitos (0412, 0414, 0416, 0424, 0426).'],
      errorMessages: { pattern: 'El teléfono debe ser un número válido.' }
    },
    {
      key: 'scheduleId',
      label: 'Horario',
      type: FieldColumnTypeEnum.Select,
      isDynamic: true,
      options: [],
      requirements: ['Seleccione un horario disponible para el cliente.'],
      errorMessages: { required: 'El horario es obligatorio.' }
    },
    {
      key: 'coachId',
      label: 'Entrenador',
      type: FieldColumnTypeEnum.Select,
      isDynamic: true,
      dependsOn: 'scheduleId',
      options: [],
      requirements: ['Seleccione el entrenador asignado a este horario.'],
      errorMessages: { required: 'El entrenador es obligatorio.' }
    }
  ];

  clientForm: FormGroup = this.formBuilder.group({
    personId: [null],
    name: ['', [
      Validators.required,
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
      Validators.maxLength(50),
      Validators.minLength(3)
    ]],
    lastname: ['', [
      Validators.required,
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
      Validators.maxLength(50),
      Validators.minLength(3)
    ]],
    phone: ['', [
      Validators.required,
      Validators.pattern(/^0(412|414|416|424|426)[-\s]?\d{3}[-\s]?\d{4}$/),
      Validators.maxLength(11),
      Validators.minLength(10)
    ]],
    scheduleId: [null, [Validators.required]],
    coachId: [{ value: null, disabled: true }, [Validators.required]]
  });

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    this.clientId = param !== null ? Number(param) : null;

    if (this.clientId === null) {
      this.clientFormFields.unshift({
        key: 'ci',
        label: 'Cédula',
        requirements: ['Debe ser un número', 'Máximo 8 dígitos'],
        errorMessages: { pattern: 'La cédula debe ser un número' }
      });

      this.clientForm.addControl('ci', this.formBuilder.control('', [
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.minLength(8),
        Validators.maxLength(8)
      ]));
    }

    this.loadSettings().subscribe({
      next: () => {
        this.loadScheduleOptions();
        this.setupFieldDependencies();
      },
      error: (err) => {
        console.warn('No se pudieron cargar las configuraciones, usando valores por defecto:', err);
        this.loadScheduleOptions();
        this.setupFieldDependencies();
      }
    });
  }

  private loadSettings(): Observable<Array<Settings>> {
    return this.settingsService.getSettings().pipe(
      map(settings => {
        const configMap = new Map(settings.map(s => [s.key, s.value]));

        this.maxClientsPerSchedule = configMap.get('carga_total_maxima') ?? 35;
        this.thresholdGreen = configMap.get('bandera_verde') ?? 70;
        this.thresholdYellow = configMap.get('bandera_amarilla') ?? 90;

        return settings;
      })
    );
  }

  private setupFieldDependencies(): void {
    const scheduleControl = this.clientForm.get('scheduleId');
    const coachControl = this.clientForm.get('coachId');

    scheduleControl?.valueChanges.subscribe((value) => {
      if (!this.isInitialLoad) {
        coachControl?.setValue(null);
        coachControl?.disable();
      }

      const scheduleId = this.extractId(value);

      if (scheduleId) {
        this.loadCoachOptionsForSchedule(scheduleId);
        coachControl?.enable();
      } else {
        this.coachOptions.set([]);
        this.updateCoachFieldOptions([]);
      }
    });
  }

  private loadScheduleOptions(): void {
    this.scheduleApi.getAllSchedules(0, 100, true, {})
      .subscribe({
        next: (response: PaginationResultDto<Schedule>) => {
          const availableSchedules = response.content.filter(
            schedule => schedule.activeClientCount < this.maxClientsPerSchedule
          );

          const options: Array<EnrichedSelectOption> = availableSchedules.map(
            schedule => this.mapScheduleToOption(schedule)
          );

          this.scheduleOptions.set(options);
          this.updateScheduleFieldOptions(options);

          if (this.clientId !== null) {
            this.loadClientData();
          }
        },
        error: (err: MessageError) => {
          this.notification.alert({
            message: err.message,
            theme: DialogThemeEnum.Danger
          });
        }
      });
  }

  private loadClientData(): void {
    if (!this.clientId) return;

    this.clientApi.getClient(this.clientId).subscribe({
      next: (res: any) => {
        this.clientForm.patchValue({
          personId: res.personId,
          name: res.name,
          lastname: res.lastname,
          phone: res.phone
        });

        if (res.schedule?.scheduleId) {
          const scheduleOption = this.findOptionById(this.scheduleOptions(), res.schedule.scheduleId);
          if (scheduleOption) {
            this.clientForm.get('scheduleId')?.setValue(scheduleOption);
          }
        }

        this.isInitialLoad = false;

        if (res.schedule?.scheduleId && res.coach?.personId) {
          setTimeout(() => {
            const coachOption = this.findOptionById(this.coachOptions(), res.coach.personId);
            if (coachOption) {
              this.clientForm.get('coachId')?.setValue(coachOption);
            }
            
            this.cdr.detectChanges();
          }, 200);
        } else {
          this.cdr.detectChanges();
        }
      },
      error: (err: MessageError) => {
        this.notification.alert({
          message: err.message,
          theme: DialogThemeEnum.Danger,
          returnTo: '/application/clients/list/enable'
        });
      }
    });
  }

  private findOptionById(options: Array<EnrichedSelectOption>, id: number): EnrichedSelectOption | null {
    return options.find(opt => opt.value === id) || null;
  }

  private extractId(value: any): number | null {
    if (!value) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value.value !== undefined) return value.value;
    if (typeof value === 'object' && value.scheduleId !== undefined) return value.scheduleId;
    if (typeof value === 'object' && value.personId !== undefined) return value.personId;
    return null;
  }

  private mapScheduleToOption(schedule: Schedule): EnrichedSelectOption {
    const percentage = (schedule.activeClientCount / this.maxClientsPerSchedule) * 100;
    
    let statusColor: 'green' | 'yellow' | 'red';
    let statusText: string;

    if (percentage >= this.thresholdYellow) {
      statusColor = 'red';
      statusText = `Casi lleno (${schedule.activeClientCount}/${this.maxClientsPerSchedule})`;
    } else if (percentage >= this.thresholdGreen) {
      statusColor = 'yellow';
      statusText = `Ocupado (${schedule.activeClientCount}/${this.maxClientsPerSchedule})`;
    } else {
      statusColor = 'green';
      statusText = `Disponible (${schedule.activeClientCount}/${this.maxClientsPerSchedule})`;
    }

    return {
      value: schedule.scheduleId,
      label: `${schedule.startTime} a ${schedule.endTime}`,
      statusColor,
      statusText,
      isDisabled: false,
      raw: schedule
    };
  }

  private loadCoachOptionsForSchedule(scheduleId: number): void {
    this.coachApi.getAllCoaches(0, 100, true, {})
      .subscribe({
        next: (response: PaginationResultDto<Coach>) => {
          const availableCoaches = response.content.filter(coach => 
            coach.schedules?.some(schedule => schedule.scheduleId === scheduleId)
          );

          const options: Array<EnrichedSelectOption> = availableCoaches.map(coach => ({
            value: coach.personId,
            label: `${coach.name} ${coach.lastname}`,
            sublabel: ` (CI: ${coach.ci})`,
            statusColor: undefined,
            statusText: undefined,
            isDisabled: false,
            raw: coach
          }));

          this.coachOptions.set(options);
          this.updateCoachFieldOptions(options);
          
          this.cdr.detectChanges();
        },
        error: (err: MessageError) => {
          this.coachOptions.set([]);
          this.updateCoachFieldOptions([]);
          this.notification.alert({
            message: err.message,
            theme: DialogThemeEnum.Danger
          });
        }
      });
  }

  private updateScheduleFieldOptions(options: Array<EnrichedSelectOption>): void {
    const scheduleField = this.clientFormFields.find(f => f.key === 'scheduleId');
    if (scheduleField) {
      scheduleField.options = options;
    }
  }

  private updateCoachFieldOptions(options: Array<EnrichedSelectOption>): void {
    const coachField = this.clientFormFields.find(f => f.key === 'coachId');
    if (coachField) {
      coachField.options = options;
    }
  }

  handleSave(): void {
    if (this.clientForm.invalid) {
      Object.keys(this.clientForm.controls).forEach(key => {
        this.clientForm.get(key)?.markAsTouched();
        this.clientForm.get(key)?.markAsDirty();
      });
      return;
    }

    const formData = this.clientForm.value;

    const payload = {
      ...formData,
      scheduleId: this.extractId(formData.scheduleId),
      coachId: this.extractId(formData.coachId)
    };

    this.notification.confirm({
      message: '¿Está seguro de guardar los cambios?',
      theme: DialogThemeEnum.Info,
      action: (confirm) => {
        if (!confirm) return;

        const request: Observable<any> = payload.personId
          ? this.clientApi.updateClient(payload)
          : this.clientApi.saveClient(payload);

        request.subscribe({
          next: () => {
            this.notification.alert({
              message: 'Cambios guardados correctamente.',
              theme: DialogThemeEnum.Success,
              returnTo: '/application/clients/list/enable'
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
      });
  }

  handleCancel(): void {
    this.router.navigate(['/application/clients/list/enable']);
  }
}