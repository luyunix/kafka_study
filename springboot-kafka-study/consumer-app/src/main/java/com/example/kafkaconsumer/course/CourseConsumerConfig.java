package com.example.kafkaconsumer.course;

import com.example.kafkaconsumer.model.StudyEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;

/**
 * 仅在 course-extras Profile 下创建手动确认和批量监听容器。
 */
@Configuration
@Profile("course-extras")
public class CourseConsumerConfig {

    @Bean
    ConcurrentKafkaListenerContainerFactory<String, StudyEvent>
    manualAckKafkaListenerContainerFactory(
            ConsumerFactory<String, StudyEvent> consumerFactory
    ) {
        ConcurrentKafkaListenerContainerFactory<String, StudyEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.getContainerProperties()
                .setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }

    @Bean
    ConcurrentKafkaListenerContainerFactory<String, StudyEvent>
    batchKafkaListenerContainerFactory(
            ConsumerFactory<String, StudyEvent> consumerFactory
    ) {
        ConcurrentKafkaListenerContainerFactory<String, StudyEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setBatchListener(true);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.BATCH);
        return factory;
    }
}
