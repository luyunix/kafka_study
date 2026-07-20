package com.example.kafkaproducer.dashboard;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/traces")
public class DashboardController {

    private final MessageTraceStore traceStore;

    public DashboardController(MessageTraceStore traceStore) {
        this.traceStore = traceStore;
    }

    @GetMapping
    public DashboardSnapshot snapshot() {
        return traceStore.snapshot();
    }

    @DeleteMapping
    public void clear() {
        traceStore.clear();
    }
}
