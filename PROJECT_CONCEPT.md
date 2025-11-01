# gRPC Communication Demo Project

## Project Overview

This project demonstrates all three gRPC communication patterns using Java Quarkus microservices with a real-time frontend visualization. The demo simulates a **Smart City Traffic Management System** where different services communicate to manage traffic flow, monitor sensors, and coordinate traffic lights.

## System Architecture

### Services

#### 1. **Traffic Control Service** (Port: 9001)
- **Role**: Central coordination service
- **Responsibilities**:
  - Receives traffic sensor data
  - Coordinates traffic light timing
  - Provides traffic statistics
  - Aggregates city-wide traffic information

#### 2. **Sensor Network Service** (Port: 9002)
- **Role**: IoT sensor data provider
- **Responsibilities**:
  - Simulates traffic sensors at intersections
  - Streams real-time vehicle counts
  - Reports road conditions
  - Detects traffic incidents

#### 3. **Traffic Light Controller Service** (Port: 9003)
- **Role**: Traffic signal management
- **Responsibilities**:
  - Controls traffic light states
  - Responds to coordination requests
  - Maintains intersection priority
  - Handles emergency vehicle preemption

### Frontend Application
- **Technology**: Angular with WebSocket
- **Port**: 4200
- **Features**:
  - Real-time city map visualization
  - Live traffic flow indicators
  - gRPC communication pattern visualizer
  - Service health monitoring
  - Communication logs

## gRPC Communication Patterns

### 1. **Unary (Request-Response)**
**Use Case**: Query Traffic Statistics

```
Frontend → Traffic Control Service
Request: GetIntersectionStats(intersectionId)
Response: IntersectionStats(vehicleCount, avgWaitTime, currentPhase)
```

**Example Flow**:
- User clicks an intersection on the map
- Frontend sends request to Traffic Control Service
- Service returns current statistics
- Display stats in UI panel

### 2. **Server Streaming**
**Use Case**: Real-time Sensor Data Feed

```
Traffic Control Service → Sensor Network Service
Request: StreamSensorData(intersectionIds[])
Response: Stream<SensorReading>(timestamp, location, vehicleCount, speed)
```

**Example Flow**:
- Traffic Control Service subscribes to sensor updates
- Sensor Network Service streams data every 2 seconds
- Traffic Control Service processes and aggregates data
- Frontend displays live sensor readings on map

### 3. **Bidirectional Streaming**
**Use Case**: Traffic Light Coordination

```
Traffic Control Service ↔ Traffic Light Controller Service
Send: TrafficLightCommand(intersectionId, phase, duration)
Receive: TrafficLightStatus(intersectionId, currentPhase, queueLength)
```

**Example Flow**:
- Traffic Control Service sends optimization commands
- Traffic Light Controller sends back real-time status updates
- Both services continuously exchange information
- System adapts traffic light timing based on real-time conditions
- Frontend shows bidirectional communication with animated arrows

## Project Structure

```
smart-city-traffic-management-system/
├── traffic-control-service/          # Service 1 (Quarkus)
│   ├── src/main/
│   │   ├── proto/
│   │   │   ├── traffic-control.proto
│   │   │   ├── sensor.proto
│   │   │   └── traffic-light.proto
│   │   ├── java/com/demo/traffic/
│   │   │   ├── grpc/
│   │   │   │   ├── TrafficControlGrpcService.java
│   │   │   │   ├── SensorClientService.java
│   │   │   │   └── TrafficLightClientService.java
│   │   │   ├── model/
│   │   │   ├── service/
│   │   │   └── rest/
│   │   │       └── TrafficRestResource.java (Bridge to Frontend)
│   │   └── resources/
│   │       └── application.properties
│   └── pom.xml
│
├── sensor-network-service/            # Service 2 (Quarkus)
│   ├── src/main/
│   │   ├── proto/
│   │   │   └── sensor.proto
│   │   ├── java/com/demo/sensor/
│   │   │   ├── grpc/
│   │   │   │   └── SensorGrpcService.java
│   │   │   ├── simulator/
│   │   │   │   └── TrafficSimulator.java
│   │   │   └── model/
│   │   └── resources/
│   │       └── application.properties
│   └── pom.xml
│
├── traffic-light-service/             # Service 3 (Quarkus)
│   ├── src/main/
│   │   ├── proto/
│   │   │   └── traffic-light.proto
│   │   ├── java/com/demo/light/
│   │   │   ├── grpc/
│   │   │   │   └── TrafficLightGrpcService.java
│   │   │   ├── controller/
│   │   │   │   └── LightController.java
│   │   │   └── model/
│   │   └── resources/
│   │       └── application.properties
│   └── pom.xml
│
├── frontend-servoce/                          # Angular Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── city-map/
│   │   │   │   ├── service-monitor/
│   │   │   │   ├── communication-visualizer/
│   │   │   │   └── stats-panel/
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   └── websocket.service.ts
│   │   │   └── app.component.ts
│   │   ├── assets/
│   │   └── environments/
│   ├── angular.json
│   └── package.json
│
└── docker-compose.yml                 # Orchestrate all services
```

