package com.mihailmerkov.sctms.sensor.grpc;

import com.mihailmerkov.sctms.sensor.SensorReading;
import com.mihailmerkov.sctms.sensor.SensorSubscription;
import io.quarkus.grpc.GrpcService;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.AssertSubscriber;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class SensorGrpcServiceTest {

    @Inject
    @GrpcService
    Instance<SensorGrpcService> sensorServiceInstance;

    private SensorGrpcService getSensorService() {
        return sensorServiceInstance.get();
    }

    @Test
    void testStreamSensorData_shouldStreamReadings() {
        // Given
        SensorSubscription subscription = SensorSubscription.newBuilder()
                .addAllIntersectionIds(Arrays.asList("INT-001", "INT-002"))
                .setIntervalSeconds(1)
                .build();

        // When
        AssertSubscriber<SensorReading> subscriber = getSensorService()
                .streamSensorData(subscription)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(10));

        // Then
        List<SensorReading> readings = subscriber
                .awaitItems(4, Duration.ofSeconds(5))
                .getItems();

        assertFalse(readings.isEmpty(), "Should receive sensor readings");
        assertTrue(readings.size() >= 2, "Should receive at least 2 readings");

        SensorReading reading = readings.get(0);
        assertNotNull(reading.getSensorId());
        assertNotNull(reading.getIntersectionId());
        assertTrue(reading.getVehicleCount() >= 0);
        assertTrue(reading.getAverageSpeed() >= 0);
        assertNotNull(reading.getRoadCondition());
        assertTrue(reading.getTimestamp() > 0);
    }

    @Test
    void testStreamSensorData_withMultipleIntersections() {
        // Given
        SensorSubscription subscription = SensorSubscription.newBuilder()
                .addAllIntersectionIds(Arrays.asList("INT-001", "INT-002", "INT-003"))
                .setIntervalSeconds(1)
                .build();

        // When
        AssertSubscriber<SensorReading> subscriber = getSensorService()
                .streamSensorData(subscription)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(10));

        // Then
        List<SensorReading> readings = subscriber
                .awaitItems(6, Duration.ofSeconds(5))
                .getItems();

        assertTrue(readings.size() >= 3, "Should receive readings for all intersections");

        // Verify we have readings from different intersections
        long distinctIntersections = readings.stream()
                .map(SensorReading::getIntersectionId)
                .distinct()
                .count();

        assertTrue(distinctIntersections >= 2, "Should have readings from multiple intersections");
    }

    @Test
    void testStreamSensorData_cancellation() {
        // Given
        SensorSubscription subscription = SensorSubscription.newBuilder()
                .addIntersectionIds("INT-001")
                .setIntervalSeconds(1)
                .build();

        // When
        AssertSubscriber<SensorReading> subscriber = getSensorService()
                .streamSensorData(subscription)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(5));

        subscriber.awaitItems(2, Duration.ofSeconds(3));
        subscriber.cancel();

        // Then
        assertTrue(subscriber.isCancelled());
    }

    @Test
    void testStreamSensorData_withCustomInterval() {
        // Given
        SensorSubscription subscription = SensorSubscription.newBuilder()
                .addIntersectionIds("INT-001")
                .setIntervalSeconds(2)
                .build();

        // When
        long startTime = System.currentTimeMillis();
        AssertSubscriber<SensorReading> subscriber = getSensorService()
                .streamSensorData(subscription)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(5));

        subscriber.awaitItems(2, Duration.ofSeconds(6));
        long elapsed = System.currentTimeMillis() - startTime;

        // Then
        assertTrue(elapsed >= 2000, "Should respect custom interval");
    }
}

