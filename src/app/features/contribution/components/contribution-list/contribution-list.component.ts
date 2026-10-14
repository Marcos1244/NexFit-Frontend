import { Component, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ContributionApiService } from '../../services/contribution-api.service';
import { NotificationService } from '../../../../ui/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import Contribution from '../../../../core/models/contribution.model';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import TableFilterConfig from '../../../../ui/models/tableFilterConfig.model';
import TableActionConfig from '../../../../ui/models/tableActionConfig.model';
import { EventActionEnum } from '../../../../ui/enums/EventAction.enum';
import MessageError from '../../../../core/dto/messageError.dto';
import PaginationResultDto from '../../../../core/dto/PaginationResult.dto';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import { PageEvent } from '@angular/material/paginator';
import { DynamicTableComponent } from '../../../../ui/components/dynamic-table/dynamic-table.component';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import { AuthService } from '../../../../core/security/auth/services/auth.service';
import { RoleEnum } from '../../../../core/enums/role.enum';
import { ContributionStatus } from '../../../../core/enums/contributionStatus.enum';

@Component({
  imports: [
    DynamicTableComponent,
    ModuleLayoutComponent
  ],
  selector: 'app-contribution-list.component',
  styleUrl: './contribution-list.component.css',
  templateUrl: './contribution-list.component.html',
})
export class ContributionListComponent implements OnInit {
  private contributionApi: ContributionApiService = inject(ContributionApiService);
  private notification: NotificationService = inject(NotificationService);
  private router: Router = inject(Router);
  private auth: AuthService = inject(AuthService);
  private route: ActivatedRoute = inject(ActivatedRoute);

  contributions: WritableSignal<Array<Contribution>> = signal<Array<Contribution>>([]);
  totalElements: WritableSignal<number> = signal<number>(0);
  pageNumber: WritableSignal<number> = signal<number>(0);
  pageSize: WritableSignal<number> = signal<number>(10);
  currentFilters: WritableSignal<any> = signal<any>({});

  private status: WritableSignal<ContributionStatus> = signal(ContributionStatus.Active);

  readonly menuElements: Array<MenuElementConfig> = [
    { label: 'Crear', route: '/application/contributions/save' },
    { label: 'Listar Aprobados', route: '/application/contributions/list/enable' },
    { label: 'Listar No Aprobados', route: '/application/contributions/list/pending' },
    { label: 'Listar Expirados', route: '/application/contributions/list/disable' }
  ];


  readonly tableColumns: Array<TableFormConfig>  = [
    { key: 'person.ci', label: 'Cédula' },
    { key: 'person.name', label: 'Nombre' },
    { key: 'person.lastname', label: 'Apellido' },
    { key: 'reference', label: 'Referencia' },
    { key: 'amount', label: 'Monto' },
    { key: 'date', label: 'Fecha', type: FieldColumnTypeEnum.Date },
    { key: 'expiration', label: 'Vencimiento', type: FieldColumnTypeEnum.Date },
    { key: 'type', label: 'Tipo' }
  ];

  readonly filters: Array<TableFilterConfig> = [
    { key: 'person.ci', label: 'Cédula', type: FieldColumnTypeEnum.Text },
    { key: 'person.name', label: 'Nombre', type: FieldColumnTypeEnum.Text },
    { key: 'person.lastname', label: 'Apellido', type: FieldColumnTypeEnum.Text },
    { key: 'reference', label: 'Referencia', type: FieldColumnTypeEnum.Text },
    { key: 'startDate', label: 'Fecha Inicial', type: FieldColumnTypeEnum.Date },
    { key: 'endDate', label: 'Fecha Final', type: FieldColumnTypeEnum.Date },
    { key: 'type', label: 'Tipo', type: FieldColumnTypeEnum.Select, options: [
      { value: 'MENSUALIDAD', label: 'Mensualidad' },
      { value: 'INSCRIPCION', label: 'Inscripción' },
      { value: 'MENSUALIDAD_INSCRIPCION', label: 'Mensualidad e Inscripción' }
    ] }
  ];

  actions: Array<TableActionConfig> = [];

  selectListType (params: string | null) {
    this.actions = [];

    switch (params) {
      case EventActionEnum.Enable:
        console.log("Activo");
        this.status.set(ContributionStatus.Active)

        break;
      case EventActionEnum.Disable:
        console.log("Inactivo")
        this.status.set(ContributionStatus.Inactive)
        break;
      case EventActionEnum.Pending:
        console.log("Pendiente")
        this.status.set(ContributionStatus.Pending)

        this.actions.push({
          icon: 'check_circle',
          name: 'enable',
          tooltip: 'Aprobar contribución',
          colorClass: '!text-green-500',
          disabledIf: () => this.auth.hasAnyRole([RoleEnum.ADMINISTRATOR])
        });

        break;
    }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      let status = params.get('status');

      this.selectListType(status);
      this.pageNumber.set(0);
      this.loadContributions();
    });
  }

  loadContributions(): void {

    this.contributionApi.getAllContributions(
      this.pageNumber(),
      this.pageSize(),
      this.status(),
      this.currentFilters()
    ).subscribe({
      next: (res: PaginationResultDto<Contribution>) => {
        this.contributions.set(res.content);
        this.totalElements.set(res.totalElements);
      },
      error: (info: { error: MessageError }) => {
        this.notification.alert({
          message: info.error.message,
          theme: DialogThemeEnum.Danger,
          returnTo: '/application/home'
        })
      }
    });
  }

  handleAction (event: { action: string, row: Contribution }): void {
    if (event.action === EventActionEnum.Disable) {
      this.notification.confirm({
        message: '¿Seguro de aprobar esta contribución?. No habrá reversión de esta acción',
        theme: DialogThemeEnum.Info,
        action: (confirm) => {
          if (!confirm)
            return;

          this.contributionApi.approveContribution(event.row.contributionId).subscribe({
            next: () => {
              this.notification.alert({
                message: 'Se ha completado la operación.',
                theme: DialogThemeEnum.Success
              });

              this.loadContributions();
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
  }


  handlePagination (page: PageEvent): void {
    this.pageNumber.set(page.pageIndex);
    this.pageSize.set(page.pageSize);
    this.loadContributions();
  }

  handleFilters (filters: any): void {
    this.currentFilters.set(filters);
    this.pageNumber.set(0);
    this.loadContributions();
  }

}
