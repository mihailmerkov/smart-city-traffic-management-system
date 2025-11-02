# Frontend Service

## Overview
The Frontend Service is a modern web application built with Angular 19 that provides a real-time visualization dashboard for the Smart City Traffic Management System. It displays live traffic data, intersection maps, communication flow between microservices, and comprehensive statistics.

## Technology Stack
- **Framework**: Angular 19.2.0
- **Language**: TypeScript 5.7.2
- **Rendering**: Server-Side Rendering (SSR) with Express
- **Build Tool**: Angular CLI
- **Key Dependencies**:
  - Angular SSR
  - RxJS 7.8 (Reactive Programming)
  - Leaflet 1.9.4 (Interactive Maps)
  - Express 4.18 (SSR Server)

## Architecture Role
This service acts as the **user interface** in the system, providing:
- Real-time traffic visualization dashboard
- Interactive city map with intersection markers
- Communication flow visualizer showing gRPC architecture
- Statistics dashboard with live metrics
- WebSocket connection to Traffic Control Service
- REST API consumption for on-demand data

## Port
- **HTTP Port**: 4200 (development)
- **SSR Port**: 4000 (production server-side rendering)

## Features
- **City Map Component**: Interactive map displaying 6 intersections with real-time status
- **Communication Visualizer**: Live visualization of REST, WebSocket, and gRPC communication flows
- **Stats Dashboard**: Real-time metrics including vehicle counts, wait times, and phase status
- **Real-time Updates**: WebSocket connection for continuous data streaming
- **Responsive Design**: Modern UI with gradient themes and animations
- **Server-Side Rendering**: Fast initial page loads with Angular SSR

## Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

## How to Download Dependencies
```bash
# Navigate to the service directory
cd frontend-service

# Install all npm dependencies
npm install
```

## How to Start the Service

### Development Mode (with hot reload)
```bash
# Start development server
npm start

# Or use Angular CLI directly
ng serve
```
The application will be available at `http://localhost:4200`

### Production Mode (with SSR)
```bash
# Build the application
npm run build

# Serve with Server-Side Rendering
npm run serve:ssr:frontend-service
```
The SSR server will be available at `http://localhost:4000`

## Docker Deployment

### Using Docker (Standalone)
```bash
# Build optimized Docker image with multi-stage build
docker build -t frontend-service:latest .

# Run container
docker run -d \
  --name frontend-service \
  -p 4200:4200 \
  -e NODE_ENV=production \
  -e API_BASE_URL=http://localhost:8001 \
  frontend-service:latest

# View logs
docker logs -f frontend-service

# Stop container
docker stop frontend-service
```

### Using Docker Compose (Recommended)
The service is included in the root `docker-compose.yml` for full system orchestration:

```bash
# From the project root directory
docker-compose up -d

# View logs for this service
docker-compose logs -f frontend-service

# Stop all services
docker-compose down
```

### Docker Image Features
- **Multi-stage build**: Optimized image size (~250MB)
- **Security**: Runs as non-root user
- **Health checks**: Built-in health monitoring
- **SSR enabled**: Server-Side Rendering for better SEO and performance
- **Production optimized**: Minified bundles and tree-shaking
- **Alpine Linux**: Minimal base image

### Docker Environment Variables
- `NODE_ENV` - Node environment (default: production)
- `PORT` - Application port (default: 4200)
- `API_BASE_URL` - Backend API URL (default: http://traffic-control-service:8001)

## Development
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --code-coverage

# Build for production
npm run build

# Watch mode for development
npm run watch
```

## Building for Production
```bash
# Build with SSR
npm run build

# The output will be in dist/frontend-service/
# - browser/  - Client-side assets
# - server/   - Server-side rendering bundle
```

## Testing the Application
Once started, open your browser and navigate to:
- **Development**: `http://localhost:4200`
- **Production SSR**: `http://localhost:4000`

### Available Views
1. **City Map**: Visual representation of 6 intersections with live updates
2. **Communication Architecture**: Real-time diagram showing:
   - Frontend → REST API → Traffic Control
   - Frontend ⇄ WebSocket ⇄ Traffic Control
   - Traffic Control → gRPC Stream → Sensor Service
   - Traffic Control ⇄ gRPC Bidirectional ⇄ Traffic Light Service
3. **Statistics Dashboard**: Live metrics for all intersections

## Application Structure
```
src/
├── app/
│   ├── components/
│   │   ├── city-map/              # Interactive map component
│   │   ├── communication-visualizer/  # Communication flow visualization
│   │   └── stats-dashboard/       # Real-time statistics
│   ├── services/
│   │   ├── realtime-data.service.ts   # WebSocket service
│   │   └── traffic-api.service.ts     # REST API service
│   ├── app.component.ts           # Main application component
│   └── app.config.ts              # Application configuration
├── index.html
└── main.ts                        # Application bootstrap
```

## API Integration

### WebSocket Connection
The frontend automatically connects to:
```
ws://localhost:8001/ws/traffic
```
This provides real-time streaming of:
- Sensor readings from all intersections
- Traffic light phase updates
- Combined traffic statistics

### REST API Calls
The frontend makes HTTP requests to:
```
http://localhost:8001/api/traffic/intersections      # All intersections
http://localhost:8001/api/traffic/intersections/{id} # Specific intersection
http://localhost:8001/api/traffic/health             # Health check
```

## Configuration
The service configuration is in `src/app/services/`:
- `traffic-api.service.ts`: REST API base URL (default: `http://localhost:8001`)
- `realtime-data.service.ts`: WebSocket URL (default: `ws://localhost:8001/ws/traffic`)

## Development
```bash
# Run tests
npm test

# Run tests with coverage
npm run test -- --code-coverage

# Build for production
npm run build

# Lint the code
ng lint

# Watch mode for development
npm run watch
```

## Building for Production
```bash
# Build with SSR
npm run build

# The output will be in dist/frontend-service/
# - browser/  - Client-side assets
# - server/   - Server-side rendering bundle
```

## Docker Support
```bash
# Build Docker image
docker build -t frontend-service .

# Run container
docker run -p 4200:4200 frontend-service
```

## Dependencies
This service requires the Traffic Control Service to be running:
- Traffic Control Service must be accessible at `http://localhost:8001`
- WebSocket endpoint at `ws://localhost:8001/ws/traffic`

## Features in Detail

### Real-time Data Flow
1. **WebSocket Stream**: Continuous updates every 2 seconds
2. **REST API**: On-demand queries for specific intersections
3. **Reactive Programming**: RxJS observables for data management
4. **Automatic Reconnection**: WebSocket auto-reconnects on disconnect

### Visualization Components
- **Animated Traffic Flows**: Visual indicators for active communication
- **Color-coded Status**: Intersection status based on traffic conditions
- **Live Counters**: Real-time message counts for each communication type
- **Communication Logs**: Detailed log of all service interactions

## Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Notes
- The application uses standalone components (Angular 19 feature)
- Server-Side Rendering improves initial load performance
- Leaflet provides interactive map capabilities
- All communication is visualized in real-time
- Responsive design works on desktop, tablet, and mobile devices

