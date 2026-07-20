package com.example.kafkaproducer.producer;

import java.util.concurrent.CompletableFuture;
import java.time.Instant;

import com.example.kafkaproducer.dashboard.MessageTraceStore;
import com.example.kafkaproducer.model.StudyEvent;
import com.example.kafkaproducer.web.EventRequest;
import com.example.kafkaproducer.web.SendReceipt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class EventPublisher {

    private final KafkaTemplate<String, StudyEvent> kafkaTemplate;
    private final String topic;
    private final MessageTraceStore traceStore;

    public EventPublisher(
            KafkaTemplate<String, StudyEvent> kafkaTemplate,
            @Value("${app.kafka.topic}") String topic,
            MessageTraceStore traceStore
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
        this.traceStore = traceStore;
    }

    public CompletableFuture<SendReceipt> publish(EventRequest request) {
        StudyEvent event = StudyEvent.of(request.normalizedType(), request.payload());
        String key = request.normalizedKey(event.id());

        var sendFuture = request.partition() == null
                ? kafkaTemplate.send(topic, key, event)
                : kafkaTemplate.send(topic, request.partition(), key, event);

        return sendFuture.thenApply(result -> {
            var metadata = result.getRecordMetadata();
            SendReceipt receipt = new SendReceipt(
                    event.id(),
                    key,
                    event.type(),
                    event.payload(),
                    metadata.topic(),
                    metadata.partition(),
                    metadata.offset(),
                    Instant.now()
            );
            traceStore.recordSent(receipt);
            return receipt;
        });
    }
}
