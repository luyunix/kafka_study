package com.example.kafkaconsumer.course;

import com.example.kafkaconsumer.model.StudyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * 消费输入 Topic 后加工消息并发送到输出 Topic。
 */
@Component
@Profile("course-extras")
public class EventForwarder {

    private final KafkaTemplate<String, StudyEvent> kafkaTemplate;

    public EventForwarder(KafkaTemplate<String, StudyEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(
            topics = CourseTopics.FORWARD_INPUT,
            groupId = "study-forwarder-group"
    )
    public void forward(StudyEvent event) {
        StudyEvent forwarded = new StudyEvent(
                event.id(),
                "FORWARDED_" + event.type(),
                event.payload(),
                event.occurredAt()
        );
        kafkaTemplate.send(CourseTopics.FORWARD_OUTPUT, event.id(), forwarded);
    }
}
