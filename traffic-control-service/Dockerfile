FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/quarkus-app/ ./
EXPOSE 8001 9001
CMD ["java", "-jar", "quarkus-run.jar"]
# Smart City Traffic Management System - gRPC Demo

This project demonstrates all three gRPC communication patterns using Java Quarkus microservices. It simulates a Smart City Traffic Management System where different services communicate to manage traffic flow, monitor sensors, and coordinate traffic lights.

## Architecture Overview

The system consists of three microservices:

1. **Sensor Control Service** (Ports: HTTP 8000, gRPC 9002)
   - Implements **Server Streaming** pattern
   - Simulates IoT traffic sensors at intersections
   - Streams real-time vehicle counts, speeds, and road conditions

2. **Traffic Light Service** (Ports: HTTP 8002, gRPC 9003)
   - Implements **Bidirectional Streaming** pattern
   - Manages traffic light states and phases
   - Receives commands and sends status updates continuously

3. **Traffic Control Service** (Ports: HTTP 8001, gRPC 9001)
   - Implements **Unary (Request-Response)** pattern
   - Central coordination service
   - Acts as gRPC client to both Sensor and Traffic Light services
   - Exposes REST API and WebSocket for frontend integration

## gRPC Communication Patterns Demonstrated

### 1. Unary RPC (Request-Response)
**Service:** Traffic Control Service
**Endpoints:**
- `GetIntersectionStats` - Query statistics for a specific intersection
- `GetAllIntersections` - Get all intersections with current data

**Example:**
```bash
# Using gRPCurl
grpcurl -plaintext -d '{"intersection_id":"INT-001"}' localhost:9001 traffic.control.TrafficControlService/GetIntersectionStats
```

### 2. Server Streaming
**Service:** Sensor Control Service → Traffic Control Service
**Method:** `StreamSensorData`

The Traffic Control Service subscribes to real-time sensor data from the Sensor Service. The Sensor Service continuously streams vehicle counts, speeds, and road conditions every 2 seconds.

**Flow:**
1. Traffic Control Service sends subscription request with intersection IDs
2. Sensor Service starts streaming sensor readings
3. Traffic Control Service receives continuous updates

### 3. Bidirectional Streaming
**Service:** Traffic Control Service ↔ Traffic Light Service
**Method:** `CoordinateTrafficLights`

Both services maintain an open bidirectional channel:
- Traffic Control Service sends optimization commands based on traffic conditions
- Traffic Light Service sends back real-time status updates
- Both services can send/receive messages at any time

**Flow:**
1. Traffic Control Service opens bidirectional stream
2. Sends commands to change traffic light phases
3. Receives status updates from traffic lights
4. Both services continuously exchange information

## Prerequisites

- Java 21 or later
- Maven 3.8+
- Node.js 18+ and npm (for frontend)
- Docker and Docker Compose (optional)

## Quick Start

### Option 1: Run Services Individually

#### Terminal 1 - Sensor Control Service
```bash
cd sensor-control-service
./mvnw clean quarkus:dev
```

#### Terminal 2 - Traffic Light Service
```bash
cd traffic-light-service
./mvnw clean quarkus:dev
```

#### Terminal 3 - Traffic Control Service
```bash
cd traffic-control-service
./mvnw clean quarkus:dev
```

### Option 2: Using Docker Compose
```bash
docker-compose up --build
```

## Testing the gRPC Services

### 1. Test Unary RPC

Get all intersections:
```bash
curl http://localhost:8001/api/traffic/intersections
```

Get specific intersection stats:
```bash
curl http://localhost:8001/api/traffic/intersections/INT-001
```

### 2. Monitor Server Streaming

Check sensor data being received:
```bash
curl http://localhost:8001/api/traffic/sensors
```

The Traffic Control Service is continuously receiving sensor data via gRPC streaming.

### 3. Monitor Bidirectional Streaming

Check traffic light status:
```bash
curl http://localhost:8001/api/traffic/lights
```

Send a command to change traffic light:
```bash
curl -X POST http://localhost:8001/api/traffic/lights/INT-001/command \
  -H "Content-Type: application/json" \
  -d '{"phase":"GREEN_NS","duration":45,"priority":3}'
```

### 4. WebSocket Real-Time Updates

