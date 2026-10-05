import { Enviroment } from '../../../../../enviroment';
import { HttpClient, HttpParams } from '@angular/common/http';
import User from '../../../core/models/user.model';
import CreateUserDto from '../dto/createUser.dto';
import UpdateUserDto from '../dto/updateUser.dto';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import PaginationResultDto from '../../../core/dto/PaginationResult.dto';

@Service()
export class UserApiService {
  private API_ROUTE: string = Enviroment.API + 'users';

  private http: HttpClient = inject(HttpClient);

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(this.API_ROUTE + '/' + id);
  }

  getAllUsers(
    pageNumber: number,
    pageSize: number,
    status: boolean,
    filters: any = {},
  ): Observable<PaginationResultDto<User>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('status', status);

    Object.keys(filters).forEach((key) => {
      const value = filters[key];

      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<PaginationResultDto<User>>(this.API_ROUTE, { params });
  }

  saveUser(userDto: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.API_ROUTE, userDto);
  }

  updateUser(userDto: UpdateUserDto): Observable<User> {
    return this.http.put<User>(this.API_ROUTE, userDto);
  }

  disableUser(id: number): Observable<any> {
    return this.http.patch(this.API_ROUTE + '/disable/' + id, {});
  }

  enableUser(id: number): Observable<any> {
    return this.http.patch(this.API_ROUTE + '/enable/' + id, {});
  }
}
