package com.example.kafkaproducer.course;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaAdmin;

@Configuration
public class CourseTopicConfig {

    @Bean
    KafkaAdmin.NewTopics courseTopics() {
        return new KafkaAdmin.NewTopics(
                topic(CourseTopics.MANUAL_ACK),
                topic(CourseTopics.BATCH),
                topic(CourseTopics.OFFSET, 5),
                topic(CourseTopics.RECEIVE),
                topic(CourseTopics.ASSIGNMENT, 10),
                topic(CourseTopics.FORWARD_INPUT),
                topic(CourseTopics.FORWARD_OUTPUT)
        );
    }

    private NewTopic topic(String name) {
        return topic(name, 3);
    }

    private NewTopic topic(String name, int partitions) {
        return TopicBuilder.name(name)
                .partitions(partitions)
                .replicas(1)
                .build();
    }
}
