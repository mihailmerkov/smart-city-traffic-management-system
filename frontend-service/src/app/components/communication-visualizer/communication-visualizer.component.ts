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
      <h2>♻️ Communication Architecture</h2>
      <p class="subtitle">Real-time microservices communication flow</p>

      <div class="architecture-diagram" aria-label="Microservice communication diagram">
        <!-- Layer 1: Frontend -->
        <div class="layer frontend-layer" title="User Interface Layer">
          <div class="service-node frontend" role="group" aria-label="Frontend Service (Angular UI)">
            <div class="node-icon">🖥️</div>
            <div class="node-name">Frontend Service</div>
            <div class="node-tech">Angular UI</div>
            <div class="node-port">Port :4200</div>
            <div class="node-badges">
              <span class="badge" title="REST snapshot requests">REST</span>
              <span class="badge" title="WebSocket merged updates">WS</span>
            </div>
            <details class="service-details">
              <summary>Service Details</summary>
              <div class="service-description">
                <p><strong>Overview:</strong> The Frontend Service is a modern web application built with Angular 19 that provides a real-time visualization dashboard for the Smart City Traffic Management System. It displays live traffic data, intersection maps, communication flow between microservices, and comprehensive statistics.</p>
                <p><strong>Architecture Role:</strong> This service acts as the user interface in the system, providing:</p>
                <ul>
                  <li>Real-time traffic visualization dashboard</li>
                  <li>Interactive city map with intersection markers</li>
                  <li>Communication flow visualizer showing gRPC architecture</li>
                  <li>Statistics dashboard with live metrics</li>
                  <li>WebSocket connection to Traffic Control Service</li>
                  <li>REST API consumption for on-demand data</li>
                </ul>
              </div>
            </details>
          </div>
        </div>

        <!-- Frontend Connections: REST + WebSocket -->
        <div class="layer frontend-connections-layer">
          <div class="dual-connections">
            <!-- REST Connection -->
            <div class="connection-flow rest-flow" [class.active]="hasActiveRest" title="On-demand HTTP/JSON snapshot requests from Frontend to Traffic Control">
              <div class="flow-arrow">
                <div class="arrow-line vertical rest" aria-hidden="true"></div>
                <div class="arrow-head rest">▼</div>
              </div>
              <div class="flow-label rest-label">
                <span class="label-type">REST API</span>
                <span class="label-detail">Unary Request / Response</span>
                <span class="label-method">GET /api/traffic/*</span>
              </div>
            </div>

            <!-- WebSocket Connection -->
            <div class="connection-flow websocket-flow" [class.active]="hasActiveWebSocket" title="Continuous merged traffic updates (sensors + lights)">
              <div class="flow-arrow">
                <div class="arrow-line vertical websocket" aria-hidden="true"></div>
                <div class="arrow-head websocket">⇅</div>
              </div>
              <div class="flow-label websocket-label">
                <span class="label-type">WebSocket</span>
                <span class="label-detail">Real-time Push (2s cadence)</span>
                <span class="label-method">ws://localhost:8001/ws/traffic</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Layer 2: Traffic Control (Orchestrator) -->
        <div class="layer control-layer" title="Orchestrator: aggregates & optimizes">
          <div class="service-node control" role="group" aria-label="Traffic Control Service (Orchestrator)">
            <div class="node-icon">🎛️</div>
            <div class="node-name">Traffic Control Service</div>
            <div class="node-tech">Quarkus Orchestrator</div>
            <div class="node-port">REST/WS :8001 · gRPC Clients</div>
            <div class="node-badges">
              <span class="badge badge-secondary" title="Aggregates sensor + light data">AGG</span>
              <span class="badge badge-secondary" title="Optimization / coordination logic">OPT</span>
              <span class="badge badge-outline" title="Optional gRPC server (not used by Frontend)">gRPC Srv *</span>
            </div>
            <details class="service-details">
              <summary>Service Details</summary>
              <div class="service-description">
                <p><strong>Overview:</strong> The Traffic Control Service is the central orchestrator microservice that coordinates all traffic management operations. It acts as a gRPC client to both Sensor and Traffic Light services, aggregates data, and exposes REST APIs and WebSocket endpoints for the frontend application.</p>
                <p><strong>Architecture Role:</strong> This service acts as the orchestrator in the system, serving as:</p>
                <ul>
                  <li>gRPC client consuming streams from Sensor Service (Server Streaming)</li>
                  <li>gRPC client coordinating with Traffic Light Service (Bidirectional Streaming)</li>
                  <li>REST API provider for the frontend</li>
                  <li>WebSocket server for real-time data streaming to the frontend</li>
                </ul>
              </div>
            </details>
          </div>
        </div>

        <!-- Layer 3: gRPC Connections -->
        <div class="layer grpc-layer" title="Internal gRPC streaming layer">
          <div class="grpc-connections">
            <!-- Left: Server Streaming from Sensor -->
            <div class="grpc-flow sensor-flow" title="Inbound server streaming of raw sensor readings">
              <div class="connection-flow streaming-flow" [class.active]="hasActiveSensorStream">
                <div class="flow-arrow">
                  <div class="arrow-line vertical stream" aria-hidden="true"></div>
                  <div class="arrow-head stream">▼</div>
                </div>
                <div class="flow-label streaming-label">
                  <span class="label-type">Server Streaming</span>
                  <span class="label-detail">Sensor → Control</span>
                  <span class="label-method">streamSensorData()</span>
                </div>
              </div>
              <div class="service-node sensor" role="group" aria-label="Sensor Service (Data Provider)">
                <div class="node-icon">📡</div>
                <div class="node-name">Sensor Service</div>
                <div class="node-tech">Data Generator</div>
                <div class="node-port">gRPC :8002</div>
                <div class="node-badges">
                  <span class="badge" title="Generates vehicle counts">VEH</span>
                  <span class="badge" title="Speed & conditions">SPD</span>
                  <span class="badge" title="Incident detection">INC</span>
                </div>
                <details class="service-details">
                  <summary>Service Details</summary>
                  <div class="service-description">
                    <p><strong>Overview:</strong> The Sensor Control Service is a gRPC microservice responsible for simulating and streaming real-time traffic sensor data. It continuously generates vehicle count, speed, road conditions, and incident detection data for multiple intersections in the smart city traffic management system.</p>
                    <p><strong>Architecture Role:</strong> This service acts as a data provider in the system, streaming sensor readings to the Traffic Control Service using gRPC Server Streaming. It simulates IoT sensors deployed at traffic intersections.</p>
                  </div>
                </details>
              </div>
            </div>

            <!-- Right: Bidirectional with Traffic Light -->
            <div class="grpc-flow light-flow" title="Full duplex optimization commands & phase status">
              <div class="connection-flow bidir-flow" [class.active]="hasActiveLightStream">
                <div class="flow-arrow bidir" aria-hidden="true">
                  <div class="arrow-head up">▲</div>
                  <div class="arrow-line vertical bidir"></div>
                  <div class="arrow-head down">▼</div>
                </div>
                <div class="flow-label bidir-label">
                  <span class="label-type">Bidirectional</span>
                  <span class="label-detail">Control ⇄ Light</span>
                  <span class="label-method">coordinateTrafficLights()</span>
                </div>
              </div>
              <div class="service-node light" role="group" aria-label="Traffic Light Service (Actuator)">
                <div class="node-icon">🚦</div>
                <div class="node-name">Traffic Light Service</div>
                <div class="node-tech">Phase Controller</div>
                <div class="node-port">gRPC :8003</div>
                <div class="node-badges">
                  <span class="badge" title="Current phase status">PHASE</span>
                  <span class="badge" title="Adaptive timing">ADAPT</span>
                  <span class="badge" title="Receives optimization commands">CMD</span>
                </div>
                <details class="service-details">
                  <summary>Service Details</summary>
                  <div class="service-description">
                    <p><strong>Overview:</strong> The Traffic Light Service is a gRPC microservice responsible for managing traffic light phases and responding to coordination commands. It implements a bidirectional streaming gRPC interface to receive commands from the Traffic Control Service and send back phase status updates in real-time.</p>
                    <p><strong>Architecture Role:</strong> This service acts as a traffic light controller in the system, receiving optimization commands from the Traffic Control Service via gRPC Bidirectional Streaming and managing traffic light phases (RED, GREEN, YELLOW) for multiple intersections.</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- Diagram Legend -->
        <div class="legend" aria-label="Protocol legend">
          <div class="legend-title">Legend</div>
          <div class="legend-items">
            <div class="legend-item"><span class="legend-swatch rest"></span><span>REST (Unary HTTP/JSON)</span></div>
            <div class="legend-item"><span class="legend-swatch websocket"></span><span>WebSocket (Merged updates)</span></div>
            <div class="legend-item"><span class="legend-swatch stream"></span><span>gRPC Server Streaming (Sensors)</span></div>
            <div class="legend-item"><span class="legend-swatch bidir"></span><span>gRPC Bidirectional (Lights)</span></div>
            <div class="legend-item"><span class="legend-swatch optional"></span><span>Optional gRPC Server *</span></div>
          </div>
        </div>

        <!-- Collapsible Details -->
        <details class="details-block">
          <summary>Advanced: Resilience & Performance</summary>
          <ul>
            <li><strong>WebSocket Reconnect:</strong> exponential backoff, resumes with latest snapshot.</li>
            <li><strong>Sensor Stream:</strong> continuous ticks (~2s) aggregated server-side to reduce payload size.</li>
            <li><strong>Light Duplex:</strong> command buffering; replays last optimization on re-connect.</li>
            <li><strong>Optional gRPC Server:</strong> reserved for future gRPC-Web / external analytic consumers.</li>
            <li><strong>Front-End Strategy:</strong> REST for initial snapshot + WS for deltas avoids polling storm.</li>
          </ul>
        </details>
      </div>

      <div class="communication-stats">
        <div class="stat-card rest-stat">
          <div class="stat-icon">🌐</div>
          <div class="stat-value">{{ restApiCallCount }}</div>
          <div class="stat-label">REST API Calls</div>
          <div class="stat-route">Frontend → Control</div>
        </div>
        <div class="stat-card websocket-stat">
          <div class="stat-icon">🔌</div>
          <div class="stat-value">{{ webSocketMessageCount }}</div>
          <div class="stat-label">WebSocket Messages</div>
          <div class="stat-route">Frontend ⇄ Control</div>
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
    .visualizer-container{padding:16px;background:#fff;border-radius:6px;border:1px solid #e5e7eb}
    h2{margin:0 0 6px;font-size:22px;color:#1f2937;font-weight:600}
    .subtitle{margin:0 0 18px;font-size:13px;color:#4b5563}
    .architecture-diagram{display:flex;flex-direction:column;gap:14px;margin-bottom:22px}
    .layer{display:flex;justify-content:center}
    .service-node{padding:18px 22px;border-radius:12px;min-width:230px;font-size:13px;color:#fff}
    .service-node.frontend{background:#2563eb}
    .service-node.control{background:#d97706}
    .service-node.sensor{background:#16a34a}
    .service-node.light{background:#db2777}
    .node-icon{font-size:34px;margin-bottom:8px}
    .node-name{font-weight:600;margin-bottom:4px;font-size:15px}
    .node-tech,.node-port{opacity:.85;font-size:12px}
    .node-port{font-family:monospace}
    .dual-connections{display:flex;gap:18px}
    .connection-flow{display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid #d1d5db;border-radius:10px;background:#f9fafb;font-size:12px}
    .connection-flow.active{border-color:#2563eb}
    .flow-arrow{display:flex;flex-direction:column;align-items:center}
    .arrow-line{width:3px;height:42px;background:#d1d5db}
    .arrow-line.rest{background:#2563eb}
    .arrow-line.websocket{background:#7c3aed;height:50px}
    .arrow-line.stream{background:#16a34a}
    .arrow-line.bidir{background:#db2777;height:36px}
    .arrow-head{font-size:15px;color:inherit}
    .flow-label{display:flex;flex-direction:column;gap:3px}
    .label-type{font-weight:600;font-size:13px}
    .label-detail{font-size:12px;color:#374151}
    .label-method{font-family:monospace;font-size:12px;color:#374151}
    .grpc-connections{display:flex;gap:26px}
    .grpc-flow{display:flex;flex-direction:column;align-items:center;gap:12px}
    .communication-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:18px}
    .stat-card{padding:14px;border-radius:8px;font-size:12px;color:#fff}
    .rest-stat{background:#2563eb}.websocket-stat{background:#7c3aed}.stream-stat{background:#16a34a}.bidir-stat{background:#db2777}.total-stat{background:#d97706}
    .stat-icon{font-size:22px;margin-bottom:6px}
    .stat-value{font-size:22px;font-weight:600}
    .stat-label{font-size:12px}
    .stat-route{font-size:12px;font-family:monospace}
    .log-entries{background:#111827;border-radius:8px;padding:12px;max-height:300px;overflow:auto;font-family:monospace;font-size:12px}
    .log-entry{display:grid;grid-template-columns:85px 78px 150px 1fr;gap:8px;padding:8px;border-radius:6px;margin-bottom:6px;border-left:4px solid transparent;background:#1f2937}
    .log-entry.success{border-color:#16a34a;background:#1f2937}
    .log-entry.error{border-color:#dc2626;background:#1f2937}
    .log-entry.pending{border-color:#ca8a04;background:#1f2937}
    .log-entry:hover{filter:brightness(1.15)}
    .log-time{color:#9ca3af;font-weight:600}
    .log-type{padding:3px 6px;border-radius:4px;font-size:10px;font-weight:600;text-align:center;letter-spacing:.5px}
    .log-type.rest{background:#2563eb;color:#fff}.log-type.server-stream{background:#16a34a;color:#fff}.log-type.bidirectional{background:#db2777;color:#fff}
    .log-service{color:#60a5fa;font-weight:600}
    .log-message{color:#e5e7eb;line-height:1.3;word-break:break-word}
    .no-logs{text-align:center;color:#9ca3af;padding:24px;font-style:italic}
    .legend,.details-block{font-size:12px;margin-top:10px}
    .legend-title{font-weight:600;margin-bottom:4px;text-transform:uppercase;font-size:12px;color:#374151}
    .legend-items{display:flex;flex-wrap:wrap;gap:10px}
    .legend-item{display:flex;align-items:center;gap:6px;font-size:12px}
    .legend-swatch{width:16px;height:7px;border-radius:3px}
    .legend-swatch.rest{background:#2563eb}.legend-swatch.websocket{background:#7c3aed}.legend-swatch.stream{background:#16a34a}.legend-swatch.bidir{background:#db2777}.legend-swatch.optional{background:#9ca3af}
    .node-badges{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
    .badge{background:rgba(255,255,255,.25);padding:3px 7px;border-radius:10px;font-size:10px;font-weight:600}
    .badge-outline{background:rgba(0,0,0,.25)}
    .service-details{margin-top:12px;color:#fff}
    .service-details summary{cursor:pointer;font-weight:600;font-size:12px;padding:6px 10px;background:rgba(0,0,0,.2);border-radius:6px;list-style:none;user-select:none;transition:background .2s}
    .service-details summary:hover{background:rgba(0,0,0,.3)}
    .service-details summary::-webkit-details-marker{display:none}
    .service-details summary::before{content:'▶ ';display:inline-block;margin-right:4px;transition:transform .2s}
    .service-details[open] summary::before{transform:rotate(90deg)}
    .service-description{margin-top:8px;padding:10px;background:rgba(0,0,0,.15);border-radius:6px;font-size:11px;line-height:1.5}
    .service-description p{margin:0 0 8px}
    .service-description p:last-child{margin-bottom:0}
    .service-description ul{margin:6px 0 0;padding-left:20px}
    .service-description li{margin-bottom:4px}
    .service-description li:last-child{margin-bottom:0}
  `]
})
export class CommunicationVisualizerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  logs: CommunicationLog[] = [];
  restApiCallCount = 0;
  webSocketMessageCount = 0;
  sensorStreamCount = 0;
  lightCommandCount = 0;
  totalMessages = 0;

  hasActiveRest = false;
  hasActiveWebSocket = false;
  hasActiveSensorStream = false;
  hasActiveLightStream = false;

  constructor(private realtimeDataService: RealtimeDataService) {}

  ngOnInit(): void {
    this.realtimeDataService.communicationLogs$
      .pipe(takeUntil(this.destroy$))
      .subscribe((log: CommunicationLog) => {
        this.logs.push(log);
        this.updateStats(log);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateStats(log: CommunicationLog): void {
    this.totalMessages++;

    // REST API calls (Frontend → Traffic Control)
    if (log.type === 'UNARY' && log.service === 'Traffic Control') {
      this.restApiCallCount++;
      this.hasActiveRest = true;
      setTimeout(() => this.hasActiveRest = false, 1000);
    }

    // WebSocket messages (Frontend ⇄ Traffic Control)
    else if (log.service === 'Traffic Control' && log.type === 'SERVER_STREAMING') {
      this.webSocketMessageCount++;
      this.hasActiveWebSocket = true;
      setTimeout(() => this.hasActiveWebSocket = false, 1000);
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
