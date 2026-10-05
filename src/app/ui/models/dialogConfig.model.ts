import { DialogTypeEnum } from '../enums/DialogType.enum';
import { DialogThemeEnum } from '../enums/DialogTheme.enum';

export default interface DialogConfig {
  title: string;
  message: string;
  type: DialogTypeEnum;
  theme?: DialogThemeEnum;
  acceptText?: string;
  cancelText?: string;
}
