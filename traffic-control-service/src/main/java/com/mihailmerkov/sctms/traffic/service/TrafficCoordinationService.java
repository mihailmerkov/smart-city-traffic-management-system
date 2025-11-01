package com.mihailmerkov.sctms.traffic.service;

import com.mihailmerkov.sctms.light.TrafficLightStatus;
import com.mihailmerkov.sctms.sensor.SensorReading;
import com.mihailmerkov.sctms.traffic.IntersectionList;
import com.mihailmerkov.sctms.traffic.IntersectionStats;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Main coordination service that aggregates data from sensors and controls traffic lights.
 */
@ApplicationScoped
public class TrafficCoordinationService {

    private static final Logger LOG = Logger.getLogger(TrafficCoordinationService.class);
    private static final Random random = new Random();

    @Inject
    SensorClientService sensorClientService;

    @Inject
    TrafficLightClientService trafficLightClientService;

    /**
     * Get statistics for a specific intersection by aggregating sensor and light data.
     */
    public IntersectionStats getIntersectionStats(String intersectionId) {
        SensorReading sensorData = sensorClientService.getLatestReading(intersectionId);
        TrafficLightStatus lightStatus = trafficLightClientService.getLatestStatus(intersectionId);

        int vehicleCount = sensorData != null ? sensorData.getVehicleCount() : 0;
        String currentPhase = lightStatus != null ? lightStatus.getCurrentPhase() : "UNKNOWN";

        // Calculate average wait time based on vehicle count and phase
        double avgWaitTime = calculateWaitTime(vehicleCount, currentPhase);

        // Optimize traffic light if needed
        optimizeTrafficLight(intersectionId, vehicleCount, currentPhase);

        return IntersectionStats.newBuilder()
                .setIntersectionId(intersectionId)
                .setVehicleCount(vehicleCount)
                .setAvgWaitTime(avgWaitTime)
                .setCurrentPhase(currentPhase)
                .setTimestamp(Instant.now().toEpochMilli())
                .build();
    }

    /**
     * Get statistics for all intersections.
     */
    public IntersectionList getAllIntersections() {
        List<IntersectionStats> statsList = new ArrayList<>();

        // Get all known intersections from sensor data
        sensorClientService.getAllLatestReadings().keySet().forEach(intersectionId -> {
            IntersectionStats stats = getIntersectionStats(intersectionId);
            statsList.add(stats);
        });

        return IntersectionList.newBuilder()
                .addAllIntersections(statsList)
                .build();
    }

    /**
     * Calculate average wait time based on conditions.
     */
    private double calculateWaitTime(int vehicleCount, String phase) {
        double baseWaitTime = 15.0; // seconds

        // Increase wait time based on vehicle count
        double waitTime = baseWaitTime + (vehicleCount * 0.5);

        // Red light increases wait time
        if (phase.contains("RED")) {
            waitTime += 20.0;
        }

        return Math.min(waitTime, 120.0); // Cap at 2 minutes
    }

    /**
     * Optimize traffic light timing based on real-time sensor data.
     * This demonstrates the coordination between services.
     */
    private void optimizeTrafficLight(String intersectionId, int vehicleCount, String currentPhase) {
        // If heavy traffic detected, extend green light duration
        if (vehicleCount > 30 && currentPhase.contains("GREEN")) {
            LOG.infof("Heavy traffic detected at %s, extending green light", intersectionId);
            trafficLightClientService.sendCommand(intersectionId, currentPhase, 45, 3);
        }
        // If very light traffic, reduce green light duration
        else if (vehicleCount < 10 && currentPhase.contains("GREEN")) {
            LOG.infof("Light traffic detected at %s, reducing green light", intersectionId);
            trafficLightClientService.sendCommand(intersectionId, currentPhase, 20, 1);
        }
    }
}


