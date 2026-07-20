package com.example.kafkaconsumer.course;

import java.util.List;

import com.example.kafkaconsumer.model.StudyEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.PartitionOffset;
import org.springframework.kafka.annotation.TopicPartition;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

/**
 * P89–P111 的额外消费方式。默认不启动，使用 --spring.profiles.active=course-extras 开启。
 */
@Component
@Profile("course-extras")
public class CourseConsumerExamples {

    private static final Logger log = LoggerFactory.getLogger(CourseConsumerExamples.class);

    /**
     * P89：只接收消息体。
     */
    @KafkaListener(topics = CourseTopics.RECEIVE, groupId = "study-body-group")
    public void receiveValue(StudyEvent event) {
        log.info("消息体：{}", event);
    }

    /**
     * P90：把常用 Kafka 消息头直接绑定为方法参数。
     */
    @KafkaListener(topics = CourseTopics.RECEIVE, groupId = "study-header-group")
    public void receiveHeaders(
            StudyEvent event,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            @Header(KafkaHeaders.RECEIVED_KEY) String key
    ) {
        log.info("消息头：topic={}, partition={}, offset={}, key={}, event={}",
                topic, partition, offset, key, event);
    }

    /**
     * P91：用 ConsumerRecord 一次取得消息体、头部元数据与位置。
     */
    @KafkaListener(topics = CourseTopics.RECEIVE, groupId = "study-record-group")
    public void receiveRecord(ConsumerRecord<String, StudyEvent> record) {
        log.info("完整记录：topic={}, partition={}, offset={}, key={}, headers={}, event={}",
                record.topic(),
                record.partition(),
                record.offset(),
                record.key(),
                record.headers(),
                record.value());
    }

    @KafkaListener(
            topics = CourseTopics.MANUAL_ACK,
            groupId = "study-manual-group",
            containerFactory = "manualAckKafkaListenerContainerFactory"
    )
    public void receiveWithManualAck(
            ConsumerRecord<String, StudyEvent> record,
            Acknowledgment acknowledgment
    ) {
        log.info("手动 ACK：partition={}, offset={}, event={}",
                record.partition(), record.offset(), record.value());
        acknowledgment.acknowledge();
    }

    @KafkaListener(
            topics = CourseTopics.BATCH,
            groupId = "study-batch-group",
            containerFactory = "batchKafkaListenerContainerFactory"
    )
    public void receiveBatch(List<ConsumerRecord<String, StudyEvent>> records) {
        log.info("批量消费 {} 条消息", records.size());
        records.forEach(record -> log.info(
                "batch partition={}, offset={}, event={}",
                record.partition(),
                record.offset(),
                record.value()
        ));
    }

    @KafkaListener(
            groupId = "study-fixed-offset-group",
            topicPartitions = @TopicPartition(
                    topic = CourseTopics.OFFSET,
                    partitions = {"0", "1", "2"},
                    partitionOffsets = {
                            @PartitionOffset(partition = "3", initialOffset = "3"),
                            @PartitionOffset(partition = "4", initialOffset = "3")
                    }
            )
    )
    public void receiveFromFixedOffset(ConsumerRecord<String, StudyEvent> record) {
        log.info("固定 Offset：partition={}, offset={}, event={}",
                record.partition(), record.offset(), record.value());
    }
}
