package com.example.kafkaproducer.model;

import java.time.Instant;

public record ConsumptionReceipt(
        String eventId,
        String consumerInstance,
        String consumerGroup,
        String topic,
        int partition,
        long offset,
        Instant consumedAt
) {
}
