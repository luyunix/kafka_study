import unittest

from kafka_from_scratch import (
    Broker,
    DefaultPartitioner,
    OffsetStore,
    ReplicatedPartition,
    RoundRobinPartitioner,
    cooperative_changes,
    range_assign,
    round_robin_assign,
    sticky_assign,
)


class KafkaBasicsTest(unittest.TestCase):
    def test_offsets_are_local_to_each_partition(self):
        broker = Broker()
        broker.create_topic("orders", partitions=2)
        self.assertEqual(broker.append("orders", 0, "a").offset, 0)
        self.assertEqual(broker.append("orders", 0, "b").offset, 1)
        self.assertEqual(broker.append("orders", 1, "c").offset, 0)

    def test_keyed_partition_is_stable(self):
        partitioner = DefaultPartitioner()
        first = partitioner.choose(8, key="customer-42")
        self.assertEqual(first, partitioner.choose(8, key="customer-42"))

    def test_round_robin_producer_partitioning(self):
        partitioner = RoundRobinPartitioner()
        self.assertEqual([partitioner.choose(3) for _ in range(7)], [0, 1, 2, 0, 1, 2, 0])

    def test_range_and_round_robin_assignors(self):
        topics = {"a": 3, "b": 3}
        subscriptions = {"c1": {"a", "b"}, "c2": {"a", "b"}}
        ranged = range_assign(topics, subscriptions)
        rounded = round_robin_assign(topics, subscriptions)
        self.assertEqual(sum(map(len, ranged.values())), 6)
        self.assertEqual(sum(map(len, rounded.values())), 6)
        self.assertNotEqual(ranged, rounded)

    def test_auto_offset_reset_only_applies_without_commit(self):
        store = OffsetStore()
        self.assertEqual(
            store.start_position("g", "t", 0, log_end_offset=10, auto_offset_reset="latest"),
            10,
        )
        store.commit("g", "t", 0, 4)
        self.assertEqual(
            store.start_position("g", "t", 0, log_end_offset=10, auto_offset_reset="latest"),
            4,
        )

    def test_sticky_assignor_preserves_valid_ownership(self):
        topics = {"orders": 4}
        subscriptions = {"c1": {"orders"}, "c2": {"orders"}}
        previous = {"c1": [("orders", 0), ("orders", 1)], "c2": [("orders", 2), ("orders", 3)]}
        desired = sticky_assign(topics, subscriptions, previous)
        self.assertEqual(desired, previous)

        new_subscriptions = {**subscriptions, "c3": {"orders"}}
        rebalanced = sticky_assign(topics, new_subscriptions, previous)
        changes = cooperative_changes(previous, rebalanced)
        self.assertEqual(sum(len(v) for v in rebalanced.values()), 4)
        self.assertEqual(len(changes["c3"]["add"]), 1)

    def test_hw_follows_slowest_isr_replica(self):
        partition = ReplicatedPartition(leader=1, followers=[2, 3])
        partition.append_to_leader(5)
        self.assertEqual(partition.hw, 0)
        partition.replicate(2, 5)
        partition.replicate(3, 3)
        self.assertEqual(partition.hw, 3)
        partition.set_in_sync(3, False)
        self.assertEqual(partition.hw, 5)


if __name__ == "__main__":
    unittest.main()
