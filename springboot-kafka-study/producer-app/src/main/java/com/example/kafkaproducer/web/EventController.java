package com.example.kafkaproducer.web;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.IntStream;

import com.example.kafkaproducer.producer.EventPublisher;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventPublisher publisher;

    public EventController(EventPublisher publisher) {
        this.publisher = publisher;
    }

    @GetMapping
    public String usage() {
        return "POST JSON to /api/events, or POST /api/events/batch?count=12";
    }

    @PostMapping
    public CompletableFuture<SendReceipt> publish(@RequestBody EventRequest request) {
        return publisher.publish(request);
    }

    @PostMapping("/batch")
    public CompletableFuture<List<SendReceipt>> publishBatch(
            @RequestParam(defaultValue = "12") int count
    ) {
        if (count < 1 || count > 100) {
            throw new IllegalArgumentException("count 必须在 1 到 100 之间");
        }

        List<CompletableFuture<SendReceipt>> sends = IntStream.range(0, count)
                .mapToObj(index -> new EventRequest(
                        "study-key-" + index,
                        "batch-study-event",
                        "第 " + (index + 1) + " 条课程消息",
                        null
                ))
                .map(publisher::publish)
                .toList();

        return CompletableFuture
                .allOf(sends.toArray(CompletableFuture[]::new))
                .thenApply(ignored -> sends.stream()
                        .map(CompletableFuture::join)
                        .toList());
    }
}
