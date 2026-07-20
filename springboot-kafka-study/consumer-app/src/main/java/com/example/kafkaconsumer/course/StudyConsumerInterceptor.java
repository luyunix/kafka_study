package com.example.kafkaconsumer.course;

import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import com.example.kafkaconsumer.model.StudyEvent;
import org.apache.kafka.clients.consumer.ConsumerInterceptor;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;

/**
 * 课程中的 ConsumerInterceptor：记录 poll 返回的消息总数。
 */
public class StudyConsumerInterceptor implements ConsumerInterceptor<String, StudyEvent> {

    private static final AtomicLong CONSUME_COUNT = new AtomicLong();

    @Override
    public ConsumerRecords<String, StudyEvent> onConsume(
            ConsumerRecords<String, StudyEvent> records
    ) {
        CONSUME_COUNT.addAndGet(records.count());
        return records;
    }

    @Override
    public void onCommit(Map<TopicPartition, OffsetAndMetadata> offsets) {
    }

    @Override
    public void close() {
    }

    @Override
    public void configure(Map<String, ?> configs) {
    }

    public static long consumeCount() {
        return CONSUME_COUNT.get();
    }
}
