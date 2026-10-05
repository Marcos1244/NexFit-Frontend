import { Enviroment } from '../../../../../enviroment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import Audit from '../../../core/models/audit.model';
import { Observable } from 'rxjs/internal/Observable';
import PaginationResponseDto from '../../../core/dto/PaginationResult.dto';

@Service()
export class AuditApiService {
    private http: HttpClient = inject(HttpClient);

    private API_ROUTE = Enviroment.API + 'audits';

    public getAllAudits (
        pageNumber: number, 
        pageSize: number, 
        filters: any = {}
    ): Observable<PaginationResponseDto<Audit>> {
        let params = new HttpParams()
            .set('pageNumber', pageNumber)
            .set('pageSize', pageSize);

        Object.keys(filters).forEach((key) => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                const backendKey = key.includes('.') ? key.split('.').pop()! : key;
        
                params = params.set(backendKey, filters[key]);
            }
        });

        return this.http.get<PaginationResponseDto<Audit>>(this.API_ROUTE, { params });
    }
}