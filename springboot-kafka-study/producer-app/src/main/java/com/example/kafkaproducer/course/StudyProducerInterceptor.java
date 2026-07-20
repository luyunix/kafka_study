package com.example.kafkaproducer.course;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import com.example.kafkaproducer.model.StudyEvent;
import org.apache.kafka.clients.producer.ProducerInterceptor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;

/**
 * 在消息进入序列化与分区流程之前增加课程来源 Header，并统计发送次数。
 */
public class StudyProducerInterceptor implements ProducerInterceptor<String, StudyEvent> {

    public static final String SOURCE_HEADER = "x-course-source";
    private static final AtomicLong SEND_COUNT = new AtomicLong();

    @Override
    public ProducerRecord<String, StudyEvent> onSend(ProducerRecord<String, StudyEvent> record) {
        record.headers().add(
                SOURCE_HEADER,
                "producer-app".getBytes(StandardCharsets.UTF_8)
        );
        SEND_COUNT.incrementAndGet();
        return record;
    }

    @Override
    public void onAcknowledgement(RecordMetadata metadata, Exception exception) {
    }

    @Override
    public void close() {
    }

    @Override
    public void configure(Map<String, ?> configs) {
    }

    public static long sendCount() {
        return SEND_COUNT.get();
    }
}
