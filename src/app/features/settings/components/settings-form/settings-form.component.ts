import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import { SettingsService } from '../../services/settings.service';
import Settings from '../../../../core/models/settings.model';
import { NotificationService } from '../../../../ui/services/notification.service';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import MessageError from '../../../../core/dto/messageError.dto';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import SettingMetadata from '../../models/settings-metadata.model';
import { ScheduleApiService } from '../../../schedules/services/schedule-api.service'; 
import Schedule from '../../../../core/models/schedule.model';
import { map } from 'rxjs/operators';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModuleLayoutComponent,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  selector: 'app-settings-form.component',
  styleUrl: './settings-form.component.css',
  templateUrl: './settings-form.component.html',
})
export class SettingsFormComponent implements OnInit {
  private settingsService: SettingsService = inject(SettingsService);
  private notification: NotificationService = inject(NotificationService);
  private fb: FormBuilder = inject(FormBuilder);
  private scheduleApi: ScheduleApiService = inject(ScheduleApiService);

  readonly menuElements: Array<MenuElementConfig> = [];

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  hasChanges = signal<boolean>(false);


  private originalValues: Record<string, number> = {};


  preview = signal<{ verde: number; amarilla: number; roja: number }>({
    verde: 0, amarilla: 0, roja: 100
  });

  settingsForm: FormGroup = this.fb.group({});

  readonly metadata: Array<SettingMetadata> = [
    {
      key: 'bandera_verde',
      label: 'Umbral Verde',
      description: 'Porcentaje máximo de ocupación para mostrar el indicador verde (disponible).',
      icon: 'check_circle',
      min: 0, max: 100, suffix: '%'
    },
    {
      key: 'bandera_amarilla',
      label: 'Umbral Amarillo',
      description: 'Porcentaje máximo de ocupación para mostrar el indicador amarillo (ocupado).',
      icon: 'warning',
      min: 0, max: 100, suffix: '%'
    },
    {
      key: 'bandera_roja',
      label: 'Umbral Rojo',
      description: 'Porcentaje a partir del cual se muestra el indicador rojo (casi lleno).',
      icon: 'error',
      min: 0, max: 100, suffix: '%'
    },
    {
      key: 'rango_notificacion',
      label: 'Días de Notificación',
      description: 'Días de anticipación para avisar a los clientes sobre el vencimiento de su mensualidad.',
      icon: 'notifications_active',
      min: 1, max: 30, suffix: 'días'
    },
    {
      key: 'carga_total_maxima',
      label: 'Carga Total Máxima',
      description: 'Número máximo de clientes permitidos por horario. Al reducirlo, se valida que ningún horario activo lo exceda.',
      icon: 'groups',
      min: 1,
      max: 200,
      suffix: 'clientes'
    }
  ];

  ngOnInit(): void {
    this.loadSettings();
  }


  private loadSettings(): void {
    this.isLoading.set(true);

    this.settingsService.getSettings().subscribe({
      next: (settings: Array<Settings>) => {
        Object.keys(this.settingsForm.controls).forEach(key => {
          this.settingsForm.removeControl(key);
        });

        settings.forEach(setting => {
          const meta = this.getMetadata(setting.key);
          this.settingsForm.addControl(
            setting.key,
            this.fb.control(setting.value, [
              Validators.required,
              Validators.min(meta.min),
              Validators.max(meta.max)
            ])
          );
          this.originalValues[setting.key] = setting.value;
        });

        this.settingsForm.setValidators(this.thresholdOrderValidator());

        this.settingsForm.valueChanges.subscribe(() => {
          this.hasChanges.set(this.computeHasChanges());
          this.updatePreview();
        });

        this.updatePreview();
        this.isLoading.set(false);
      },
      error: (info: { error: MessageError }) => {
        this.isLoading.set(false);
        this.notification.alert({
          message: info.error?.message || 'No se pudieron cargar las configuraciones.',
          theme: DialogThemeEnum.Danger
        });
      }
    });
  }

  private getMetadata(key: string): SettingMetadata {
    return this.metadata.find(m => m.key === key)
      ?? { key, label: key, description: '', icon: 'tune', min: 0, max: 100, suffix: '' };
  }


  private thresholdOrderValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const verde = group.get('bandera_verde')?.value;
      const amarilla = group.get('bandera_amarilla')?.value;
      const roja = group.get('bandera_roja')?.value;

      if (verde == null || amarilla == null || roja == null) return null;

