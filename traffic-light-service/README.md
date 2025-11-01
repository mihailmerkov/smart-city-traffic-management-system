# Traffic Light Service

## Overview
The Traffic Light Service is a gRPC microservice responsible for managing traffic light phases and responding to coordination commands. It implements a bidirectional streaming gRPC interface to receive commands from the Traffic Control Service and send back phase status updates in real-time.

## Technology Stack
- **Framework**: Quarkus 3.29.0
- **Language**: Java 21
- **Protocol**: gRPC (Bidirectional Streaming)
- **Build Tool**: Maven
- **Key Dependencies**:
  - Quarkus gRPC
  - Quarkus Mutiny (Reactive Programming)
  - Quarkus WebSockets
  - Quarkus RESTEasy Jackson

## Architecture Role
This service acts as a **traffic light controller** in the system, receiving optimization commands from the Traffic Control Service via gRPC Bidirectional Streaming and managing traffic light phases (RED, GREEN, YELLOW) for multiple intersections.

## Ports
- **HTTP Port**: 8003
- **gRPC Port**: 8003 (shared with HTTP)

## Features
- Bidirectional gRPC streaming for real-time coordination
- Dynamic traffic light phase management
- Adaptive timing based on traffic conditions
- Phase transition logic (RED → GREEN → YELLOW → RED)
- Automatic phase cycling with configurable durations
- Real-time status reporting

## Prerequisites
- Java 21 or higher
- Maven 3.8+

## How to Download Dependencies
```bash
# Navigate to the service directory
cd traffic-light-service

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

### Using Docker
```bash
# Build Docker image
docker build -f src/main/docker/Dockerfile.jvm -t traffic-light-service .

# Run container
docker run -p 8003:8003 traffic-light-service
```

## Testing the Service
Once started, the service will be available at:
- **gRPC Server**: `localhost:8003`
- **Health Check**: `http://localhost:8003/q/health`

### gRPC Endpoints
- `TrafficLightService.coordinateTrafficLights()` - Bidirectional streaming endpoint for receiving commands and sending status updates

## API Documentation
The service exposes a gRPC bidirectional streaming API defined in `src/main/proto/traffic-light.proto`:

```protobuf
service TrafficLightService {
  rpc coordinateTrafficLights(stream LightCommand) returns (stream LightStatus);
}
```

## Configuration
Key configurations in `application.properties`:
- `quarkus.http.port=8003` - HTTP and gRPC port
- Debug logging enabled for light control logic

## Phase Management
The service manages three traffic light phases:
- **RED**: Stop phase (default 30-45 seconds)
- **YELLOW**: Caution phase (5 seconds)
- **GREEN**: Go phase (20-40 seconds, adaptive based on traffic)

Phase durations are dynamically adjusted based on:
- Vehicle count at the intersection
- Traffic optimization commands
- Time of day patterns

## Development
```bash
# Run tests
./mvnw test

# Run in dev mode with debugging
./mvnw quarkus:dev -Ddebug=5006
```

## Notes
- The service maintains state for 6 intersections (INT-001 through INT-006)
- Bidirectional streaming enables real-time coordination with Traffic Control
- Phase transitions are smooth and follow standard traffic light patterns
- Supports emergency override commands for incident management

