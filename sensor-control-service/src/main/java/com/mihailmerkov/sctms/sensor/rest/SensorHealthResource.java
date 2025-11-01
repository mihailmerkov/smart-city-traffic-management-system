package com.mihailmerkov.sctms.sensor.rest;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 * REST endpoint for health checks.
 */
@Path("/api/sensor")
@Produces(MediaType.APPLICATION_JSON)
public class SensorHealthResource {

    @GET
    @Path("/health")
    public HealthStatus health() {
        return new HealthStatus("sensor-control-service", "UP");
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

