# Spring Boot + Kafka 课程配套工程

这是 B 站课程 P52–P156 的 Java 实操配套项目。Python 的
[`kafka_from_scratch`](../kafka_from_scratch/README.md) 继续用于理解底层机制；
本工程负责复现老师使用的 Java 17、Spring Boot 和 Spring for Apache Kafka 开发方式。

## 工程结构

这里只保留两个可以分别导入 IDEA、分别部署的 Maven 工程：

```text
springboot-kafka-study
├── producer-app/    # 页面、REST API、KafkaTemplate、分区器、生产者拦截器
├── consumer-app/    # @KafkaListener、消费组、ACK、批量消费、消费者拦截器
├── compose.yaml     # Kafka 3.7.0 KRaft
├── compose-cluster.yaml # 三节点 KRaft、三副本与故障切换实验
└── README.md
```

- [producer-app 使用说明](./producer-app/README.md)
- [consumer-app 使用说明](./consumer-app/README.md)

两个工程没有根 `pom.xml`，也没有共享代码依赖，避免出现父工程、旧 `src` 和两个子工程
混在一起的情况。生产者关闭 JSON 类型头，消费者明确配置自己的 `StudyEvent` 类型，因此
它们可以单独编译和部署。

### 在 IDEA 中启动

1. 分别把 `producer-app/pom.xml`、`consumer-app/pom.xml` 加载为 Maven Project。
2. 先运行一次 `KafkaProducerApplication`。
3. 为 `KafkaConsumerApplication` 创建两个 Run Configuration。
4. 第一个设置环境变量
   `INSTANCE_ID=consumer-1;CONSUMER_GROUP=study-multi-group`。
5. 第二个设置环境变量
   `INSTANCE_ID=consumer-2;CONSUMER_GROUP=study-multi-group`。
6. 在 Run Configuration 中勾选 `Allow multiple instances`，再分别启动。
7. 打开 `http://localhost:18080` 进入学习工作台；从“Kafka 实验台”进入消息收发页面。

Topic 默认有 3 个分区。两个消费者使用相同组名时，三个分区会在两个实例之间分配；
每条消息只由组内一个实例处理。消费者工程不启动 Web Server，所以多开不会发生端口冲突。

学习工作台会直接读取仓库中的 10 章 156 节 Markdown 笔记，支持课程搜索、逐节阅读、
原视频跳转和本机学习进度记录。页面地址：

```text
学习工作台：http://localhost:18080/
消息流实验：http://localhost:18080/lab.html
```

消息流实验中的左栏来自生产者 `SendResult`，右栏来自消费者处理后写入
`study.multi.events.receipts` 的回执。两边使用相同 Event ID，可以逐条核对消息从生产到
消费的完整路径。默认使用 18080，是为了避开本机已被其他容器占用的 8080。

## 技术栈

- Java 17
- Spring Boot 3.3.0
- Spring for Apache Kafka
- Maven
- Kafka 3.7.0（`compose.yaml` 使用单节点 KRaft）

## 代码与课程对应

| 课程 | 代码入口 | 学习内容 |
|---|---|---|
| P52–P61 | 两个工程的 `application.yml`、`EventPublisher`、`EventConsumer` | 工程、连接、发送、监听、earliest 与 Offset |
| P62–P73 | `producer-app/course/ProducerApiExamples` | Message、ProducerRecord、指定分区、同步/异步结果、JSON 序列化 |
| P74–P88 | `KafkaTopicConfig`、`course/KeyHashPartitioner`、`course/StudyProducerInterceptor` | Topic/副本、自定义分区、发送流程与拦截器 |
| P89–P111 | `consumer-app/course` | 手动 ACK、指定 Offset、批量消费、消费者拦截器、消息转发 |
| P112–P118 | `consumer-app` 的四个 Profile 配置 | Range、RoundRobin、Sticky、CooperativeSticky |
| P119–P147 | 配置、测试与 Python 机制包 | Offset、日志存储、集群、副本、ISR、LEO、HW |
| P148–P156 | `compose-cluster.yaml` | 三节点 KRaft、Controller Quorum、多副本与故障切换 |

## 目录速览

`producer-app` 内按职责分为 `web`、`producer`、`dashboard`、`model`、`config` 和
`course`；`consumer-app` 内分为 `consumer`、`model` 和 `course`。平时只需阅读主流程：

