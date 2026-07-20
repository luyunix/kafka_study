# Kafka Producer App

这是可单独导入 IDEA、单独运行的生产者工程。它通过网页或 REST 接口把 JSON 对象发送到
`study.multi.events`，并在 Topic 不存在时创建 3 个分区。

页面会同时监听 `study.multi.events.receipts` 消费回执 Topic，用来实时显示哪个消费者实例
处理了消息。页面最多保留最近 200 条生产与消费记录；“清空页面记录”只清空内存展示，
不会删除 Kafka 中的消息。

## 代码怎么读

先看默认页面案例的主流程：

```text
web/EventController
        ↓
producer/EventPublisher
        ↓
Kafka: study.multi.events
        ↓
dashboard/ReceiptListener
        ↓
网页展示生产记录和消费回执
```

- `web`：页面和手动发送接口。
- `producer`：默认案例的发送入口。
- `dashboard`：保存发送结果、接收消费者回执。
- `config`：创建 Topic。
- `model`：生产消息和消费回执的数据结构。
- `course`：老师课程中的多种发送 API、自定义分区器和生产者拦截器。

日常演示只看 `web → producer → dashboard`；学到对应章节时再进入 `course`，两类代码不会
混在同一个类里。

`ProducerApiExamples` 包含 `send()`、`sendDefault()`、`Message`、`ProducerRecord`、
指定 Partition、阻塞获取结果和异步回调，分别对应 P62–P73。

## 启动

```bash
mvn spring-boot:run
```

P81–P83 切换为 Kafka 自带的 `RoundRobinPartitioner`：

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=roundrobin-producer
```

打开消息观察页面：[http://localhost:18080](http://localhost:18080)。页面支持：

- 手动输入 Key、类型、内容和分区后发送。
- 一键批量发送 1–100 条消息。
- 查看 Producer 返回的 Topic、Partition 和 Offset。
- 查看 Consumer 实例名、消费组、Partition 和 Offset。
- 根据 Event ID 对照同一条消息的生产与消费过程。

发送一条消息：

```bash
curl -X POST http://localhost:18080/api/events \
  -H 'Content-Type: application/json' \
  -d '{"key":"student-1","type":"lesson","payload":"学习消费者组"}'
```

一次发送 12 条，适合观察多个消费者之间的分区分配：

```bash
curl -X POST 'http://localhost:18080/api/events/batch?count=12'
```

指定分区：

```bash
curl -X POST http://localhost:18080/api/events \
  -H 'Content-Type: application/json' \
  -d '{"key":"fixed","type":"partition","payload":"发往分区 2","partition":2}'
```
