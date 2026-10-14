import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import { CoachApiService } from '../../services/coach-api.service';
import { ScheduleApiService } from '../../../schedules/services/schedule-api.service';
import { NotificationService } from '../../../../ui/services/notification.service';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import MessageError from '../../../../core/dto/messageError.dto';
import Schedule from '../../../../core/models/schedule.model';
import Coach from '../../../../core/models/coach.model';
import PaginationResultDto from '../../../../core/dto/PaginationResult.dto';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-coach-schedule-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModuleLayoutComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './coach-schedule-form.component.html',
  styleUrl: './coach-schedule-form.component.css'
})
export class CoachScheduleFormComponent implements OnInit, OnDestroy {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  private coachApi: CoachApiService = inject(CoachApiService);
  private scheduleApi: ScheduleApiService = inject(ScheduleApiService);
  private notification: NotificationService = inject(NotificationService);

  private destroy$ = new Subject<void>();

  coachId: number | null = null;
  coach: Coach | null = null;

  scheduleForm: FormGroup = this.fb.group({
    schedules: this.fb.array([])
  });

  allSchedules: Array<Schedule> = [];

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  readonly menuElements: Array<MenuElementConfig> = [
    { label: 'Crear', route: '/application/coaches/save' },
    { label: 'Listar Activos', route: '/application/coaches/list/enable' },
    { label: 'Listar Inactivos', route: '/application/coaches/list/disable' }
  ];

  get schedulesArray(): FormArray {
    return this.scheduleForm.get('schedules') as FormArray;
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.coachId = Number(id);
        this.loadData();
      } else {
        this.router.navigate(['/application/coaches/list/enable']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    if (!this.coachId) return;

    this.isLoading.set(true);

    this.scheduleApi.getAllSchedules(0, 100, true, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginationResultDto<Schedule>) => {
          this.allSchedules = response.content;
          this.loadCoach();
        },
        error: (err: MessageError) => {
          this.isLoading.set(false);
          this.notification.alert({
            message: err.message,
            theme: DialogThemeEnum.Danger,
            returnTo: '/application/coaches/list/enable'
          });
        }
      });
  }

  private loadCoach(): void {
    if (!this.coachId) return;

    this.coachApi.getCoachById(this.coachId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coach: Coach) => {
          this.coach = coach;
          this.initializeFormWithCoachSchedules(coach.schedules || []);
          this.isLoading.set(false);
        },
        error: (err: MessageError) => {
          this.isLoading.set(false);
          this.notification.alert({
            message: err.message,
            theme: DialogThemeEnum.Danger,
            returnTo: '/application/coaches/list/enable'
          });
        }
      });
  }

  private initializeFormWithCoachSchedules(schedules: Array<Schedule>): void {
    while (this.schedulesArray.length > 0) {
      this.schedulesArray.removeAt(0);
    }

    if (schedules.length > 0) {
      schedules.forEach((schedule) => {
        this.schedulesArray.push(new FormControl<number | null>(schedule.scheduleId));
      });
    } else {
      this.schedulesArray.push(new FormControl<number | null>(null));
    }
  }

  getAvailableSchedulesForIndex(index: number): Array<Schedule> {
    const assignedIds = this.schedulesArray.controls
      .filter((_, i) => i !== index)
      .map((control) => control.value as number | null)
      .filter((id): id is number => id !== undefined && id !== null);

    return this.allSchedules.filter(
      (schedule) => !assignedIds.includes(schedule.scheduleId)
    );
  }

  addScheduleControl(): void {
    if (this.schedulesArray.length > 0) {
      const lastControl = this.schedulesArray.at(this.schedulesArray.length - 1);
      if (!lastControl.value) {
        this.notification.alert({
          message: 'Por favor, seleccione un horario antes de agregar otro.',
          theme: DialogThemeEnum.Info
        });
        return;
      }
    }

    this.schedulesArray.push(new FormControl<number | null>(null));
  }

  removeScheduleControl(index: number): void {
    if (index < 0 || index >= this.schedulesArray.length) return;

    const scheduleId = this.schedulesArray.at(index).value as number | null;

    if (scheduleId) {
      this.notification.confirm({
        message: '¿Está seguro de que desea eliminar este horario del entrenador?',
        theme: DialogThemeEnum.Info,
        action: (confirm) => {
          if (confirm) {
            this.removeCoachSchedule(index, scheduleId);
          }
        }
      });
    } else {
      this.schedulesArray.removeAt(index);
      if (this.schedulesArray.length === 0) {
        this.schedulesArray.push(new FormControl<number | null>(null));
      }
    }
  }

  onScheduleSelected(index: number, scheduleId: number | null): void {
    if (!this.coachId || !scheduleId) return;

    this.isSaving.set(true);

    this.coachApi.pushCoachSchedule(this.coachId, scheduleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.notification.alert({
            message: 'Horario asignado correctamente.',
            theme: DialogThemeEnum.Success
          });
          this.loadCoach();
        },
        error: (info: { error: MessageError }) => {
          this.isSaving.set(false);
          this.notification.alert({
            message: info.error.message,
            theme: DialogThemeEnum.Danger
          });
        }
      });
  }

  private removeCoachSchedule(index: number, scheduleId: number): void {
    if (!this.coachId) return;

    this.isSaving.set(true);

    this.coachApi.removeCoachSchedule(this.coachId, scheduleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);

          if (index >= 0 && index < this.schedulesArray.length) {
            this.schedulesArray.removeAt(index);
          }

          this.notification.alert({
            message: 'Horario eliminado correctamente.',
            theme: DialogThemeEnum.Success
          });

          if (this.schedulesArray.length === 0) {
            this.schedulesArray.push(new FormControl<number | null>(null));
          }
        },
        error: (info: { error: MessageError }) => {
          this.isSaving.set(false);
          this.notification.alert({
            message: info.error.message,
            theme: DialogThemeEnum.Danger
          });
        }
      });
  }

  formatSchedule(schedule: Schedule): string {
    return `${schedule.startTime} a ${schedule.endTime}`;
  }

  isLastControl(index: number): boolean {
    return index === this.schedulesArray.length - 1;
  }

  canAddNewSchedule(): boolean {
    if (this.schedulesArray.length === 0) return true;
    const lastControl = this.schedulesArray.at(this.schedulesArray.length - 1);
    return !!lastControl.value;
  }

  handleCancel(): void {
    this.router.navigate(['/application/coaches/list/enable']);
  }
}
