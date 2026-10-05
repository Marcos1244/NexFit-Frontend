import { ContributionType } from '../enums/contributionType.enum';
import Person from './person.model';

export default interface Contribution {
  contributionId: number;
  reference: string;
  amount: number;
  type: ContributionType;
  date: Date;
  expiration: Date;

  person: Person;
}
