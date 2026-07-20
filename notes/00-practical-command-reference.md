# Kafka 3.7.0 实操命令校正版

这份速查表把课程画面中最容易被 ASR 识别错的命令恢复为可直接执行的形式。命令默认在
Kafka 安装目录执行；使用 Docker 时，可先进入容器：

```bash
docker exec -it kafka-study bash
cd /opt/kafka
```

## P23–P26：KRaft 初始化与启动

生成 Cluster ID：

```bash
bin/kafka-storage.sh random-uuid
```

格式化存储目录。`<cluster-id>` 替换为上一步输出：

```bash
bin/kafka-storage.sh format \
  --cluster-id <cluster-id> \
  --config config/kraft/server.properties
```

启动和停止：

```bash
bin/kafka-server-start.sh -daemon config/kraft/server.properties
bin/kafka-server-stop.sh
```

## P33–P34：Topic 的增删查

创建 3 分区、1 副本的 Topic：

```bash
bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --topic helloTopic \
  --partitions 3 \
  --replication-factor 1
```

查看列表和详情：

```bash
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic helloTopic
```

删除 Topic：

```bash
bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --delete \
  --topic helloTopic
```

## P35–P37：命令行生产与消费

发送消息：

```bash
bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic helloTopic
```

从当前最新位置开始消费：

```bash
bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic helloTopic
```

从最早位置读取已有消息：

```bash
bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic helloTopic \
  --from-beginning
```

## P38–P43：外部客户端连接

`listeners` 是 Broker 实际绑定的监听地址，`advertised.listeners` 是返回给客户端的可达地址：

```properties
listeners=PLAINTEXT://0.0.0.0:9092
advertised.listeners=PLAINTEXT://192.168.1.100:9092
```

远程客户端不能使用 Broker 返回的容器名或 `localhost`。修改后必须重启 Broker。

## P60–P61、P120–P127：消费组与 Offset

查看消费组：

```bash
bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --group helloGroup
```

输出中的关键列：

- `CURRENT-OFFSET`：消费组下一次要读取的位置。
- `LOG-END-OFFSET`：分区日志末端位置。
- `LAG`：尚未消费的消息数，通常等于两者之差。

重置前必须停止该消费组中的消费者。先预览，再执行：

```bash
bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group helloGroup \
  --topic helloTopic \
  --reset-offsets \
  --to-earliest
```

```bash
bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group helloGroup \
  --topic helloTopic \
  --reset-offsets \
  --to-earliest \
  --execute
```

重置到最新位置：

```bash
bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group helloGroup \
  --topic helloTopic \
  --reset-offsets \
  --to-latest \
  --execute
```

`auto-offset-reset=earliest/latest/none` 只在消费组没有有效已提交 Offset 时生效；已有进度的
消费组会继续从已提交位置读取。

## P119：日志目录

查看 Broker 的日志目录配置：

```bash
grep '^log.dirs' config/kraft/server.properties
```

一个分区对应一个 `<topic>-<partition>` 目录。常见文件包括 `.log`、`.index`、
`.timeindex`、`leader-epoch-checkpoint` 和 `partition.metadata`。

## P128–P156：三节点 KRaft 集群

本仓库提供三节点配置：

```bash
cd springboot-kafka-study
docker compose -f compose-cluster.yaml up -d
```

客户端连接地址：

```text
localhost:19092,localhost:29092,localhost:39092
```

创建三副本 Topic：

```bash
docker exec kafka-study-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create \
  --topic replicated-events \
  --partitions 3 \
  --replication-factor 3
```

查看 Leader、Replicas 和 ISR：

```bash
docker exec kafka-study-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe \
  --topic replicated-events
```

停止一个 Broker 后再次查看，可观察 Leader 切换和 ISR 变化：

```bash
docker stop kafka-study-1
docker start kafka-study-1
```
