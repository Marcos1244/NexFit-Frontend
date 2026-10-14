// features/home/services/dashboard.service.ts
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, map } from 'rxjs';
import { ClientApiService } from '../../clients/services/client-api.service';
import { ScheduleApiService } from '../../schedules/services/schedule-api.service';
import { CoachApiService } from '../../coaches/services/coach-api.service';
import { SettingsService } from '../../settings/services/settings.service';
import Client from '../../../core/models/client.model';
import {
  DashboardStats,
  IncomeComparison,
  ComparisonPeriod,
  CriticalSchedule,
  DataPoint
} from '../models/dashboard.model';

interface DateRange {
  start: Date;
  end: Date;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private clientApi: ClientApiService = inject(ClientApiService);
  private scheduleApi: ScheduleApiService = inject(ScheduleApiService);
  private coachApi: CoachApiService = inject(CoachApiService);
  private settingsService: SettingsService = inject(SettingsService);

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      activeClients: this.clientApi.getAllClients(0, 1000, true, false, {}),
      inactiveClients: this.clientApi.getAllClients(0, 1000, false, false, {}),
      schedules: this.scheduleApi.getAllSchedules(0, 100, true, {}),
      coaches: this.coachApi.getAllCoaches(0, 1000, true, {}),
      settings: this.settingsService.getSettings(),
      pendingClients: this.clientApi.getAllClients(0, 1, true, true, {})
    }).pipe(
      map(({ activeClients, inactiveClients, schedules, coaches, settings, pendingClients }) => {
        const configMap = new Map<string, number>(
          settings.map(s => [s.key, s.value] as [string, number])
        );
        const maxClientsPerSchedule = configMap.get('carga_total_maxima') ?? 35;

        const activeList = activeClients.content;
        const today = this.startOfLocalDay(new Date());

        const newClientsToday = activeList.filter(c =>
          this.parseLocalDate(c.createdAt).getTime() === today.getTime()
        ).length;

        const occupancy = schedules.content.map(s => ({
          scheduleId: s.scheduleId,
          startTime: s.startTime,
          endTime: s.endTime,
          occupancyPercentage: Math.round((s.activeClientCount / maxClientsPerSchedule) * 100),
          activeClients: s.activeClientCount
        }));

        const fullSchedules = occupancy.filter(s => s.occupancyPercentage >= 100).length;

        const criticalSchedules: Array<CriticalSchedule> = [...occupancy]
          .sort((a, b) => b.occupancyPercentage - a.occupancyPercentage)
          .slice(0, 3);

        return {
          activeClients: activeList.length,
          inactiveClients: inactiveClients.content.length,
          newClientsToday,
          activeCoaches: coaches.content.length,
          totalCapacity: schedules.content.length * maxClientsPerSchedule,
          currentOccupancy: activeList.length,
          maxClientsPerSchedule,
          fullSchedules,
          pendingClients: pendingClients.totalElements,
          criticalSchedules
        };
      })
    );
  }


  getNewClientsComparison(period: ComparisonPeriod): Observable<IncomeComparison> {
    const { currentRange, previousRange, labels, currentLabel, previousLabel } =
      this.getRangesAndLabels(period);

    return forkJoin({
      current: this.clientApi.getAllClients(0, 1000, true, false, {
        startDate: this.formatDate(currentRange.start),
        endDate: this.formatDate(currentRange.end)
      }),
      previous: this.clientApi.getAllClients(0, 1000, true, false, {
        startDate: this.formatDate(previousRange.start),
        endDate: this.formatDate(previousRange.end)
      })
    }).pipe(
      map(({ current, previous }) => {
        const currentData = this.groupByBucket(current.content, currentRange, labels, period);
        const previousData = this.groupByBucket(previous.content, previousRange, labels, period);

        const currentTotal = currentData.reduce((sum, p) => sum + p.value, 0);
        const previousTotal = previousData.reduce((sum, p) => sum + p.value, 0);

        const percentageChange = previousTotal > 0
          ? ((currentTotal - previousTotal) / previousTotal) * 100
          : (currentTotal > 0 ? 100 : 0);

        return {
          periodLabel: currentLabel,
          comparisonLabel: previousLabel,
          currentPeriod: currentData,
          previousPeriod: previousData,
          currentTotal,
          previousTotal,
          percentageChange
        };
      })
    );
  }

  private getRangesAndLabels(period: ComparisonPeriod) {
    switch (period) {
      case 'WEEK':
        return {
          currentRange: this.getWeekRange(0),
          previousRange: this.getWeekRange(1),
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          currentLabel: 'Esta semana',
          previousLabel: 'Semana pasada'
        };
      case 'MONTH':
        return {
          currentRange: this.getMonthRange(0),
          previousRange: this.getMonthRange(1),
          labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
          currentLabel: 'Este mes',
          previousLabel: 'Mes pasado'
        };
      case 'YEAR':
        return {
          currentRange: this.getYearRange(0),
          previousRange: this.getYearRange(1),
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                   'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          currentLabel: 'Este año',
          previousLabel: 'Año pasado'
        };
      default:
        throw new Error(`Período de comparación no soportado: ${period}`);
    }
  }

  private groupByBucket(
    clients: Array<Client>,
    range: DateRange,
    labels: Array<string>,
    period: ComparisonPeriod
  ): Array<DataPoint> {
    const result: Array<DataPoint> = labels.map(label => ({ label, value: 0 }));

    clients.forEach(client => {
      const created = this.parseLocalDate(client.createdAt);
      let bucketIndex = -1;

      switch (period) {
        case 'WEEK': {
          bucketIndex = Math.floor(
            (created.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
          );
          break;
        }
        case 'MONTH': {
          bucketIndex = Math.min(Math.floor((created.getDate() - 1) / 7), 3);
          break;
        }
        case 'YEAR': {
          bucketIndex = created.getMonth();
          break;
        }
      }

      if (bucketIndex >= 0 && bucketIndex < result.length) {
        result[bucketIndex].value += 1;
      }
    });

    return result;
  }

  private parseLocalDate(value: string): Date {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private startOfLocalDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getWeekRange(weeksAgo: number): DateRange {
    const now = this.startOfLocalDay(new Date());
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const start = new Date(now);
    start.setDate(now.getDate() - daysFromMonday - (weeksAgo * 7));

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return { start, end };
  }

  private getMonthRange(monthsAgo: number): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
    return { start, end };
  }

  private getYearRange(yearsAgo: number): DateRange {
    const now = new Date();
    const year = now.getFullYear() - yearsAgo;
    return {
      start: new Date(year, 0, 1),
      end: new Date(year + 1, 0, 1)
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}