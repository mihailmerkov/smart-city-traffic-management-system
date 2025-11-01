import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, catchError, of, map } from 'rxjs';
import { switchMap, startWith, shareReplay } from 'rxjs/operators';

export interface ServiceHealth {
  name: string;
  status: 'online' | 'offline' | 'checking';
  endpoint: string;
}

@Injectable({
  providedIn: 'root'
})
export class HealthCheckService {

  private services = [
    { name: 'Traffic Control', endpoint: 'http://localhost:8001/api/traffic/health' },
    { name: 'Sensor Service', endpoint: 'http://localhost:8002/api/sensor/health' },
    { name: 'Traffic Light', endpoint: 'http://localhost:8003/api/light/health' }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Check health of all services every 10 seconds
   */
  checkAllServices(): Observable<ServiceHealth[]> {
    return interval(10000).pipe(
      startWith(0),
      switchMap(() => this.performHealthChecks()),
      shareReplay(1)
    );
  }

  private performHealthChecks(): Observable<ServiceHealth[]> {
    const checks = this.services.map(service =>
      this.checkService(service.endpoint, service.name)
    );

    // Convert array of observables to observable of array
    return new Observable(observer => {
      const results: ServiceHealth[] = [];
      let completed = 0;

      checks.forEach((check, index) => {
        check.subscribe(health => {
          results[index] = health;
          completed++;
          if (completed === checks.length) {
            observer.next(results);
            observer.complete();
          }
        });
      });
    });
  }

  private checkService(endpoint: string, name: string): Observable<ServiceHealth> {
    return this.http.get(endpoint, {
      observe: 'response',
      responseType: 'json'
    }).pipe(
      map(response => ({
        name,
        status: response.status === 200 ? 'online' as const : 'offline' as const,
        endpoint
      })),
      catchError(() => of({
        name,
        status: 'offline' as const,
        endpoint
      }))
    );
  }
}

