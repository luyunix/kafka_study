package com.example.kafkaproducer.course;

import java.time.Instant;

import com.example.kafkaproducer.model.StudyEvent;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StudyProducerInterceptorTest {

    @Test
    void addsCourseSourceHeader() {
        StudyProducerInterceptor interceptor = new StudyProducerInterceptor();
        ProducerRecord<String, StudyEvent> record = new ProducerRecord<>(
                "study.multi.events",
                "key",
                new StudyEvent("1", "lesson", "partition", Instant.now())
        );

        ProducerRecord<String, StudyEvent> intercepted = interceptor.onSend(record);

        assertThat(intercepted.headers().lastHeader(StudyProducerInterceptor.SOURCE_HEADER))
                .isNotNull();
    }
}