      if (!(verde < amarilla && amarilla <= roja)) {
        return { invalidThresholdOrder: true };
      }
      return null;
    };
  }

  private computeHasChanges(): boolean {
    return Object.keys(this.originalValues).some(key => {
      const current = this.settingsForm.get(key)?.value;
      return current !== this.originalValues[key];
    });
  }


  private updatePreview(): void {
    const verde = Number(this.settingsForm.get('bandera_verde')?.value) || 0;
    const amarilla = Number(this.settingsForm.get('bandera_amarilla')?.value) || 0;
    const roja = Number(this.settingsForm.get('bandera_roja')?.value) || 100;
    this.preview.set({ verde, amarilla, roja });
  }

  handleSave(): void {
  if (this.settingsForm.invalid) {
    this.settingsForm.markAllAsTouched();
    this.notification.alert({
      message: 'Corrija los errores antes de guardar.',
      theme: DialogThemeEnum.Info
    });
    return;
  }

  const changedKeys = Object.keys(this.originalValues).filter(
    key => this.settingsForm.get(key)?.value !== this.originalValues[key]
  );

  if (changedKeys.length === 0) {
    this.notification.alert({
      message: 'No hay cambios para guardar.',
      theme: DialogThemeEnum.Info
    });
    return;
  }

  if (changedKeys.includes('carga_total_maxima')) {
    const newLimit = Number(this.settingsForm.get('carga_total_maxima')?.value);

    this.isSaving.set(true);
    this.validateScheduleCapacity(newLimit).subscribe({
      next: (conflicts: any) => {
        if (conflicts.length > 0) {
          this.isSaving.set(false);
          this.showCapacityError(conflicts, newLimit);
          return;
        }
        this.performSave(changedKeys);
      },
      error: (info: { error: MessageError }) => {
        this.isSaving.set(false);
        this.notification.alert({
          message: info.error?.message || 'No se pudieron validar los horarios.',
          theme: DialogThemeEnum.Danger
        });
      }
    });
  } else {
    this.performSave(changedKeys);
  }
}


  handleReset(): void {
    this.settingsForm.patchValue(this.originalValues);
    this.hasChanges.set(false);
    this.updatePreview();
  }


  getMeta(key: string): SettingMetadata {
    return this.getMetadata(key);
  }

  get orderedKeys(): Array<string> {
    return this.metadata
      .map(m => m.key)
      .filter(key => this.settingsForm.contains(key));
  }

  get thresholdOrderInvalid(): boolean {
    return !!this.settingsForm.errors?.['invalidThresholdOrder'];
  }


private validateScheduleCapacity(newLimit: number): Observable<Array<Schedule>> {
  return this.scheduleApi.getAllSchedules(0, 1000, true, {}).pipe(
    map(response =>
      response.content.filter(schedule => schedule.activeClientCount > newLimit)
    )
  );
}


private showCapacityError(conflicts: Array<Schedule>, newLimit: number): void {
  const detail = conflicts
    .slice(0, 5)
    .map(s => `${s.startTime.slice(0, 5)}-${s.endTime.slice(0, 5)} (${s.activeClientCount} clientes)`)
    .join(', ');

  const extra = conflicts.length > 5 ? ` y ${conflicts.length - 5} más...` : '';

  this.notification.alert({
    message: `No se puede reducir la carga máxima a ${newLimit}. ` +
             `Los siguientes horarios la exceden: ${detail}${extra}. ` +
             `Reasigne clientes o elija un límite mayor.`,
    theme: DialogThemeEnum.Danger
  });
}


private performSave(changedKeys: Array<string>): void {
  this.isSaving.set(true);

  const requests = changedKeys.map(key =>
    this.settingsService.updateSettings({
      key,
      value: Number(this.settingsForm.get(key)?.value)
    })
  );

  forkJoin(requests).subscribe({
    next: () => {
      this.isSaving.set(false);

      changedKeys.forEach(key => {
        this.originalValues[key] = Number(this.settingsForm.get(key)?.value);
      });
      this.hasChanges.set(false);

      this.notification.alert({
        message: 'Configuraciones guardadas correctamente.',
        theme: DialogThemeEnum.Success
      });
    },
    error: (info: { error: MessageError }) => {
      this.isSaving.set(false);
      this.notification.alert({
        message: info.error?.message || 'No se pudieron guardar las configuraciones.',
        theme: DialogThemeEnum.Danger
      });
    }
  });
}
}
