package com.mihailmerkov.sctms.light.grpc;

import com.mihailmerkov.sctms.light.TrafficLightCommand;
import com.mihailmerkov.sctms.light.TrafficLightService;
import com.mihailmerkov.sctms.light.TrafficLightStatus;
import com.mihailmerkov.sctms.light.controller.LightController;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

/**
 * Traffic Light gRPC Service implementing Bidirectional Streaming pattern.
 * Receives commands and sends back status updates continuously.
 */
@GrpcService
public class TrafficLightGrpcService implements TrafficLightService {

    private static final Logger LOG = Logger.getLogger(TrafficLightGrpcService.class);

    @Inject
    LightController lightController;

    @Override
    public Multi<TrafficLightStatus> coordinateTrafficLights(Multi<TrafficLightCommand> commands) {
        LOG.info("Bidirectional streaming started: CoordinateTrafficLights");

        // Create a broadcast processor to emit status updates
        BroadcastProcessor<TrafficLightStatus> statusProcessor = BroadcastProcessor.create();

        // Subscribe to incoming commands
        commands
                .invoke(command -> LOG.infof("Received command: intersection=%s, phase=%s, duration=%d, priority=%d",
                        command.getIntersectionId(), command.getPhase(),
                        command.getDurationSeconds(), command.getPriority()))
                .subscribe().with(
                        command -> {
                            // Process the command and update light controller
                            lightController.processCommand(command);

                            // Generate and emit status update
                            TrafficLightStatus status = lightController.getStatus(command.getIntersectionId());
                            statusProcessor.onNext(status);

                            LOG.infof("Sent status: intersection=%s, phase=%s, remaining=%d",
                                    status.getIntersectionId(), status.getCurrentPhase(),
                                    status.getTimeRemaining());
                        },
                        failure -> {
                            LOG.errorf(failure, "Error processing command");
                            statusProcessor.onError(failure);
                        },
                        () -> {
                            LOG.info("Command stream completed");
                            statusProcessor.onComplete();
                        }
                );

        // Also emit periodic status updates even without commands
        Multi<TrafficLightStatus> periodicUpdates = lightController.getPeriodicStatusUpdates();

        // Merge command-triggered updates with periodic updates
        return Multi.createBy().merging()
                .streams(statusProcessor, periodicUpdates)
                .onCancellation().invoke(() -> LOG.info("Client cancelled bidirectional stream"));
    }
}

