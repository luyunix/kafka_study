package com.example.kafkaproducer.dashboard;

import com.example.kafkaproducer.model.ConsumptionReceipt;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ConsumptionReceiptListener {

    private final MessageTraceStore traceStore;

    public ConsumptionReceiptListener(MessageTraceStore traceStore) {
        this.traceStore = traceStore;
    }

    @KafkaListener(
            topics = "${app.kafka.receipt-topic}",
            groupId = "${app.kafka.receipt-group}"
    )
    public void receive(ConsumptionReceipt receipt) {
        traceStore.recordConsumed(receipt);
    }
}
