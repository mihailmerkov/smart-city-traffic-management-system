import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {CityMapComponent} from './components/city-map/city-map.component';
import {
  CommunicationVisualizerComponent
} from './components/communication-visualizer/communication-visualizer.component';
import {StatsDashboardComponent} from './components/stats-dashboard/stats-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    CityMapComponent,
    CommunicationVisualizerComponent,
    StatsDashboardComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Smart City Traffic Management System';
}
