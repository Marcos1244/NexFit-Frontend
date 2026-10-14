import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Enviroment } from '../../../../../enviroment';
import Client from '../../../core/models/client.model';
import { Observable } from 'rxjs/internal/Observable';
import CreateClientDto from '../dto/createClient.dto';
import PaginationResultDto from '../../../core/dto/PaginationResult.dto';

@Service()
export class ClientApiService {
    private http: HttpClient = inject(HttpClient);

    private API_ROUTE = Enviroment.API + 'clients';

    saveClient (dto: CreateClientDto): Observable<Client> {
        return this.http.post<Client>(this.API_ROUTE, dto);
    }

    updateClient (dto: CreateClientDto): Observable<Client> {
        return this.http.put<Client>(this.API_ROUTE, dto);
    }

    getClient (personId: number): Observable<Client> {
        return this.http.get<Client>(`${this.API_ROUTE}/${personId}`);
    }

    getAllClients (
        pageNumber: number,
        pageSize: number,
        status: boolean,
        hasPendingContribution: boolean = false,
        filters: any = {}
    ): Observable<PaginationResultDto<Client>> {
        let params = new HttpParams()
            .set('pageNumber', pageNumber)
            .set('pageSize', pageSize)
            .set('status', status)
            .set('hasPendingContribution', hasPendingContribution);

        Object.keys(filters).forEach((key) => {
            const value = filters[key];

            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value);
            }
        });

        return this.http.get<PaginationResultDto<Client>>(this.API_ROUTE, { params });
    }

    disableClient (personId: number): Observable<any> {
        return this.http.patch(`${this.API_ROUTE}/disable/${personId}`, {});
    }

    enableClient (personId: number, scheduleId: number): Observable<any> {
        return this.http.patch(`${this.API_ROUTE}/enable/${personId}/${scheduleId}`, {});
    }
}
