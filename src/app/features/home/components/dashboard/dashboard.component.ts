// features/dashboard/components/dashboard/dashboard.component.ts
import {
  Component, inject, OnInit, OnDestroy,
  signal, effect, viewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleLayoutComponent } from '../../../../layouts/components/module-layout/module-layout.component';
import MenuElementConfig from '../../../../layouts/models/menuElementConfig.model';
import { DashboardService } from '../../services/dashboard.service';
import { SettingsService } from '../../../settings/services/settings.service';
import { DashboardStats, IncomeComparison, ComparisonPeriod } from '../../models/dashboard.model';
import Settings from '../../../../core/models/settings.model';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Chart from 'chart.js/auto';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  imports: [
    CommonModule,
    ModuleLayoutComponent,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltip
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.component.css',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService: DashboardService = inject(DashboardService);
  private settingsService: SettingsService = inject(SettingsService);
  private router: Router = inject(Router);

  private readonly clientsChartRef = viewChild<ElementRef<HTMLCanvasElement>>('clientsChart');

  readonly menuElements: Array<MenuElementConfig> = [];

  private thresholdGreen = 70;
  private thresholdYellow = 90;

  stats = signal<DashboardStats | null>(null);
  clientsComparison = signal<IncomeComparison | null>(null);
  selectedPeriod = signal<ComparisonPeriod>('WEEK');
  isLoadingStats = signal<boolean>(true);
  isLoadingChart = signal<boolean>(false);
  pendingClientsCount = signal<number>(0);

  private chart: Chart | null = null;

  readonly periodOptions: Array<{ value: ComparisonPeriod; label: string }> = [
    { value: 'WEEK', label: 'Semana' },
    { value: 'MONTH', label: 'Mes' },
    { value: 'YEAR', label: 'Año' }
  ];

  constructor() {
    effect(() => {
      const canvasEl = this.clientsChartRef();
      const comparison = this.clientsComparison();

      if (canvasEl && comparison) {
        this.renderChart(canvasEl.nativeElement);
      }
    });
  }

  ngOnInit(): void {
    this.loadSettings().subscribe({
      next: () => {
        this.loadStats();
        this.loadClientsComparison();
      },
      error: (err) => {
        console.warn('No se pudieron cargar las configuraciones, usando valores por defecto:', err);
        this.loadStats();
        this.loadClientsComparison();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private loadSettings() {
    return this.settingsService.getSettings().pipe(
      map(settings => {
        const configMap = new Map(settings.map(s => [s.key, s.value]));

        this.thresholdGreen = configMap.get('bandera_verde') ?? 70;
        this.thresholdYellow = configMap.get('bandera_amarilla') ?? 90;

        return settings;
      })
    );
  }

  loadStats(): void {
    this.isLoadingStats.set(true);
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.pendingClientsCount.set(stats.pendingClients);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false)
    });
  }

  loadClientsComparison(): void {
    this.isLoadingChart.set(true);
    this.dashboardService.getNewClientsComparison(this.selectedPeriod()).subscribe({
      next: (comparison) => {
        this.clientsComparison.set(comparison);
        this.isLoadingChart.set(false);
      },
      error: () => this.isLoadingChart.set(false)
    });
  }

  changePeriod(period: ComparisonPeriod): void {
    if (this.selectedPeriod() === period) return;
    this.selectedPeriod.set(period);
    this.loadClientsComparison();
  }

  private renderChart(canvas: HTMLCanvasElement): void {
    const comparison = this.clientsComparison();
    if (!comparison) return;

    this.destroyChart();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = comparison.currentPeriod.map(p => p.label);
    const currentData = comparison.currentPeriod.map(p => p.value);
    const previousData = comparison.previousPeriod.map(p => p.value);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: comparison.periodLabel,
            data: currentData,
            backgroundColor: 'rgba(30, 58, 138, 0.85)',
            borderColor: '#1e3a8a',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: comparison.comparisonLabel,
            data: previousData,
            backgroundColor: 'rgba(147, 197, 253, 0.6)',
            borderColor: '#93c5fd',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, font: { size: 12, weight: 'bold' } }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y} clientes`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  getCapacityPercentage(): number {
    const stats = this.stats();
    if (!stats || stats.totalCapacity === 0) return 0;
    return Math.round((stats.currentOccupancy / stats.totalCapacity) * 100);
  }

  getOccupancyColor(percentage: number): string {
    if (percentage >= this.thresholdYellow) return '#dc2626';
    if (percentage >= this.thresholdGreen) return '#d97706';
    return '#16a34a';
  }

  navigateToPendingClients(): void {
    this.router.navigate(['/application/clients/list/pending']);
  }
}