## Proto Definitions

### traffic-control.proto
```protobuf
syntax = "proto3";

package traffic.control;

service TrafficControlService {
  // Unary: Get intersection statistics
  rpc GetIntersectionStats(IntersectionRequest) returns (IntersectionStats);
  
  // Unary: Get all intersections
  rpc GetAllIntersections(Empty) returns (IntersectionList);
}

message IntersectionRequest {
  string intersection_id = 1;
}

message IntersectionStats {
  string intersection_id = 1;
  int32 vehicle_count = 2;
  double avg_wait_time = 3;
  string current_phase = 4;
  int64 timestamp = 5;
}

message IntersectionList {
  repeated IntersectionStats intersections = 1;
}

message Empty {}
```

### sensor.proto
```protobuf
syntax = "proto3";

package sensor;

service SensorService {
  // Server Streaming: Stream sensor data from multiple sensors
  rpc StreamSensorData(SensorSubscription) returns (stream SensorReading);
}

message SensorSubscription {
  repeated string intersection_ids = 1;
  int32 interval_seconds = 2;
}

message SensorReading {
  string sensor_id = 1;
  string intersection_id = 2;
  int32 vehicle_count = 3;
  double average_speed = 4;
  string road_condition = 5;
  int64 timestamp = 6;
  bool incident_detected = 7;
}
```

### traffic-light.proto
```protobuf
syntax = "proto3";

package trafficlight;

service TrafficLightService {
  // Bidirectional Streaming: Coordinate traffic lights
  rpc CoordinateTrafficLights(stream TrafficLightCommand) 
      returns (stream TrafficLightStatus);
}

message TrafficLightCommand {
  string intersection_id = 1;
  string phase = 2;  // "GREEN_NS", "GREEN_EW", "RED_ALL"
  int32 duration_seconds = 3;
  int32 priority = 4;
}

message TrafficLightStatus {
  string intersection_id = 1;
  string current_phase = 2;
  int32 time_remaining = 3;
  int32 queue_length = 4;
  int64 timestamp = 5;
  bool emergency_mode = 6;
}
```

## Communication Flow Example

### Scenario: Rush Hour Traffic Management

1. **Initialization (Unary)**
   - Frontend requests all intersection data from Traffic Control Service
   - Traffic Control Service returns list of intersections with current stats

2. **Monitoring Phase (Server Streaming)**
   - Traffic Control Service subscribes to Sensor Network Service
   - Sensor Network continuously streams vehicle counts and speeds
   - Traffic Control aggregates data and updates internal state

3. **Optimization Phase (Bidirectional Streaming)**
   - Traffic Control Service opens bidirectional channel with Traffic Light Service
   - Traffic Control sends optimization commands based on sensor data
   - Traffic Light Service executes commands and reports status back
   - Both services maintain continuous communication

4. **Frontend Visualization**
   - REST/WebSocket bridge exposes data to frontend
   - Real-time updates show:
     - Vehicle counts at each intersection (from sensor stream)
     - Traffic light phases (from bidirectional coordination)
     - Communication arrows showing active gRPC calls
     - Message logs with timestamps


## Implementation Steps

