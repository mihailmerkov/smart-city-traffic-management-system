package com.mihailmerkov.sctms.sensor.grpc;

import com.mihailmerkov.sctms.sensor.*;
import com.mihailmerkov.sctms.sensor.simulator.TrafficSimulator;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Multi;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.List;

/**
 * gRPC Service implementing Server Streaming pattern.
 * Streams real-time sensor data from traffic intersections.
 */
@GrpcService
public class SensorGrpcService implements SensorService {

    private static final Logger LOG = Logger.getLogger(SensorGrpcService.class);

    @Inject
    TrafficSimulator trafficSimulator;

    /**
     * Server Streaming RPC: Continuously streams sensor readings for subscribed intersections.
     */
    @Override
    public Multi<SensorReading> streamSensorData(SensorSubscription request) {
        List<String> intersectionIds = request.getIntersectionIdsList();
        int intervalSeconds = request.getIntervalSeconds() > 0 ? request.getIntervalSeconds() : 2;

        LOG.infof("Starting sensor data stream for intersections: %s (interval: %ds)",
                intersectionIds, intervalSeconds);

        // Create a stream that emits sensor readings at specified intervals
        return Multi.createFrom().ticks().every(Duration.ofSeconds(intervalSeconds))
                .onItem().transform(tick -> {
                    // Generate readings for all subscribed intersections
                    List<SensorReading> readings = trafficSimulator.generateSensorReading(intersectionIds);

                    // Log and return readings one by one
                    for (SensorReading reading : readings) {
                        LOG.debugf("Streaming sensor data: %s - vehicles: %d, speed: %.2f",
                                reading.getIntersectionId(),
                                reading.getVehicleCount(),
                                reading.getAverageSpeed());
                    }

                    return readings;
                })
                .onItem().transformToMultiAndConcatenate(readings -> Multi.createFrom().iterable(readings))
                .onCancellation().invoke(() ->
                    LOG.infof("Sensor data stream cancelled for intersections: %s", intersectionIds))
                .onFailure().invoke(throwable ->
                    LOG.errorf(throwable, "Error in sensor data stream"));
    }
}

