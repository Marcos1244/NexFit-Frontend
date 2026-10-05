import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DynamicDialogComponent } from '../components/dyanmic-dialog/dyanmic-dialog.component';
import { DialogTypeEnum } from '../enums/DialogType.enum';
import { DialogThemeEnum } from '../enums/DialogTheme.enum';
import { Router } from '@angular/router';
import DialogConfig from '../models/dialogConfig.model';

@Service()
export class NotificationService {
  private dialog: MatDialog = inject(MatDialog);
  private router: Router = inject(Router);

  error(message: string, options?: { returnTo: string }): void {
    const dialogRef = this.dialog.open(DynamicDialogComponent, {
      width: '450px',
      data: {
        title: 'Parece que hubo un error.',
        message,
        type: DialogTypeEnum.Alert,
        theme: DialogThemeEnum.Danger,
        acceptText: 'Ok',
      },
    });

    if (options?.returnTo) {
      dialogRef.afterClosed().subscribe(() => {
        this.router.navigate([options.returnTo!]);
      });
    }
  }

  confirm (info: {message: string, theme: DialogThemeEnum, action: (confirm: any) => void }) {
    this.display({
      title: '¿Está seguro?',
      message: info.message,
      type: DialogTypeEnum.Confirm,
      theme: info.theme,
      acceptText: 'Aceptar',
      cancelText: 'Cancelar'
    }, info.action);
  }

  alert (info: { message: string, theme: DialogThemeEnum, returnTo?: string }) {
    let title: string = '';

    if (info.theme === DialogThemeEnum.Danger) {
      title = 'Se ha producido un error.';
    } else {
      title = 'Se ha completado la operación.';
    }

    this.display({
      title,
      message: info.message,
      type: DialogTypeEnum.Alert,
      theme: info.theme,
      acceptText: 'De acuerdo'
    }, () => {
      if (info.returnTo) {
        this.router.navigate([info.returnTo]);
      }
    });
  }

  private display (
    data: DialogConfig,
    action?: any
  ): void {
    const dialogRef = this.dialog.open(DynamicDialogComponent, {
      width: '450px',
      data
    });

    if (action !== undefined && action !== null) {
      dialogRef.afterClosed().subscribe(action);
    }
  }
}