### Phase 1: Proto Definitions & Code Generation
1. Define all `.proto` files
2. Configure Quarkus gRPC plugin in `pom.xml`
3. Generate Java classes from proto files
4. Verify generated stubs and skeletons

### Phase 2: Backend Services
1. **Sensor Network Service**
   - Implement `StreamSensorData` with simulated data
   - Create traffic simulator that generates realistic patterns
   - Add time-based variations (rush hour, night time)

2. **Traffic Light Controller Service**
   - Implement bidirectional streaming handler
   - Create light phase state machine
   - Add command processing logic
   - Implement status reporting

3. **Traffic Control Service**
   - Implement unary RPC endpoints
   - Create gRPC clients for Sensor and Traffic Light services
   - Implement REST endpoints for frontend
   - Add WebSocket support for real-time updates
   - Implement coordination logic

### Phase 3: Frontend Application (Angular)
1. Create Angular project with routing and services
2. Build city map visualization component with Leaflet
3. Implement WebSocket service for real-time connection to Traffic Control Service
4. Create communication visualizer component with animated flows
5. Add service health monitoring with RxJS observables
6. Create statistics dashboard with ECharts
7. Implement interactive controls (pause/resume, speed control)
8. Add responsive layout with Angular Material

### Phase 4: Integration & Testing
1. Docker Compose setup
2. Service discovery configuration
3. Health checks and monitoring
4. End-to-end testing
5. Performance optimization

## Key Features to Demonstrate

### 1. **Unary Pattern Visualization**
- Click intersection → See request/response
- Display response time
- Show data payload

### 2. **Server Streaming Visualization**
- Animated data flow from Sensor Service
- Real-time counter of messages received
- Stream connection status indicator
- Pause/resume streaming controls

### 3. **Bidirectional Streaming Visualization**
- Two-way arrows between services
- Message queue visualization
- Command/status pairing
- Connection lifecycle (open/active/closed)

### 4. **Communication Metrics**
- Messages per second
- Average latency
- Total data transferred
- Active connections count

## Development Timeline

- **Week 1**: Proto definitions, project setup, code generation
- **Week 2**: Backend services implementation
- **Week 3**: Frontend development
- **Week 4**: Integration, testing, documentation

## Running the Demo

### Start Backend Services
```bash
# Terminal 1 - Sensor Network Service
cd sensor-network-service
./mvnw quarkus:dev

# Terminal 2 - Traffic Light Service
cd traffic-light-service
./mvnw quarkus:dev

# Terminal 3 - Traffic Control Service
cd traffic-control-service
./mvnw quarkus:dev
```

### Start Frontend
```bash
cd frontend
npm install
ng serve
```

### Using Docker Compose
```bash
docker-compose up --build
```

Access the application at `http://localhost:4200`

## Learning Outcomes

By building this project, you will understand:
1. How to define gRPC service contracts with Protocol Buffers
2. Implementing all three gRPC communication patterns in Quarkus
3. Managing reactive streams with Mutiny
4. Building gRPC clients and servers
5. Bridging gRPC with REST/WebSocket for frontend communication
6. Error handling and connection management in streaming scenarios
7. Performance characteristics of different gRPC patterns
8. Real-world microservice communication patterns

## Extensions & Enhancements

- Add authentication with JWT tokens
- Implement service mesh (Istio) for observability
- Add distributed tracing with OpenTelemetry
- Implement circuit breakers and retry logic
- Add database persistence for historical data
- Create admin dashboard for system configuration
- Implement load balancing across multiple instances
- Add Kubernetes deployment manifests

## Resources

- [Quarkus gRPC Guide](https://quarkus.io/guides/grpc)
- [gRPC Documentation](https://grpc.io/docs/)
- [Protocol Buffers](https://protobuf.dev/)
- [Mutiny Reactive Programming](https://smallrye.io/smallrye-mutiny/)

---

**Project Difficulty**: Intermediate to Advanced
**Estimated Time**: 3-4 weeks
**Technologies**: Java 17+, Quarkus 3.x, gRPC, Protocol Buffers, Angular 17+, RxJS, WebSocket
**Best For**: Learning microservice communication, gRPC patterns, reactive programming
