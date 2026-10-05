import { Router, RouterLinkWithHref } from '@angular/router';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import { DynamicTableComponent } from '../../../../ui/components/dynamic-table/dynamic-table.component';
import { ScheduleApiService } from '../../services/schedule-api.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import Schedule from '../../../../core/models/schedule.model';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import TableFilterConfig from '../../../../ui/models/tableFilterConfig.model';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import { DaysOfWeekEnum } from '../../../../core/enums/daysOfWeek.enum';
import SelectOption from '../../../../ui/models/selectOption.model';
import TableActionConfig from '../../../../ui/models/tableActionConfig.model';
import { EventActionEnum } from '../../../../ui/enums/EventAction.enum';
import PaginationResultDto from '../../../../core/dto/PaginationResult.dto';
import MessageError from '../../../../core/dto/messageError.dto';
import { NotificationService } from '../../../../ui/services/notification.service';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import { PageEvent } from '@angular/material/paginator';

@Component({
  imports: [
    ModuleLayoutComponent,
    DynamicTableComponent
  ],
  selector: 'app-schedule-list',
  styleUrl: './schedule-list.component.css',
  templateUrl: './schedule-list.component.html',
})
export class ScheduleListComponent implements OnInit {
  private scheduleApi: ScheduleApiService = inject(ScheduleApiService);
  private router: Router = inject(Router);
  private notification: NotificationService = inject(NotificationService);

  private currentUrl: string = this.router.url;
  private typeList: string | undefined = this.currentUrl.split('/').at(-1);

  readonly MAX_CLIENTS = 35;

  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  pageNumber = signal<number>(0);
  currentFilters = signal<any>({});
  schedules = signal<Array<Schedule>>([]);

  readonly menuElements: Array<MenuElementConfig> = [
    {
      label: 'Crear',
      route: '/application/schedules/save'
    },
    {
      label: 'Listar Activos',
      route: '/application/schedules/list/enable'
    },
    {
      label: 'Listar Inactivos',
      route: '/application/schedules/list/disable'
    }
  ];

  readonly columns: Array<TableFormConfig> = [
    {
      key: 'startTime',
      label: 'Hora de Inicio'
    },
    {
      key: 'endTime',
      label: 'Hora de Salida'
    },
    {
      key: 'activeClientCount',
      label: 'Clientes',
      type: FieldColumnTypeEnum.Custom,
      customRender: true
    }
  ];

  readonly filters: Array<TableFilterConfig> = [
    {
      key: 'startTime',
      label: 'Hora de Inicio',
      type: FieldColumnTypeEnum.Time,
      maxTimeKey: 'endTime'
    },
    {
      key: 'endTime',
      label: 'Hora de Salida',
      type: FieldColumnTypeEnum.Time,
      minTimeKey: 'startTime'
    }
  ];

  actions: Array<TableActionConfig> = [];

  ngOnInit(): void {
    if (this.typeList === EventActionEnum.Enable) {
      this.actions.push({
        name: EventActionEnum.Update,
        icon: 'edit',
        tooltip: 'Actualizar Horario',
        colorClass: '!text-interactivo'
      });

      this.actions.push({
        name: EventActionEnum.View,
        icon: 'group',
        tooltip: 'Ver usuarios adscritos',
        colorClass: '!text-institucional'
      });

      this.actions.push({
        name: EventActionEnum.Disable,
        icon: 'block',
        tooltip: 'Inhabilitar Horario',
        colorClass: '!text-red-500'
      });

    } else {
      this.actions.push({
        name: EventActionEnum.Enable,
        icon: 'check_circle',
        tooltip: 'Habilitar Horario',
        colorClass: '!text-green-500'
      });
    }

    this.loadSchedules();
    
  }

  loadSchedules(): void {
    this.scheduleApi.getAllSchedules(
      this.pageNumber(),
      this.pageSize(),
      this.typeList === EventActionEnum.Enable,
      this.currentFilters()
    ).subscribe({
      next: (res: PaginationResultDto<Schedule>) => {
        this.schedules.set(res.content);
        this.totalElements.set(res.totalElements);
      },
      error: (err: MessageError) => {
        this.notification.alert({
          message: err.message,
          theme: DialogThemeEnum.Danger,
          returnTo: '/application/home'
        })
      }
    });
  }

  handleAction (event: { action: string, row: Schedule }): void {
    if (event.action === EventActionEnum.Disable || event.action === EventActionEnum.Enable) {
      this.notification.confirm({
        message: this.typeList === EventActionEnum.Enable
        ? 'Inhabilitar un horario puede afectar posibles registros de clientes.'
        : 'Habilitar un horario dispondrá de nuevas opciones para el registro de clientes.',
        theme: DialogThemeEnum.Info,
        action: (confirm) => {
          if (confirm) {
            let request;

            if (this.typeList === EventActionEnum.Enable) {
              request = this.scheduleApi.disableSchedule(event.row.scheduleId);
            } else {
              request = this.scheduleApi.enableSchedule(event.row.scheduleId);
            };

            request.subscribe({
              next: (): void => {
                this.notification.alert({
                  message: 'Se ha completado correctamente la operación.',
                  theme: DialogThemeEnum.Success
                });
                this.loadSchedules();
              },
              error: (err: MessageError): void => {
                this.notification.alert({
                  message: err.message,
                  theme: DialogThemeEnum.Danger
                });
              }
            });
          }
        }
      });

    } else if (event.action === EventActionEnum.Update) {
      this.router.navigate(['/application/schedules/save/' + event.row.scheduleId]);
    } else if (event.action === EventActionEnum.View) {
      this.router.navigate(['/application/schedules/list/clients/' + event.row.scheduleId]);
    }
  }

  handlePagination(event: PageEvent) {
    this.pageNumber.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadSchedules();
  }

  handleFilters(filters: any) {
    this.currentFilters.set(filters);
    this.pageNumber.set(0);
    this.loadSchedules();
  }

  getClientOccupancyClass(count: number): string {
    const percentage = (count / this.MAX_CLIENTS) * 100;
    if (percentage >= 90) return 'bg-red-500';      
    if (percentage >= 70) return 'bg-amber-500';    
    return 'bg-green-500';                         
  }
}
