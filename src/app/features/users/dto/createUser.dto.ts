import { RoleEnum } from '../../../core/enums/role.enum';

export default interface CreateUserDto {
  ci: string;
  name: string;
  lastname: string;
  role: RoleEnum;
  password: string;
}
