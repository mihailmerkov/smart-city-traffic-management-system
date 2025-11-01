import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {IntersectionStats, TrafficApiService} from './traffic-api.service';

export interface CommunicationLog {
  timestamp: Date;
  type: 'UNARY' | 'SERVER_STREAMING' | 'BIDIRECTIONAL';
  service: string;
  message: string;
  status: 'success' | 'error' | 'pending';
}

interface WebSocketMessage {
  type: string;
  timestamp: number;
  sensors: any[];
  lights: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeDataService {
  private communicationLogs = new Subject<CommunicationLog>();
  private intersectionUpdates = new Subject<IntersectionStats>();
  private webSocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  communicationLogs$ = this.communicationLogs.asObservable();
  intersectionUpdates$ = this.intersectionUpdates.asObservable();

  constructor(private apiService: TrafficApiService) {
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    try {
      // Connect to Traffic Control WebSocket endpoint
      this.webSocket = new WebSocket('ws://localhost:8001/ws/traffic');

      this.webSocket.onopen = () => {
        console.log('WebSocket connected to Traffic Control Service');
        this.reconnectAttempts = 0;
        this.addLog('SERVER_STREAMING', 'Traffic Control',
          'WebSocket connection established', 'success');
      };

      this.webSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.addLog('SERVER_STREAMING', 'Traffic Control',
          'WebSocket connection error', 'error');
      };

      this.webSocket.onclose = () => {
        console.log('WebSocket disconnected');
        this.addLog('SERVER_STREAMING', 'Traffic Control',
          'WebSocket connection closed', 'error');
        this.handleReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    // Process sensor data and combine with light data
    const sensorMap = new Map();
    message.sensors?.forEach(sensor => {
      sensorMap.set(sensor.intersectionId, sensor);
    });

    const lightMap = new Map();
    message.lights?.forEach(light => {
      lightMap.set(light.intersectionId, light);
    });

    // Create intersection stats by combining sensor and light data
    const intersectionIds = new Set([...sensorMap.keys(), ...lightMap.keys()]);

    intersectionIds.forEach(id => {
      const sensor = sensorMap.get(id);
      const light = lightMap.get(id);

      const stats: IntersectionStats = {
        intersectionId: id,
        vehicleCount: sensor?.vehicleCount || 0,
        avgWaitTime: this.calculateWaitTime(sensor?.vehicleCount || 0, light?.currentPhase || 'UNKNOWN'),
        currentPhase: light?.currentPhase || 'UNKNOWN',
        timestamp: message.timestamp || Date.now()
      };

      this.intersectionUpdates.next(stats);
    });

    // Log the different gRPC communications happening in the backend
    if (message.sensors && message.sensors.length > 0) {
      this.addLog('SERVER_STREAMING', 'Sensor Service',
        `Received ${message.sensors.length} sensor readings`, 'success');
    }

    if (message.lights && message.lights.length > 0) {
      this.addLog('BIDIRECTIONAL', 'Traffic Light Service',
        `Received ${message.lights.length} light status updates`, 'success');
    }
  }

  private calculateWaitTime(vehicleCount: number, phase: string): number {
    let baseWaitTime = 15.0;
    let waitTime = baseWaitTime + (vehicleCount * 0.5);

    if (phase.includes('RED')) {
      waitTime += 20.0;
    }

    return Math.min(waitTime, 120.0);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

      console.log(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connectWebSocket();
      }, delay);
    } else {
      console.error('Max WebSocket reconnection attempts reached');
      this.addLog('SERVER_STREAMING', 'Traffic Control',
        'Failed to reconnect after multiple attempts', 'error');
    }
  }

  private addLog(type: CommunicationLog['type'], service: string, message: string, status: CommunicationLog['status']): void {
    this.communicationLogs.next({
      timestamp: new Date(),
      type,
      service,
      message,
      status
    });
  }

  getIntersectionById(id: string): Observable<IntersectionStats> {
    this.addLog('UNARY', 'Traffic Control', `Requesting stats for ${id}`, 'pending');
    return new Observable(observer => {
      this.apiService.getIntersectionStats(id).subscribe({
        next: (stats) => {
          this.addLog('UNARY', 'Traffic Control', `Received stats for ${id}`, 'success');
          observer.next(stats);
          observer.complete();
        },
        error: (err) => {
          this.addLog('UNARY', 'Traffic Control', `Error for ${id}: ${err.message}`, 'error');
          observer.error(err);
        }
      });
    });
  }
}

