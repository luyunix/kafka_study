package com.example.kafkaconsumer.consumer;

import java.time.Instant;

import com.example.kafkaconsumer.model.StudyEvent;
import com.example.kafkaconsumer.model.ConsumptionReceipt;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EventConsumerTest {

    @Test
    void countsConsumedRecords() {
        @SuppressWarnings("unchecked")
        KafkaTemplate<String, ConsumptionReceipt> kafkaTemplate = mock(KafkaTemplate.class);
        when(kafkaTemplate.send(anyString(), anyString(), any()))
                .thenReturn(CompletableFuture.completedFuture(null));
        EventConsumer consumer = new EventConsumer(
                "consumer-test",
                "study-test-group",
                "study.receipts",
                kafkaTemplate
        );
        StudyEvent event = new StudyEvent("1", "lesson", "consumer group", Instant.now());

        consumer.consume(new ConsumerRecord<>("study.multi.events", 1, 9L, "key-1", event));

        assertThat(consumer.consumedCount()).isEqualTo(1);
        verify(kafkaTemplate).send(anyString(), anyString(), any(ConsumptionReceipt.class));
    }
}
