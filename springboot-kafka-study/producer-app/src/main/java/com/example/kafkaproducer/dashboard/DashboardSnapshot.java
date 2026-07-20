package com.example.kafkaproducer.dashboard;

import java.util.List;

import com.example.kafkaproducer.model.ConsumptionReceipt;
import com.example.kafkaproducer.web.SendReceipt;

public record DashboardSnapshot(
        List<SendReceipt> sent,
        List<ConsumptionReceipt> consumed
) {
}
