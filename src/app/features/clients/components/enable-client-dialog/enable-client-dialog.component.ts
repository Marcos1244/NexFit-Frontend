import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { ScheduleApiService } from '../../../schedules/services/schedule-api.service';
import { SettingsService } from '../../../settings/services/settings.service';
import Schedule from '../../../../core/models/schedule.model';
import Settings from '../../../../core/models/settings.model';
import PaginationResultDto from '../../../../core/dto/PaginationResult.dto';
import MessageError from '../../../../core/dto/messageError.dto';
import { EnrichedSelectOption } from '../../../../ui/models/EnrichedSelectOption.model';

export interface EnableClientDialogData {
  personId: number;
  clientName: string;
}

export interface EnableClientDialogResult {
  scheduleId: number;
}

@Component({
  selector: 'app-enable-client-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: 'enable-client-dialog.component.html'
})
export class EnableClientDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<EnableClientDialogComponent, EnableClientDialogResult | null>);
  data: EnableClientDialogData = inject(MAT_DIALOG_DATA);
  private scheduleApi: ScheduleApiService = inject(ScheduleApiService);
  private settingsService: SettingsService = inject(SettingsService);
  private fb: FormBuilder = inject(FormBuilder);

  private maxClientsPerSchedule = 35;
  thresholdGreen = 70;
  thresholdYellow = 90;

  isLoading = signal<boolean>(true);
  scheduleOptions = signal<Array<EnrichedSelectOption>>([]);

  form: FormGroup = this.fb.group({
    scheduleId: [null, [Validators.required]]
  });

  ngOnInit(): void {
    this.loadSettings().subscribe({
      next: () => {
        this.loadSchedules();
      },
      error: (err) => {
        console.warn('No se pudieron cargar las configuraciones, usando valores por defecto:', err);
        this.loadSchedules();
      }
    });
  }


  private loadSettings() {
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

  private loadSchedules(): void {
    this.isLoading.set(true);

    this.scheduleApi.getAllSchedules(0, 100, true, {}).subscribe({
      next: (response: PaginationResultDto<Schedule>) => {
        const availableSchedules = response.content.filter(
          schedule => schedule.activeClientCount < this.maxClientsPerSchedule
        );

        const options: Array<EnrichedSelectOption> = availableSchedules.map(
          schedule => this.mapScheduleToOption(schedule)
        );

        this.scheduleOptions.set(options);
        this.isLoading.set(false);
      },
      error: (err: MessageError) => {
        console.error('Error al cargar horarios:', err);
        this.isLoading.set(false);
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

  compareOptions(o1: any, o2: any): boolean {
    if (o1 === o2) return true;
    if (!o1 || !o2) return false;
    const id1 = typeof o1 === 'object' ? o1.value : o1;
    const id2 = typeof o2 === 'object' ? o2.value : o2;
    return id1 === id2;
  }

  getStatusColorClass(color?: string): string {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedOption = this.form.value.scheduleId as EnrichedSelectOption;
    const result: EnableClientDialogResult = {
      scheduleId: selectedOption.value
    };

    this.dialogRef.close(result);
  }
}