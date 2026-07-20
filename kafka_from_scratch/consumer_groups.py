from __future__ import annotations

TopicPartitions = dict[str, int]
Subscriptions = dict[str, set[str]]
Assignment = dict[str, list[tuple[str, int]]]


def range_assign(topic_partitions: TopicPartitions, subscriptions: Subscriptions) -> Assignment:
    """Approximate RangeAssignor: allocate each topic independently in ranges."""
    result: Assignment = {consumer: [] for consumer in sorted(subscriptions)}
    for topic in sorted(topic_partitions):
        consumers = sorted(c for c, topics in subscriptions.items() if topic in topics)
        if not consumers:
            continue
        count = topic_partitions[topic]
        base, extra = divmod(count, len(consumers))
        start = 0
        for index, consumer in enumerate(consumers):
            size = base + (1 if index < extra else 0)
            result[consumer].extend((topic, p) for p in range(start, start + size))
            start += size
    return result


def round_robin_assign(topic_partitions: TopicPartitions, subscriptions: Subscriptions) -> Assignment:
    """Round-robin all eligible topic partitions across sorted consumers."""
    result: Assignment = {consumer: [] for consumer in sorted(subscriptions)}
    if not subscriptions:
        return result
    all_partitions = [
        (topic, partition)
        for topic in sorted(topic_partitions)
        for partition in range(topic_partitions[topic])
    ]
    consumers = sorted(subscriptions)
    cursor = 0
    for topic, partition in all_partitions:
        for _ in consumers:
            consumer = consumers[cursor % len(consumers)]
            cursor += 1
            if topic in subscriptions[consumer]:
                result[consumer].append((topic, partition))
                break
    return result


def assignment_loads(assignment: Assignment) -> dict[str, int]:
    return {consumer: len(partitions) for consumer, partitions in assignment.items()}


def sticky_assign(
    topic_partitions: TopicPartitions,
    subscriptions: Subscriptions,
    previous: Assignment | None = None,
) -> Assignment:
    """Keep valid previous ownership, then balance the remaining partitions.

    This is a teaching model rather than Kafka's complete StickyAssignor, but
    it exposes the two goals: balanced load and minimal movement.
    """
    result: Assignment = {consumer: [] for consumer in sorted(subscriptions)}
    valid = {
        (topic, partition)
        for topic, count in topic_partitions.items()
        for partition in range(count)
    }
    owned: set[tuple[str, int]] = set()

    for consumer in sorted(result):
        for topic_partition in (previous or {}).get(consumer, []):
            topic, _ = topic_partition
            if (
                topic_partition in valid
                and topic in subscriptions[consumer]
                and topic_partition not in owned
            ):
                result[consumer].append(topic_partition)
                owned.add(topic_partition)

    unassigned = sorted(valid - owned)
    while unassigned:
        topic_partition = unassigned.pop(0)
        topic, _ = topic_partition
        eligible = [
            consumer
            for consumer in sorted(result)
            if topic in subscriptions[consumer]
        ]
        if not eligible:
            continue
        consumer = min(eligible, key=lambda name: (len(result[name]), name))
        result[consumer].append(topic_partition)

    # Move only enough partitions to make the assignment differ by at most one.
    while result:
        most = max(result, key=lambda name: (len(result[name]), name))
        least = min(result, key=lambda name: (len(result[name]), name))
        if len(result[most]) - len(result[least]) <= 1:
            break
        movable = next(
            (
                tp
                for tp in reversed(result[most])
                if tp[0] in subscriptions[least]
            ),
            None,
        )
        if movable is None:
            break
        result[most].remove(movable)
        result[least].append(movable)

    for partitions in result.values():
        partitions.sort()
    return result


def cooperative_changes(previous: Assignment, desired: Assignment) -> dict[str, dict[str, list[tuple[str, int]]]]:
    """Show incremental revoke/add actions for a cooperative rebalance."""
    consumers = sorted(set(previous) | set(desired))
    return {
        consumer: {
            "revoke": sorted(set(previous.get(consumer, [])) - set(desired.get(consumer, []))),
            "add": sorted(set(desired.get(consumer, [])) - set(previous.get(consumer, []))),
        }
        for consumer in consumers
    }
