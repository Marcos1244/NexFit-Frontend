import { FieldColumnTypeEnum } from '../enums/FieldColumnType.enum';
import { EnrichedSelectOption } from './EnrichedSelectOption.model';

export default interface TableFormConfig {
  icon?: string;
  key: string;
  label: string;
  type?: FieldColumnTypeEnum;
  options?: Array<EnrichedSelectOption>;

  requirements?: Array<string>;

  errorMessages?: Record<string, string>;

  customRender?: boolean;

  isDynamic?: boolean;
  dependsOn?: string; 
  placeholder?: string;
}
