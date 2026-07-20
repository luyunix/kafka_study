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
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * P89–P111 的额外消费方式。默认不启动，使用 --spring.profiles.active=course-extras 开启。
 */
@Component
@Profile("course-extras")
public class CourseConsumerExamples {

    private static final Logger log = LoggerFactory.getLogger(CourseConsumerExamples.class);

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
                    partitionOffsets = @PartitionOffset(
                            partition = "0",
                            initialOffset = "0"
                    )
            )
    )
    public void receiveFromFixedOffset(ConsumerRecord<String, StudyEvent> record) {
        log.info("固定 Offset：partition={}, offset={}, event={}",
                record.partition(), record.offset(), record.value());
    }
}
