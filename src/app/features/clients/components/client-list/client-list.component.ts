// features/client/components/client-list/client-list.component.ts
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ClientApiService } from '../../services/client-api.service';
import { NotificationService } from '../../../../ui/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
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
import { EnableClientDialogComponent, EnableClientDialogResult } from '../enable-client-dialog/enable-client-dialog.component';

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
  private dialog: MatDialog = inject(MatDialog);
  private route: ActivatedRoute = inject(ActivatedRoute);

  clients: WritableSignal<Array<Client>> = signal<Array<Client>>([]);
  totalElements: WritableSignal<number> = signal<number>(0);
  pageNumber: WritableSignal<number> = signal<number>(0);
  pageSize: WritableSignal<number> = signal<number>(10);
  currentFilters: WritableSignal<any> = signal<any>({});
  isProcessing = signal<boolean>(false);

  private status: WritableSignal<EventActionEnum> = signal(EventActionEnum.Enable);

  readonly menuElements: Array<MenuElementConfig> = [
    { label: 'Crear', route: '/application/clients/save' },
    { label: 'Listar Activos', route: '/application/clients/list/enable' },
    { label: 'Listar Inactivos', route: '/application/clients/list/disable' },
    { label: 'Listar Pendientes', route: '/application/clients/list/pending' }
  ];

  private readonly baseColumns: Array<TableFormConfig> = [
    { key: 'ci', label: 'Cédula' },
    { key: 'name', label: 'Nombre' },
    { key: 'lastname', label: 'Apellido' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'coach.name', label: 'Entrenador' }
  ];

  private readonly baseFilters: Array<TableFilterConfig> = [
    { key: 'ci', label: 'Cédula' },
    { key: 'name', label: 'Nombre' },
    { key: 'lastname', label: 'Apellido' }
  ];

  tableColumns: Array<TableFormConfig> = [];
  filters: Array<TableFilterConfig> = [];
  tableActions: Array<TableActionConfig> = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const statusParam = params.get('status');

      this.configureView(statusParam);
      this.pageNumber.set(0);
      this.currentFilters.set({}); 
      this.loadClients();
    });
  }


  private configureView(statusParam: string | null): void {
    switch (statusParam) {
      case EventActionEnum.Enable:
        this.status.set(EventActionEnum.Enable);
        
        this.tableColumns = [
          ...this.baseColumns,
          { key: 'schedule.startTime', label: 'Hora' }
        ];
        
        this.filters = [
          ...this.baseFilters,
          { key: 'startTime', label: 'Hora Inicio', type: FieldColumnTypeEnum.Time },
          { key: 'endTime', label: 'Hora Fin', type: FieldColumnTypeEnum.Time }
        ];

        this.tableActions = [
          { icon: 'edit', name: EventActionEnum.Update, tooltip: 'Actualizar cliente', colorClass: '!text-yellow-600' },
          { icon: 'block', name: EventActionEnum.Disable, tooltip: 'Inhabilitar cliente', colorClass: '!text-red-500' }
        ];
        break;

      case EventActionEnum.Disable:
        this.status.set(EventActionEnum.Disable);
        
        this.tableColumns = [...this.baseColumns];
        this.filters = [...this.baseFilters];
        
        this.tableActions = [
          { icon: 'check_circle', name: EventActionEnum.Enable, tooltip: 'Habilitar cliente', colorClass: '!text-green-500' }
        ];
        break;

      case EventActionEnum.Pending:
        this.status.set(EventActionEnum.Pending);
        
        this.tableColumns = [...this.baseColumns,
          { key: 'schedule.startTime', label: 'Hora' }
        ];
        this.filters = [...this.baseFilters,
          { key: 'startTime', label: 'Hora Inicio', type: FieldColumnTypeEnum.Time },
          { key: 'endTime', label: 'Hora Fin', type: FieldColumnTypeEnum.Time }
        ];
        
        this.tableActions = [
          { icon: 'edit', name: EventActionEnum.Update, tooltip: 'Actualizar cliente', colorClass: '!text-yellow-600' },
          { icon: 'block', name: EventActionEnum.Disable, tooltip: 'Inhabilitar cliente', colorClass: '!text-red-500' }
        ];
        break;

      default:
        this.status.set(EventActionEnum.Enable);
        this.tableColumns = [...this.baseColumns];
        this.filters = [...this.baseFilters];
        this.tableActions = [];
        break;
    }
  }

  loadClients(): void {
    this.clientApi.getAllClients(
      this.pageNumber(),
      this.pageSize(),
      this.status() === EventActionEnum.Enable, 
      this.status() === EventActionEnum.Pending, 
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

  handleAction(event: { action: string, row: Client }): void {
    switch (event.action) {
      case EventActionEnum.Disable:
        this.handleDisable(event.row);
        break;
      case EventActionEnum.Enable:
        this.handleEnable(event.row);
        break;
      case EventActionEnum.Update:
        this.router.navigate(['/application/clients/save/' + event.row.personId]);
        break;
    }
  }

  private handleDisable(client: Client): void {
    this.notification.confirm({
      message: '¿Está seguro que desea inhabilitar este cliente?',
      theme: DialogThemeEnum.Info,
      action: (confirm) => {
        if (confirm) {
          this.clientApi.disableClient(client.personId).subscribe({
            next: () => {
              this.notification.alert({
                message: 'Cliente inhabilitado correctamente.',
                theme: DialogThemeEnum.Success
              });
              this.loadClients();
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

  private handleEnable(client: Client): void {
    const dialogRef = this.dialog.open<EnableClientDialogComponent, any, EnableClientDialogResult | null>(
      EnableClientDialogComponent,
      {
        data: {
          personId: client.personId,
          clientName: `${client.name} ${client.lastname}`
        },
        width: '550px',
        maxWidth: '95vw',
        disableClose: true,
        autoFocus: true
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.scheduleId) {
        this.isProcessing.set(true);
        this.clientApi.enableClient(client.personId, result.scheduleId).subscribe({
          next: () => {
            this.isProcessing.set(false);
            this.notification.alert({
              message: 'Cliente habilitado correctamente con el nuevo horario asignado.',
              theme: DialogThemeEnum.Success
            });
            this.loadClients();
          },
          error: (info: { error: MessageError }) => {
            this.isProcessing.set(false);
            this.notification.alert({
              message: info.error.message,
              theme: DialogThemeEnum.Danger
            });
          }
        });
      }
    });
  }

  handlePagination(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadClients();
  }

  handleFilters(filters: any): void {
    this.currentFilters.set(filters);
    this.pageNumber.set(0);
    this.loadClients();
  }
}