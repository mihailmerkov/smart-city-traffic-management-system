package com.mihailmerkov.sctms.traffic.service;

import com.mihailmerkov.sctms.light.TrafficLightCommand;
import com.mihailmerkov.sctms.light.TrafficLightService;
import com.mihailmerkov.sctms.light.TrafficLightStatus;
import io.quarkus.grpc.GrpcClient;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Client service for coordinating traffic lights via gRPC Bidirectional Streaming.
 */
@ApplicationScoped
public class TrafficLightClientService {

    private static final Logger LOG = Logger.getLogger(TrafficLightClientService.class);

    @GrpcClient("traffic-light-service")
    TrafficLightService trafficLightService;

    // Cache latest traffic light statuses
    private final Map<String, TrafficLightStatus> latestStatuses = new ConcurrentHashMap<>();

    // Processor to send commands
    private BroadcastProcessor<TrafficLightCommand> commandProcessor;

    @PostConstruct
    public void init() {
        // Start bidirectional streaming on startup
        startTrafficLightCoordination();
    }

    /**
     * Establishes bidirectional stream with Traffic Light Service.
     */
    public void startTrafficLightCoordination() {
        LOG.info("Starting bidirectional stream with Traffic Light Service...");

        // Create processor for sending commands
        commandProcessor = BroadcastProcessor.create();

        // Establish bidirectional stream
        Multi<TrafficLightStatus> statusStream = trafficLightService.coordinateTrafficLights(commandProcessor);

        // Subscribe to status updates
        statusStream.subscribe().with(
                status -> {
                    // Update cache with latest status
                    latestStatuses.put(status.getIntersectionId(), status);
                    LOG.debugf("Received traffic light status: intersection=%s, phase=%s, remaining=%d, queue=%d",
                            status.getIntersectionId(), status.getCurrentPhase(),
                            status.getTimeRemaining(), status.getQueueLength());
                },
                failure -> {
                    LOG.errorf(failure, "Error in traffic light coordination stream");
                    scheduleReconnect();
                },
                () -> LOG.info("Traffic light coordination stream completed")
        );
    }

    /**
     * Send a command to change traffic light phase.
     */
    public void sendCommand(String intersectionId, String phase, int durationSeconds, int priority) {
        if (commandProcessor == null) {
            LOG.warn("Command processor not initialized, cannot send command");
            return;
        }

        TrafficLightCommand command = TrafficLightCommand.newBuilder()
                .setIntersectionId(intersectionId)
                .setPhase(phase)
                .setDurationSeconds(durationSeconds)
                .setPriority(priority)
                .build();

        commandProcessor.onNext(command);
        LOG.infof("Sent command to traffic light: intersection=%s, phase=%s, duration=%d",
                intersectionId, phase, durationSeconds);
    }

    /**
     * Get the latest status for an intersection.
     */
    public TrafficLightStatus getLatestStatus(String intersectionId) {
        return latestStatuses.get(intersectionId);
    }

    /**
     * Get all latest statuses.
     */
    public Map<String, TrafficLightStatus> getAllLatestStatuses() {
        return new ConcurrentHashMap<>(latestStatuses);
    }

    private void scheduleReconnect() {
        LOG.info("Scheduling reconnect to traffic light service in 5 seconds...");
        try {
            Thread.sleep(5000);
            startTrafficLightCoordination();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

