from kafka_from_scratch import Broker, DefaultPartitioner


def main() -> None:
    broker = Broker()
    broker.create_topic("orders", partitions=3)
    partitioner = DefaultPartitioner()

    for order_id in ("A-100", "B-200", "A-100"):
        partition = partitioner.choose(3, key=order_id)
        event = broker.append(
            "orders",
            partition,
            {"order_id": order_id},
            key=order_id,
        )
        print(
            f"key={event.key} -> topic={event.topic}, "
            f"partition={event.partition}, offset={event.offset}"
        )


if __name__ == "__main__":
    main()

