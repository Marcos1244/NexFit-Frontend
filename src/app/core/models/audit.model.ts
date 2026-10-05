import { ModuleEnum } from '../enums/module.enum';
import { ActionEnum } from '../enums/action.enum';
import User from './user.model';


export default interface Audit {
  auditId: number;
  module: ModuleEnum;
  action: ActionEnum;
  details: string;
  affectedEntityId: number;
  date: Date;

  user: User;
}
