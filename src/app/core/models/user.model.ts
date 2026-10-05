import { RoleEnum } from '../enums/role.enum';

export default interface User {
  personId: number;
  ci: string;
  name: string;
  lastname: string;
  role: RoleEnum;
};
