package com.mihailmerkov.sctms.traffic.rest;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class TrafficRestResourceTest {

    @Test
    void testGetAllIntersections() {
        given()
            .when().get("/api/traffic/intersections")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("$", notNullValue());
    }

    @Test
    void testGetIntersectionStats() {
        given()
            .pathParam("id", "INT-001")
            .when().get("/api/traffic/intersections/{id}")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("intersectionId", equalTo("INT-001"))
                .body("vehicleCount", greaterThanOrEqualTo(0))
                .body("avgWaitTime", greaterThanOrEqualTo(0.0f))
                .body("currentPhase", notNullValue())
                .body("timestamp", greaterThan(0L));
    }

    @Test
    void testHealth() {
        given()
            .when().get("/api/traffic/health")
            .then()
                .statusCode(200)
                .body(containsString("UP"))
                .body(containsString("traffic-control-service"));
    }

    @Test
    void testGetIntersectionStats_multipleIntersections() {
        String[] intersections = {"INT-001", "INT-002", "INT-003", "INT-004"};

        for (String id : intersections) {
            given()
                .pathParam("id", id)
                .when().get("/api/traffic/intersections/{id}")
                .then()
                    .statusCode(200)
                    .body("intersectionId", equalTo(id));
        }
    }
}

