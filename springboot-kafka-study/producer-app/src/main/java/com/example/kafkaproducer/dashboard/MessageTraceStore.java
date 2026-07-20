package com.example.kafkaproducer.dashboard;

import java.util.ArrayList;
import java.util.List;

import com.example.kafkaproducer.model.ConsumptionReceipt;
import com.example.kafkaproducer.web.SendReceipt;
import org.springframework.stereotype.Component;

@Component
public class MessageTraceStore {

    private static final int MAX_ITEMS = 200;

    private final List<SendReceipt> sent = new ArrayList<>();
    private final List<ConsumptionReceipt> consumed = new ArrayList<>();

    public synchronized void recordSent(SendReceipt receipt) {
        sent.add(0, receipt);
        trim(sent);
    }

    public synchronized void recordConsumed(ConsumptionReceipt receipt) {
        consumed.add(0, receipt);
        trim(consumed);
    }

    public synchronized DashboardSnapshot snapshot() {
        return new DashboardSnapshot(List.copyOf(sent), List.copyOf(consumed));
    }

    public synchronized void clear() {
        sent.clear();
        consumed.clear();
    }

    private static void trim(List<?> items) {
        if (items.size() > MAX_ITEMS) {
            items.subList(MAX_ITEMS, items.size()).clear();
        }
    }
}
