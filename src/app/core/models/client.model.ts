import Schedule from './schedule.model';
import Coach from './coach.model';

export default interface Client {
  personId: number;
  ci: string;
  name: string;
  lastname: string;
  phone: string;
  coach: Coach | null;
  schedule: Schedule | null;
}
