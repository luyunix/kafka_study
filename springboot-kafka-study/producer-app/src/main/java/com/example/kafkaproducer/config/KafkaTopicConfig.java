package com.example.kafkaproducer.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    NewTopic studyMultiInstanceTopic(
            @Value("${app.kafka.topic}") String topic,
            @Value("${app.kafka.partitions}") int partitions
    ) {
        return TopicBuilder.name(topic)
                .partitions(partitions)
                .replicas(1)
                .build();
    }

    @Bean
    NewTopic studyConsumptionReceiptTopic(
            @Value("${app.kafka.receipt-topic}") String topic
    ) {
        return TopicBuilder.name(topic)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
