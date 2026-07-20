# Kafka Consumer App

这是可单独导入 IDEA、单独运行的消费者工程。它没有 Web Server，因此多开实例不会发生
端口冲突。每处理一条 `study.multi.events` 消息，它会向
`study.multi.events.receipts` 发送一条消费回执，供生产者工程的观察页面显示；回执包含
实例名、消费组、原消息的 Partition 和 Offset。

## 代码怎么读

默认案例只有一条主线：

```text
Kafka: study.multi.events
        ↓
consumer/EventConsumer
        ↓
Kafka: study.multi.events.receipts
        ↓
生产者网页显示消费结果
```

- `consumer`：默认消费监听器，也是多实例演示的核心。
- `model`：收到的事件和发回的消费回执。
- `course`：老师课程中的手动 ACK、批量消费、固定 Offset、消费者拦截器和消息转发。

`course` 中的额外监听器默认不启动，只有启用 `course-extras` Profile 时才参与消费，避免
学习主流程时被高级示例干扰。

在两个终端中使用相同消费组、不同实例名启动：

```bash
INSTANCE_ID=consumer-1 CONSUMER_GROUP=study-multi-group mvn spring-boot:run
```

```bash
INSTANCE_ID=consumer-2 CONSUMER_GROUP=study-multi-group mvn spring-boot:run
```

两个实例属于同一个消费组，Topic 的 3 个分区只会由其中一个实例负责，每条消息也只会被
组内一个实例处理。增加或关闭实例时会触发 Rebalance。

如果希望两个实例各自收到全部消息，请使用不同组名：

```bash
INSTANCE_ID=consumer-a CONSUMER_GROUP=group-a mvn spring-boot:run
INSTANCE_ID=consumer-b CONSUMER_GROUP=group-b mvn spring-boot:run
```

单个进程内部也能创建多个 Consumer 线程：

```bash
INSTANCE_ID=consumer-1 CONSUMER_CONCURRENCY=3 mvn spring-boot:run
```

观察页面位于生产者工程：[http://localhost:18080](http://localhost:18080)。

学习课程中的额外消费方式：

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=course-extras
```
