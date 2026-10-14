export interface DashboardStats {
  activeClients: number;
  inactiveClients: number;
  newClientsToday: number;
  activeCoaches: number;
  totalCapacity: number;
  currentOccupancy: number;
  maxClientsPerSchedule: number;
  fullSchedules: number;
  pendingClients: number;
  criticalSchedules: Array<CriticalSchedule>;
}

export interface CriticalSchedule {
  scheduleId: number;
  startTime: string;
  endTime: string;
  occupancyPercentage: number;
  activeClients: number;
}

export interface DataPoint {
  label: string;
  value: number;
}

export interface IncomeComparison {
  periodLabel: string;
  comparisonLabel: string;
  currentPeriod: Array<DataPoint>;
  previousPeriod: Array<DataPoint>;
  currentTotal: number;
  previousTotal: number;
  percentageChange: number;
}

export type ComparisonPeriod = 'WEEK' | 'MONTH' | 'YEAR';