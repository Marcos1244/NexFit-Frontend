import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import DialogConfig from '../../models/dialogConfig.model';
import { MatIconModule } from '@angular/material/icon';
import { Component, inject } from '@angular/core';
import { DialogThemeEnum } from '../../enums/DialogTheme.enum';
import { DialogTypeEnum } from '../../enums/DialogType.enum';

@Component({
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  selector: 'app-dyanmic-dialog',
  styleUrl: './dyanmic-dialog.component.css',
  templateUrl: './dyanmic-dialog.component.html',
})
export class DynamicDialogComponent {
  readonly dialogRef: MatDialogRef<DynamicDialogComponent> = inject(MatDialogRef<DynamicDialogComponent>);
  readonly data: DialogConfig = inject<DialogConfig>(MAT_DIALOG_DATA);

  onAccept (): void {
    this.dialogRef.close(true);
  }

  onCancel (): void {
    this.dialogRef.close(false);
  }

  protected readonly DialogTypeEnum = DialogTypeEnum;
  protected readonly DialogThemeEnum = DialogThemeEnum;
}
