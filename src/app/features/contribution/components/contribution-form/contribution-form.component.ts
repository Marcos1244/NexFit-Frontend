// features/contribution/components/contribution-form/contribution-form.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributionApiService } from '../../services/contribution-api.service';
import { ClientApiService } from '../../../clients/services/client-api.service';
import { SettingsService } from '../../../settings/services/settings.service';
import { NotificationService } from '../../../../ui/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import { ContributionType } from '../../../../core/enums/contributionType.enum';
import SelectOption from '../../../../ui/models/selectOption.model';
import CreateContributionDto from '../../dto/createContribution.dto';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import MessageError from '../../../../core/dto/messageError.dto';
import { ScheduleApiService } from '../../../schedules/services/schedule-api.service';
import PaginationResultDto from '../../../../core/dto/PaginationResult.dto';
import Schedule from '../../../../core/models/schedule.model';
import Client from '../../../../core/models/client.model';
import Settings from '../../../../core/models/settings.model';
import { EnrichedSelectOption } from '../../../../ui/models/EnrichedSelectOption.model';
import { DynamicFormComponent } from '../../../../ui/components/dynamic-form/dynamic-form.component';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  imports: [
    CommonModule,
    DynamicFormComponent,
    ModuleLayoutComponent
  ],
  selector: 'app-contribution-form',
  styleUrl: './contribution-form.component.css',
  templateUrl: './contribution-form.component.html',
})
export class ContributionFormComponent implements OnInit {
  private contributionApi: ContributionApiService = inject(ContributionApiService);
  private clientApi: ClientApiService = inject(ClientApiService);
  private scheduleApi: ScheduleApiService = inject(ScheduleApiService);
  private settingsService: SettingsService = inject(SettingsService);
  private notification: NotificationService = inject(NotificationService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private router: Router = inject(Router);

  private maxClientsPerSchedule = 35;
  private thresholdGreen = 70;
  private thresholdYellow = 90;

  allClients: Array<Client> = [];
  filteredClients = signal<Array<EnrichedSelectOption>>([]);
  scheduleOptions = signal<Array<EnrichedSelectOption>>([]);

  selectedClient = signal<Client | null>(null);
  showScheduleField = signal<boolean>(false);

  readonly menuElements: Array<MenuElementConfig> = [
    { label: 'Crear', route: '/application/contributions/save' },
    { label: 'Listar Aprobados', route: '/application/contributions/list/enable' },
    { label: 'Listar No Aprobados', route: '/application/contributions/list/disable' }
  ];

  contributionFormFields: Array<TableFormConfig> = [
    {
      key: 'personId',
      label: 'Cliente',
      type: FieldColumnTypeEnum.Autocomplete,
      isDynamic: true,
      options: [],
      requirements: ['Busque y seleccione un cliente por nombre o apellido'],
      errorMessages: { required: 'El cliente es obligatorio.' }
    },
    {
      key: 'reference',
      label: 'Referencia',
      requirements: ['Número de referencia del pago'],
      errorMessages: { required: 'La referencia es obligatoria.' }
    },
    {
      key: 'amount',
      label: 'Monto',
      type: FieldColumnTypeEnum.Number,
      requirements: ['Monto de la contribución'],
      errorMessages: { required: 'El monto es obligatorio.' }
    },
    {
      key: 'type',
      label: 'Tipo',
      type: FieldColumnTypeEnum.Select,
      options: Object.values(ContributionType).map((value): SelectOption => ({
        label: value,
        value
      })),
      requirements: ['Tipo de contribución'],
      errorMessages: { required: 'El tipo es obligatorio.' }
    }
  ];

  contributionForm: FormGroup = this.formBuilder.group({
    personId: [null, [Validators.required]],
    reference: ['', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(4),
      Validators.pattern(/^\d+$/)
    ]],
    amount: ['', [Validators.required, Validators.min(0.01)]],
    type: ['', [Validators.required]]
  });




  ngOnInit(): void {
    
    this.loadSettings().subscribe({
      next: () => {
        this.loadClients();
        this.setupFormListeners();
      },
      error: (err) => {
        console.warn('No se pudieron cargar las configuraciones, usando valores por defecto:', err);
        this.loadClients();
        this.setupFormListeners();
      }
    });
  }


  private loadSettings() {
    return this.settingsService.getSettings().pipe(
      map(settings => {
        const configMap = new Map<string, number>(
          settings.map(s => [s.key, s.value] as [string, number])
        );

        this.maxClientsPerSchedule = configMap.get('carga_total_maxima') ?? 35;
        this.thresholdGreen = configMap.get('bandera_verde') ?? 70;
        this.thresholdYellow = configMap.get('bandera_amarilla') ?? 90;

        return settings;
      })
    );
  }


  private loadClients(): void {
    forkJoin({
      active: this.clientApi.getAllClients(0, 1000, true, false, {}),
      inactive: this.clientApi.getAllClients(0, 1000, false, false, {})
    }).subscribe({
      next: ({ active, inactive }) => {
        this.allClients = [...active.content, ...inactive.content];

        const options: Array<EnrichedSelectOption> = this.allClients.map(client => ({
          value: client.personId,
          label: `${client.name} ${client.lastname}`,
          sublabel: `CI: ${client.ci} - ${client.status ? 'Activo' : 'Inactivo'}`,
          statusColor: client.status ? 'green' : 'red',
          statusText: client.status ? 'Activo' : 'Inactivo',
          raw: client
        }));

        this.filteredClients.set(options);
        this.updateClientFieldOptions(options);
      },
      error: (err: MessageError) => {
        this.notification.alert({
          message: err.message,
          theme: DialogThemeEnum.Danger
        });
      }
    });
  }

