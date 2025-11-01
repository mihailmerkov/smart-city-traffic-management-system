package com.mihailmerkov.sctms.traffic.service;

import com.mihailmerkov.sctms.traffic.IntersectionList;
import com.mihailmerkov.sctms.traffic.IntersectionStats;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class TrafficCoordinationServiceTest {

    @Inject
    TrafficCoordinationService coordinationService;

    @Test
    void testGetIntersectionStats_shouldReturnValidData() {
        // Given
        String intersectionId = "INT-001";

        // When
        IntersectionStats stats = coordinationService.getIntersectionStats(intersectionId);

        // Then
        assertNotNull(stats);
        assertEquals(intersectionId, stats.getIntersectionId());
        assertTrue(stats.getVehicleCount() >= 0);
        assertTrue(stats.getAvgWaitTime() >= 0);
        assertTrue(stats.getAvgWaitTime() <= 120.0, "Wait time should be capped");
        assertNotNull(stats.getCurrentPhase());
        assertTrue(stats.getTimestamp() > 0);
    }

    @Test
    void testGetAllIntersections_shouldReturnList() {
        // When
        IntersectionList list = coordinationService.getAllIntersections();

        // Then
        assertNotNull(list);
        assertNotNull(list.getIntersectionsList());
    }

    @Test
    void testGetIntersectionStats_calculatesWaitTime() {
        // Given
        String intersectionId = "INT-001";

        // When
        IntersectionStats stats = coordinationService.getIntersectionStats(intersectionId);

        // Then
        assertTrue(stats.getAvgWaitTime() >= 15.0, "Should have base wait time");
    }

    @Test
    void testGetIntersectionStats_multipleIntersections() {
        // Given
        String[] intersectionIds = {"INT-001", "INT-002", "INT-003", "INT-004"};

        // When & Then
        for (String id : intersectionIds) {
            IntersectionStats stats = coordinationService.getIntersectionStats(id);
            assertNotNull(stats);
            assertEquals(id, stats.getIntersectionId());
        }
    }
}

