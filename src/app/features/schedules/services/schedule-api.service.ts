import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Enviroment } from '../../../../../enviroment';
import { Observable } from 'rxjs';
import Schedule from '../../../core/models/schedule.model';
import PaginationResultDto from '../../../core/dto/PaginationResult.dto';
import CreateScheduleDto from '../dto/createSchedule.dto';
import UpdateScheduleDto from '../dto/updateSchedule.dto';

@Service()
export class ScheduleApiService {
    private http: HttpClient = inject(HttpClient);

    private API_ROUTE: string = Enviroment.API + 'schedules';

    getAllSchedules (
        pageNumber: number,
        pageSize: number,
        status: boolean,
        filters: any = {}
    ): Observable<PaginationResultDto<Schedule>> {
        let params = new HttpParams()
        .set('pageNumber', pageNumber)
        .set('pageSize', pageSize)
        .set('status', status);

        

        Object.keys(filters).forEach((key) => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                params = params.set(key, filters[key]);
            }
        });

        return this.http.get<PaginationResultDto<Schedule>>(this.API_ROUTE, { params });
    }

    disableSchedule (id: number): Observable<any> {
        return this.http.patch(this.API_ROUTE + '/disable/' + id, {});
    }

    enableSchedule (id: number): Observable<any> {
        return this.http.patch(this.API_ROUTE + '/enable/' + id, {});
    }

    saveSchedule (dto: CreateScheduleDto): Observable<Schedule> {
        return this.http.post<Schedule>(this.API_ROUTE, dto);
    }

    updateSchedule (dto: UpdateScheduleDto): Observable<Schedule> {
        return this.http.put<Schedule>(this.API_ROUTE, dto);
    }

    getScheduleById (id: number): Observable<Schedule> {
        return this.http.get<Schedule>(this.API_ROUTE + `/${id}`);
    }
}
