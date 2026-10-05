import { skipAuthToken } from '../../../core/security/auth/token/skipAuth.token';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Enviroment } from '../../../../../enviroment';
import { Service, inject } from '@angular/core';
import TokenDto from '../dto/token.dto';
import LoginDto from '../dto/login.dto';
import { Observable } from 'rxjs';

@Service()
export class LoginService {
  private http: HttpClient = inject(HttpClient);
  private API_ROUTE: string = Enviroment.API + 'users';

  login (loginDto: LoginDto): Observable<TokenDto> {
    return this.http.post<TokenDto>(this.API_ROUTE + '/login', loginDto, {
      context: new HttpContext().set(skipAuthToken, true)
    });
  }
}
