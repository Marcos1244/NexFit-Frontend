import { ContributionType } from '../../../core/enums/contributionType.enum';

export default interface CreateContributionDto {
    personId: number;
    reference: string;
    amount: number;
    type: ContributionType;
    scheduleId?: number;
}