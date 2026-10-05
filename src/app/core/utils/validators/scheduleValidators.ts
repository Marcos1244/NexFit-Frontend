import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class ScheduleValidators {

  static validTimeFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(control.value) ? null : { invalidTimeFormat: { value: control.value } };
    };
  }

  static withinAllowedTimeRanges(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const time = control.value as string;
      const [hours, minutes] = time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;

      const inRange1 = totalMinutes >= 540 && totalMinutes <= 660;
      const inRange2 = totalMinutes >= 840 && totalMinutes <= 1080;

      return (inRange1 || inRange2) ? null : { outsideAllowedRange: { value: control.value } };
    };
  }

  static startTimeBeforeEndTime(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startTime = group.get('startTime')?.value;
      const endTime = group.get('endTime')?.value;

      if (!startTime || !endTime) return null;

      const startTotal = ScheduleValidators.timeToMinutes(startTime);
      const endTotal = ScheduleValidators.timeToMinutes(endTime);

      return startTotal >= endTotal ? { startTimeAfterEndTime: true } : null;
    };
  }

  private static timeToMinutes(time: string): number {
    if (!time || typeof time !== 'string') return 0;
    const parts = time.split(':');
    return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
  }
}