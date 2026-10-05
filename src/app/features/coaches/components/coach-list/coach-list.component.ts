import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CoachApiService } from '../../services/coach-api.service';
import { NotificationService } from '../../../../ui/services/notification.service';
import { Router } from '@angular/router';
import Coach from '../../../../core/models/coach.model';
import { PageEvent } from '@angular/material/paginator';
import { EventActionEnum } from '../../../../ui/enums/EventAction.enum';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import { Observable } from 'rxjs';
import MessageError from '../../../../core/dto/messageError.dto';
import PaginationResultDto from '../../../../core/dto/PaginationResult.dto';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import TableFilterConfig from '../../../../ui/models/tableFilterConfig.model';
import TableActionConfig from '../../../../ui/models/tableActionConfig.model';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import { DynamicTableComponent } from '../../../../ui/components/dynamic-table/dynamic-table.component';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import SelectOption from '../../../../ui/models/selectOption.model';
import { DaysOfWeekEnum } from '../../../../core/enums/daysOfWeek.enum';

@Component({
  imports: [
    ModuleLayoutComponent,
    DynamicTableComponent
  ],
  selector: 'app-coach-list.component',
  styleUrl: './coach-list.component.css',
  templateUrl: './coach-list.component.html',
})
export class CoachListComponent implements OnInit {
  private notification: NotificationService = inject(NotificationService);
  private coachApi: CoachApiService = inject(CoachApiService);
  private router: Router = inject(Router);

  currentUrl: string = this.router.url;
  typeList: string | undefined = this.currentUrl.split('/').at(-1);

  coaches: WritableSignal<Array<Coach>> = signal<Array<Coach>>([]);
  totalElements: WritableSignal<number> = signal<number>(0);
  pageNumber: WritableSignal<number> = signal<number>(0);
  pageSize: WritableSignal<number> = signal<number>(10);
  currentFilters: WritableSignal<any> = signal<any>({});
  

  readonly menuElements: Array<MenuElementConfig> = [
    { label: 'Crear', route: '/application/coaches/save' },
    { label: 'Listar Activos', route: '/application/coaches/list/enable' },
    { label: 'Listar Inactivos', route: '/application/coaches/list/disable' }
  ];

  readonly tableColumns: Array<TableFormConfig>  = [
    { key: 'ci', label: 'Cédula' },
    { key: 'name', label: 'Nombre' },
    { key: 'lastname', label: 'Apellido' }
  ];

  readonly filters: Array<TableFilterConfig> = [
    { key: 'ci', label: 'Cédula' },
    { key: 'name', label: 'Nombre' },
    { key: 'lastname', label: 'Apellido' },
    { key: 'startTime', label: 'Hora Inicio', type: FieldColumnTypeEnum.Time },
    { key: 'endTime', label: 'Hora Fin', type: FieldColumnTypeEnum.Time }
  ];

  tableActions: Array<TableActionConfig> = [];

  ngOnInit(): void {
    if (
      this.typeList === EventActionEnum.Enable
    ) {
      this.tableActions.push({
        icon: 'edit',
        name: EventActionEnum.Update,
        tooltip: 'Actualizar entrenador',
        colorClass: '!text-yellow-600'
      });

      this.tableActions.push({
        icon: 'schedule',
        name: EventActionEnum.Schedules,
        tooltip: 'Gestionar horarios del entrenador',
        colorClass: '!text-interactivo'
      });

      this.tableActions.push({
        icon: 'block',
        name: EventActionEnum.Disable,
        tooltip: 'Inhabilitar entrenador',
        colorClass: '!text-red-500'
      });

    } else {
      this.tableActions.push({
        icon: 'check_circle',
        name: EventActionEnum.Enable,
        tooltip: 'Habilitar entrenador',
        colorClass: '!text-green-500'
      });

    }

    this.loadCoaches();
  }

  loadCoaches (): void {
    this.coachApi.getAllCoaches(
      this.pageNumber(),
      this.pageSize(),
      this.typeList === EventActionEnum.Enable,
      this.currentFilters()
    ).subscribe({
      next: (res: PaginationResultDto<Coach>) => {
        this.coaches.set(res.content);
        this.totalElements.set(res.totalElements);
      },
      error: (info: { error: MessageError }) => {
        this.notification.alert({
          message: info.error.message,
          theme: DialogThemeEnum.Danger,
          returnTo: '/application/home'
        });
      }
    });
  }

  handleAction (event: { action: string, row: Coach }): void {
    if (
      event.action === EventActionEnum.Enable || event.action === EventActionEnum.Disable
    ) {
      this.notification.confirm({
        message: this.typeList === EventActionEnum.Enable
        ? 'Inhabilitar un entrenador va a reducir las opciones de registro de clientes.'
        : 'Habilitar un entrenador va a aumentar las opciones de registro de clientes.',
        theme: DialogThemeEnum.Info,
        action: (confirm): void => {
          if (confirm) {
            let request: Observable<any> = this.typeList === EventActionEnum.Enable
            ? this.coachApi.disableCoach(event.row.personId)
            : this.coachApi.enableCoach(event.row.personId);

            request.subscribe({
              next: () => {
                this.notification.alert({
                  message: 'Se ha completado la operación',
                  theme: DialogThemeEnum.Success
                });

                this.loadCoaches(); 
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
    } else if (
      event.action === EventActionEnum.Update
    ) {
      this.router.navigate(['/application/coaches/save/' + event.row.personId]);
    } else if (
      event.action === EventActionEnum.Schedules
    ) {
      this.router.navigate(['/application/coaches/schedules/' + event.row.personId]);
    }
  }

  handlePagination (page: PageEvent): void {
    this.pageNumber.set(page.pageIndex);
    this.pageSize.set(page.pageSize);

    this.loadCoaches();
  }

  handleFilters (filters: any): void {
    this.currentFilters.set(filters);
    this.pageNumber.set(0);

    this.loadCoaches();
  }

  
}
