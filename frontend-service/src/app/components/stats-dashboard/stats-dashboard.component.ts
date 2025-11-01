import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Subject, takeUntil} from 'rxjs';
import {RealtimeDataService} from '../../services/realtime-data.service';
import {HealthCheckService, ServiceHealth} from '../../services/health-check.service';

export interface IntersectionStats {
  intersectionId: string;
  vehicleCount: number;
  avgWaitTime: number;
  currentPhase: string;
  timestamp: number;
}

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h2>Traffic Statistics Dashboard</h2>

      <div class="overview-cards">
        <div class="card">
          <div class="card-icon">🚗</div>
          <div class="card-content">
            <div class="card-value">{{ totalVehicles }}</div>
            <div class="card-label">Total Vehicles</div>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">⏱️</div>
          <div class="card-content">
            <div class="card-value">{{ avgWaitTime.toFixed(1) }}s</div>
            <div class="card-label">Avg Wait Time</div>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">🚦</div>
          <div class="card-content">
            <div class="card-value">{{ activeIntersections }}</div>
            <div class="card-label">Active Intersections</div>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">📊</div>
          <div class="card-content">
            <div class="card-value">{{ trafficLevel }}</div>
            <div class="card-label">Traffic Level</div>
          </div>
        </div>
      </div>

      <div class="intersections-table">
        <h3>Intersection Details</h3>
        <table>
          <thead>
            <tr>
              <th>Intersection ID</th>
              <th>Vehicles</th>
              <th>Wait Time</th>
              <th>Current Phase</th>
              <th>Status</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let stats of intersectionsList" [class]="getRowClass(stats.vehicleCount)">
              <td><strong>{{ stats.intersectionId }}</strong></td>
              <td>
                <div class="vehicle-count">
                  {{ stats.vehicleCount }}
                  <span class="trend" [class.up]="true">▲</span>
                </div>
              </td>
              <td>{{ stats.avgWaitTime.toFixed(1) }}s</td>
              <td>
                <span class="phase-badge" [class]="getPhaseClass(stats.currentPhase)">
                  {{ formatPhase(stats.currentPhase) }}
                </span>
              </td>
              <td>
                <span class="status-indicator" [class]="getStatusClass(stats.vehicleCount)">
                  {{ getStatusText(stats.vehicleCount) }}
                </span>
              </td>
              <td class="timestamp">{{ formatTime(stats.timestamp) }}</td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="intersectionsList.length === 0" class="no-data">
          <div class="spinner"></div>
          <p>Waiting for traffic data...</p>
        </div>
      </div>

      <div class="charts-section">
        <div class="chart-card">
          <h3>Traffic Distribution</h3>
          <div class="bar-chart">
            <div *ngFor="let stats of intersectionsList" class="bar-item">
              <div class="bar-label">{{ stats.intersectionId }}</div>
              <div class="bar-wrapper">
                <div class="bar"
                     [style.width.%]="getBarWidth(stats.vehicleCount)"
                     [style.background]="getBarColor(stats.vehicleCount)">
                </div>
                <span class="bar-value">{{ stats.vehicleCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h3>System Health</h3>
          <div class="health-indicators">
            <div class="health-item" *ngFor="let service of serviceHealthStatus">
              <div class="health-icon">{{ getHealthIcon(service.status) }}</div>
              <div class="health-info">
                <div class="health-name">{{ service.name }}</div>
                <div class="health-status" [class]="service.status">
                  {{ service.status === 'online' ? 'Online' : service.status === 'offline' ? 'Offline' : 'Checking...' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
    }

    h2 {
      margin: 0 0 20px 0;
      color: #1f2937;
    }

    h3 {
      margin: 0 0 15px 0;
      color: #374151;
      font-size: 16px;
    }

    .overview-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .card-icon {
      font-size: 40px;
    }

    .card-value {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
      line-height: 1;
    }

    .card-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 5px;
    }

    .intersections-table {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 12px;
      background: #f9fafb;
      color: #374151;
      font-weight: 600;
      font-size: 13px;
      border-bottom: 2px solid #e5e7eb;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }

    tr:hover {
      background: #f9fafb;
    }

    tr.high-traffic {
      background: #fef2f2;
    }

    .vehicle-count {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .trend {
      font-size: 12px;
      color: #6b7280;
    }

    .trend.up {
      color: #ef4444;
    }

    .phase-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .phase-badge.green {
      background: #d1fae5;
      color: #065f46;
    }

    .phase-badge.red {
      background: #fee2e2;
      color: #991b1b;
    }

    .phase-badge.unknown {
      background: #f3f4f6;
      color: #374151;
    }

    .status-indicator {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .status-indicator.normal {
      background: #d1fae5;
      color: #065f46;
    }

    .status-indicator.moderate {
      background: #fef3c7;
      color: #92400e;
    }

    .status-indicator.congested {
      background: #fee2e2;
      color: #991b1b;
    }

    .timestamp {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    .spinner {
      border: 3px solid #f3f4f6;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .charts-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    .chart-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .bar-item {
      display: grid;
      grid-template-columns: 100px 1fr;
      align-items: center;
      gap: 15px;
    }

    .bar-label {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .bar-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .bar {
      height: 30px;
      border-radius: 4px;
      transition: width 0.3s ease;
      min-width: 20px;
    }

    .bar-value {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }

    .health-indicators {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .health-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .health-icon {
      font-size: 24px;
    }

    .health-name {
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
    }

    .health-status {
      font-size: 12px;
      font-weight: 600;
    }

    .health-status.online {
      color: #22c55e;
    }

    .health-status.offline {
      color: #ef4444;
    }

    .health-status.checking {
      color: #f59e0b;
    }
  `]
})
export class StatsDashboardComponent implements OnInit, OnDestroy {
  intersectionsList: IntersectionStats[] = [];
  totalVehicles = 0;
  avgWaitTime = 0;
  activeIntersections = 0;
  trafficLevel = 'Normal';
  serviceHealthStatus: ServiceHealth[] = [];

  private destroy$ = new Subject<void>();
  private intersectionsMap = new Map<string, IntersectionStats>();

  constructor(
    private realtimeService: RealtimeDataService,
    private healthCheckService: HealthCheckService
  ) {}

  ngOnInit(): void {
    this.realtimeService.intersectionUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.intersectionsMap.set(stats.intersectionId, stats);
        this.updateDashboard();
      });

    // Subscribe to health check updates
    this.healthCheckService.checkAllServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe(healthStatus => {
        this.serviceHealthStatus = healthStatus;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDashboard(): void {
    this.intersectionsList = Array.from(this.intersectionsMap.values());
    this.activeIntersections = this.intersectionsList.length;

    if (this.intersectionsList.length > 0) {
      this.totalVehicles = this.intersectionsList.reduce((sum, s) => sum + s.vehicleCount, 0);
      this.avgWaitTime = this.intersectionsList.reduce((sum, s) => sum + s.avgWaitTime, 0) / this.intersectionsList.length;

      const avgVehiclesPerIntersection = this.totalVehicles / this.intersectionsList.length;
      if (avgVehiclesPerIntersection < 20) {
        this.trafficLevel = 'Light';
      } else if (avgVehiclesPerIntersection < 35) {
        this.trafficLevel = 'Moderate';
      } else {
        this.trafficLevel = 'Heavy';
      }
    }
  }

  getRowClass(vehicleCount: number): string {
    return vehicleCount > 40 ? 'high-traffic' : '';
  }

  getPhaseClass(phase: string): string {
    if (phase.includes('GREEN')) return 'green';
    if (phase.includes('RED')) return 'red';
    return 'unknown';
  }

  formatPhase(phase: string): string {
    return phase.replace('_', ' ');
  }

  getStatusClass(vehicleCount: number): string {
    if (vehicleCount < 25) return 'normal';
    if (vehicleCount < 40) return 'moderate';
    return 'congested';
  }

  getStatusText(vehicleCount: number): string {
    if (vehicleCount < 25) return 'Normal';
    if (vehicleCount < 40) return 'Moderate';
    return 'Congested';
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  getBarWidth(vehicleCount: number): number {
    return Math.min((vehicleCount / 60) * 100, 100);
  }

  getBarColor(vehicleCount: number): string {
    if (vehicleCount < 15) return '#22c55e';
    if (vehicleCount < 30) return '#eab308';
    if (vehicleCount < 45) return '#f97316';
    return '#ef4444';
  }

  getHealthIcon(status: string): string {
    if (status === 'online') return '✅';
    if (status === 'offline') return '❌';
    return '⏳';
  }
}

