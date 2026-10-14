import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Enviroment } from '../../../../../enviroment';
import CreateContributionDto from '../dto/createContribution.dto';
import Contribution from '../../../core/models/contribution.model';
import PaginationResultDto from '../../../core/dto/PaginationResult.dto';
import { Observable } from 'rxjs/internal/Observable';
import { ContributionStatus } from '../../../core/enums/contributionStatus.enum';

@Service()
export class ContributionApiService {
    private http: HttpClient = inject(HttpClient);

    private API_ROUTE: string = Enviroment.API + 'contributions';

    public saveContribution (dto: CreateContributionDto): Observable<Contribution> {
        return this.http.post<Contribution>(this.API_ROUTE, dto);
    }

    public getAllContributions (
        pageNumber: number,
        pageSize: number,
        status: ContributionStatus,
        filters: any = {}
    ): Observable<PaginationResultDto<Contribution>> {
        let params = new HttpParams()
            .set('pageNumber', pageNumber)
            .set('pageSize', pageSize)
            .set('status', status);


        for (const key in filters) {
            const value = filters[key];

            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, value);
            }
        }

        return this.http.get<PaginationResultDto<Contribution>>(this.API_ROUTE, { params });
    }

    public approveContribution (contributionId: number): Observable<any> {
        return this.http.patch(`${this.API_ROUTE}/${contributionId}`, {});
    }
}