```text
producer-app: EventController → EventPublisher → Kafka
consumer-app: Kafka → EventConsumer → 消费回执
```

课程中较细的 API、拦截器、手动 ACK、批量监听和转发统一放在各自的 `course` 包，不和
默认页面案例混在一起。

## 运行

先启动 Kafka 3.7.0：

```bash
cd springboot-kafka-study
docker compose up -d
```

分别执行测试：

```bash
cd producer-app && mvn test
cd ../consumer-app && mvn test
```

启动生产者页面：

```bash
cd producer-app
mvn spring-boot:run
```

P81–P83 使用 Kafka 自带的轮询分区器：

```bash
cd producer-app
mvn spring-boot:run -Dspring-boot.run.profiles=roundrobin-producer
```

启动多个消费者：

```bash
cd consumer-app
INSTANCE_ID=consumer-1 CONSUMER_GROUP=study-multi-group mvn spring-boot:run
INSTANCE_ID=consumer-2 CONSUMER_GROUP=study-multi-group mvn spring-boot:run
```

手动 ACK、批量监听、固定 Offset 和转发示例默认关闭，学习对应课程时开启：

```bash
cd consumer-app
mvn spring-boot:run -Dspring-boot.run.profiles=course-extras
```

连接其他 Kafka：

```bash
cd producer-app
KAFKA_BOOTSTRAP_SERVERS=192.168.11.128:9092 mvn spring-boot:run
```

## 四种消费者分区分配策略

在 `consumer-app` 中切换四个 Spring Profile：

```bash
cd consumer-app
mvn spring-boot:run -Dspring-boot.run.profiles=range
mvn spring-boot:run -Dspring-boot.run.profiles=roundrobin
mvn spring-boot:run -Dspring-boot.run.profiles=sticky
mvn spring-boot:run -Dspring-boot.run.profiles=cooperative-sticky
```

它们对应下面的 `partition.assignment.strategy` 配置：

```yaml
spring:
  kafka:
    consumer:
      properties:
        partition.assignment.strategy: org.apache.kafka.clients.consumer.RangeAssignor
        # partition.assignment.strategy: org.apache.kafka.clients.consumer.RoundRobinAssignor
        # partition.assignment.strategy: org.apache.kafka.clients.consumer.StickyAssignor
        # partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

关键区别：

- Range：按 Topic 分配连续区间，多个 Topic 时可能不够均衡。
- RoundRobin：把订阅的分区轮询分给 Consumer。
- Sticky：均衡的同时尽量保留上次分配，减少迁移。
- CooperativeSticky：增量协作重平衡，避免所有 Consumer 同时停下来交还全部分区。

四个 Profile 都会监听 10 分区的 `study.events.assignment`，并在单进程中启动 3 个
Consumer 线程，从日志中可以直接核对课程里的分区结果。

## 三节点 KRaft 集群

单节点练习结束后，先停止 `compose.yaml` 中的 Kafka，再启动三节点集群：

```bash
docker compose down
docker compose -f compose-cluster.yaml up -d
```

Spring Boot 连接三个 Broker：

```bash
KAFKA_BOOTSTRAP_SERVERS=localhost:19092,localhost:29092,localhost:39092 \
  mvn spring-boot:run
```

完整创建 Topic、查看 ISR 和停止 Broker 的命令见
[`notes/00-practical-command-reference.md`](../notes/00-practical-command-reference.md)。

## Offset 必须这样理解

`auto-offset-reset: earliest` 只在当前 Consumer Group 没有有效已提交 Offset 时生效。
已经提交过进度的组会继续从提交位置消费；若要重新演示，可更换 `groupId`，或显式重置该组
的 Offset。手动 ACK 示例会在业务处理完成后调用 `acknowledge()`。

## 两套练习如何配合

1. 先运行 `producer-app` 和多个 `consumer-app`，直观看到消息分区与消费组分配。
2. 阅读两个工程的 `course` 包，学习手动 ACK、批量消费、拦截器和指定 Offset。
3. 运行 Python 练习包，观察分区、消费组、Offset、ISR/HW 的最小实现。
4. 回到逐课讲义，用带时间戳 ASR 核查老师的具体演示顺序。
