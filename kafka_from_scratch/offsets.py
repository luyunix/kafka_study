from __future__ import annotations


class OffsetStore:
    """Model committed consumer positions by (group, topic, partition)."""

    def __init__(self) -> None:
        self._positions: dict[tuple[str, str, int], int] = {}

    def commit(self, group: str, topic: str, partition: int, next_offset: int) -> None:
        if next_offset < 0:
            raise ValueError("next_offset must be non-negative")
        self._positions[(group, topic, partition)] = next_offset

    def committed(self, group: str, topic: str, partition: int) -> int | None:
        return self._positions.get((group, topic, partition))

    def start_position(
        self,
        group: str,
        topic: str,
        partition: int,
        *,
        log_end_offset: int,
        auto_offset_reset: str,
    ) -> int:
        committed = self.committed(group, topic, partition)
        if committed is not None:
            return committed
        if auto_offset_reset == "earliest":
            return 0
        if auto_offset_reset == "latest":
            return log_end_offset
        raise ValueError("auto_offset_reset must be 'earliest' or 'latest'")

