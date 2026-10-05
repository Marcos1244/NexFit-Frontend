import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import { DynamicTableComponent } from '../../../../ui/components/dynamic-table/dynamic-table.component';
import { UserApiService } from '../../services/user-api.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import TableFormConfig from '../../../../ui/models/TableFormConfig.model';
import { RoleEnum } from '../../../../core/enums/role.enum';
import { FieldColumnTypeEnum } from '../../../../ui/enums/FieldColumnType.enum';
import TableActionConfig from '../../../../ui/models/tableActionConfig.model';
import User from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/security/auth/services/auth.service';
import { EventActionEnum } from '../../../../ui/enums/EventAction.enum';
import { MatDialog } from '@angular/material/dialog';
import { DynamicDialogComponent } from '../../../../ui/components/dyanmic-dialog/dyanmic-dialog.component';
import { DialogTypeEnum } from '../../../../ui/enums/DialogType.enum';
import { DialogThemeEnum } from '../../../../ui/enums/DialogTheme.enum';
import MessageError from '../../../../core/dto/messageError.dto';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import TableFilterConfig from '../../../../ui/models/tableFilterConfig.model';

@Component({
  imports: [ModuleLayoutComponent, DynamicTableComponent],
  selector: 'app-user-list',
  styleUrl: './user-list.component.css',
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  private userApi: UserApiService = inject(UserApiService);
  private dialog: MatDialog = inject(MatDialog);
  private router: Router = inject(Router);
  private auth: AuthService = inject(AuthService);

  currentUrl: string = this.router.url;
  typeList: string | undefined = this.currentUrl.split('/').at(-1);

  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  pageNumber = signal<number>(0);
  currentFilters = signal<any>({});
  users = signal<Array<any>>([]);

  readonly menuElements: Array<MenuElementConfig> = [
    {
      label: 'Crear',
      route: '/application/users/save',
    },
    {
      label: 'Listar Activos',
      route: '/application/users/list/enable',
    },
    {
      label: 'Listar Inactivos',
      route: '/application/users/list/disable',
    },
  ];

  readonly columns: Array<TableFormConfig> = [
    {
      key: 'ci',
      label: 'Cédula',
      type: FieldColumnTypeEnum.Text
    },
    {
      key: 'name',
      label: 'Nombre',
      type: FieldColumnTypeEnum.Text
    },
    {
      key: 'lastname',
      label: 'Apellido',
      type: FieldColumnTypeEnum.Text
    },
    {
      key: 'role',
      label: 'Rol',
      type: FieldColumnTypeEnum.Select,
      options: [
        {
          label: 'Administrador',
          value: RoleEnum.ADMINISTRATOR,
        },
        {
          label: 'Supervisor',
          value: RoleEnum.SUPERVISOR,
        },
      ],
    },
  ];

  filters: Array<TableFilterConfig> = [
    {
      key: 'ci',
      label: 'Cédula',
      type: FieldColumnTypeEnum.Text
    },
    {
      key: 'name',
      label: 'Nombre',
      type: FieldColumnTypeEnum.Text
    },
    {
      key: 'lastname',
      label: 'Apellido',
      type: FieldColumnTypeEnum.Text
    },
    {
      key: 'role',
      label: 'Rol',
      type: FieldColumnTypeEnum.Select,
      options: [
        {
          label: 'Administrador',
          value: RoleEnum.ADMINISTRATOR,
        },
        {
          label: 'Supervisor',
          value: RoleEnum.SUPERVISOR,
        },
      ],
    },
  ];

  actions: Array<TableActionConfig> = [];

  ngOnInit() {
    if (this.typeList === EventActionEnum.Enable) {
      this.actions.push({
        name: EventActionEnum.Update,
        icon: 'edit',
        tooltip: 'Actualizar usuario',
        colorClass: '!text-interactivo',
        disabledIf: (row: User) =>
          row.ci === this.auth.sub() || !this.auth.hasAnyRole([RoleEnum.ADMINISTRATOR]),
      });

      this.actions.push({
        name: EventActionEnum.Disable,
        icon: 'block',
        tooltip: 'Inhabilitar usuario',
        colorClass: '!text-red-500',
        disabledIf: (row: User): boolean =>
          row.ci === this.auth.sub() || !this.auth.hasAnyRole([RoleEnum.ADMINISTRATOR]),
      });

    } else {
      this.actions.push({
        name: EventActionEnum.Enable,
        icon: 'check_circle',
        tooltip: 'Habilitar usuario',
        colorClass: '!text-green-500',
        disabledIf: (row: User): boolean => !this.auth.hasAnyRole([RoleEnum.ADMINISTRATOR]),
      });

    }

    this.loadUsers();
  }

  handleAction(event: { action: string; row: User }) {
    if (event.action === EventActionEnum.Disable || event.action === EventActionEnum.Enable) {
      const dialogRef = this.dialog.open(DynamicDialogComponent, {
        width: '450px',
        data: {
          title: this.typeList === EventActionEnum.Enable
            ? 'Inhabilitar usuario.'
            : 'Habilitar usuario.',
          message:
            this.typeList === EventActionEnum.Enable
              ? `¿Estás seguro que deseas inhabilitar al usuario ${event.row.name}?`
              : `¿Estás seguro que deseas habilitar al usuario ${event.row.name}?`,
          type: DialogTypeEnum.Confirm,
          theme: this.typeList === EventActionEnum.Enable
          ? DialogThemeEnum.Danger
          : DialogThemeEnum.Info,
          acceptText: this.typeList === EventActionEnum.Enable
            ? 'Inhabilitar'
            : 'Habilitar',
        },
      });

      dialogRef.afterClosed().subscribe((confirm) => {
        if (confirm) {
          let subscribed;

          if (this.typeList === EventActionEnum.Enable) {
            subscribed = this.userApi.disableUser(event.row.personId)
          } else {
            subscribed = this.userApi.enableUser(event.row.personId);
          }

          subscribed.subscribe({
            next: (): void => {
              this.loadUsers();
            },
            error: (err: MessageError): void => {
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
            },
          });
        }
      });
    } else if (event.action === EventActionEnum.Update) {
      this.router.navigateByUrl('/application/users/save/'+ event.row.personId);
    }
  }

  loadUsers(): void {
    this.userApi
      .getAllUsers(
        this.pageNumber(),
        this.pageSize(),
        this.typeList === EventActionEnum.Enable,
        this.currentFilters(),
      )
      .subscribe({
        next: (res) => {
          this.users.set(res.content);
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
        },
      });
  }

  handlePagination(event: PageEvent) {
    this.pageNumber.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  handleFilters(filters: any) {
    this.currentFilters.set(filters);
    this.pageNumber.set(0);
    this.loadUsers();
  }
}
