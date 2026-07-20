package com.example.kafkaconsumer.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class ConsumerStartupLogger implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ConsumerStartupLogger.class);

    private final String instanceId;
    private final String groupId;
    private final String topic;

    public ConsumerStartupLogger(
            @Value("${app.instance-id}") String instanceId,
            @Value("${spring.kafka.consumer.group-id}") String groupId,
            @Value("${app.kafka.topic}") String topic
    ) {
        this.instanceId = instanceId;
        this.groupId = groupId;
        this.topic = topic;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info(
                "消费者实例已启动：instanceId={}, groupId={}, topic={}",
                instanceId,
                groupId,
                topic
        );
    }
}
