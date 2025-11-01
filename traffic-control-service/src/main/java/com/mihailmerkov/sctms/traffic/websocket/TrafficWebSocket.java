package com.mihailmerkov.sctms.traffic.websocket;

import com.mihailmerkov.sctms.sensor.SensorReading;
import com.mihailmerkov.sctms.light.TrafficLightStatus;
import com.mihailmerkov.sctms.traffic.service.SensorClientService;
import com.mihailmerkov.sctms.traffic.service.TrafficLightClientService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * WebSocket endpoint for streaming real-time traffic data to frontend.
 * Aggregates data from sensor and traffic light services.
 */
@ServerEndpoint("/ws/traffic")
@ApplicationScoped
public class TrafficWebSocket {

    private static final Logger LOG = Logger.getLogger(TrafficWebSocket.class);

    @Inject
    SensorClientService sensorClientService;

    @Inject
    TrafficLightClientService trafficLightClientService;

    private final Set<Session> sessions = ConcurrentHashMap.newKeySet();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    @OnOpen
    public void onOpen(Session session) {
        sessions.add(session);
        LOG.infof("WebSocket opened: sessionId=%s, total sessions=%d", session.getId(), sessions.size());

        // Start sending updates to this session
        startPeriodicUpdates();
    }

    @OnClose
    public void onClose(Session session) {
        sessions.remove(session);
        LOG.infof("WebSocket closed: sessionId=%s, remaining sessions=%d", session.getId(), sessions.size());
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        LOG.errorf(throwable, "WebSocket error for session: %s", session.getId());
        sessions.remove(session);
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        LOG.infof("Received message from client: %s", message);
        // Handle client requests (e.g., subscribe to specific intersections)
    }

    /**
     * Periodically broadcast traffic data to all connected clients.
     */
    private void startPeriodicUpdates() {
        if (scheduler.isShutdown()) {
            return;
        }

        scheduler.scheduleAtFixedRate(() -> {
            if (!sessions.isEmpty()) {
                String update = buildTrafficUpdate();
                broadcast(update);
            }
        }, 0, 2, TimeUnit.SECONDS);
    }

    /**
     * Build JSON update with all traffic data.
     */
    private String buildTrafficUpdate() {
        Map<String, SensorReading> sensorData = sensorClientService.getAllLatestReadings();
        Map<String, TrafficLightStatus> lightData = trafficLightClientService.getAllLatestStatuses();

        StringBuilder json = new StringBuilder();
        json.append("{\"type\":\"traffic-update\",\"timestamp\":").append(System.currentTimeMillis()).append(",");
        json.append("\"sensors\":[");

        boolean first = true;
        for (Map.Entry<String, SensorReading> entry : sensorData.entrySet()) {
            if (!first) json.append(",");
            first = false;
            SensorReading reading = entry.getValue();
            json.append("{")
                    .append("\"intersectionId\":\"").append(reading.getIntersectionId()).append("\",")
                    .append("\"vehicleCount\":").append(reading.getVehicleCount()).append(",")
                    .append("\"averageSpeed\":").append(reading.getAverageSpeed()).append(",")
                    .append("\"roadCondition\":\"").append(reading.getRoadCondition()).append("\",")
                    .append("\"incidentDetected\":").append(reading.getIncidentDetected())
                    .append("}");
        }

        json.append("],\"lights\":[");

        first = true;
        for (Map.Entry<String, TrafficLightStatus> entry : lightData.entrySet()) {
            if (!first) json.append(",");
            first = false;
            TrafficLightStatus status = entry.getValue();
            json.append("{")
                    .append("\"intersectionId\":\"").append(status.getIntersectionId()).append("\",")
                    .append("\"currentPhase\":\"").append(status.getCurrentPhase()).append("\",")
                    .append("\"timeRemaining\":").append(status.getTimeRemaining()).append(",")
                    .append("\"queueLength\":").append(status.getQueueLength()).append(",")
                    .append("\"emergencyMode\":").append(status.getEmergencyMode())
                    .append("}");
        }

        json.append("]}");
        return json.toString();
    }

    /**
     * Broadcast message to all connected sessions.
     */
    private void broadcast(String message) {
        for (Session session : sessions) {
            if (session.isOpen()) {
                try {
                    session.getBasicRemote().sendText(message);
                } catch (IOException e) {
                    LOG.errorf(e, "Failed to send message to session: %s", session.getId());
                    sessions.remove(session);
                }
            }
        }
    }
}

