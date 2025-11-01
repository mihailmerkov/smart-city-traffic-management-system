import {Component, OnDestroy, OnInit, PLATFORM_ID, Inject} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {Subject, takeUntil} from 'rxjs';
import {RealtimeDataService} from '../../services/realtime-data.service';
import {IntersectionStats} from '../../services/traffic-api.service';

// Lazy load Leaflet only on browser
let L: any;

interface IntersectionMarker {
  id: string;
  marker: any;
  circle: any;
  stats?: IntersectionStats;
}

@Component({
  selector: 'app-city-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div id="map" class="map"></div>
      <div class="map-legend">
        <h3>Traffic Conditions</h3>
        <div class="legend-item">
          <span class="legend-color" style="background: #22c55e"></span>
          <span>Light (0-15 vehicles)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #eab308"></span>
          <span>Moderate (16-30 vehicles)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #f97316"></span>
          <span>Heavy (31-45 vehicles)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #ef4444"></span>
          <span>Congested (45+ vehicles)</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-container {
      position: relative;
      width: 100%;
      height: 600px;
    }

    .map {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .map-legend {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }

    .map-legend h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: 600;
    }

    .legend-item {
      display: flex;
      align-items: center;
      margin: 5px 0;
      font-size: 12px;
    }

    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-right: 8px;
      display: inline-block;
    }
  `]
})
export class CityMapComponent implements OnInit, OnDestroy {
  private map: any;
  private destroy$ = new Subject<void>();
  private intersections: Map<string, IntersectionMarker> = new Map();
  private isBrowser: boolean;

  // City center coordinates (example: New York City)
  private cityCenter: [number, number] = [40.7128, -74.0060];

  // Intersection positions
  private intersectionLocations = [
    { id: 'INT-001', lat: 40.7128, lng: -74.0060, name: 'Times Square' },
    { id: 'INT-002', lat: 40.7489, lng: -73.9680, name: 'Central Park South' },
    { id: 'INT-003', lat: 40.6782, lng: -73.9442, name: 'Brooklyn Bridge' },
    { id: 'INT-004', lat: 40.7614, lng: -73.9776, name: 'Columbus Circle' }
  ];

  constructor(
    private realtimeService: RealtimeDataService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async ngOnInit(): Promise<void> {
    if (this.isBrowser) {
      // Dynamically import Leaflet only in the browser
      L = await import('leaflet');
      this.initMap();
      this.createIntersectionMarkers();
      this.subscribeToUpdates();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (!L) return;

    this.map = L.map('map', {
      center: this.cityCenter,
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Force map to recalculate size after initialization
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  private createIntersectionMarkers(): void {
    if (!L || !this.map) return;

    this.intersectionLocations.forEach(location => {
      const icon = L.divIcon({
        className: 'custom-traffic-icon',
        html: `
          <div style="
            width: 40px;
            height: 40px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            🚦
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([location.lat, location.lng], { icon })
        .addTo(this.map)
        .bindPopup(this.createPopupContent(location.id, location.name));

      const circle = L.circle([location.lat, location.lng], {
        radius: 200,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2
      }).addTo(this.map);

      marker.on('click', () => {
        this.onIntersectionClick(location.id);
      });

      this.intersections.set(location.id, { id: location.id, marker, circle });
    });
  }

  private createPopupContent(id: string, name: string): string {
    const stats = this.intersections.get(id)?.stats;
    if (!stats) {
      return `<b>${name}</b><br>ID: ${id}<br>Loading data...`;
    }

    return `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 10px 0;">${name}</h4>
        <p style="margin: 5px 0;"><b>ID:</b> ${id}</p>
        <p style="margin: 5px 0;"><b>Vehicles:</b> ${stats.vehicleCount}</p>
        <p style="margin: 5px 0;"><b>Avg Wait:</b> ${stats.avgWaitTime.toFixed(1)}s</p>
        <p style="margin: 5px 0;"><b>Phase:</b> ${this.formatPhase(stats.currentPhase)}</p>
        <p style="margin: 5px 0; font-size: 11px; color: #666;">
          Updated: ${new Date(stats.timestamp).toLocaleTimeString()}
        </p>
      </div>
    `;
  }

  private subscribeToUpdates(): void {
    this.realtimeService.intersectionUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.updateIntersectionMarker(stats);
      });
  }

  private updateIntersectionMarker(stats: IntersectionStats): void {
    const intersection = this.intersections.get(stats.intersectionId);
    if (!intersection) return;

    intersection.stats = stats;

    // Update circle color based on traffic
    const color = this.getTrafficColor(stats.vehicleCount);
    intersection.circle.setStyle({
      color: color,
      fillColor: color
    });

    // Update popup content
    const location = this.intersectionLocations.find(l => l.id === stats.intersectionId);
    if (location) {
      intersection.marker.setPopupContent(this.createPopupContent(stats.intersectionId, location.name));
    }
  }

  private getTrafficColor(vehicleCount: number): string {
    if (vehicleCount < 15) return '#22c55e'; // Green
    if (vehicleCount < 30) return '#eab308'; // Yellow
    if (vehicleCount < 45) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  private formatPhase(phase: string): string {
    const phaseMap: { [key: string]: string } = {
      'GREEN_NS': '🟢 N-S Green',
      'GREEN_EW': '🟢 E-W Green',
      'RED_ALL': '🔴 All Red',
      'UNKNOWN': '⚪ Unknown'
    };
    return phaseMap[phase] || phase;
  }

  private onIntersectionClick(id: string): void {
    this.realtimeService.getIntersectionById(id).subscribe();
  }
}

