import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import TableFormConfig from '../../models/TableFormConfig.model';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FieldColumnTypeEnum } from '../../enums/FieldColumnType.enum';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  selector: 'app-dynamic-form',
  styleUrl: './dynamic-form.component.css',
  templateUrl: './dynamic-form.component.html',
})
export class DynamicFormComponent {
  title = input.required<string>();
  fields = input.required<Array<TableFormConfig>>();
  formGroup = input.required<FormGroup>();

  onSubmit = output<void>();
  onCancel = output<void>();

  getControl(key: string) {
    return this.formGroup().get(key);
  }

  shouldShowError(fieldKey: string): boolean {
    const control = this.formGroup().get(fieldKey);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(field: TableFormConfig): string {
    const control = this.getControl(field.key);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return field.errorMessages?.['required'] || 'Este campo es obligatorio';
    if (errors['minlength']) return field.errorMessages?.['minlength'] || `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return field.errorMessages?.['maxlength'] || `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['pattern']) return field.errorMessages?.['pattern'] || 'Formato inválido';

    return 'El valor ingresado no es válido';
  }

  getGroupErrorMessage(field: TableFormConfig): string | null {
    const groupErrors = this.formGroup().errors;
    if (!groupErrors) return null;

    const control = this.getControl(field.key);
    if (!control || (!control.touched && !control.dirty)) return null;

    if (groupErrors['startTimeAfterEndTime'] && field.key === 'endTime') {
      return field.errorMessages?.['startTimeAfterEndTime'] || 'La hora de fin debe ser posterior a la hora de inicio.';
    }

    return null;
  }


  getStatusColorClass(color?: string): string {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
      case 'gray': return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  }


  formatOptionLabel(option: any): string {
    if (!option) return '';
    return option.label || String(option);
  }

  compareOptions(o1: any, o2: any): boolean {
    if (!o1 || !o2) return o1 === o2;
    
    const id1 = typeof o1 === 'object' ? o1.value : o1;
    const id2 = typeof o2 === 'object' ? o2.value : o2;
    
    return id1 === id2;
  }

  protected readonly FieldColumnTypeEnum = FieldColumnTypeEnum;
}