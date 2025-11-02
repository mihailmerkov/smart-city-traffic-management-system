# Smart City Traffic Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.java.net/)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.29.0-blue.svg)](https://quarkus.io/)
[![Angular](https://img.shields.io/badge/Angular-19.2-red.svg)](https://angular.io/)
[![gRPC](https://img.shields.io/badge/gRPC-Latest-green.svg)](https://grpc.io/)

> A real-time microservices-based traffic management system demonstrating advanced gRPC communication patterns (Unary, Server Streaming, and Bidirectional Streaming) with Quarkus and Angular.

**Author**: [Mihail Merkov](https://github.com/mihailmerkov)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Communication Flow](#communication-flow)
- [System Components](#system-components)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Project Structure](#project-structure)
- [gRPC Communication Patterns](#grpc-communication-patterns)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The Smart City Traffic Management System is a comprehensive demonstration of modern microservices architecture using gRPC for inter-service communication. The system simulates real-time traffic monitoring and control for a smart city with 6 intersections, showcasing:

- **3 Types of gRPC Communication Patterns**:
  - Unary RPC (traditional request/response)
  - Server Streaming RPC (continuous data flow)
  - Bidirectional Streaming RPC (full-duplex communication)

- **Real-time Data Processing**: Live sensor data streaming and traffic light coordination
- **Reactive Programming**: Built with Quarkus Mutiny and RxJS
- **Modern Frontend**: Angular 19 with Server-Side Rendering
- **WebSocket Integration**: Real-time updates to the web interface

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                               │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │          Frontend Service (Angular 19 + SSR)                │    │
│  │                    Port: 4200                               │    │
│  │  • Interactive City Map (Leaflet)                           │    │
│  │  • Real-time Statistics Dashboard                           │    │
│  │  • Communication Flow Visualizer                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│              │                                │                      │
│              │ REST API                       │ WebSocket            │
│              │ (HTTP/JSON)                    │ (Real-time)          │
│              ▼                                ▼                      │
└──────────────────────────────────────────────────────────────────────┘
               │                                │
               └────────────────┬───────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                     ORCHESTRATION LAYER                                │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │       Traffic Control Service (Quarkus Orchestrator)          │    │
│  │                      Port: 8001                               │    │
│  │  • REST API Server (for Frontend)                             │    │
│  │  • WebSocket Server (Real-time streaming)                     │    │
│  │  • gRPC Client (to Sensor Service)                            │    │
│  │  • gRPC Client (to Traffic Light Service)                     │    │
│  │  • Traffic Optimization Algorithm                             │    │
│  │  • Data Aggregation & Coordination                            │    │
│  └──────────────────────────────────────────────────────────────┘    │
│              │                                │                        │
│              │ gRPC                           │ gRPC                   │
│              │ Server Streaming               │ Bidirectional          │
│              ▼                                ▼                        │
└────────────────────────────────────────────────────────────────────────┘
               │                                │
    ┌──────────┘                                └──────────┐
    │                                                      │
┌───▼────────────────────────────┐    ┌──────────────────▼─────────────┐
│      DATA PROVIDER LAYER       │    │    ACTUATOR LAYER              │
│  ┌──────────────────────────┐  │    │  ┌──────────────────────────┐ │
│  │  Sensor Control Service  │  │    │  │ Traffic Light Service    │ │
│  │      (Quarkus gRPC)      │  │    │  │    (Quarkus gRPC)        │ │
│  │       Port: 8002         │  │    │  │       Port: 8003         │ │
│  │                          │  │    │  │                          │ │
│  │ • Simulates IoT Sensors  │  │    │  │ • Controls Traffic Lights│ │
│  │ • Generates Vehicle Data │  │    │  │ • Manages Phase Timing   │ │
│  │ • Detects Incidents      │  │    │  │ • Responds to Commands   │ │
│  │ • Streams Continuously   │  │    │  │ • Sends Status Updates   │ │
│  └──────────────────────────┘  │    │  └──────────────────────────┘ │
└────────────────────────────────┘    └────────────────────────────────┘
```

### Architecture Layers

1. **Frontend Layer**: User interface for visualization and monitoring
2. **Orchestration Layer**: Central coordinator managing all traffic operations
3. **Data Provider Layer**: Sensor data generation and streaming
4. **Actuator Layer**: Traffic light control and management

---

## 🔄 Communication Flow

### Detailed Communication Diagram

```
Frontend Service (Angular 19)
    │
    ├──────────────────────────────────────────────────┐
    │                                                   │
    │ [1] REST API (HTTP/JSON)                         │ [2] WebSocket (Real-time)
    │     GET /api/traffic/intersections               │     ws://localhost:8001/ws/traffic
    │     GET /api/traffic/intersections/{id}          │     • Bidirectional streaming
    │     • On-demand queries                           │     • Continuous updates (2s interval)
    │     • Unary Request/Response                      │     • Combined sensor + light data
    │                                                   │
    ▼                                                   ▼
┌───────────────────────────────────────────────────────────────────┐
│        Traffic Control Service (Orchestrator)                      │
│                                                                    │
│  [REST Server] ◄────► [WebSocket Server] ◄────► [gRPC Clients]   │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
    │                                                   │
    │ [3] gRPC Server Streaming                        │ [4] gRPC Bidirectional Streaming
    │     SensorService.streamSensorData()             │     TrafficLightService
    │     • Continuous sensor readings                 │         .coordinateTrafficLights()
    │     • Vehicle count, speed, conditions           │     • Sends optimization commands
    │     • Updates every 2 seconds                    │     • Receives phase status
    │     • One-way stream: Sensor → Control          │     • Full-duplex communication
    │                                                   │
    ▼                                                   ▼
┌──────────────────────────┐              ┌──────────────────────────┐
│  Sensor Control Service  │              │  Traffic Light Service   │
│                          │              │                          │
│  [gRPC Server]           │              │  [gRPC Server]           │
│  • Generates sensor data │              │  • Manages light phases  │
│  • Streams continuously  │              │  • RED/YELLOW/GREEN      │
│  • 6 intersections       │              │  • Adaptive timing       │
└──────────────────────────┘              └──────────────────────────┘
```

### Communication Sequence

```
1. System Startup:
   ┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Sensor  │         │ Traffic │         │  Light  │         │Frontend │
   │ Service │         │ Control │         │ Service │         │ Service │
   └────┬────┘         └────┬────┘         └────┬────┘         └────┬────┘
        │                   │                   │                   │
        │  Start gRPC       │                   │                   │
        │  Server (8002)    │                   │                   │
        │◄──────────────────┤                   │                   │
        │                   │  Start gRPC       │                   │
        │                   │  Server (8003)    │                   │
        │                   ├──────────────────►│                   │
        │                   │                   │                   │
        │                   │  Start REST & WS  │                   │
        │                   │  Server (8001)    │                   │
        │                   │◄──────────────────┤                   │
        │                   │                   │   Start Angular   │
        │                   │                   │   Dev Server      │
        │                   │                   │◄──────────────────┤
        │                   │                   │                   │

2. Real-time Data Flow:
   ┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Sensor  │         │ Traffic │         │  Light  │         │Frontend │
   │ Service │         │ Control │         │ Service │         │ Service │
   └────┬────┘         └────┬────┘         └────┬────┘         └────┬────┘
        │                   │                   │                   │
        │ [Server Stream]   │                   │                   │
        │  Sensor Data      │                   │                   │
        ├──────────────────►│                   │                   │
        │  (every 2s)       │                   │                   │
        │                   │ [Bidir Stream]    │                   │
        │                   │  Optimization Cmd │                   │
        │                   ├──────────────────►│                   │
        │                   │                   │                   │
        │                   │  Phase Status     │                   │
        │                   │◄──────────────────┤                   │
        │                   │                   │                   │
        │                   │ [WebSocket]       │                   │
        │                   │  Combined Data    │                   │
        │                   ├──────────────────────────────────────►│
        │                   │                   │                   │
        │ Sensor Data       │                   │                   │
        ├──────────────────►│                   │                   │
        │                   │  Optimization Cmd │                   │
        │                   ├──────────────────►│                   │
        │                   │  Phase Update     │                   │
        │                   │◄──────────────────┤                   │
        │                   │  Updated Data     │                   │
        │                   ├──────────────────────────────────────►│
        │                   │                   │                   │
        └───────────────────┴───────────────────┴───────────────────┘
```

---

## 🧩 System Components

### 1. Frontend Service
**Technology**: Angular 19 with SSR, TypeScript, Leaflet  
**Port**: 4200  
**Purpose**: Web-based user interface

**Key Features**:
- Interactive city map with 6 intersection markers
- Real-time statistics dashboard showing vehicle counts and wait times
- Communication visualizer displaying all gRPC flows
- WebSocket connection for live updates
- REST API consumption for on-demand queries

**Communication**:
- REST API calls to Traffic Control Service (HTTP)
- WebSocket connection for real-time streaming

[📖 Detailed Documentation](./frontend-service/README.md)

---

### 2. Traffic Control Service (Orchestrator)
**Technology**: Quarkus 3.29.0, Java 21, gRPC, WebSocket  
**Port**: 8001  
**Purpose**: Central coordination and orchestration

**Key Features**:
- gRPC client consuming sensor data (Server Streaming)
- gRPC client coordinating traffic lights (Bidirectional Streaming)
- REST API server for frontend queries
- WebSocket server for real-time frontend updates
- Traffic optimization algorithms
- Data aggregation and processing

**Communication**:
- **Inbound**: REST from Frontend, WebSocket from Frontend
- **Outbound**: gRPC to Sensor Service, gRPC to Traffic Light Service

[📖 Detailed Documentation](./traffic-control-service/README.md)

---

### 3. Sensor Control Service
**Technology**: Quarkus 3.29.0, Java 21, gRPC  
**Port**: 8002  
**Purpose**: IoT sensor simulation and data streaming

**Key Features**:
- Simulates traffic sensors at 6 intersections
- Generates realistic vehicle counts, speeds, and conditions
- Random incident detection
- Continuous data streaming via gRPC Server Streaming
- Updates every 2 seconds per intersection

**Communication**:
- **Outbound**: gRPC Server Streaming to Traffic Control Service

[📖 Detailed Documentation](./sensor-control-service/README.md)

---

### 4. Traffic Light Service
**Technology**: Quarkus 3.29.0, Java 21, gRPC  
**Port**: 8003  
**Purpose**: Traffic light phase management

**Key Features**:
- Manages traffic light phases (RED, YELLOW, GREEN)
- Bidirectional gRPC streaming with Traffic Control
- Receives optimization commands
- Sends real-time phase status updates
- Adaptive timing based on traffic conditions
- Smooth phase transitions

**Communication**:
- **Bidirectional**: gRPC Bidirectional Streaming with Traffic Control Service

[📖 Detailed Documentation](./traffic-light-service/README.md)

---

## 🛠️ Technology Stack

### Backend Services
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Quarkus | 3.29.0 |
| Language | Java | 21 |
| Protocol | gRPC | Latest |
| Reactive | Mutiny | Built-in |
| Build Tool | Maven | 3.8+ |

### Frontend Service
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Angular | 19.2.0 |
| Language | TypeScript | 5.7.2 |
| SSR | Express | 4.18.2 |
| Maps | Leaflet | 1.9.4 |
| Build Tool | Angular CLI | 19.2.19 |

### Communication Protocols
- **gRPC**: Inter-service communication (3 patterns)
- **WebSocket**: Real-time frontend updates
- **REST**: On-demand frontend queries
- **HTTP/2**: Transport for gRPC

---

## 🚀 Quick Start

### Prerequisites
- Java 21 or higher
- Maven 3.8+
- Node.js 18+ and npm 9+
- Git

### One-Command Startup (All Services)

```bash
# Clone the repository
git clone https://github.com/mihailmerkov/smart-city-traffic-management-system.git
cd smart-city-traffic-management-system

# Start all services using Docker Compose
docker-compose up --build
```

Wait for all services to start, then access:
- **Frontend**: http://localhost:4200
- **Traffic Control API**: http://localhost:8001/api/traffic/intersections

### Manual Startup (Development Mode)

```bash
# Terminal 1: Start Sensor Control Service
cd sensor-control-service
./mvnw clean install
./mvnw quarkus:dev

# Terminal 2: Start Traffic Light Service
cd traffic-light-service
./mvnw clean install
./mvnw quarkus:dev

# Terminal 3: Start Traffic Control Service
cd traffic-control-service
./mvnw clean install
./mvnw quarkus:dev

# Terminal 4: Start Frontend Service
cd frontend-service
npm install
npm start
```

Access the application at http://localhost:4200

---

## 📝 Detailed Setup

### Backend Services (Quarkus)

Each backend service follows the same setup process:

```bash
# Navigate to service directory
cd <service-name>

# Download dependencies
./mvnw clean install

# Development mode (hot reload)
./mvnw quarkus:dev

# Production build
./mvnw clean package
java -jar target/quarkus-app/quarkus-run.jar
```

**Startup Order** (important for proper initialization):
1. Sensor Control Service (port 8002)
2. Traffic Light Service (port 8003)
3. Traffic Control Service (port 8001)
4. Frontend Service (port 4200)

### Frontend Service (Angular)

```bash
# Navigate to frontend directory
cd frontend-service

# Install dependencies
npm install

# Development mode
npm start
# Accessible at http://localhost:4200

# Production build with SSR
npm run build
npm run serve:ssr:frontend-service
# Accessible at http://localhost:4000
```

---

## 📁 Project Structure

```
smart-city-traffic-management-system/
├── README.md                          # This file
├── docker-compose.yml                 # Docker orchestration
│
├── sensor-control-service/            # Sensor Data Provider
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mihailmerkov/sctms/sensor/
│   │   │   │   ├── grpc/
│   │   │   │   │   └── SensorGrpcService.java        # gRPC server
│   │   │   │   └── service/
│   │   │   │       └── SensorSimulator.java          # Data generator
│   │   │   ├── proto/
│   │   │   │   └── sensor.proto                      # gRPC definition
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── pom.xml
│   └── README.md
│
├── traffic-light-service/             # Traffic Light Controller
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mihailmerkov/sctms/light/
│   │   │   │   ├── grpc/
│   │   │   │   │   └── TrafficLightGrpcService.java  # gRPC server
│   │   │   │   └── service/
│   │   │   │       ├── LightController.java          # Phase manager
│   │   │   │       └── PhaseTransitionManager.java
│   │   │   ├── proto/
│   │   │   │   └── traffic-light.proto               # gRPC definition
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── pom.xml
│   └── README.md
│
├── traffic-control-service/           # Orchestrator
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mihailmerkov/sctms/traffic/
│   │   │   │   ├── grpc/
│   │   │   │   │   └── TrafficControlGrpcService.java # gRPC server (optional)
│   │   │   │   ├── rest/
│   │   │   │   │   ├── TrafficRestResource.java      # REST API
│   │   │   │   │   └── IntersectionStatsDTO.java
│   │   │   │   ├── websocket/
│   │   │   │   │   └── TrafficWebSocketResource.java # WebSocket
│   │   │   │   └── service/
│   │   │   │       └── TrafficCoordinationService.java # Core logic
│   │   │   ├── proto/
│   │   │   │   ├── sensor.proto                      # Client stub
│   │   │   │   ├── traffic-light.proto               # Client stub
│   │   │   │   └── traffic-control.proto             # Server definition
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── pom.xml
│   └── README.md
│
└── frontend-service/                  # Angular Frontend
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── city-map/
    │   │   │   │   ├── city-map.component.ts
    │   │   │   │   ├── city-map.component.html
    │   │   │   │   └── city-map.component.css
    │   │   │   ├── communication-visualizer/
    │   │   │   │   ├── communication-visualizer.component.ts
    │   │   │   │   └── ...
    │   │   │   └── stats-dashboard/
    │   │   │       ├── stats-dashboard.component.ts
    │   │   │       └── ...
    │   │   ├── services/
    │   │   │   ├── realtime-data.service.ts          # WebSocket service
    │   │   │   └── traffic-api.service.ts            # REST API service
    │   │   ├── app.component.ts
    │   │   └── app.config.ts
    │   ├── index.html
    │   ├── main.ts
    │   └── styles.css
    ├── package.json
    ├── angular.json
    └── README.md
```

---

## 🔌 gRPC Communication Patterns

This project demonstrates all three gRPC communication patterns:

### 1. Unary RPC (Request-Response)
**Traditional RPC pattern - one request, one response**

```protobuf
// traffic-control.proto
service TrafficControlService {
  rpc GetIntersectionStats(IntersectionRequest) returns (IntersectionStats);
}
```

**Use Case**: Frontend makes on-demand REST API calls  
**Flow**: Frontend → Traffic Control (REST) → Internal processing  
**Example**: Getting statistics for a specific intersection

---

### 2. Server Streaming RPC
**One request, stream of responses**

```protobuf
// sensor.proto
service SensorService {
  rpc streamSensorData(SensorRequest) returns (stream SensorReading);
}
```

**Use Case**: Continuous sensor data streaming  
**Flow**: Traffic Control ← Sensor Service (continuous stream)  
**Example**: Receiving vehicle counts every 2 seconds

**Java Implementation (Server)**:
```java
@Override
public Multi<SensorReading> streamSensorData(SensorRequest request) {
    return Multi.createFrom().ticks().every(Duration.ofSeconds(2))
        .map(tick -> generateSensorReading(intersectionId));
}
```

**Java Implementation (Client)**:
```java
sensorService.streamSensorData(request)
    .subscribe().with(
        reading -> processSensorData(reading),
        failure -> handleError(failure)
    );
```

---

### 3. Bidirectional Streaming RPC
**Full-duplex communication - both sides stream**

```protobuf
// traffic-light.proto
service TrafficLightService {
  rpc coordinateTrafficLights(stream LightCommand) returns (stream LightStatus);
}
```

**Use Case**: Traffic light coordination with real-time feedback  
**Flow**: Traffic Control ⇄ Traffic Light Service (both directions)  
**Example**: Sending optimization commands and receiving phase updates

**Java Implementation (Server)**:
```java
@Override
public Multi<LightStatus> coordinateTrafficLights(Multi<LightCommand> commands) {
    commands.subscribe().with(
        command -> processCommand(command),
        failure -> handleError(failure)
    );
    return statusUpdateStream;
}
```

**Java Implementation (Client)**:
```java
Multi<LightStatus> statusStream = lightService.coordinateTrafficLights(commandStream);
statusStream.subscribe().with(
    status -> updateLightStatus(status),
    failure -> handleError(failure)
);
```

---

## 📚 API Documentation

### REST API Endpoints

#### Traffic Control Service (Port 8001)

**Get All Intersections**
```http
GET /api/traffic/intersections
```
Response:
```json
[
  {
    "intersectionId": "INT-001",
    "vehicleCount": 42,
    "avgWaitTime": 28.5,
    "currentPhase": "GREEN",
    "timestamp": 1730505600000
  },
  ...
]
```

**Get Specific Intersection**
```http
GET /api/traffic/intersections/{id}
```
Response:
```json
{
  "intersectionId": "INT-001",
  "vehicleCount": 42,
  "avgWaitTime": 28.5,
  "currentPhase": "GREEN",
  "timestamp": 1730505600000
}
```

**Health Check**
```http
GET /api/traffic/health
```
Response:
```json
{
  "service": "traffic-control-service",
  "status": "UP",
  "timestamp": 1730505600000
}
```

---

### WebSocket API

**Real-time Traffic Updates**
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8001/ws/traffic');

// Receive messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Sensors:', data.sensors);
  console.log('Lights:', data.lights);
};
```

Message Format:
```json
{
  "type": "TRAFFIC_UPDATE",
  "timestamp": 1730505600000,
  "sensors": [
    {
      "sensorId": "SENSOR-001",
      "intersectionId": "INT-001",
      "vehicleCount": 42,
      "averageSpeed": 35.5,
      "roadCondition": "GOOD",
      "incidentDetected": false,
      "timestamp": 1730505600000
    }
  ],
  "lights": [
    {
      "lightId": "LIGHT-001",
      "intersectionId": "INT-001",
      "currentPhase": "GREEN",
      "phaseStartTime": 1730505590000,
      "estimatedDuration": 30000
    }
  ]
}
```

---

### gRPC APIs (Internal)

#### Sensor Service (Port 8002)
```protobuf
service SensorService {
  rpc streamSensorData(SensorRequest) returns (stream SensorReading);
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

#### Traffic Light Service (Port 8003)
```protobuf
service TrafficLightService {
  rpc coordinateTrafficLights(stream LightCommand) returns (stream LightStatus);
}

message LightCommand {
  string intersection_id = 1;
  string recommended_phase = 2;
  int32 recommended_duration = 3;
  int32 priority_level = 4;
}

message LightStatus {
  string light_id = 1;
  string intersection_id = 2;
  string current_phase = 3;
  int64 phase_start_time = 4;
  int32 estimated_duration = 5;
}
```

#### Traffic Control Service (Port 8001)
```protobuf
service TrafficControlService {
  rpc GetIntersectionStats(IntersectionRequest) returns (IntersectionStats);
  rpc GetAllIntersections(Empty) returns (IntersectionList);
}
```

---

## 💻 Development

### Running in Development Mode

All services support hot-reload for rapid development:

```bash
# Backend services (Quarkus Dev Mode)
cd <service-name>
./mvnw quarkus:dev

# Frontend (Angular Dev Server)
cd frontend-service
npm start
```

### Running Tests

```bash
# Backend services
cd <service-name>
./mvnw test

# Frontend
cd frontend-service
npm test
```

### Debugging

**Backend Services (IntelliJ IDEA / VS Code)**:
```bash
./mvnw quarkus:dev -Ddebug=5005
```
Then attach debugger to port 5005.

**Frontend (Chrome DevTools)**:
- Open http://localhost:4200
- Press F12 for DevTools
- Use Sources tab for debugging TypeScript

---

## 🐳 Docker Deployment

### Complete System with Docker Compose (Recommended)

The entire Smart City Traffic Management System can be deployed with a single command using Docker Compose. The configuration includes:

- **4 Microservices**: All services containerized and orchestrated
- **Health Checks**: Automatic health monitoring for all services
- **Service Dependencies**: Proper startup order with health-based dependencies
- **Resource Limits**: CPU and memory constraints for stable operation
- **Network Isolation**: Dedicated Docker network for inter-service communication
- **Auto-restart**: Services automatically restart on failure

#### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/mihailmerkov/smart-city-traffic-management-system.git
cd smart-city-traffic-management-system

# Build and start all services
docker-compose up --build

# Or start in detached mode (background)
docker-compose up -d --build

# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f traffic-control-service

# Check service status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

#### Docker Compose Features

**Service Health Checks:**
All services include health monitoring:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:PORT/q/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Dependency Management:**
Services start in the correct order:
1. Sensor Control Service (port 8002) - waits until healthy
2. Traffic Light Service (port 8003) - waits until healthy
3. Traffic Control Service (port 8001) - waits for sensors and lights
4. Frontend Service (port 4200) - waits for traffic control

**Resource Allocation:**
Each service has CPU and memory limits:
- Backend Services: 512MB RAM, 1 CPU core
- Traffic Control: 768MB RAM, 1.5 CPU cores
- Frontend: 512MB RAM, 1 CPU core

### Individual Service Docker Build

Each service can also be built and run independently:

#### Backend Services (Quarkus)

```bash
# Build backend service
cd <service-name>
docker build -t <service-name>:latest .

# Run with environment variables
docker run -d \
  --name <service-name> \
  -p <port>:<port> \
  -e QUARKUS_LOG_LEVEL=INFO \
  <service-name>:latest
```

**Example - Sensor Control Service:**
```bash
cd sensor-control-service
docker build -t sensor-control-service:latest .
docker run -d --name sensor-service -p 8002:8002 sensor-control-service:latest
```

#### Frontend Service (Angular + SSR)

```bash
cd frontend-service
docker build -t frontend-service:latest .
docker run -d \
  --name frontend \
  -p 4200:4200 \
  -e NODE_ENV=production \
  -e API_BASE_URL=http://localhost:8001 \
  frontend-service:latest
```

### Docker Image Details

All Docker images are built using multi-stage builds for optimal size and security:

#### Backend Services (Quarkus)
**Image Size:** ~200MB (Alpine-based)

**Build Stages:**
1. **Build Stage**: Maven compilation with dependency caching
2. **Runtime Stage**: Minimal JRE with application artifacts

**Security Features:**
- Non-root user execution
- Minimal Alpine Linux base
- No development tools in final image
- Health check endpoints

**Environment Variables:**
- `QUARKUS_HTTP_PORT` - HTTP/gRPC port
- `QUARKUS_LOG_LEVEL` - Logging level (INFO, DEBUG, TRACE)
- `QUARKUS_GRPC_CLIENTS_*` - gRPC client configuration
- `JAVA_OPTS` - JVM options

#### Frontend Service (Angular)
**Image Size:** ~250MB (Node Alpine-based)

**Build Stages:**
1. **Build Stage**: Angular compilation with SSR
2. **Runtime Stage**: Node.js server with compiled assets

**Security Features:**
- Non-root user execution
- Production-only dependencies
- Minimal Alpine Linux base
- Health check endpoint

**Environment Variables:**
- `NODE_ENV` - Node environment
- `PORT` - Application port
- `API_BASE_URL` - Backend API URL

### Docker Network Configuration

The `docker-compose.yml` creates a dedicated bridge network:

```yaml
networks:
  traffic-network:
    driver: bridge
    name: smart-city-traffic-network
```

**Network Benefits:**
- Service discovery by container name
- Isolated from other Docker networks
- Automatic DNS resolution
- Secure inter-service communication

### Production Deployment Tips

1. **Environment Variables**: Use `.env` file for configuration
   ```bash
   # Create .env file
   cat > .env << EOF
   QUARKUS_LOG_LEVEL=INFO
   NODE_ENV=production
   EOF
   
   # Start with env file
   docker-compose --env-file .env up -d
   ```

2. **Volume Mounts**: Add persistent storage if needed
   ```yaml
   volumes:
     - ./logs:/deployments/logs
   ```

3. **Port Mapping**: Change ports for production
   ```yaml
   ports:
     - "80:4200"  # Map to port 80
   ```

4. **Scaling**: Scale services horizontally
   ```bash
   docker-compose up -d --scale sensor-control-service=3
   ```

5. **Monitoring**: Use Docker stats
   ```bash
   docker stats
   docker-compose logs -f --tail=100
   ```

### Troubleshooting Docker Deployment

**Service won't start:**
```bash
# Check service logs
docker-compose logs <service-name>

# Check health status
docker-compose ps

# Restart specific service
docker-compose restart <service-name>
```

**Network issues:**
```bash
# Verify network exists
docker network ls | grep traffic

# Inspect network
docker network inspect smart-city-traffic-network

# Recreate network
docker-compose down && docker-compose up
```

**Port conflicts:**
```bash
# Check what's using the port
lsof -i :8001

# Change port in docker-compose.yml
ports:
  - "8101:8001"  # Map to different host port
```

### Docker Image Optimization

All Dockerfiles include:
- **Layer caching**: Dependencies downloaded before source copy
- **Multi-stage builds**: Separate build and runtime stages
- **`.dockerignore`**: Excludes unnecessary files
- **Minimal base images**: Alpine Linux for small size
- **Health checks**: Built-in monitoring
- **Security**: Non-root user execution

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Complete cleanup
docker system prune -a --volumes
```

---

## 🧪 Testing

### Backend Tests (JUnit + Quarkus Test)

```bash
cd <service-name>

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=SensorGrpcServiceTest

# Run with coverage
./mvnw test jacoco:report
```

### Frontend Tests (Karma + Jasmine)

```bash
cd frontend-service

# Run tests once
npm test

# Run tests with coverage
npm test -- --code-coverage

# Run tests in watch mode
npm test -- --watch
```

### Integration Testing

Test the full flow:

```bash
# 1. Start all services
docker-compose up

# 2. Test REST API
curl http://localhost:8001/api/traffic/intersections

# 3. Test WebSocket (using wscat)
npm install -g wscat
wscat -c ws://localhost:8001/ws/traffic

# 4. Access frontend
open http://localhost:4200
```

---

## 🎓 Learning Resources

This project demonstrates:

- **gRPC Fundamentals**: All three communication patterns
- **Reactive Programming**: Quarkus Mutiny and RxJS
- **Microservices Architecture**: Service orchestration and coordination
- **Real-time Communication**: WebSocket and streaming
- **Modern Frontend**: Angular 19 with SSR
- **Containerization**: Docker and Docker Compose
- **API Design**: REST, WebSocket, and gRPC best practices

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author

**Mihail Merkov**
- GitHub: [@mihailmerkov](https://github.com/mihailmerkov)
- LinkedIn: [Mihail Merkov](https://www.linkedin.com/in/mihailmerkov)

---

## 🙏 Acknowledgments

- [Quarkus](https://quarkus.io/) - Supersonic Subatomic Java Framework
- [gRPC](https://grpc.io/) - High-performance RPC framework
- [Angular](https://angular.io/) - Platform for building web applications
- [Leaflet](https://leafletjs.com/) - Interactive map library
- [Mutiny](https://smallrye.io/smallrye-mutiny/) - Reactive programming library

---

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact me via [GitHub](https://github.com/mihailmerkov)

---

**⭐ If you found this project helpful, please consider giving it a star!**

---

*Last Updated: November 2025*

