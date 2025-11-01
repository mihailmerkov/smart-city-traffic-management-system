package com.mihailmerkov.sctms.sensor.simulator;

import com.mihailmerkov.sctms.sensor.SensorReading;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class TrafficSimulatorTest {

    @Inject
    TrafficSimulator trafficSimulator;

    @Test
    void testGenerateSensorReading_shouldReturnReadingsForAllIntersections() {
        // Given
        List<String> intersectionIds = Arrays.asList("INT-001", "INT-002", "INT-003");

        // When
        List<SensorReading> readings = trafficSimulator.generateSensorReading(intersectionIds);

        // Then
        assertEquals(3, readings.size());
        assertEquals("INT-001", readings.get(0).getIntersectionId());
        assertEquals("INT-002", readings.get(1).getIntersectionId());
        assertEquals("INT-003", readings.get(2).getIntersectionId());
    }

    @Test
    void testGenerateSensorReading_shouldHaveValidData() {
        // Given
        List<String> intersectionIds = Arrays.asList("INT-001");

        // When
        List<SensorReading> readings = trafficSimulator.generateSensorReading(intersectionIds);

        // Then
        SensorReading reading = readings.get(0);

        assertNotNull(reading.getSensorId());
        assertTrue(reading.getSensorId().contains("SENSOR-"));
        assertEquals("INT-001", reading.getIntersectionId());
        assertTrue(reading.getVehicleCount() >= 0, "Vehicle count should be non-negative");
        assertTrue(reading.getAverageSpeed() >= 5.0, "Speed should be at least 5 mph");
        assertTrue(reading.getAverageSpeed() <= 60.0, "Speed should be at most 60 mph");
        assertNotNull(reading.getRoadCondition());
        assertTrue(reading.getTimestamp() > 0, "Timestamp should be positive");
    }

    @Test
    void testGenerateSensorReading_shouldHaveValidRoadConditions() {
        // Given
        List<String> intersectionIds = Arrays.asList("INT-001");
        List<String> validConditions = Arrays.asList("CLEAR", "LIGHT_TRAFFIC", "HEAVY_TRAFFIC", "CONGESTED");

        // When
        List<SensorReading> readings = trafficSimulator.generateSensorReading(intersectionIds);

        // Then
        SensorReading reading = readings.get(0);
        assertTrue(validConditions.contains(reading.getRoadCondition()),
                "Road condition should be one of: " + validConditions);
    }

    @Test
    void testGenerateSensorReading_multipleCallsShouldProduceDifferentData() {
        // Given
        List<String> intersectionIds = Arrays.asList("INT-001");

        // When
        List<SensorReading> readings1 = trafficSimulator.generateSensorReading(intersectionIds);
        List<SensorReading> readings2 = trafficSimulator.generateSensorReading(intersectionIds);

        // Then - at least one of the values should be different (very high probability)
        SensorReading r1 = readings1.get(0);
        SensorReading r2 = readings2.get(0);

        boolean isDifferent = r1.getVehicleCount() != r2.getVehicleCount() ||
                Math.abs(r1.getAverageSpeed() - r2.getAverageSpeed()) > 0.1 ||
                !r1.getRoadCondition().equals(r2.getRoadCondition());

        assertTrue(isDifferent, "Multiple calls should produce varied data");
    }

    @Test
    void testGenerateSensorReading_emptyListShouldReturnEmpty() {
        // Given
        List<String> intersectionIds = Arrays.asList();

        // When
        List<SensorReading> readings = trafficSimulator.generateSensorReading(intersectionIds);

        // Then
        assertTrue(readings.isEmpty());
    }
}

