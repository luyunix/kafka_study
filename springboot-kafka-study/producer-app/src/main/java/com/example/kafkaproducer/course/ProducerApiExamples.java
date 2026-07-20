package com.example.kafkaproducer.course;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import com.example.kafkaproducer.model.StudyEvent;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.kafka.support.SendResult;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

/**
 * P62–P73 对应的 KafkaTemplate 发送 API。页面使用 EventPublisher，这里集中保留课程写法。
 */
@Service
public class ProducerApiExamples {

    private final KafkaTemplate<String, StudyEvent> kafkaTemplate;
    private final String defaultTopic;

    public ProducerApiExamples(
            KafkaTemplate<String, StudyEvent> kafkaTemplate,
            @Value("${app.kafka.topic}") String defaultTopic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.defaultTopic = defaultTopic;
    }

    public CompletableFuture<SendResult<String, StudyEvent>> send(
            String key,
            StudyEvent event
    ) {
        return kafkaTemplate.send(defaultTopic, key, event);
    }

    public CompletableFuture<SendResult<String, StudyEvent>> sendMessage(StudyEvent event) {
        Message<StudyEvent> message = MessageBuilder
                .withPayload(event)
                .setHeader(KafkaHeaders.TOPIC, defaultTopic)
                .setHeader(KafkaHeaders.KEY, event.id())
                .build();
        return kafkaTemplate.send(message);
    }

    public CompletableFuture<SendResult<String, StudyEvent>> sendProducerRecord(
            StudyEvent event
    ) {
        ProducerRecord<String, StudyEvent> record =
                new ProducerRecord<>(defaultTopic, event.id(), event);
        return kafkaTemplate.send(record);
    }

    public CompletableFuture<SendResult<String, StudyEvent>> sendToPartition(
            int partition,
            String key,
            StudyEvent event
    ) {
        return kafkaTemplate.send(defaultTopic, partition, key, event);
    }

    public SendResult<String, StudyEvent> sendBlocking(
            String key,
            StudyEvent event
    ) throws Exception {
        return send(key, event).get(10, TimeUnit.SECONDS);
    }

    public CompletableFuture<SendResult<String, StudyEvent>> sendAsync(
            String key,
            StudyEvent event
    ) {
        return send(key, event).whenComplete((result, error) -> {
            if (error != null) {
                throw new IllegalStateException("Kafka 异步发送失败", error);
            }
        });
    }
}
