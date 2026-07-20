from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Event:
    topic: str
    partition: int
    offset: int
    key: str | None
    value: Any
    headers: dict[str, bytes] = field(default_factory=dict)


class Broker:
    """An in-memory append-only Kafka-like log.

    It intentionally models only the concepts needed by the notes: Topic,
    Partition, append order, Offset and reads from a specific position.
    """

    def __init__(self) -> None:
        self._topics: dict[str, list[list[Event]]] = {}

    def create_topic(self, name: str, partitions: int) -> None:
        if not name:
            raise ValueError("topic name must not be empty")
        if partitions <= 0:
            raise ValueError("partitions must be positive")
        if name in self._topics:
            raise ValueError(f"topic already exists: {name}")
        self._topics[name] = [[] for _ in range(partitions)]

    def partition_count(self, topic: str) -> int:
        return len(self._topics[topic])

    def append(
        self,
        topic: str,
        partition: int,
        value: Any,
        *,
        key: str | None = None,
        headers: dict[str, bytes] | None = None,
    ) -> Event:
        logs = self._topics[topic]
        if partition < 0 or partition >= len(logs):
            raise IndexError(f"partition out of range: {partition}")
        log = logs[partition]
        event = Event(topic, partition, len(log), key, value, headers or {})
        log.append(event)
        return event

    def read(self, topic: str, partition: int, offset: int, limit: int = 100) -> list[Event]:
        if offset < 0:
            raise ValueError("offset must be non-negative")
        return self._topics[topic][partition][offset: offset + limit]

    def end_offset(self, topic: str, partition: int) -> int:
        """Return the LEO-like next offset for this local log."""
        return len(self._topics[topic][partition])

