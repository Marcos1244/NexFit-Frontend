// ui/components/dynamic-form/dynamic-form.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import TableFormConfig from '../../models/TableFormConfig.model';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatFormFieldModule, MatSuffix } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FieldColumnTypeEnum } from '../../enums/FieldColumnType.enum';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule
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
  onAutocompleteSearch = output<{ fieldKey: string; term: string }>();

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
    if (errors['min']) return field.errorMessages?.['min'] || `El valor mínimo es ${errors['min'].min}`;

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

  /**
   * Función de comparación para selects con objetos enriquecidos.
   */
  compareOptions(o1: any, o2: any): boolean {
    if (o1 === o2) return true;
    if (!o1 || !o2) return false;
    
    const id1 = typeof o1 === 'object' ? o1.value : o1;
    const id2 = typeof o2 === 'object' ? o2.value : o2;
    
    return id1 === id2;
  }

  /**
   * Obtiene el color de estado como clase de Tailwind.
   */
  getStatusColorClass(color?: string): string {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
      case 'gray': return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  }

  /**
   * Función de display para autocomplete.
   */
  displayWithOption(option: any): string {
    if (!option) return '';
    if (typeof option === 'string') return option;
    return option.label || '';
  }

  /**
   * Maneja el evento de búsqueda en autocomplete.
   */
  onSearchInput(fieldKey: string, event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.onAutocompleteSearch.emit({ fieldKey, term });
  }

  protected readonly FieldColumnTypeEnum = FieldColumnTypeEnum;
}