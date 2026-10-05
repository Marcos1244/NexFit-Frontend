import { DaysOfWeekEnum } from "../../../core/enums/daysOfWeek.enum";

export default interface CreateScheduleDto {
    startTime: Date;
    endTime: Date;
}