import { DaysOfWeekEnum } from "../../../core/enums/daysOfWeek.enum";

export default interface UpdateScheduleDto {
    scheduleId: number;
    startTime: Date;
    endTime: Date;
}