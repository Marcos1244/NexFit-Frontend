import { Enviroment } from '../../../../../enviroment';
import Coach from '../../../core/models/coach.model';
import UpdateCoachDto from '../dto/updateCoach.dto';
import CreateCoachDto from '../dto/createCoach.dto';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import PaginationResultDto from '../../../core/dto/PaginationResult.dto';

@Service()
export class CoachApiService {
    private http: HttpClient = inject(HttpClient);

    private API_ROUTE: string = Enviroment.API + 'coaches';

    saveCoach (dto: CreateCoachDto): Observable<Coach> {
        return this.http.post<Coach>(this.API_ROUTE, dto);
    }

    updateCoach (dto: UpdateCoachDto): Observable<Coach> {
        return this.http.put<Coach>(this.API_ROUTE, dto);
    }

    getCoachById (id: number): Observable<Coach> {
        return this.http.get<Coach>(this.API_ROUTE + `/${id}`);
    }

    getAllCoaches (
        pageNumber: number,
        pageSize: number,
        status: boolean,
        filters: any = {}
    ): Observable<PaginationResultDto<Coach>> {
        let params = new HttpParams()
        .set('pageNumber', pageNumber)
        .set('pageSize', pageSize)
        .set('status', status);

        Object.keys(filters).forEach((key) => {
            const value = filters[key];

            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, value);
            }
        })

        return this.http.get<PaginationResultDto<Coach>>(this.API_ROUTE, { params });
    }

    disableCoach (id: number): Observable<any> {
        return this.http.patch(this.API_ROUTE + `/disable/${id}`, {});
    }

    enableCoach (id: number): Observable<any> {
        return this.http.patch(this.API_ROUTE + `/enable/${id}`, {});
    }

    pushCoachSchedule (personId: number, scheduleId: number): Observable<any> {
        return this.http.post(this.API_ROUTE + `/schedule/${personId}/${scheduleId}`, {});
    }

    removeCoachSchedule (personId: number, scheduleId: number): Observable<any> {
        return this.http.delete(this.API_ROUTE + `/schedule/${personId}/${scheduleId}`, {});
    }
}
