package com.mihailmerkov.sctms.traffic.rest;

import com.mihailmerkov.sctms.traffic.IntersectionStats;
import com.mihailmerkov.sctms.traffic.service.TrafficCoordinationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.logging.Logger;

import java.util.List;

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
    public List<IntersectionStats> getAllIntersections() {
        LOG.info("REST: GET /api/traffic/intersections");
        return coordinationService.getAllIntersections().getIntersectionsList();
    }

    /**
     * GET /api/traffic/intersections/{id}
     * Returns statistics for a specific intersection.
     */
    @GET
    @Path("/intersections/{id}")
    public IntersectionStats getIntersectionStats(@PathParam("id") String intersectionId) {
        LOG.infof("REST: GET /api/traffic/intersections/%s", intersectionId);
        return coordinationService.getIntersectionStats(intersectionId);
    }

    /**
     * GET /api/traffic/health
     * Simple health check endpoint.
     */
    @GET
    @Path("/health")
    public String health() {
        return "{\"status\": \"UP\", \"service\": \"traffic-control-service\"}";
    }
}

