import { DaysOfWeekEnum } from '../enums/daysOfWeek.enum';

export default interface Schedule {
  scheduleId: number;
  startTime: string;
  endTime: string;
  activeClientCount: number;
}
