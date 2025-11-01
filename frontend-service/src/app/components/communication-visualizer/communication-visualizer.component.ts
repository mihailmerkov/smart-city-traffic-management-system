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
      <h2>🔄 gRPC Communication Architecture</h2>
      <p class="subtitle">Real-time microservices communication flow</p>

      <div class="architecture-diagram">
        <!-- Layer 1: Frontend -->
        <div class="layer frontend-layer">
          <div class="service-node frontend">
            <div class="node-icon">🖥️</div>
            <div class="node-name">Frontend Service</div>
            <div class="node-tech">Angular 19 + SSR</div>
            <div class="node-port">Port :4200</div>
          </div>
        </div>

        <!-- Connection: REST API -->
        <div class="layer connection-layer">
          <div class="connection-flow rest-flow" [class.active]="hasActiveRest">
            <div class="flow-arrow">
              <div class="arrow-line vertical"></div>
              <div class="arrow-head">▼</div>
            </div>
            <div class="flow-label">
              <span class="label-type">REST API</span>
              <span class="label-detail">HTTP/JSON</span>
              <span class="label-method">GET /api/traffic/*</span>
            </div>
          </div>
        </div>

        <!-- Layer 2: Traffic Control (Orchestrator) -->
        <div class="layer control-layer">
          <div class="service-node control">
            <div class="node-icon">🎛️</div>
            <div class="node-name">Traffic Control Service</div>
            <div class="node-tech">Quarkus gRPC Orchestrator</div>
            <div class="node-port">HTTP :8001 | gRPC Client</div>
          </div>
        </div>

        <!-- Layer 3: gRPC Connections -->
        <div class="layer grpc-layer">
          <div class="grpc-connections">
            <!-- Left: Server Streaming from Sensor -->
            <div class="grpc-flow sensor-flow">
              <div class="connection-flow streaming-flow" [class.active]="hasActiveSensorStream">
                <div class="flow-arrow">
                  <div class="arrow-line vertical stream"></div>
                  <div class="arrow-head stream">▼</div>
                </div>
                <div class="flow-label streaming-label">
                  <span class="label-type">Server Streaming</span>
                  <span class="label-detail">gRPC Stream</span>
                  <span class="label-method">streamSensorData()</span>
                </div>
              </div>
              <div class="service-node sensor">
                <div class="node-icon">📡</div>
                <div class="node-name">Sensor Service</div>
                <div class="node-tech">Real-time Data Provider</div>
                <div class="node-port">gRPC :8000</div>
              </div>
            </div>

            <!-- Right: Bidirectional with Traffic Light -->
            <div class="grpc-flow light-flow">
              <div class="connection-flow bidir-flow" [class.active]="hasActiveLightStream">
                <div class="flow-arrow bidir">
                  <div class="arrow-head up">▲</div>
                  <div class="arrow-line vertical bidir"></div>
                  <div class="arrow-head down">▼</div>
                </div>
                <div class="flow-label bidir-label">
                  <span class="label-type">Bidirectional Stream</span>
                  <span class="label-detail">gRPC Duplex</span>
                  <span class="label-method">coordinateTrafficLights()</span>
                </div>
              </div>
              <div class="service-node light">
                <div class="node-icon">🚦</div>
                <div class="node-name">Traffic Light Service</div>
                <div class="node-tech">Phase Controller</div>
                <div class="node-port">gRPC :8003</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="communication-stats">
        <div class="stat-card rest-stat">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ restCallCount }}</div>
          <div class="stat-label">REST API Calls</div>
          <div class="stat-route">Frontend → Control</div>
        </div>
        <div class="stat-card stream-stat">
          <div class="stat-icon">📡</div>
          <div class="stat-value">{{ sensorStreamCount }}</div>
          <div class="stat-label">Sensor Readings</div>
          <div class="stat-route">Sensor → Control</div>
        </div>
        <div class="stat-card bidir-stat">
          <div class="stat-icon">🔄</div>
          <div class="stat-value">{{ lightCommandCount }}</div>
          <div class="stat-label">Light Commands</div>
          <div class="stat-route">Control ⇄ Light</div>
        </div>
        <div class="stat-card total-stat">
          <div class="stat-icon">💬</div>
          <div class="stat-value">{{ totalMessages }}</div>
          <div class="stat-label">Total Messages</div>
          <div class="stat-route">All Services</div>
        </div>
      </div>

      <div class="communication-log">
        <h3>📝 Communication Log</h3>
        <div class="log-entries">
          <div *ngFor="let log of logs.slice(-10).reverse()"
               class="log-entry"
               [class.success]="log.status === 'success'"
               [class.error]="log.status === 'error'"
               [class.pending]="log.status === 'pending'">
            <span class="log-time">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</span>
            <span class="log-type" [ngClass]="getLogTypeClass(log.type)">{{ formatLogType(log.type) }}</span>
            <span class="log-service">{{ log.service }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div *ngIf="logs.length === 0" class="no-logs">
            <span>Waiting for communication events...</span>
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
      margin: 0 0 5px 0;
      color: #1f2937;
      font-size: 24px;
    }

    .subtitle {
      margin: 0 0 25px 0;
      color: #6b7280;
      font-size: 14px;
    }

    .architecture-diagram {
      display: flex;
      flex-direction: column;
      gap: 0;
      margin-bottom: 30px;
      padding: 40px;
      background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%);
      border-radius: 16px;
      border: 2px solid #d1d5db;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .layer {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px 0;
    }

    .frontend-layer {
      margin-bottom: 10px;
    }

    .connection-layer {
      margin: 10px 0;
    }

    .control-layer {
      margin: 10px 0 20px 0;
    }

    .grpc-layer {
      margin-top: 10px;
    }

    .service-node {
      padding: 25px 35px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      min-width: 280px;
    }

    .service-node:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 12px 24px rgba(0,0,0,0.2);
    }

    .service-node.frontend {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: 4px solid #1d4ed8;
    }

    .service-node.control {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border: 4px solid #b45309;
      min-width: 320px;
    }

    .service-node.sensor {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      border: 4px solid #15803d;
    }

    .service-node.light {
      background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
      border: 4px solid #be185d;
    }

    .node-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .node-name {
      font-weight: 700;
      color: white;
      font-size: 16px;
      margin-bottom: 6px;
    }

    .node-tech {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 4px;
    }

    .node-port {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.8);
      font-family: monospace;
      font-weight: 600;
    }

    .connection-flow {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 15px 25px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      transition: all 0.3s ease;
    }

    .connection-flow.active {
      background: rgba(255, 255, 255, 0.95);
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .flow-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .flow-arrow.bidir {
      gap: 0;
    }

    .arrow-line {
      width: 4px;
      height: 60px;
      background: #d1d5db;
      transition: all 0.3s ease;
      border-radius: 2px;
    }

    .arrow-line.stream {
      background: repeating-linear-gradient(
        180deg,
        #22c55e 0px,
        #22c55e 10px,
        transparent 10px,
        transparent 15px
      );
      background-size: 4px 15px;
    }

    .arrow-line.bidir {
      background: repeating-linear-gradient(
        180deg,
        #ec4899 0px,
        #ec4899 8px,
        transparent 8px,
        transparent 12px
      );
      background-size: 4px 12px;
      height: 50px;
    }

    .connection-flow.active .arrow-line {
      background: #3b82f6;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
    }

    .connection-flow.active .arrow-line.stream {
      animation: stream-flow-down 1s linear infinite;
    }

    .connection-flow.active .arrow-line.bidir {
      animation: bidir-flow-vertical 0.8s linear infinite;
    }

    @keyframes stream-flow-down {
      0% { background-position: 0 0; }
      100% { background-position: 0 15px; }
    }

    @keyframes bidir-flow-vertical {
      0% { background-position: 0 0; }
      100% { background-position: 0 12px; }
    }

    .arrow-head {
      font-size: 24px;
      color: #d1d5db;
      transition: all 0.3s ease;
      line-height: 1;
    }

    .arrow-head.stream {
      color: #22c55e;
    }

    .arrow-head.up {
      color: #ec4899;
      margin-bottom: -5px;
    }

    .arrow-head.down {
      color: #ec4899;
      margin-top: -5px;
    }

    .connection-flow.active .arrow-head {
      color: #3b82f6;
      animation: pulse-arrow 1s infinite;
    }

    .connection-flow.active .arrow-head.stream {
      color: #16a34a;
    }

    .connection-flow.active .arrow-head.up,
    .connection-flow.active .arrow-head.down {
      color: #db2777;
    }

    @keyframes pulse-arrow {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }

    .flow-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 180px;
    }

    .label-type {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .label-detail {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
    }

    .label-method {
      font-size: 11px;
      color: #9ca3af;
      font-family: 'Courier New', monospace;
      background: rgba(0, 0, 0, 0.05);
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
      align-self: flex-start;
    }

    .streaming-label .label-type {
      color: #16a34a;
    }

    .bidir-label .label-type {
      color: #db2777;
    }

    .grpc-connections {
      display: flex;
      gap: 60px;
      justify-content: center;
      align-items: flex-start;
    }

    .grpc-flow {
      display: flex;
      flex-direction: column;
      align-items: center;
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
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-3px);
    }

    .rest-stat { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
    .stream-stat { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; }
    .bidir-stat { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; }
    .total-stat { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; }

    .stat-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 13px;
      opacity: 0.95;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .stat-route {
      font-size: 11px;
      opacity: 0.85;
      font-family: monospace;
    }

    .communication-log {
      margin-top: 20px;
    }

    .communication-log h3 {
      margin: 0 0 15px 0;
      color: #1f2937;
      font-size: 18px;
    }

    .log-entries {
      background: #1f2937;
      border-radius: 8px;
      padding: 15px;
      max-height: 350px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }

    .log-entry {
      padding: 10px;
      margin-bottom: 6px;
      border-radius: 4px;
      display: grid;
      grid-template-columns: 100px 130px 180px 1fr;
      gap: 12px;
      align-items: center;
      transition: background 0.2s ease;
    }

    .log-entry:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .log-entry.success { background: rgba(34, 197, 94, 0.15); border-left: 4px solid #22c55e; }
    .log-entry.error { background: rgba(239, 68, 68, 0.15); border-left: 4px solid #ef4444; }
    .log-entry.pending { background: rgba(251, 191, 36, 0.15); border-left: 4px solid #fbbf24; }

    .log-time {
      color: #9ca3af;
      font-weight: 600;
    }

    .log-type {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 10px;
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
    }

    .log-type.rest { background: #3b82f6; color: white; }
    .log-type.server-stream { background: #22c55e; color: white; }
    .log-type.bidirectional { background: #ec4899; color: white; }

    .log-service {
      color: #60a5fa;
      font-weight: 600;
    }

    .log-message {
      color: #d1d5db;
    }

    .no-logs {
      text-align: center;
      color: #9ca3af;
      padding: 40px;
      font-style: italic;
    }
  `]
})
export class CommunicationVisualizerComponent implements OnInit, OnDestroy {
  logs: CommunicationLog[] = [];
  restCallCount = 0;
  sensorStreamCount = 0;
  lightCommandCount = 0;
  totalMessages = 0;

  hasActiveRest = false;
  hasActiveSensorStream = false;
  hasActiveLightStream = false;

  private destroy$ = new Subject<void>();

  constructor(private realtimeService: RealtimeDataService) {}

  ngOnInit(): void {
    this.realtimeService.communicationLogs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(log => {
        this.logs.push(log);
        this.updateCountsAndIndicators(log);

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

  private updateCountsAndIndicators(log: CommunicationLog): void {
    this.totalMessages++;

    // REST API calls (Frontend → Traffic Control)
    if (log.type === 'UNARY' && log.service === 'Traffic Control') {
      this.restCallCount++;
      this.hasActiveRest = true;
      setTimeout(() => this.hasActiveRest = false, 1000);
    }

    // Server Streaming (Sensor → Traffic Control)
    else if (log.type === 'SERVER_STREAMING' && log.service === 'Sensor Service') {
      this.sensorStreamCount++;
      this.hasActiveSensorStream = true;
      setTimeout(() => this.hasActiveSensorStream = false, 1000);
    }

    // Bidirectional (Traffic Control ⇄ Traffic Light)
    else if (log.type === 'BIDIRECTIONAL' && log.service === 'Traffic Light Service') {
      this.lightCommandCount++;
      this.hasActiveLightStream = true;
      setTimeout(() => this.hasActiveLightStream = false, 1000);
    }
  }

  getLogTypeClass(type: string): string {
    switch (type) {
      case 'UNARY': return 'rest';
      case 'SERVER_STREAMING': return 'server-stream';
      case 'BIDIRECTIONAL': return 'bidirectional';
      default: return '';
    }
  }

  formatLogType(type: string): string {
    switch (type) {
      case 'UNARY': return 'REST';
      case 'SERVER_STREAMING': return 'STREAM';
      case 'BIDIRECTIONAL': return 'BIDIR';
      default: return type;
    }
  }
}

