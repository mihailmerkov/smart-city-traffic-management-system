package com.mihailmerkov.sctms.sensor.simulator;

import com.mihailmerkov.sctms.sensor.SensorReading;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Simulates traffic sensor data with realistic patterns.
 * Generates vehicle counts, speeds, and road conditions based on time of day.
 */
@ApplicationScoped
public class TrafficSimulator {

    private static final String[] ROAD_CONDITIONS = {"CLEAR", "LIGHT_TRAFFIC", "HEAVY_TRAFFIC", "CONGESTED"};
    private static final Random random = new Random();

    /**
     * Generates sensor readings for the given intersection IDs.
     */
    public List<SensorReading> generateSensorReading(List<String> intersectionIds) {
        List<SensorReading> readings = new ArrayList<>();

        for (String intersectionId : intersectionIds) {
            SensorReading reading = generateSingleReading(intersectionId);
            readings.add(reading);
        }

        return readings;
    }

    /**
     * Generates a single sensor reading for an intersection.
     */
    private SensorReading generateSingleReading(String intersectionId) {
        int hour = java.time.LocalTime.now().getHour();
        boolean isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

        // Adjust traffic based on time of day
        int baseVehicles = isRushHour ? 40 : 15;
        int vehicleCount = baseVehicles + random.nextInt(20);

        // Average speed inversely proportional to vehicle count
        double baseSpeed = isRushHour ? 25.0 : 45.0;
        double averageSpeed = baseSpeed + (random.nextDouble() * 20 - 10);
        averageSpeed = Math.max(5.0, Math.min(60.0, averageSpeed)); // Clamp between 5-60 mph

        // Determine road condition based on vehicle count
        String roadCondition;
        if (vehicleCount < 15) {
            roadCondition = "CLEAR";
        } else if (vehicleCount < 30) {
            roadCondition = "LIGHT_TRAFFIC";
        } else if (vehicleCount < 45) {
            roadCondition = "HEAVY_TRAFFIC";
        } else {
            roadCondition = "CONGESTED";
        }

        // Small chance of incident
        boolean incidentDetected = random.nextDouble() < 0.05;

        return SensorReading.newBuilder()
                .setSensorId("SENSOR-" + intersectionId)
                .setIntersectionId(intersectionId)
                .setVehicleCount(vehicleCount)
                .setAverageSpeed(averageSpeed)
                .setRoadCondition(roadCondition)
                .setTimestamp(Instant.now().toEpochMilli())
                .setIncidentDetected(incidentDetected)
                .build();
    }
}

