export interface EnrichedSelectOption {
  value: any;
  label: string;
  sublabel?: string;
  statusColor?: 'green' | 'yellow' | 'red' | 'gray';
  statusText?: string;
  isDisabled?: boolean;
  raw?: any; 
}