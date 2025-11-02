####
# Multi-stage Dockerfile for Traffic Light Service
# Stage 1: Build with Maven
####
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy dependency definitions
COPY pom.xml .

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -B

####
# Stage 2: Runtime image
####
FROM eclipse-temurin:21-jre-alpine

# Add labels for container metadata
LABEL maintainer="Mihail Merkov <https://github.com/mihailmerkov>"
LABEL service="traffic-light-service"
LABEL version="1.0.0"
LABEL description="Traffic Light Service - gRPC Bidirectional Streaming for traffic light coordination"

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /deployments

# Copy the built artifacts from build stage
COPY --from=build --chown=appuser:appgroup /build/target/quarkus-app/lib/ ./lib/
COPY --from=build --chown=appuser:appgroup /build/target/quarkus-app/*.jar ./
COPY --from=build --chown=appuser:appgroup /build/target/quarkus-app/app/ ./app/
COPY --from=build --chown=appuser:appgroup /build/target/quarkus-app/quarkus/ ./quarkus/

# Switch to non-root user
USER appuser

# Expose HTTP and gRPC ports
EXPOSE 8003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8003/q/health || exit 1

# Set JVM options for containerized environment
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV JAVA_APP_JAR="quarkus-run.jar"

# Run the application
ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -jar $JAVA_APP_JAR" ]

