# Traffic Control Service

## Overview
The Traffic Control Service is the central orchestrator microservice that coordinates all traffic management operations. It acts as a gRPC client to both Sensor and Traffic Light services, aggregates data, and exposes REST APIs and WebSocket endpoints for the frontend application.

## Technology Stack
- **Framework**: Quarkus 3.29.0
- **Language**: Java 21
- **Protocols**: 
  - gRPC Client (Server Streaming & Bidirectional)
  - REST API (HTTP/JSON)
  - WebSocket (Real-time streaming)
- **Build Tool**: Maven
- **Key Dependencies**:
  - Quarkus gRPC
  - Quarkus Mutiny (Reactive Programming)
  - Quarkus WebSockets
  - Quarkus RESTEasy Jackson

## Architecture Role
This service acts as the **orchestrator** in the system, serving as:
- gRPC client consuming streams from Sensor Service (Server Streaming)
- gRPC client coordinating with Traffic Light Service (Bidirectional Streaming)
- REST API provider for the frontend
- WebSocket server for real-time data streaming to the frontend

## Ports
- **HTTP Port**: 8001
- **gRPC Port**: 8001 (shared with HTTP)
- **WebSocket**: `ws://localhost:8001/ws/traffic`

## Features
- Central coordination of all traffic management operations
- Real-time data aggregation from sensor streams
- Traffic light phase optimization algorithms
- REST API for on-demand queries
- WebSocket streaming for real-time frontend updates
- CORS enabled for frontend integration
- Health monitoring and status reporting

## Prerequisites
- Java 21 or higher
- Maven 3.8+
- Sensor Control Service running on port 8002
- Traffic Light Service running on port 8003

## How to Download Dependencies
```bash
# Navigate to the service directory
cd traffic-control-service

# Download all Maven dependencies
./mvnw clean install
```

## How to Start the Service

### Development Mode (with hot reload)
```bash
./mvnw quarkus:dev
```

### Production Mode
```bash
# Build the application
./mvnw clean package

# Run the JAR
java -jar target/quarkus-app/quarkus-run.jar
```

## Docker Deployment

### Using Docker (Standalone)
```bash
# Build optimized Docker image with multi-stage build
docker build -t traffic-control-service:latest .

# Run container (requires other services to be running)
docker run -d \
  --name traffic-control-service \
  -p 8001:8001 \
  -e QUARKUS_GRPC_CLIENTS_SENSOR_SERVICE_HOST=sensor-control-service \
  -e QUARKUS_GRPC_CLIENTS_SENSOR_SERVICE_PORT=8002 \
  -e QUARKUS_GRPC_CLIENTS_TRAFFIC_LIGHT_SERVICE_HOST=traffic-light-service \
  -e QUARKUS_GRPC_CLIENTS_TRAFFIC_LIGHT_SERVICE_PORT=8003 \
  traffic-control-service:latest

# View logs
docker logs -f traffic-control-service

# Stop container
docker stop traffic-control-service
```

### Using Docker Compose (Recommended)
The service is included in the root `docker-compose.yml` for full system orchestration:

```bash
# From the project root directory
docker-compose up -d

# View logs for this service
docker-compose logs -f traffic-control-service

# Stop all services
docker-compose down
```

### Docker Image Features
- **Multi-stage build**: Optimized image size (~200MB)
- **Security**: Runs as non-root user
- **Health checks**: Built-in health monitoring
- **Caching**: Efficient layer caching for faster rebuilds
- **Alpine Linux**: Minimal base image
- **Service discovery**: Automatic connection to other services in Docker network

### Docker Environment Variables
- `QUARKUS_HTTP_PORT` - HTTP/WebSocket port (default: 8001)
- `QUARKUS_GRPC_CLIENTS_SENSOR_SERVICE_HOST` - Sensor service hostname
- `QUARKUS_GRPC_CLIENTS_SENSOR_SERVICE_PORT` - Sensor service port
- `QUARKUS_GRPC_CLIENTS_TRAFFIC_LIGHT_SERVICE_HOST` - Traffic light service hostname
- `QUARKUS_GRPC_CLIENTS_TRAFFIC_LIGHT_SERVICE_PORT` - Traffic light service port
- `QUARKUS_HTTP_CORS_ORIGINS` - CORS allowed origins
- `QUARKUS_LOG_LEVEL` - Logging level (default: INFO)

## Testing the Service
Once started, the service will be available at:
- **REST API**: `http://localhost:8001/api/traffic`
- **WebSocket**: `ws://localhost:8001/ws/traffic`
- **Health Check**: `http://localhost:8001/q/health`

### REST API Endpoints
```bash
# Get all intersections
curl http://localhost:8001/api/traffic/intersections

# Get specific intersection
curl http://localhost:8001/api/traffic/intersections/INT-001

# Health check
curl http://localhost:8001/api/traffic/health
```

### WebSocket Connection
Connect to `ws://localhost:8001/ws/traffic` to receive real-time traffic updates combining sensor data and light status.

## API Documentation

### REST Endpoints
- `GET /api/traffic/intersections` - Returns all intersection statistics
- `GET /api/traffic/intersections/{id}` - Returns specific intersection stats
- `GET /api/traffic/health` - Service health status

### WebSocket Stream
- `ws://localhost:8001/ws/traffic` - Real-time bidirectional stream
  - Sends combined sensor and traffic light data
  - Updates every 2 seconds
  - JSON format with sensors[] and lights[] arrays

### gRPC Clients (Internal)
- Connects to Sensor Service (port 8002) for sensor data streaming
- Connects to Traffic Light Service (port 8003) for phase coordination

## Configuration
Key configurations in `application.properties`:
- `quarkus.http.port=8001` - HTTP, gRPC, and WebSocket port
- `quarkus.grpc.clients.sensor-service.host=localhost`
- `quarkus.grpc.clients.sensor-service.port=8002`
- `quarkus.grpc.clients.traffic-light-service.host=localhost`
- `quarkus.grpc.clients.traffic-light-service.port=8003`
- CORS enabled for frontend at `http://localhost:4200`

## Traffic Optimization Logic
The service implements intelligent algorithms to:
1. Analyze real-time sensor data (vehicle counts, speeds)
2. Calculate optimal traffic light phase durations
3. Send coordination commands to traffic lights
4. Monitor and adjust based on congestion levels
5. Handle incident detection and emergency routing

## Development
```bash
# Run tests
./mvnw test

# Run in dev mode with debugging
./mvnw quarkus:dev -Ddebug=5004
```

## Dependencies
This service requires both backend services to be running:
1. Start Sensor Control Service (port 8002)
2. Start Traffic Light Service (port 8003)
3. Start Traffic Control Service (port 8001)

## Notes
- Acts as the main integration point between all microservices
- Bridges gRPC backend services with HTTP/WebSocket frontend
- Manages 6 intersections: INT-001 through INT-006
- Implements reactive programming patterns using Mutiny
- Provides comprehensive logging for debugging coordination logic