Connect to WebSocket for live updates:
```javascript
const ws = new WebSocket('ws://localhost:8001/ws/traffic');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

## Service Ports

| Service | HTTP Port | gRPC Port |
|---------|-----------|-----------|
| Sensor Control Service | 8000 | 9002 |
| Traffic Control Service | 8001 | 9001 |
| Traffic Light Service | 8002 | 9003 |

## API Endpoints

### Traffic Control Service (HTTP REST API)

- `GET /api/traffic/intersections` - Get all intersections
- `GET /api/traffic/intersections/{id}` - Get specific intersection stats
- `GET /api/traffic/sensors` - Get all sensor data
- `GET /api/traffic/lights` - Get all traffic light statuses
- `POST /api/traffic/lights/{id}/command` - Send command to traffic light
- `GET /api/traffic/health` - Health check
- `WS /ws/traffic` - WebSocket for real-time updates

## Observing gRPC Communication

### View Logs

Each service logs gRPC communication events:

**Sensor Service (Server Streaming):**
```
Starting sensor data stream for intersections: [INT-001, INT-002, INT-003, INT-004], interval: 2 seconds
Streaming sensor data: intersection=INT-001, vehicles=42, speed=28.50
```

**Traffic Light Service (Bidirectional Streaming):**
```
Bidirectional streaming started: CoordinateTrafficLights
Received command: intersection=INT-001, phase=GREEN_NS, duration=45, priority=3
Sent status: intersection=INT-001, phase=GREEN_NS, remaining=43
```

**Traffic Control Service (Unary + Clients):**
```
Unary RPC: GetIntersectionStats for intersection: INT-001
Received sensor data: intersection=INT-001, vehicles=38, speed=32.15, condition=HEAVY_TRAFFIC
Received traffic light status: intersection=INT-001, phase=GREEN_NS, remaining=40, queue=12
```

## Project Structure

```
smart-city-traffic-management-system/
├── sensor-control-service/
│   ├── src/main/
│   │   ├── proto/
│   │   │   └── sensor.proto
│   │   ├── java/com/mihailmerkov/sctms/sensor/
│   │   │   ├── grpc/SensorGrpcService.java
│   │   │   └── simulator/TrafficSimulator.java
│   │   └── resources/application.properties
│   └── pom.xml
│
├── traffic-light-service/
│   ├── src/main/
│   │   ├── proto/
│   │   │   └── traffic-light.proto
│   │   ├── java/com/mihailmerkov/sctms/light/
│   │   │   ├── grpc/TrafficLightGrpcService.java
│   │   │   └── controller/LightController.java
│   │   └── resources/application.properties
│   └── pom.xml
│
├── traffic-control-service/
│   ├── src/main/
│   │   ├── proto/
│   │   │   ├── traffic-control.proto
│   │   │   ├── sensor.proto
│   │   │   └── traffic-light.proto
│   │   ├── java/com/mihailmerkov/sctms/traffic/
│   │   │   ├── grpc/TrafficControlGrpcService.java
│   │   │   ├── service/
│   │   │   │   ├── TrafficCoordinationService.java
│   │   │   │   ├── SensorClientService.java
│   │   │   │   └── TrafficLightClientService.java
│   │   │   ├── rest/TrafficRestResource.java
│   │   │   └── websocket/TrafficWebSocket.java
│   │   └── resources/application.properties
│   └── pom.xml
│
├── frontend-service/ (Angular - to be implemented)
├── docker-compose.yml
└── README.md
```

## Key Implementation Details

### Proto Definitions

All proto files are located in `src/main/proto/` of each service. Quarkus automatically generates Java classes during compilation.

### Server Streaming Implementation

```java
@Override
public Multi<SensorReading> streamSensorData(SensorSubscription request) {
    return Multi.createFrom().ticks().every(Duration.ofSeconds(2))
        .onItem().transform(tick -> generateSensorReading(request))
        .onItem().transformToMultiAndConcatenate(Multi.createFrom()::iterable);
}
```

### Bidirectional Streaming Implementation

```java
@Override
public Multi<TrafficLightStatus> coordinateTrafficLights(Multi<TrafficLightCommand> commands) {
    BroadcastProcessor<TrafficLightStatus> statusProcessor = BroadcastProcessor.create();

    commands.subscribe().with(
        command -> {
            processCommand(command);
            statusProcessor.onNext(getStatus(command.getIntersectionId()));
        }
    );

    return statusProcessor;
}
```

### gRPC Client Configuration

Clients are configured in `application.properties`:
```properties
quarkus.grpc.clients.sensor-service.host=localhost
quarkus.grpc.clients.sensor-service.port=9002
```

And injected using `@GrpcClient`:
```java
@GrpcClient("sensor-service")
SensorService sensorService;
```

## Development Mode

Quarkus Dev Mode provides hot reload:
```bash
./mvnw quarkus:dev
```

Access Dev UI at: http://localhost:8001/q/dev

## Building for Production

Build all services:
```bash
# In each service directory
./mvnw clean package
```

Run the JAR:
```bash
java -jar target/quarkus-app/quarkus-run.jar
```

## Testing

Run tests:
```bash
./mvnw test
```

## Troubleshooting

### Services can't communicate
- Ensure all services are running
- Check ports are not in use: `lsof -i :9001,9002,9003,8000,8001,8002`
- Verify gRPC client configuration in `application.properties`

### Proto compilation errors
- Run: `./mvnw clean compile` to regenerate gRPC code
- Check proto file syntax
- Ensure Quarkus gRPC plugin is configured in pom.xml

### Connection refused errors
- Start services in order: Sensor → Traffic Light → Traffic Control
- Check service logs for startup errors
- Verify network connectivity

## Learning Outcomes

This project demonstrates:
1. ✅ Defining gRPC service contracts with Protocol Buffers
2. ✅ Implementing Unary RPC for request-response patterns
3. ✅ Implementing Server Streaming for continuous data feeds
4. ✅ Implementing Bidirectional Streaming for full-duplex communication
5. ✅ Using Mutiny for reactive programming in Quarkus
6. ✅ Building gRPC clients and servers
7. ✅ Bridging gRPC with REST/WebSocket for frontend integration
8. ✅ Managing streaming lifecycles and error handling
9. ✅ Microservice coordination and communication patterns

## Next Steps

- [ ] Implement Angular frontend with real-time visualization
- [ ] Add authentication with JWT tokens
- [ ] Implement service mesh (Istio) for observability
- [ ] Add distributed tracing with OpenTelemetry
- [ ] Implement circuit breakers and retry logic
- [ ] Add database persistence for historical data
- [ ] Create Kubernetes deployment manifests
- [ ] Add monitoring with Prometheus and Grafana

## Resources

- [Quarkus gRPC Guide](https://quarkus.io/guides/grpc)
- [gRPC Documentation](https://grpc.io/docs/)
- [Protocol Buffers](https://protobuf.dev/)
- [Mutiny Reactive Programming](https://smallrye.io/smallrye-mutiny/)

## License

This project is for educational purposes.

---

**Built with:** Java 21, Quarkus 3.29.0, gRPC, Protocol Buffers, Mutiny

