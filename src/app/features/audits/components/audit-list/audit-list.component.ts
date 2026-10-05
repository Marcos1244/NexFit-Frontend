import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import { DynamicTableComponent } from '../../../../ui/components/dynamic-table/dynamic-table.component';
import { Component, inject, signal, OnInit } from '@angular/core';
import { AuditApiService } from '../../services/audit-api.service';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import TableActionConfig from '../../../../ui/models/tableActionConfig.model';
import Audit from '../../../../core/models/audit.model';
import PaginationResponseDto from '../../../../core/dto/PaginationResult.dto';
import { PageEvent } from '@angular/material/paginator';
import MessageError from '../../../../core/dto/messageError.dto';
import { DynamicDialogComponent } from '../../../../ui/components/dyanmic-dialog/dyanmic-dialog.component';
import { DialogTypeEnum } from '../../../../ui/enums/DialogType.enum';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import { MatDialog } from '@angular/material/dialog';
import { ModuleEnum } from '../../../../core/enums/module.enum';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import SelectOption from '../../../../ui/models/selectOption.model';
import { ActionEnum } from '../../../../core/enums/action.enum';
import TableFilterConfig from '../../../../ui/models/tableFilterConfig.model';

@Component({
  imports: [
    DynamicTableComponent,
    ModuleLayoutComponent,
  ],
  selector: 'app-audit-list',
  styleUrl: './audit-list.component.css',
  templateUrl: './audit-list.component.html',
})
export class AuditList implements OnInit {
  private auditApi: AuditApiService = inject(AuditApiService);
  private dialog: MatDialog = inject(MatDialog);

  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  pageNumber = signal<number>(0);
  currentFilters = signal<any>({});
  audits = signal<Array<Audit>>([]);

  readonly menuElements: Array<MenuElementConfig> = [];

  readonly columns: Array<TableFormConfig> = [
    {
      key: 'user.ci',
      label: 'Cédula',
    },
    {
      key: 'user.name',
      label: 'Nombre'
    },
    {
      key: 'user.lastname',
      label: 'Apellido'
    },
    {
      key: 'module',
      label: 'Módulo',
      type: FieldColumnTypeEnum.Select,
      options: Object.values(ModuleEnum).map((module: ModuleEnum): SelectOption => ({
        label: module,
        value: module
      }))
    },
    {
      key: 'action',
      label: 'Acción',
      type: FieldColumnTypeEnum.Select,
      options: Object.values(ActionEnum).map((action: ActionEnum): SelectOption => ({
        label: action,
        value: action
      }))
    },
    {
      key: 'details',
      label: 'Detalles'
    },
    {
      key: 'date',
      label: 'Fecha',
      type: FieldColumnTypeEnum.Date
    }
  ];

  readonly filters: Array<TableFilterConfig> = [
    { 
      key: 'user.ci', 
      label: 'Cédula', 
      type: FieldColumnTypeEnum.Text
    },
    {
      key: 'user.name',
      label: 'Nombre',
      type: FieldColumnTypeEnum.Text
    },
    {
      key: 'user.lastname',
      label: 'Apellido',
      type: FieldColumnTypeEnum.Text
    },
    { 
      key: 'module', 
      label: 'Módulo', 
      type: FieldColumnTypeEnum.Select,
      options: Object.values(ModuleEnum).map((module: ModuleEnum): SelectOption => ({
        label: module,
        value: module
      }))
    },
    { 
      key: 'action', 
      label: 'Acción', 
      type: FieldColumnTypeEnum.Select,
      options: Object.values(ActionEnum).map((action: ActionEnum): SelectOption => ({
        label: action,
        value: action
      }))
    },
    { key: 'startDate', label: 'Fecha Inicio', type: FieldColumnTypeEnum.Date, maxDateKey: 'endDate' },
    { key: 'endDate', label: 'Fecha Fin', type: FieldColumnTypeEnum.Date, minDateKey: 'startDate' },
  ];

  actions: Array<TableActionConfig> = [];

  ngOnInit (): void {
    this.loadAudits();
  }

  loadAudits () {
    this.auditApi.getAllAudits(
      this.pageNumber(),
      this.pageSize(),
      this.currentFilters()
    ).subscribe({
      next: (res: PaginationResponseDto<Audit>) => {
        this.audits.set(res.content);
        this.totalElements.set(res.totalElements);
      },
      error: (err: MessageError) => {
        this.dialog.open(DynamicDialogComponent, {
          width: '450px',
          data: {
            title: 'Parece que hubo un error.',
            message: err.message,
            type: DialogTypeEnum.Alert,
            theme: DialogThemeEnum.Info,
            acceptText: 'Ok',
          },
        });
      }
    });
  }

  handleAction (event: { action: string; row: Audit }): void {}

  handlePagination(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAudits();
  }

  handleFilters(filters: any): void {
    this.currentFilters.set(filters);
    this.pageNumber.set(0);
    this.loadAudits();
  }
}
