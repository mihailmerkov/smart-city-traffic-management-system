package com.mihailmerkov.sctms.light.rest;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 * REST endpoint for health checks.
 */
@Path("/api/light")
@Produces(MediaType.APPLICATION_JSON)
public class TrafficLightHealthResource {

    @GET
    @Path("/health")
    public HealthStatus health() {
        return new HealthStatus("traffic-light-service", "UP");
    }
}

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


