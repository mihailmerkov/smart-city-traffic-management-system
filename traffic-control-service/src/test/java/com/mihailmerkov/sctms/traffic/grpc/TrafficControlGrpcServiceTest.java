package com.mihailmerkov.sctms.traffic.grpc;

import com.mihailmerkov.sctms.traffic.Empty;

import com.mihailmerkov.sctms.traffic.*;
import io.quarkus.grpc.GrpcService;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class TrafficControlGrpcServiceTest {

    @Inject
    @GrpcService
    Instance<TrafficControlGrpcService> trafficControlServiceInstance;

    private TrafficControlGrpcService getTrafficControlService() {
        return trafficControlServiceInstance.get();
    }

    @Test
    void testGetIntersectionStats_shouldReturnStats() {
        // Given
        IntersectionRequest request = IntersectionRequest.newBuilder()
                .setIntersectionId("INT-001")
                .build();

        // When
        IntersectionStats stats = getTrafficControlService()
                .getIntersectionStats(request)
                .subscribe()
                .withSubscriber(UniAssertSubscriber.create())
                .awaitItem(Duration.ofSeconds(5))
                .getItem();

        // Then
        assertNotNull(stats);
        assertEquals("INT-001", stats.getIntersectionId());
        assertTrue(stats.getVehicleCount() >= 0);
        assertTrue(stats.getAvgWaitTime() >= 0);
        assertNotNull(stats.getCurrentPhase());
        assertTrue(stats.getTimestamp() > 0);
    }

    @Test
    void testGetAllIntersections_shouldReturnList() {
        // Given
        Empty request = Empty.newBuilder().build();

        // When
        IntersectionList list = getTrafficControlService()
                .getAllIntersections(request)
                .subscribe()
                .withSubscriber(UniAssertSubscriber.create())
                .awaitItem(Duration.ofSeconds(10))
                .getItem();

        // Then
        assertNotNull(list);
        assertNotNull(list.getIntersectionsList());
        // Note: List might be empty initially until sensor data flows in
        // In a real test, we'd wait for data or mock the services
    }

    @Test
    void testGetIntersectionStats_multipleRequests() {
        // Given
        IntersectionRequest request1 = IntersectionRequest.newBuilder()
                .setIntersectionId("INT-001")
                .build();

        IntersectionRequest request2 = IntersectionRequest.newBuilder()
                .setIntersectionId("INT-002")
                .build();

        // When
        IntersectionStats stats1 = getTrafficControlService()
                .getIntersectionStats(request1)
                .subscribe()
                .withSubscriber(UniAssertSubscriber.create())
                .awaitItem(Duration.ofSeconds(5))
                .getItem();

        IntersectionStats stats2 = getTrafficControlService()
                .getIntersectionStats(request2)
                .subscribe()
                .withSubscriber(UniAssertSubscriber.create())
                .awaitItem(Duration.ofSeconds(5))
                .getItem();

        // Then
        assertEquals("INT-001", stats1.getIntersectionId());
        assertEquals("INT-002", stats2.getIntersectionId());
    }

    @Test
    void testGetIntersectionStats_validatesData() {
        // Given
        IntersectionRequest request = IntersectionRequest.newBuilder()
                .setIntersectionId("INT-001")
                .build();

        // When
        IntersectionStats stats = getTrafficControlService()
                .getIntersectionStats(request)
                .subscribe()
                .withSubscriber(UniAssertSubscriber.create())
                .awaitItem(Duration.ofSeconds(5))
                .getItem();

        // Then
        assertNotNull(stats.getIntersectionId());
        assertFalse(stats.getIntersectionId().isEmpty());
        assertTrue(stats.getVehicleCount() >= 0, "Vehicle count should be non-negative");
        assertTrue(stats.getAvgWaitTime() >= 0, "Wait time should be non-negative");
        assertTrue(stats.getAvgWaitTime() <= 120.0, "Wait time should be capped at 120s");
    }
}

