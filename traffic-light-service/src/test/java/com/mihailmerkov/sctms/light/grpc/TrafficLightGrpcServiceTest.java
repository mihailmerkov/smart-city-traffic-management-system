package com.mihailmerkov.sctms.light.grpc;

import com.mihailmerkov.sctms.light.TrafficLightCommand;
import com.mihailmerkov.sctms.light.TrafficLightStatus;
import io.quarkus.grpc.GrpcService;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.helpers.test.AssertSubscriber;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class TrafficLightGrpcServiceTest {

    @Inject
    @GrpcService
    Instance<TrafficLightGrpcService> trafficLightServiceInstance;

    private TrafficLightGrpcService getTrafficLightService() {
        return trafficLightServiceInstance.get();
    }

    @Test
    void testCoordinateTrafficLights_shouldReceiveStatusUpdates() {
        // Given
        TrafficLightCommand command = TrafficLightCommand.newBuilder()
                .setIntersectionId("INT-001")
                .setPhase("GREEN_NS")
                .setDurationSeconds(30)
                .setPriority(2)
                .build();

        Multi<TrafficLightCommand> commands = Multi.createFrom().item(command);

        // When
        AssertSubscriber<TrafficLightStatus> subscriber = getTrafficLightService()
                .coordinateTrafficLights(commands)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(10));

        // Then
        List<TrafficLightStatus> statuses = subscriber
                .awaitItems(1, Duration.ofSeconds(5))
                .getItems();

        assertFalse(statuses.isEmpty(), "Should receive at least one status update");

        TrafficLightStatus status = statuses.get(0);
        assertNotNull(status.getIntersectionId());
        assertNotNull(status.getCurrentPhase());
        assertTrue(status.getTimeRemaining() >= 0);
        assertTrue(status.getQueueLength() >= 0);
        assertTrue(status.getTimestamp() > 0);
    }

    @Test
    void testCoordinateTrafficLights_shouldProcessCommand() {
        // Given
        TrafficLightCommand command = TrafficLightCommand.newBuilder()
                .setIntersectionId("INT-TEST-001")
                .setPhase("GREEN_EW")
                .setDurationSeconds(45)
                .setPriority(3)
                .build();

        Multi<TrafficLightCommand> commands = Multi.createFrom().item(command);

        // When
        AssertSubscriber<TrafficLightStatus> subscriber = getTrafficLightService()
                .coordinateTrafficLights(commands)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(Long.MAX_VALUE));

        // Then - wait for items to arrive, checking periodically for our specific intersection
        TrafficLightStatus status = null;
        int attempts = 0;
        while (status == null && attempts < 10) {
            // Try to get at least one item
            try {
                subscriber.awaitNextItem(Duration.ofMillis(500));
            } catch (AssertionError e) {
                // No new items yet, that's ok
            }

            // Check if we have our target intersection in the received items
            status = subscriber.getItems().stream()
                    .filter(s -> "INT-TEST-001".equals(s.getIntersectionId()))
                    .findFirst()
                    .orElse(null);
            attempts++;
        }

        assertNotNull(status, "Expected status for INT-TEST-001");
        assertEquals("INT-TEST-001", status.getIntersectionId());
        assertEquals("GREEN_EW", status.getCurrentPhase());

        // Clean up
        subscriber.cancel();
    }

    @Test
    void testCoordinateTrafficLights_emergencyMode() {
        // Given - priority > 5 triggers emergency mode
        TrafficLightCommand command = TrafficLightCommand.newBuilder()
                .setIntersectionId("INT-EMERGENCY")
                .setPhase("GREEN_NS")
                .setDurationSeconds(60)
                .setPriority(8)
                .build();

        Multi<TrafficLightCommand> commands = Multi.createFrom().item(command);

        // When
        AssertSubscriber<TrafficLightStatus> subscriber = getTrafficLightService()
                .coordinateTrafficLights(commands)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(Long.MAX_VALUE));

        // Then - wait for items to arrive, checking periodically for our specific intersection
        TrafficLightStatus status = null;
        int attempts = 0;
        while (status == null && attempts < 10) {
            // Try to get at least one item
            try {
                subscriber.awaitNextItem(Duration.ofMillis(500));
            } catch (AssertionError e) {
                // No new items yet, that's ok
            }

            // Check if we have our target intersection in the received items
            status = subscriber.getItems().stream()
                    .filter(s -> "INT-EMERGENCY".equals(s.getIntersectionId()))
                    .findFirst()
                    .orElse(null);
            attempts++;
        }

        assertNotNull(status, "Expected status for INT-EMERGENCY");
        assertEquals("INT-EMERGENCY", status.getIntersectionId());
        assertTrue(status.getEmergencyMode(), "Should be in emergency mode for priority > 5");

        // Clean up
        subscriber.cancel();
    }

    @Test
    void testCoordinateTrafficLights_multipleCommands() {
        // Given
        TrafficLightCommand cmd1 = TrafficLightCommand.newBuilder()
                .setIntersectionId("INT-001")
                .setPhase("GREEN_NS")
                .setDurationSeconds(30)
                .setPriority(2)
                .build();

        TrafficLightCommand cmd2 = TrafficLightCommand.newBuilder()
                .setIntersectionId("INT-002")
                .setPhase("GREEN_EW")
                .setDurationSeconds(25)
                .setPriority(1)
                .build();

        Multi<TrafficLightCommand> commands = Multi.createFrom().items(cmd1, cmd2);

        // When
        AssertSubscriber<TrafficLightStatus> subscriber = getTrafficLightService()
                .coordinateTrafficLights(commands)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(10));

        // Then
        List<TrafficLightStatus> statuses = subscriber
                .awaitItems(2, Duration.ofSeconds(5))
                .getItems();

        assertTrue(statuses.size() >= 2, "Should receive status for both commands");
    }

    @Test
    void testCoordinateTrafficLights_cancellation() {
        // Given
        TrafficLightCommand command = TrafficLightCommand.newBuilder()
                .setIntersectionId("INT-001")
                .setPhase("GREEN_NS")
                .setDurationSeconds(30)
                .setPriority(2)
                .build();

        Multi<TrafficLightCommand> commands = Multi.createFrom().item(command);

        // When
        AssertSubscriber<TrafficLightStatus> subscriber = getTrafficLightService()
                .coordinateTrafficLights(commands)
                .subscribe()
                .withSubscriber(AssertSubscriber.create(10));

        subscriber.awaitItems(1, Duration.ofSeconds(3));
        subscriber.cancel();

        // Then
        assertTrue(subscriber.isCancelled());
    }
}

