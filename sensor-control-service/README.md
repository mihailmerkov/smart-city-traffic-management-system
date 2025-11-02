# Sensor Control Service

## Overview
The Sensor Control Service is a gRPC microservice responsible for simulating and streaming real-time traffic sensor data. It continuously generates vehicle count, speed, road conditions, and incident detection data for multiple intersections in the smart city traffic management system.

## Technology Stack
- **Framework**: Quarkus 3.29.0
- **Language**: Java 21
- **Protocol**: gRPC (Server Streaming)
- **Build Tool**: Maven
- **Key Dependencies**:
  - Quarkus gRPC
  - Quarkus Mutiny (Reactive Programming)
  - Quarkus WebSockets
  - Quarkus RESTEasy Jackson

## Architecture Role
This service acts as a **data provider** in the system, streaming sensor readings to the Traffic Control Service using gRPC Server Streaming. It simulates IoT sensors deployed at traffic intersections.

## Ports
- **HTTP Port**: 8002
- **gRPC Port**: 8002 (shared with HTTP)

## Features
- Real-time sensor data generation for 6 intersections
- Server Streaming gRPC endpoint for continuous data flow
- Simulated vehicle counts, speeds, and road conditions
- Random incident detection
- CORS enabled for frontend integration

## Prerequisites
- Java 21 or higher
- Maven 3.8+

## How to Download Dependencies
```bash
# Navigate to the service directory
cd sensor-control-service

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
docker build -t sensor-control-service:latest .

# Run container
docker run -d \
  --name sensor-control-service \
  -p 8002:8002 \
  -e QUARKUS_LOG_LEVEL=INFO \
  sensor-control-service:latest

# View logs
docker logs -f sensor-control-service

# Stop container
docker stop sensor-control-service
```

### Using Docker Compose (Recommended)
The service is included in the root `docker-compose.yml` for full system orchestration:

```bash
# From the project root directory
docker-compose up -d

# View logs for this service
docker-compose logs -f sensor-control-service

# Stop all services
docker-compose down
```

### Docker Image Features
- **Multi-stage build**: Optimized image size (~200MB)
- **Security**: Runs as non-root user
- **Health checks**: Built-in health monitoring
- **Caching**: Efficient layer caching for faster rebuilds
- **Alpine Linux**: Minimal base image

### Docker Environment Variables
- `QUARKUS_HTTP_PORT` - HTTP/gRPC port (default: 8002)
- `QUARKUS_LOG_LEVEL` - Logging level (default: INFO)
- `QUARKUS_LOG_CATEGORY_COM_MIHAILMERKOV_SCTMS_SENSOR_LEVEL` - Service-specific logging

## Testing the Service
Once started, the service will be available at:
- **gRPC Server**: `localhost:8002`
- **Health Check**: `http://localhost:8002/q/health`

### gRPC Endpoints
- `SensorService.streamSensorData()` - Server streaming endpoint that continuously sends sensor readings

## API Documentation
The service exposes a gRPC streaming API defined in `src/main/proto/sensor.proto`:

```protobuf
service SensorService {
  rpc streamSensorData(SensorRequest) returns (stream SensorReading);
}
```

## Configuration
Key configurations in `application.properties`:
- `quarkus.http.port=8002` - HTTP and gRPC port
- CORS enabled for frontend at `http://localhost:4200`

## Development
```bash
# Run tests
./mvnw test

# Run in dev mode with debugging
./mvnw quarkus:dev -Ddebug=5005
```

## Notes
- The service generates simulated data every 2 seconds per intersection
- Supports 6 intersections: INT-001 through INT-006
- Data includes vehicle count, speed, road conditions, and incident flags

