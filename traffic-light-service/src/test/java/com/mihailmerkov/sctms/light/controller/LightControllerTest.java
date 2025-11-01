package com.mihailmerkov.sctms.light.controller;

import com.mihailmerkov.sctms.light.TrafficLightCommand;
import com.mihailmerkov.sctms.light.TrafficLightStatus;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.AssertSubscriber;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class LightControllerTest {

    @Inject
    LightController lightController;

    @Test
    void testProcessCommand_shouldUpdateIntersectionState() {
        // Given
        TrafficLightCommand command = TrafficLightCommand.newBuilder()
                .setIntersectionId("INT-TEST-001")
                .setPhase("GREEN_NS")
                .setDurationSeconds(45)
                .setPriority(3)
                .build();

        // When
        lightController.processCommand(command);
        TrafficLightStatus status = lightController.getStatus("INT-TEST-001");

        // Then
        assertEquals("INT-TEST-001", status.getIntersectionId());
        assertEquals("GREEN_NS", status.getCurrentPhase());
        assertEquals(45, status.getTimeRemaining());
        assertFalse(status.getEmergencyMode());
    }

    @Test
    void testProcessCommand_highPriorityShouldSetEmergencyMode() {
        // Given
        TrafficLightCommand command = TrafficLightCommand.newBuilder()
                .setIntersectionId("INT-EMERGENCY")
                .setPhase("GREEN_EW")
                .setDurationSeconds(60)
                .setPriority(8)
                .build();

        // When
        lightController.processCommand(command);
        TrafficLightStatus status = lightController.getStatus("INT-EMERGENCY");

        // Then
        assertTrue(status.getEmergencyMode(), "Priority > 5 should trigger emergency mode");
    }

    @Test
    void testGetStatus_existingIntersection() {
        // Given
        String intersectionId = "INT-001"; // Initialized in constructor

        // When
        TrafficLightStatus status = lightController.getStatus(intersectionId);

        // Then
        assertNotNull(status);
        assertEquals(intersectionId, status.getIntersectionId());
        assertNotNull(status.getCurrentPhase());
        assertTrue(status.getTimeRemaining() >= 0);
        assertTrue(status.getQueueLength() >= 0);
        assertTrue(status.getTimestamp() > 0);
    }

    @Test
    void testGetStatus_nonExistentIntersection() {
        // Given
        String intersectionId = "INT-NONEXISTENT";

        // When
        TrafficLightStatus status = lightController.getStatus(intersectionId);

        // Then
        assertNotNull(status);
        assertEquals(intersectionId, status.getIntersectionId());
        assertEquals("RED_ALL", status.getCurrentPhase());
        assertEquals(0, status.getTimeRemaining());
    }

    @Test
    void testGetPeriodicStatusUpdates_shouldStream() {
        // When
        AssertSubscriber<TrafficLightStatus> subscriber = lightController
                .getPeriodicStatusUpdates()
                .subscribe()
                .withSubscriber(AssertSubscriber.create(10));

        // Then
        List<TrafficLightStatus> statuses = subscriber
                .awaitItems(2, Duration.ofSeconds(10))
                .getItems();

        assertFalse(statuses.isEmpty(), "Should receive periodic status updates");

        for (TrafficLightStatus status : statuses) {
            assertNotNull(status.getIntersectionId());
            assertNotNull(status.getCurrentPhase());
            assertTrue(status.getTimestamp() > 0);
        }
    }

    @Test
    void testValidPhases() {
        // Given
        List<String> validPhases = Arrays.asList("GREEN_NS", "GREEN_EW", "RED_ALL");

        for (String phase : validPhases) {
            // When
            TrafficLightCommand command = TrafficLightCommand.newBuilder()
                    .setIntersectionId("INT-PHASE-TEST")
                    .setPhase(phase)
                    .setDurationSeconds(30)
                    .setPriority(1)
                    .build();

            lightController.processCommand(command);
            TrafficLightStatus status = lightController.getStatus("INT-PHASE-TEST");

            // Then
            assertEquals(phase, status.getCurrentPhase());
        }
    }
}

