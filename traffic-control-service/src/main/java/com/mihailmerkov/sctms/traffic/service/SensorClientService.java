package com.mihailmerkov.sctms.traffic.service;

import com.mihailmerkov.sctms.sensor.SensorReading;
import com.mihailmerkov.sctms.sensor.SensorService;
import com.mihailmerkov.sctms.sensor.SensorSubscription;
import io.quarkus.grpc.GrpcClient;
import io.smallrye.mutiny.Multi;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Client service for consuming sensor data via gRPC Server Streaming.
 */
@ApplicationScoped
public class SensorClientService {

    private static final Logger LOG = Logger.getLogger(SensorClientService.class);

    @GrpcClient("sensor-service")
    SensorService sensorService;

    // Cache latest sensor readings
    private final Map<String, SensorReading> latestReadings = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        // Start consuming sensor data stream on startup
        startSensorDataStream();
    }

    /**
     * Subscribes to sensor data stream from Sensor Service.
     */
    public void startSensorDataStream() {
        LOG.info("Starting sensor data stream subscription...");

        SensorSubscription subscription = SensorSubscription.newBuilder()
                .addAllIntersectionIds(Arrays.asList("INT-001", "INT-002", "INT-003", "INT-004"))
                .setIntervalSeconds(2)
                .build();

        Multi<SensorReading> stream = sensorService.streamSensorData(subscription);

        stream.subscribe().with(
                reading -> {
                    // Update cache with latest reading
                    latestReadings.put(reading.getIntersectionId(), reading);
                    LOG.debugf("Received sensor data: intersection=%s, vehicles=%d, speed=%.2f, condition=%s",
                            reading.getIntersectionId(), reading.getVehicleCount(),
                            reading.getAverageSpeed(), reading.getRoadCondition());
                },
                failure -> {
                    LOG.errorf(failure, "Error in sensor data stream");
                    // Retry connection after delay
                    scheduleReconnect();
                },
                () -> LOG.info("Sensor data stream completed")
        );
    }

    private void scheduleReconnect() {
        LOG.info("Scheduling reconnect to sensor service in 5 seconds...");
        // In production, use proper retry mechanism
        try {
            Thread.sleep(5000);
            startSensorDataStream();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Get the latest sensor reading for an intersection.
     */
    public SensorReading getLatestReading(String intersectionId) {
        return latestReadings.get(intersectionId);
    }

    /**
     * Get all latest readings.
     */
    public Map<String, SensorReading> getAllLatestReadings() {
        return new ConcurrentHashMap<>(latestReadings);
    }
}

