import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface IntersectionStats {
  intersectionId: string;
  vehicleCount: number;
  avgWaitTime: number;
  currentPhase: string;
  timestamp: number;
}

export interface SensorReading {
  sensorId: string;
  intersectionId: string;
  vehicleCount: number;
  averageSpeed: number;
  roadCondition: string;
  timestamp: number;
  incidentDetected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TrafficApiService {
  private baseUrl = 'http://localhost:8001/api/traffic';

  constructor(private http: HttpClient) { }

  getAllIntersections(): Observable<IntersectionStats[]> {
    return this.http.get<IntersectionStats[]>(`${this.baseUrl}/intersections`);
  }

  getIntersectionStats(intersectionId: string): Observable<IntersectionStats> {
    return this.http.get<IntersectionStats>(`${this.baseUrl}/intersections/${intersectionId}`);
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }
}

