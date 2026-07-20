from __future__ import annotations


def murmur2(data: bytes) -> int:
    """Kafka-compatible Murmur2 hash used for keyed partition selection."""
    length = len(data)
    seed = 0x9747B28C
    m = 0x5BD1E995
    h = (seed ^ length) & 0xFFFFFFFF
    index = 0

    while length >= 4:
        k = (
            data[index]
            | (data[index + 1] << 8)
            | (data[index + 2] << 16)
            | (data[index + 3] << 24)
        )
        k = (k * m) & 0xFFFFFFFF
        k ^= (k >> 24)
        k = (k * m) & 0xFFFFFFFF
        h = (h * m) & 0xFFFFFFFF
        h ^= k
        index += 4
        length -= 4

    if length == 3:
        h ^= data[index + 2] << 16
    if length >= 2:
        h ^= data[index + 1] << 8
    if length >= 1:
        h ^= data[index]
        h = (h * m) & 0xFFFFFFFF

    h ^= h >> 13
    h = (h * m) & 0xFFFFFFFF
    h ^= h >> 15
    return h & 0xFFFFFFFF


def to_positive(value: int) -> int:
    return value & 0x7FFFFFFF


class DefaultPartitioner:
    def __init__(self) -> None:
        self._next = 0

    def choose(
        self,
        partition_count: int,
        *,
        key: str | bytes | None = None,
        explicit_partition: int | None = None,
    ) -> int:
        if partition_count <= 0:
            raise ValueError("partition_count must be positive")
        if explicit_partition is not None:
            if not 0 <= explicit_partition < partition_count:
                raise ValueError("explicit partition is out of range")
            return explicit_partition
        if key is not None:
            raw = key if isinstance(key, bytes) else key.encode("utf-8")
            return to_positive(murmur2(raw)) % partition_count

        # Modern Kafka uses sticky batching for null keys. This simulator keeps
        # one chosen partition until rotate_batch() is called.
        return self._next % partition_count

    def rotate_batch(self, partition_count: int) -> None:
        if partition_count <= 0:
            raise ValueError("partition_count must be positive")
        self._next = (self._next + 1) % partition_count


class RoundRobinPartitioner:
    def __init__(self) -> None:
        self._next = 0

    def choose(self, partition_count: int) -> int:
        if partition_count <= 0:
            raise ValueError("partition_count must be positive")
        result = self._next % partition_count
        self._next += 1
        return result
