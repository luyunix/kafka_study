package com.example.kafkaproducer.web;

public record EventRequest(
        String key,
        String type,
        String payload,
        Integer partition
) {

    public String normalizedType() {
        return type == null || type.isBlank() ? "study-event" : type;
    }

    public String normalizedKey(String fallback) {
        return key == null || key.isBlank() ? fallback : key;
    }
}
