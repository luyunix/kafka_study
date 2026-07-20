package com.example.kafkaproducer.model;

import java.time.Instant;
import java.util.UUID;

public record StudyEvent(
        String id,
        String type,
        String payload,
        Instant occurredAt
) {

    public static StudyEvent of(String type, String payload) {
        return new StudyEvent(
                UUID.randomUUID().toString(),
                type,
                payload,
                Instant.now()
        );
    }
}
