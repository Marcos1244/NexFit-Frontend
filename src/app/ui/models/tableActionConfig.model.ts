export default interface TableActionConfig {
  icon: string;
  name: string;
  tooltip: string;
  colorClass: string;
  disabledIf?: (row: any) => boolean;
}
