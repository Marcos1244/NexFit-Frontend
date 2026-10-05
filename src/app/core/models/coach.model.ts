import Schedule from './schedule.model';

export default interface Coach {
  personId: number;
  ci: string;
  name: string;
  lastname: string;
  schedules: Array<Schedule>
}
