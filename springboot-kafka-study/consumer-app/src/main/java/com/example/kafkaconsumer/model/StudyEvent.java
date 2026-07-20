package com.example.kafkaconsumer.model;

import java.time.Instant;

public record StudyEvent(
        String id,
        String type,
        String payload,
        Instant occurredAt
) {
}
