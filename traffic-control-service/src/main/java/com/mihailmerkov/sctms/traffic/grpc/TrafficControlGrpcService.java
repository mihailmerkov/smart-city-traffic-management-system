package com.mihailmerkov.sctms.traffic.grpc;

import com.mihailmerkov.sctms.traffic.*;
import com.mihailmerkov.sctms.traffic.service.TrafficCoordinationService;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

/**
 * Traffic Control gRPC Service implementing Unary (Request-Response) pattern.
 * Provides traffic statistics and intersection information.
 */
@GrpcService
public class TrafficControlGrpcService implements TrafficControlService {

    private static final Logger LOG = Logger.getLogger(TrafficControlGrpcService.class);

    @Inject
    TrafficCoordinationService coordinationService;

    /**
     * Unary RPC: Get statistics for a specific intersection.
     */
    @Override
    public Uni<IntersectionStats> getIntersectionStats(IntersectionRequest request) {
        String intersectionId = request.getIntersectionId();
        LOG.infof("Received request for intersection stats: %s", intersectionId);

        return Uni.createFrom().item(() -> {
            IntersectionStats stats = coordinationService.getIntersectionStats(intersectionId);
            LOG.infof("Returning stats for %s: vehicles=%d, wait=%.2f, phase=%s",
                    intersectionId, stats.getVehicleCount(), stats.getAvgWaitTime(), stats.getCurrentPhase());
            return stats;
        });
    }

    /**
     * Unary RPC: Get statistics for all intersections.
     */
    @Override
    public Uni<IntersectionList> getAllIntersections(Empty request) {
        LOG.info("Received request for all intersections");

        return Uni.createFrom().item(() -> {
            IntersectionList list = coordinationService.getAllIntersections();
            LOG.infof("Returning %d intersections", list.getIntersectionsCount());
            return list;
        });
    }
}

