import { FormBuilder, FormGroup, ReactiveFormsModule,AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Component, inject, input, output, effect } from '@angular/core';
import TableActionConfig from '../../models/tableActionConfig.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import TableFormConfig from '../../models/TableFormConfig.model';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import TableFilterConfig from '../../models/tableFilterConfig.model';
import { DatePipe } from '@angular/common';
import { FieldColumnTypeEnum } from '../../enums/FieldColumnType.enum';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ContentChild, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatOption,
    MatSelect,
    MatTooltip,
    DatePipe,
    MatDatepickerModule,
    MatNativeDateModule,
    NgTemplateOutlet
  ],
  selector: 'app-dynamic-table',
  styleUrl: './dynamic-table.component.css',
  templateUrl: './dynamic-table.component.html',
})
export class DynamicTableComponent {
  private formBuilder: FormBuilder = inject(FormBuilder);

  @ContentChild('customCell') customCellTemplate!: TemplateRef<any>;

  totalElements = input.required<number>();
  totalPages = input<number>();
  pageSize = input<number>(10);
  pageIndex = input<number>(0);

  columns = input.required<Array<TableFormConfig>>();

  filters = input<Array<TableFilterConfig>>();
  actions = input<Array<TableActionConfig>>();
  data = input.required<Array<any>>();

  renderCell = output<{ col: TableFormConfig; row: any; templateRef: any }>();

  onAction = output<{ action: string; row: any }>();
  onPaginate = output<PageEvent>();
  onFilter = output<any>();

  formGroup: FormGroup = this.formBuilder.group({});

  FieldColumnTypeEnum = FieldColumnTypeEnum;

  constructor() {
    effect((): void => {
      const currentFilters = this.filters();

      Object.keys(this.formGroup.controls).forEach(controlName => {
        if (!currentFilters?.some(f => f.key === controlName)) {
          this.formGroup.removeControl(controlName);
        }
      });

      currentFilters?.forEach((filter) => {
        if (!this.formGroup.contains(filter.key)) {
          this.formGroup.addControl(filter.key, this.formBuilder.control(''));
        }
      });

      const rangeValidator = this.buildRangeValidator(currentFilters!);
      if (rangeValidator) {
        this.formGroup.setValidators(rangeValidator);
      } else {
        this.formGroup.clearValidators();
      }
      this.formGroup.updateValueAndValidity();
    });
  }

  getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return '-';
    
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    
    if (value === null || value === undefined) return '-';
    if (value instanceof Date) return value.toLocaleDateString('es-ES');
    
    return value;
  }

  get displayedColumns(): Array<string> {
    const baseColumns = this.columns().map((col: TableFormConfig): string => col.key);
    
    if (this.actions()?.length) {
      return [...baseColumns, 'actions'];
    }
    
    return baseColumns;
  }

  applyFilter(): void {
    if (this.formGroup.invalid) return;

    const filterValues = { ...this.formGroup.value };

    Object.keys(filterValues).forEach((key) => {
      const value = filterValues[key];

      if (value === null || value === '' || value === undefined) {
        return;
      }

      if (this.isDateValue(value, key)) {
        filterValues[key] = this.formatDateOnly(value);
      }
    });

    const cleanFilter = Object.fromEntries(
      Object.entries(filterValues).filter(
        ([_, value]: [string, unknown]): boolean =>
          value !== null && value !== '' && value !== undefined
      )
    );

    this.onFilter.emit(cleanFilter);
  }


  clearFilter(): void {
    this.formGroup.reset();
    this.onFilter.emit({});
  }

  getMinDate(filter: TableFilterConfig): Date | null {
    if (!filter.minDateKey) return null;
    const value = this.formGroup.get(filter.minDateKey)?.value;
    return value ? new Date(value) : null;
  }

  getMaxDate(filter: TableFilterConfig): Date | null {
    if (!filter.maxDateKey) return null;
    const value = this.formGroup.get(filter.maxDateKey)?.value;
    return value ? new Date(value) : null;
  }

  private buildRangeValidator(filters: TableFilterConfig[]): ValidatorFn | null {
    const dateFilters = filters.filter(f => f.type === 'date' && (f.minDateKey || f.maxDateKey));
    const timeFilters = filters.filter(f => f.type === 'time' && (f.minTimeKey || f.maxTimeKey));

    if (dateFilters.length === 0 && timeFilters.length === 0) return null;

    return (control: AbstractControl): ValidationErrors | null => {
      let hasError = false;


      for (const filter of dateFilters) {
        const currentControl = control.get(filter.key);
        if (!currentControl?.value) continue;

        const currentDate = new Date(currentControl.value);

        if (filter.minDateKey) {
          const minControl = control.get(filter.minDateKey);
          if (minControl?.value && currentDate < new Date(minControl.value)) {
            currentControl.setErrors({ dateRangeMin: true });
            hasError = true;
          } else {
            this.clearSpecificError(currentControl!, 'dateRangeMin');
          }
        }

        if (filter.maxDateKey) {
          const maxControl = control.get(filter.maxDateKey);
          if (maxControl?.value && currentDate > new Date(maxControl.value)) {
            currentControl.setErrors({ dateRangeMax: true });
            hasError = true;
          } else {
            this.clearSpecificError(currentControl!, 'dateRangeMax');
          }
        }
      }

      for (const filter of timeFilters) {
        const currentControl = control.get(filter.key);
        const currentValue = currentControl?.value as string;
        if (!currentValue) continue;

        if (filter.minTimeKey) {
          const minControl = control.get(filter.minTimeKey);
          const minValue = minControl?.value as string;
          if (minValue && currentValue < minValue) {
            currentControl?.setErrors({ timeRangeMin: true });
            hasError = true;
          } else {
            this.clearSpecificError(currentControl!, 'timeRangeMin');
          }
        }

        if (filter.maxTimeKey) {
          const maxControl = control.get(filter.maxTimeKey);
          const maxValue = maxControl?.value as string;
          if (maxValue && currentValue > maxValue) {
            currentControl?.setErrors({ timeRangeMax: true });
            hasError = true;
          } else {
            this.clearSpecificError(currentControl!, 'timeRangeMax');
          }
        }
      }

      return hasError ? { range: true } : null;
    };
  }

  private clearSpecificError(control: AbstractControl, errorKey: string): void {
    const errors = control.errors;
    if (errors && errors[errorKey]) {
      delete errors[errorKey];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }

  private isDateValue(value: any, key: string): boolean {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return true;
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return true;
    }

    if (key.toLowerCase().endsWith('date')) {
      return true;
    }

    return false;
  }

  private formatDateOnly(value: any): string {
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) return String(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch {
      return String(value);
    }
  }
}