  private setupFormListeners(): void {
    const personIdControl = this.contributionForm.get('personId');

    personIdControl?.valueChanges.subscribe((value) => {
      if (value && typeof value === 'object' && value.value) {
        const clientId = value.value;
        const client = this.allClients.find(c => c.personId === clientId);

        if (client) {
          this.selectedClient.set(client);

          if (!client.status) {
            this.showScheduleField.set(true);
            this.addScheduleField();
            this.loadSchedules();
          } else {
            this.showScheduleField.set(false);
            this.removeScheduleField();
          }
        }
      } else {
        this.selectedClient.set(null);
        this.showScheduleField.set(false);
        this.removeScheduleField();
      }
    });
  }

  private addScheduleField(): void {
    if (!this.contributionForm.contains('scheduleId')) {
      this.contributionForm.addControl(
        'scheduleId',
        this.formBuilder.control(null, [Validators.required])
      );

      const scheduleField: TableFormConfig = {
        key: 'scheduleId',
        label: 'Horario',
        type: FieldColumnTypeEnum.Select,
        isDynamic: true,
        options: [],
        requirements: ['Seleccione un horario para el cliente inactivo'],
        errorMessages: { required: 'El horario es obligatorio para clientes inactivos.' }
      };

      const clientIndex = this.contributionFormFields.findIndex(f => f.key === 'personId');
      this.contributionFormFields.splice(clientIndex + 1, 0, scheduleField);
    }
  }

  private removeScheduleField(): void {
    if (this.contributionForm.contains('scheduleId')) {
      this.contributionForm.removeControl('scheduleId');

      const scheduleIndex = this.contributionFormFields.findIndex(f => f.key === 'scheduleId');
      if (scheduleIndex !== -1) {
        this.contributionFormFields.splice(scheduleIndex, 1);
      }
    }
  }

  private loadSchedules(): void {
    this.scheduleApi.getAllSchedules(0, 100, true, {}).subscribe({
      next: (response: PaginationResultDto<Schedule>) => {
        const availableSchedules = response.content.filter(
          schedule => schedule.activeClientCount < this.maxClientsPerSchedule
        );

        const options: Array<EnrichedSelectOption> = availableSchedules.map(
          schedule => this.mapScheduleToOption(schedule)
        );

        this.scheduleOptions.set(options);
        this.updateScheduleFieldOptions(options);
      },
      error: (err: MessageError) => {
        this.notification.alert({
          message: err.message,
          theme: DialogThemeEnum.Danger
        });
      }
    });
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
      sublabel: `${schedule.activeClientCount} de ${this.maxClientsPerSchedule} cupos ocupados`,
      statusColor,
      statusText,
      isDisabled: false,
      raw: schedule
    };
  }

 
  filterClients(searchTerm: string): void {
    if (!searchTerm || searchTerm.length < 2) {
      const options: Array<EnrichedSelectOption> = this.allClients.map(client => ({
        value: client.personId,
        label: `${client.name} ${client.lastname}`,
        sublabel: `CI: ${client.ci} - ${client.status ? 'Activo' : 'Inactivo'}`,
        statusColor: client.status ? 'green' : 'red',
        statusText: client.status ? 'Activo' : 'Inactivo',
        raw: client
      }));
      this.filteredClients.set(options);
      this.updateClientFieldOptions(options);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = this.allClients.filter(client => {
      const fullName = `${client.name} ${client.lastname}`.toLowerCase();
      return fullName.includes(term);
    });

    const options: Array<EnrichedSelectOption> = filtered.map(client => ({
      value: client.personId,
      label: `${client.name} ${client.lastname}`,
      sublabel: `CI: ${client.ci} - ${client.status ? 'Activo' : 'Inactivo'}`,
      statusColor: client.status ? 'green' : 'red',
      statusText: client.status ? 'Activo' : 'Inactivo',
      raw: client
    }));

    this.filteredClients.set(options);
    this.updateClientFieldOptions(options);
  }


  private updateClientFieldOptions(options: Array<EnrichedSelectOption>): void {
    const clientField = this.contributionFormFields.find(f => f.key === 'personId');
    if (clientField) {
      clientField.options = options;
    }
  }


  private updateScheduleFieldOptions(options: Array<EnrichedSelectOption>): void {
    const scheduleField = this.contributionFormFields.find(f => f.key === 'scheduleId');
    if (scheduleField) {
      scheduleField.options = options;
    }
  }


  displayClient(client: any): string {
    if (!client) return '';
    if (typeof client === 'object' && client.label) {
      return client.label;
    }
    return '';
  }

  handleSave(): void {
    if (this.contributionForm.invalid) {
      Object.keys(this.contributionForm.controls).forEach(key => {
        this.contributionForm.get(key)?.markAsTouched();
        this.contributionForm.get(key)?.markAsDirty();
      });
      return;
    }

    const formData = this.contributionForm.value;

    const payload: CreateContributionDto = {
      personId: typeof formData.personId === 'object' ? formData.personId.value : formData.personId,
      reference: formData.reference,
      amount: formData.amount,
      type: formData.type,
      scheduleId: formData.scheduleId ? (typeof formData.scheduleId === 'object' ? formData.scheduleId.value : formData.scheduleId) : undefined
    };

    this.notification.confirm({
      message: '¿Desea guardar esta contribución con los datos proveídos?',
      theme: DialogThemeEnum.Info,
      action: (confirm) => {
        if (!confirm) return;

        this.contributionApi.saveContribution(payload).subscribe({
          next: () => {
            this.notification.alert({
              message: 'Se ha completado la operación correctamente.',
              theme: DialogThemeEnum.Success,
              returnTo: '/application/contributions/list/enable'
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
    this.router.navigate(['/application/contributions/list/enable']);
  }
}