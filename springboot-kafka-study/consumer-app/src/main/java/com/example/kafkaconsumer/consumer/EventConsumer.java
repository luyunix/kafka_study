package com.example.kafkaconsumer.consumer;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

import com.example.kafkaconsumer.model.ConsumptionReceipt;
import com.example.kafkaconsumer.model.StudyEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventConsumer {

    private static final Logger log = LoggerFactory.getLogger(EventConsumer.class);

    private final String instanceId;
    private final String consumerGroup;
    private final String receiptTopic;
    private final KafkaTemplate<String, ConsumptionReceipt> kafkaTemplate;
    private final AtomicLong consumedCount = new AtomicLong();

    public EventConsumer(
            @Value("${app.instance-id}") String instanceId,
            @Value("${spring.kafka.consumer.group-id}") String consumerGroup,
            @Value("${app.kafka.receipt-topic}") String receiptTopic,
            KafkaTemplate<String, ConsumptionReceipt> kafkaTemplate
    ) {
        this.instanceId = instanceId;
        this.consumerGroup = consumerGroup;
        this.receiptTopic = receiptTopic;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(
            topics = "${app.kafka.topic}",
            groupId = "${spring.kafka.consumer.group-id}",
            concurrency = "${app.kafka.concurrency}"
    )
    public void consume(ConsumerRecord<String, StudyEvent> record) {
        long count = consumedCount.incrementAndGet();
        log.info(
                "[实例={}] 第 {} 条：partition={}, offset={}, key={}, event={}",
                instanceId,
                count,
                record.partition(),
                record.offset(),
                record.key(),
                record.value()
        );

        ConsumptionReceipt receipt = new ConsumptionReceipt(
                record.value().id(),
                instanceId,
                consumerGroup,
                record.topic(),
                record.partition(),
                record.offset(),
                Instant.now()
        );
        kafkaTemplate.send(receiptTopic, receipt.eventId(), receipt)
                .whenComplete((result, error) -> {
                    if (error != null) {
                        log.error("[实例={}] 发送消费回执失败，eventId={}", instanceId, receipt.eventId(), error);
                    }
                });
    }

    public long consumedCount() {
        return consumedCount.get();
    }
}
