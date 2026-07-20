# Kafka 核心机制从零实现练习包

这些代码不连接真实 Kafka，也不替代官方客户端。它的目的，是把课程里最容易混淆的
Topic、Partition、Offset、生产者分区、消费者组分配、ISR、LEO 和 HW 变成可以单步运行的模型。

## 练习顺序

1. `broker.py`：创建 Topic，向不同 Partition 追加 Event，观察 Offset 只在分区内递增。
2. `partitioning.py`：比较显式分区、带 key 哈希、默认粘性批次和 Round Robin。
3. `consumer_groups.py`：对比 Range、Round Robin、Sticky，并观察 Cooperative Rebalance
   只撤销/增加必要分区的变化集合。
4. `offsets.py`：观察已提交 Offset、`earliest` 和 `latest` 如何决定起始位置。
5. `replication.py`：让 Leader 先写、Follower 再追赶，观察各副本 LEO 与 HW 的变化。

运行全部测试：

```bash
python -m unittest discover -s tests -p 'test_*.py'
```
