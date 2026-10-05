import { FieldColumnTypeEnum } from '../enums/FieldColumnType.enum';
import SelectOption from './selectOption.model';

export default interface TableFilterConfig {
  key: string;
  label: string;
  type?: FieldColumnTypeEnum;
  options?: Array<SelectOption>;

  minDateKey?: string;  
  maxDateKey?: string;
  minTimeKey?: string; 
  maxTimeKey?: string;
}