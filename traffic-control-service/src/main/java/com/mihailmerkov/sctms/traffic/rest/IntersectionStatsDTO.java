package com.mihailmerkov.sctms.traffic.rest;

import com.mihailmerkov.sctms.traffic.IntersectionStats;

/**
 * Data Transfer Object for IntersectionStats.
 * Used to convert Protobuf objects to JSON-serializable POJOs.
 */
public class IntersectionStatsDTO {

    public String intersectionId;
    public int vehicleCount;
    public double avgWaitTime;
    public String currentPhase;
    public long timestamp;

    public IntersectionStatsDTO() {
        // Default constructor for Jackson
    }

    public IntersectionStatsDTO(String intersectionId, int vehicleCount, double avgWaitTime,
                                String currentPhase, long timestamp) {
        this.intersectionId = intersectionId;
        this.vehicleCount = vehicleCount;
        this.avgWaitTime = avgWaitTime;
        this.currentPhase = currentPhase;
        this.timestamp = timestamp;
    }

    /**
     * Convert Protobuf IntersectionStats to DTO.
     */
    public static IntersectionStatsDTO fromProtobuf(IntersectionStats stats) {
        return new IntersectionStatsDTO(
            stats.getIntersectionId(),
            stats.getVehicleCount(),
            stats.getAvgWaitTime(),
            stats.getCurrentPhase(),
            stats.getTimestamp()
        );
    }
}

