from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Replica:
    broker_id: int
    leo: int = 0
    in_sync: bool = True


class ReplicatedPartition:
    """A tiny ISR/LEO/HW state machine for one Partition."""

    def __init__(self, leader: int, followers: list[int]) -> None:
        self.leader = leader
        self.replicas = {leader: Replica(leader)}
        self.replicas.update({broker: Replica(broker) for broker in followers})
        self.hw = 0

    @property
    def isr(self) -> set[int]:
        return {broker for broker, replica in self.replicas.items() if replica.in_sync}

    def append_to_leader(self, count: int = 1) -> int:
        if count <= 0:
            raise ValueError("count must be positive")
        self.replicas[self.leader].leo += count
        self._recompute_hw()
        return self.replicas[self.leader].leo

    def replicate(self, follower: int, up_to: int | None = None) -> int:
        if follower == self.leader:
            raise ValueError("leader is not a follower")
        leader_leo = self.replicas[self.leader].leo
        target = leader_leo if up_to is None else min(up_to, leader_leo)
        self.replicas[follower].leo = max(self.replicas[follower].leo, target)
        self._recompute_hw()
        return self.replicas[follower].leo

    def set_in_sync(self, broker: int, in_sync: bool) -> None:
        self.replicas[broker].in_sync = in_sync
        self._recompute_hw()

    def _recompute_hw(self) -> None:
        synced = [r.leo for r in self.replicas.values() if r.in_sync]
        self.hw = min(synced) if synced else 0

