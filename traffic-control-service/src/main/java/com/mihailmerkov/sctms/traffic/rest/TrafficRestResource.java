package com.mihailmerkov.sctms.traffic.rest;

import com.mihailmerkov.sctms.traffic.IntersectionStats;
import com.mihailmerkov.sctms.traffic.service.TrafficCoordinationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST API for frontend to access traffic control data.
 * Bridges gRPC backend services with HTTP/REST frontend.
 */
@Path("/api/traffic")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TrafficRestResource {

    private static final Logger LOG = Logger.getLogger(TrafficRestResource.class);

    @Inject
    TrafficCoordinationService coordinationService;

    /**
     * GET /api/traffic/intersections
     * Returns all intersection statistics.
     */
    @GET
    @Path("/intersections")
    public List<IntersectionStatsDTO> getAllIntersections() {
        LOG.info("REST: GET /api/traffic/intersections");
        return coordinationService.getAllIntersections().getIntersectionsList()
                .stream()
                .map(IntersectionStatsDTO::fromProtobuf)
                .collect(Collectors.toList());
    }

    /**
     * GET /api/traffic/intersections/{id}
     * Returns statistics for a specific intersection.
     */
    @GET
    @Path("/intersections/{id}")
    public IntersectionStatsDTO getIntersectionStats(@PathParam("id") String intersectionId) {
        LOG.infof("REST: GET /api/traffic/intersections/%s", intersectionId);
        IntersectionStats stats = coordinationService.getIntersectionStats(intersectionId);
        return IntersectionStatsDTO.fromProtobuf(stats);
    }

    /**
     * GET /api/traffic/health
     * Returns health status of the service.
     */
    @GET
    @Path("/health")
    public HealthStatus health() {
        return new HealthStatus("traffic-control-service", "UP");
    }
}

/**
 * Simple health status response.
 */
class HealthStatus {
    public String service;
    public String status;
    public long timestamp;

    public HealthStatus(String service, String status) {
        this.service = service;
        this.status = status;
        this.timestamp = System.currentTimeMillis();
    }
}

