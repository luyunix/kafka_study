package com.example.kafkaproducer.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StudyEventTest {

    @Test
    void createsAnEventWithIdentityAndTime() {
        StudyEvent event = StudyEvent.of("lesson", "Kafka consumer group");

        assertThat(event.id()).isNotBlank();
        assertThat(event.type()).isEqualTo("lesson");
        assertThat(event.payload()).isEqualTo("Kafka consumer group");
        assertThat(event.occurredAt()).isNotNull();
    }
}
