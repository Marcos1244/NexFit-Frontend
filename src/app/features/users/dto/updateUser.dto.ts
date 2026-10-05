import { RoleEnum } from '../../../core/enums/role.enum';

export default interface UpdateUserDto {
  personId: number;
  name: string;
  lastname: string;
  role: RoleEnum
}
