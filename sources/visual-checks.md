# 课程关键画面核对记录

以下内容由 Codex 内置浏览器直接读取播放器画面，用来补足音轨里“看这里”“按图中配置”
等依赖屏幕的信息。这里只记录学习所需事实，不保存或重新分发原课程截图。

## P57：Kafka 的几个概念快速梳理

- 画面为 IntelliJ IDEA 的 Spring Boot 测试类 `KafkaBaseApplicationTests`。
- 测试类使用 `@SpringBootTest`。
- 通过 `@Resource` 注入 `EventProducer eventProducer`。
- `test01()` 中调用 `eventProducer.sendEvent()`，用测试方法触发生产者发送。
- 项目结构同时展示 `consumer/EventConsumer`、`producer/EventProducer`、主启动类和
  `application.yml`，说明示例把生产、消费和配置分层放置。

## P86：Kafka 生产者发送消息的流程

- IDEA 左侧能看到 `ProducerConfig.java`、`CustomPartitioner`、`KafkaConfig`、
  `EventProducer.java` 和测试类，表明本节是在前面默认/轮询/自定义分区实验之后做总串联。
- 测试方法连续调用 `sendEvent8()`、`sendEvent9()`；`test10()` 使用循环多次调用
  `sendEvent10()`，用于观察多条消息经过分区策略后的实际分布。
- 画面与音轨共同说明：不能只看 `send()` 这一行，还要把序列化、分区器、拦截器、
  批次/累加器、网络发送和 Broker 确认放在一条链路里理解。

## P119：Kafka 事件消息数据的存储

- 默认日志目录示例为 `/tmp/kafka-logs`，可通过 `log.dirs` 配置。
- Kafka 事件以日志文件形式保存；同一 Topic 的不同 Partition 分目录存储。
- 分区目录命名规则为 `<topic_name>-<partition_id>`；例如含 3 个分区的 `firstTopic`
  会对应 3 个分区目录。
- 画面列出了分区目录中的典型文件：`.log` 消息数据文件、`.index` 物理位置索引、
  `.snapshot` 快照、`leader-epoch-checkpoint` 和 `partition.metadata`。
- 这些文件的角色不同，不能把“消息存储”简单理解为只有一个 `.log` 文件。

## P136：Kafka 集群架构分析

- 架构图从左到右是 Producer、Kafka Cluster、Consumer。
- Kafka Cluster 内有 Broker-0、Broker-1、Broker-2；Topic A/B/C 的 Partition
  分散在不同 Broker，并区分 Leader 与 Follower。
- Producer 的请求指向分区 Leader；消费者按 Consumer Group 组织并消费被分配的分区。
- 图底部保留集群元数据/控制层，课程随后分别讨论 ZooKeeper 和 KRaft 两种方式。

## P147：ISR、HW、LEO 的关系

- 画面用同一分区的多个副本日志对比不同阶段的 LEO 与 HW。
- Leader 先追加数据时，Leader LEO 可以领先 Follower；Follower 追赶后各自 LEO 前移。
- HW 由 ISR 中较慢副本的同步位置约束，因此“Leader 已经写入”不等于“消费者立即可见”。
- 落后过多的副本离开 ISR 后，ISR 集合变化会影响可确认水位和故障接管候选。

## P148：KRaft 方式集群架构

- 画面继续使用三 Broker、多 Topic、多 Partition/Replica、Producer 与 Consumer Group
  的总体架构，强调业务数据面并没有因为 KRaft 而消失。
- 变化集中在元数据与控制面：KRaft 通过 Kafka 自身的控制器仲裁管理集群元数据，
  不再依赖外部 ZooKeeper。
- 因此学习 KRaft 时要分开看“消息数据所在的 Broker/Partition”和“元数据仲裁角色”。

