import { RoleEnum } from '../../../enums/role.enum';

export default interface jwtPayload {
  personId: number;
  sub: string;
  name: string;
  lastname: string;
  authorities: RoleEnum;
  iat: number;
  exp: number;
}
