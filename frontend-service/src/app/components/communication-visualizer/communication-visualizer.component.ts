import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Subject, takeUntil} from 'rxjs';
import {CommunicationLog, RealtimeDataService} from '../../services/realtime-data.service';

@Component({
  selector: 'app-communication-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visualizer-container">
      <h2>gRPC Communication Flow</h2>

      <div class="services-diagram">
        <div class="service-box frontend">
          <div class="service-icon">🖥️</div>
          <div class="service-name">Frontend</div>
          <div class="service-port">:4200</div>
        </div>

        <div class="connection-arrows">
          <div class="arrow-group">
            <div class="arrow unary" [class.active]="hasActiveUnary">
              <div class="arrow-line"></div>
              <div class="arrow-label">Unary RPC</div>
            </div>
          </div>
        </div>

        <div class="service-box control">
          <div class="service-icon">🎛️</div>
          <div class="service-name">Traffic Control</div>
          <div class="service-port">:8001 / :9001</div>
        </div>

        <div class="connection-arrows horizontal">
          <div class="arrow-group">
            <div class="arrow streaming" [class.active]="hasActiveStreaming">
              <div class="arrow-line"></div>
              <div class="arrow-label">Server Stream</div>
            </div>
            <div class="arrow bidirectional" [class.active]="hasActiveBidirectional">
              <div class="arrow-line reverse"></div>
              <div class="arrow-label">Bidirectional</div>
            </div>
          </div>
        </div>

        <div class="backend-services">
          <div class="service-box sensor">
            <div class="service-icon">📡</div>
            <div class="service-name">Sensor Service</div>
            <div class="service-port">:8000 / :9002</div>
          </div>

          <div class="service-box light">
            <div class="service-icon">🚦</div>
            <div class="service-name">Traffic Light</div>
            <div class="service-port">:8002 / :9003</div>
          </div>
        </div>
      </div>

      <div class="communication-stats">
        <div class="stat-card">
          <div class="stat-value">{{ unaryCount }}</div>
          <div class="stat-label">Unary Requests</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ streamingCount }}</div>
          <div class="stat-label">Stream Messages</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ bidirectionalCount }}</div>
          <div class="stat-label">Bidirectional</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalMessages }}</div>
          <div class="stat-label">Total Messages</div>
        </div>
      </div>

      <div class="communication-log">
        <h3>Communication Log</h3>
        <div class="log-entries">
          <div *ngFor="let log of logs.slice(-10).reverse()"
               class="log-entry"
               [class.success]="log.status === 'success'"
               [class.error]="log.status === 'error'"
               [class.pending]="log.status === 'pending'">
            <span class="log-time">{{ log.timestamp | date:'HH:mm:ss' }}</span>
            <span class="log-type" [class]="log.type.toLowerCase()">{{ log.type }}</span>
            <span class="log-service">{{ log.service }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visualizer-container {
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 20px 0;
      color: #1f2937;
    }

    .services-diagram {
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 2fr;
      gap: 20px;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .service-box {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .service-box.frontend { background: #dbeafe; border: 2px solid #3b82f6; }
    .service-box.control { background: #fef3c7; border: 2px solid #f59e0b; }
    .service-box.sensor { background: #dcfce7; border: 2px solid #22c55e; }
    .service-box.light { background: #fce7f3; border: 2px solid #ec4899; }

    .service-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }

    .service-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 5px;
    }

    .service-port {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
    }

    .connection-arrows {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .connection-arrows.horizontal {
      grid-column: 4;
    }

    .arrow {
      position: relative;
      padding: 10px 0;
    }

    .arrow-line {
      height: 3px;
      background: #d1d5db;
      position: relative;
      transition: all 0.3s ease;
    }

    .arrow-line::after {
      content: '▶';
      position: absolute;
      right: -10px;
      top: -8px;
      color: #d1d5db;
      font-size: 18px;
    }

    .arrow-line.reverse::after {
      content: '◀';
      left: -10px;
      right: auto;
    }

    .arrow.active .arrow-line {
      background: #3b82f6;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    }

    .arrow.active .arrow-line::after {
      color: #3b82f6;
      animation: pulse 1s infinite;
    }

    .arrow-label {
      font-size: 11px;
      color: #6b7280;
      margin-top: 5px;
      text-align: center;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .backend-services {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .communication-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .stat-card {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }

    .communication-log {
      margin-top: 20px;
    }

    .communication-log h3 {
      margin: 0 0 15px 0;
      color: #1f2937;
    }

    .log-entries {
      background: #1f2937;
      border-radius: 8px;
      padding: 15px;
      max-height: 300px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 12px;
    }

    .log-entry {
      padding: 8px;
      margin-bottom: 5px;
      border-radius: 4px;
      display: grid;
      grid-template-columns: 80px 120px 150px 1fr;
      gap: 10px;
      align-items: center;
    }

    .log-entry.success { background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; }
    .log-entry.error { background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; }
    .log-entry.pending { background: rgba(251, 191, 36, 0.1); border-left: 3px solid #fbbf24; }

    .log-time { color: #9ca3af; }
    .log-type {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      text-align: center;
      font-weight: 600;
    }
    .log-type.unary { background: #3b82f6; color: white; }
    .log-type.server_streaming { background: #22c55e; color: white; }
    .log-type.bidirectional { background: #ec4899; color: white; }
    .log-service { color: #60a5fa; }
    .log-message { color: #d1d5db; }
  `]
})
export class CommunicationVisualizerComponent implements OnInit, OnDestroy {
  logs: CommunicationLog[] = [];
  unaryCount = 0;
  streamingCount = 0;
  bidirectionalCount = 0;
  totalMessages = 0;

  hasActiveUnary = false;
  hasActiveStreaming = false;
  hasActiveBidirectional = false;

  private destroy$ = new Subject<void>();

  constructor(private realtimeService: RealtimeDataService) {}

  ngOnInit(): void {
    this.realtimeService.communicationLogs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(log => {
        this.logs.push(log);
        this.totalMessages++;

        // Update counters
        if (log.type === 'UNARY') {
          this.unaryCount++;
          this.flashActive('unary');
        } else if (log.type === 'SERVER_STREAMING') {
          this.streamingCount++;
          this.flashActive('streaming');
        } else if (log.type === 'BIDIRECTIONAL') {
          this.bidirectionalCount++;
          this.flashActive('bidirectional');
        }

        // Keep only last 100 logs
        if (this.logs.length > 100) {
          this.logs = this.logs.slice(-100);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private flashActive(type: 'unary' | 'streaming' | 'bidirectional'): void {
    if (type === 'unary') {
      this.hasActiveUnary = true;
      setTimeout(() => this.hasActiveUnary = false, 1000);
    } else if (type === 'streaming') {
      this.hasActiveStreaming = true;
      setTimeout(() => this.hasActiveStreaming = false, 1000);
    } else if (type === 'bidirectional') {
      this.hasActiveBidirectional = true;
      setTimeout(() => this.hasActiveBidirectional = false, 1000);
    }
  }
}

