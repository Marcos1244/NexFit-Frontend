import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ClientApiService } from '../../services/client-api.service';
import { NotificationService } from '../../../../ui/services/notification.service';
import { Router } from '@angular/router';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import SelectOption from '../../../../ui/models/selectOption.model';
import { DaysOfWeekEnum } from '../../../../core/enums/daysOfWeek.enum';
import TableFilterConfig from '../../../../ui/models/tableFilterConfig.model';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import Client from '../../../../core/models/client.model';
import TableActionConfig from '../../../../ui/models/tableActionConfig.model';
import { EventActionEnum } from '../../../../ui/enums/EventAction.enum';
import PaginationResultDto from '../../../../core/dto/PaginationResult.dto';
import MessageError from '../../../../core/dto/messageError.dto';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import { Observable } from 'rxjs/internal/Observable';
import { DynamicTableComponent } from '../../../../ui/components/dynamic-table/dynamic-table.component';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import { PageEvent } from '@angular/material/paginator';

@Component({
  imports: [
    ModuleLayoutComponent,
    DynamicTableComponent
  ],
  selector: 'app-client-list.component',
  styleUrl: './client-list.component.css',
  templateUrl: './client-list.component.html',
})
export class ClientListComponent implements OnInit {
  private notification: NotificationService = inject(NotificationService);
  private clientApi: ClientApiService = inject(ClientApiService);
  private router: Router = inject(Router);

  private currentUrl: string = this.router.url;
  private typeList: string | undefined = this.currentUrl.split('/').at(-1);

  clients: WritableSignal<Array<Client>> = signal<Array<Client>>([]);
  totalElements: WritableSignal<number> = signal<number>(0);
  pageNumber: WritableSignal<number> = signal<number>(0);
  pageSize: WritableSignal<number> = signal<number>(10);
  currentFilters: WritableSignal<any> = signal<any>({});
  

  readonly menuElements: Array<MenuElementConfig> = [
    { label: 'Crear', route: '/application/clients/save' },
    { label: 'Listar Activos', route: '/application/clients/list/enable' },
    { label: 'Listar Inactivos', route: '/application/clients/list/disable' }
  ];

  readonly tableColumns: Array<TableFormConfig>  = [
    { key: 'ci', label: 'Cédula' },
    { key: 'name', label: 'Nombre' },
    { key: 'lastname', label: 'Apellido' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'coach.name', label: 'Entrenador' },
    { key: 'schedule.startTime', label: 'Hora' },
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
    switch (this.typeList) {
      case EventActionEnum.Enable:
        this.tableActions.push({
          icon: 'edit',
          name: EventActionEnum.Update,
          tooltip: 'Actualizar cliente',
          colorClass: '!text-yellow-600'
        });
    
        this.tableActions.push({
          icon: 'block',
          name: EventActionEnum.Disable,
          tooltip: 'Inhabilitar cliente',
          colorClass: '!text-red-500'
        });

        break;

      case EventActionEnum.Disable:
        this.tableActions.push({
          icon: 'check_circle',
          name: EventActionEnum.Enable,
          tooltip: 'Habilitar cliente',
          colorClass: '!text-green-500'
        });

        break;
    }
    this.loadClients();
  }

  loadClients(): void {
    this.clientApi.getAllClients(
      this.pageNumber(),
      this.pageSize(),
      this.typeList === EventActionEnum.Enable,
      this.currentFilters()
    ).subscribe({
      next: (res: PaginationResultDto<Client>) => {
        this.clients.set(res.content);
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

  handleAction (event: { action: string, row: Client }): void {
    switch (event.action) {
      case EventActionEnum.Disable:
      case EventActionEnum.Enable:
        this.notification.confirm({
          message: this.typeList === EventActionEnum.Enable 
          ? '¿Está seguro que desea inhabilitar este cliente?' 
          : '¿Está seguro que desea habilitar este cliente?',
          theme: DialogThemeEnum.Info,
          action: (confirm) => {
            if (confirm) {
              let request: Observable<any> = this.typeList === EventActionEnum.Enable
                ? this.clientApi.disableClient(event.row.personId)
                : this.clientApi.enableClient(event.row.personId);

              request.subscribe({
                next: () => {
                  this.notification.alert({
                    message: 'Se ha completado la operación.',
                    theme: DialogThemeEnum.Success
                  });

                  this.loadClients();
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
          }
        });

        break;

        case EventActionEnum.Update:
          this.router.navigate(['/application/clients/save/' + event.row.personId]);
          break;
    }
  }

  handlePagination (event: PageEvent): void {
    this.pageNumber.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadClients();
  }

  handleFilters (filters: any): void {
    this.currentFilters.set(filters);
    this.pageNumber.set(0);
    this.loadClients();
  }
}
