package com.example.kafkaproducer.web;

import java.time.Instant;

public record SendReceipt(
        String eventId,
        String key,
        String type,
        String payload,
        String topic,
        int partition,
        long offset,
        Instant sentAt
) {
}
