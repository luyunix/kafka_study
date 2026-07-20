"""Small dependency-free simulations for learning Kafka core mechanics."""

from .broker import Broker, Event
from .consumer_groups import (
    cooperative_changes,
    range_assign,
    round_robin_assign,
    sticky_assign,
)
from .offsets import OffsetStore
from .partitioning import DefaultPartitioner, RoundRobinPartitioner, murmur2
from .replication import ReplicatedPartition

__all__ = [
    "Broker",
    "DefaultPartitioner",
    "Event",
    "OffsetStore",
    "ReplicatedPartition",
    "RoundRobinPartitioner",
    "cooperative_changes",
    "murmur2",
    "range_assign",
    "round_robin_assign",
    "sticky_assign",
]
