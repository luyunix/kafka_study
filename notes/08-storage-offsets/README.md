# 第 8 章：消息存储与 Offset

理解日志文件、__consumer_offsets、生产者 Offset 与消费者 Offset 的含义和代码表现。

## 整章核心讲解

Kafka 把每个 Topic-Partition 保存成独立的追加日志目录，`.log` 保存记录，索引文件帮助按 Offset/时间定位，检查点与元数据文件支持恢复和副本管理。

生产者看到的 Offset 是 Broker 为新记录分配的位置；消费者提交的 Offset 通常表示下一条要读的位置。`__consumer_offsets` 保存的是消费者组进度和相关协调数据，不是业务消息本身。

## 先看懂整章数据流

```mermaid
flowchart LR
    C0["日志存储"]
    C1["__consumer_offsets"]
    C0 --> C1
    C2["Producer Offset"]
    C1 --> C2
    C3["Consumer Offset"]
    C2 --> C3
    C4["重启验证"]
    C3 --> C4
```

## 本章逐节目录

1. [P119 Kafka事件消息数据的存储](./p119-Kafka事件消息数据的存储.md) · 10:07
2. [P120 Kafka的__consumer_offsets主题](./p120-Kafka的__consumer_offsets主题.md) · 05:49
3. [P121 Kafka的__consumer_offsets主题数据查看](./p121-Kafka的__consumer_offsets主题数据查看.md) · 05:34
4. [P122 Kafka的Offset详解-生产者Offset](./p122-Kafka的Offset详解-生产者Offset.md) · 02:50
5. [P123 Kafka的Offset详解-消费者Offset](./p123-Kafka的Offset详解-消费者Offset.md) · 06:51
6. [P124 Kafka的Offset详解-生产者Offset代码演示](./p124-Kafka的Offset详解-生产者Offset代码演示.md) · 05:26
7. [P125 Kafka的Offset详解-消费者Offset代码演示默认从最新位置消费](./p125-Kafka的Offset详解-消费者Offset代码演示默认从最新位置消费.md) · 11:16
8. [P126 Kafka的Offset详解-消费者Offset代码演示默认从最新位置消费](./p126-Kafka的Offset详解-消费者Offset代码演示默认从最新位置消费.md) · 06:28
9. [P127 Kafka的Offset详解-消费者Offset代码演示总结](./p127-Kafka的Offset详解-消费者Offset代码演示总结.md) · 07:33

## 本章学习方法

1. 先把上面的流程图画在纸上，明确每节位于哪一步。
2. 读逐节正文，再用 ASR 核查老师的补充、口头提醒和演示顺序。
3. 遇到命令或代码课，必须记录“输入—配置—输出—失败原因”。
4. 学完后从头解释整章，不以“视频播放完”作为完成标准。
