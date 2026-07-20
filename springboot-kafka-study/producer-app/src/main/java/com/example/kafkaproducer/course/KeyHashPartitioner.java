package com.example.kafkaproducer.course;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.apache.kafka.clients.producer.Partitioner;
import org.apache.kafka.common.Cluster;
import org.apache.kafka.common.PartitionInfo;
import org.apache.kafka.common.utils.Utils;

/**
 * 课程中的自定义分区器：相同 Key 始终进入相同分区；没有 Key 时从可用分区中随机选择。
 */
public class KeyHashPartitioner implements Partitioner {

    @Override
    public int partition(
            String topic,
            Object key,
            byte[] keyBytes,
            Object value,
            byte[] valueBytes,
            Cluster cluster
    ) {
        List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
        if (partitions == null || partitions.isEmpty()) {
            throw new IllegalStateException("Topic 没有可用分区：" + topic);
        }

        if (key != null) {
            byte[] bytes = keyBytes != null
                    ? keyBytes
                    : key.toString().getBytes(StandardCharsets.UTF_8);
            return Utils.toPositive(Utils.murmur2(bytes)) % partitions.size();
        }

        List<PartitionInfo> available = cluster.availablePartitionsForTopic(topic);
        List<PartitionInfo> candidates = available == null || available.isEmpty()
                ? partitions
                : available;
        return candidates
                .get(ThreadLocalRandom.current().nextInt(candidates.size()))
                .partition();
    }

    @Override
    public void close() {
    }

    @Override
    public void configure(Map<String, ?> configs) {
    }
}
