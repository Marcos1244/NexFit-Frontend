import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Enviroment } from '../../../../../enviroment';
import { Observable } from 'rxjs';
import Settings from '../../../core/models/settings.model';
import UpdateSettingsDto from '../dto/updateSettings.dto';

@Service()
export class SettingsService {
    private http: HttpClient = inject(HttpClient);

    private API_ROUTE: string = Enviroment.API + 'settings';

    public updateSettings (dto: UpdateSettingsDto): Observable<Settings> {
        return this.http.put<Settings>(this.API_ROUTE, dto);
    }

    public getSettings (): Observable<Array<Settings>> {
        return this.http.get<Array<Settings>>(this.API_ROUTE);
    }
}
