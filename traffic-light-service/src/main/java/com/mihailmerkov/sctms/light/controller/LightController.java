package com.mihailmerkov.sctms.light.controller;

import com.mihailmerkov.sctms.light.TrafficLightCommand;
import com.mihailmerkov.sctms.light.TrafficLightStatus;
import io.smallrye.mutiny.Multi;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Controls traffic light states and manages intersection logic.
 */
@ApplicationScoped
public class LightController {

    private static final Logger LOG = Logger.getLogger(LightController.class);
    private static final Random random = new Random();

    // Store current state for each intersection
    private final Map<String, IntersectionState> intersectionStates = new ConcurrentHashMap<>();

    public LightController() {
        // Initialize some default intersections
        initializeIntersection("INT-001");
        initializeIntersection("INT-002");
        initializeIntersection("INT-003");
        initializeIntersection("INT-004");
    }

    private void initializeIntersection(String intersectionId) {
        intersectionStates.put(intersectionId, new IntersectionState(intersectionId, "GREEN_NS", 30));
    }

    /**
     * Process a command received from the traffic control service.
     */
    public void processCommand(TrafficLightCommand command) {
        String intersectionId = command.getIntersectionId();

        IntersectionState state = intersectionStates.computeIfAbsent(
                intersectionId,
                id -> new IntersectionState(id, "RED_ALL", 10)
        );

        // Update the state based on command
        state.setCurrentPhase(command.getPhase());
        state.setTimeRemaining(command.getDurationSeconds());
        state.setPriority(command.getPriority());
        state.setEmergencyMode(command.getPriority() > 5);

        LOG.infof("Updated intersection %s: phase=%s, duration=%d",
                intersectionId, command.getPhase(), command.getDurationSeconds());
    }

    /**
     * Get current status for an intersection.
     */
    public TrafficLightStatus getStatus(String intersectionId) {
        IntersectionState state = intersectionStates.get(intersectionId);

        if (state == null) {
            // Return default status for unknown intersection
            return TrafficLightStatus.newBuilder()
                    .setIntersectionId(intersectionId)
                    .setCurrentPhase("RED_ALL")
                    .setTimeRemaining(0)
                    .setQueueLength(0)
                    .setTimestamp(Instant.now().toEpochMilli())
                    .setEmergencyMode(false)
                    .build();
        }

        // Simulate queue length based on phase and time
        int queueLength = calculateQueueLength(state);

        return TrafficLightStatus.newBuilder()
                .setIntersectionId(intersectionId)
                .setCurrentPhase(state.getCurrentPhase())
                .setTimeRemaining(state.getTimeRemaining())
                .setQueueLength(queueLength)
                .setTimestamp(Instant.now().toEpochMilli())
                .setEmergencyMode(state.isEmergencyMode())
                .build();
    }

    /**
     * Provides periodic status updates for all intersections.
     */
    public Multi<TrafficLightStatus> getPeriodicStatusUpdates() {
        return Multi.createFrom().ticks().every(Duration.ofSeconds(3))
                .onItem().transform(tick -> {
                    // Update time remaining for all intersections
                    intersectionStates.values().forEach(state -> {
                        int remaining = state.getTimeRemaining() - 3;
                        if (remaining <= 0) {
                            // Cycle to next phase
                            cyclePhase(state);
                        } else {
                            state.setTimeRemaining(remaining);
                        }
                    });

                    // Return status for a random intersection (or iterate through all)
                    if (!intersectionStates.isEmpty()) {
                        String randomId = intersectionStates.keySet().stream()
                                .skip(random.nextInt(intersectionStates.size()))
                                .findFirst()
                                .orElse("INT-001");
                        return getStatus(randomId);
                    }

                    return null;
                })
                .filter(status -> status != null);
    }

    private void cyclePhase(IntersectionState state) {
        String currentPhase = state.getCurrentPhase();
        String nextPhase;
        int duration;

        switch (currentPhase) {
            case "GREEN_NS":
                nextPhase = "GREEN_EW";
                duration = 30;
                break;
            case "GREEN_EW":
                nextPhase = "RED_ALL";
                duration = 5;
                break;
            case "RED_ALL":
                nextPhase = "GREEN_NS";
                duration = 30;
                break;
            default:
                nextPhase = "RED_ALL";
                duration = 10;
        }

        state.setCurrentPhase(nextPhase);
        state.setTimeRemaining(duration);

        LOG.debugf("Cycled intersection %s to phase %s", state.getIntersectionId(), nextPhase);
    }

    private int calculateQueueLength(IntersectionState state) {
        // Simulate queue length: longer during red phase, shorter during green
        int baseQueue = state.getCurrentPhase().contains("RED") ? 15 : 5;
        return baseQueue + random.nextInt(10);
    }

    /**
     * Internal class to track intersection state.
     */
    private static class IntersectionState {
        private final String intersectionId;
        private String currentPhase;
        private int timeRemaining;
        private int priority;
        private boolean emergencyMode;

        public IntersectionState(String intersectionId, String currentPhase, int timeRemaining) {
            this.intersectionId = intersectionId;
            this.currentPhase = currentPhase;
            this.timeRemaining = timeRemaining;
            this.priority = 0;
            this.emergencyMode = false;
        }

        public String getIntersectionId() { return intersectionId; }
        public String getCurrentPhase() { return currentPhase; }
        public void setCurrentPhase(String currentPhase) { this.currentPhase = currentPhase; }
        public int getTimeRemaining() { return timeRemaining; }
        public void setTimeRemaining(int timeRemaining) { this.timeRemaining = timeRemaining; }
        public int getPriority() { return priority; }
        public void setPriority(int priority) { this.priority = priority; }
        public boolean isEmergencyMode() { return emergencyMode; }
        public void setEmergencyMode(boolean emergencyMode) { this.emergencyMode = emergencyMode; }
    }
}

