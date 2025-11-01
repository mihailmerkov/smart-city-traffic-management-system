import {Injectable} from '@angular/core';
import {Observable, Subject, timer} from 'rxjs';
import {retry, share, switchMap} from 'rxjs/operators';
import {IntersectionStats, TrafficApiService} from './traffic-api.service';

export interface CommunicationLog {
  timestamp: Date;
  type: 'UNARY' | 'SERVER_STREAMING' | 'BIDIRECTIONAL';
  service: string;
  message: string;
  status: 'success' | 'error' | 'pending';
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeDataService {
  private communicationLogs = new Subject<CommunicationLog>();
  private intersectionUpdates = new Subject<IntersectionStats>();

  communicationLogs$ = this.communicationLogs.asObservable();
  intersectionUpdates$ = this.intersectionUpdates.asObservable();

  constructor(private apiService: TrafficApiService) {
    this.startPolling();
  }

  private startPolling(): void {
    // Poll all intersections every 3 seconds
    timer(0, 3000).pipe(
      switchMap(() => this.apiService.getAllIntersections()),
      retry({ count: 3, delay: 2000 }),
      share()
    ).subscribe({
      next: (intersections) => {
        intersections.forEach(intersection => {
          this.intersectionUpdates.next(intersection);
        });
        this.addLog('UNARY', 'Traffic Control', 'Fetched intersection stats', 'success');
      },
      error: (err) => {
        this.addLog('UNARY', 'Traffic Control', `Error: ${err.message}`, 'error');
      }
    });

    // Simulate streaming logs
    this.simulateStreamingLogs();
  }

  private simulateStreamingLogs(): void {
    // Simulate sensor streaming logs
    timer(2000, 4000).subscribe(() => {
      this.addLog('SERVER_STREAMING', 'Sensor Service',
        'Streaming sensor data from intersections', 'success');
    });

    // Simulate bidirectional streaming logs
    timer(3000, 5000).subscribe(() => {
      this.addLog('BIDIRECTIONAL', 'Traffic Light Service',
        'Coordinating traffic lights', 'success');
    });
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

