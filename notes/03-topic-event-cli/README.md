# 第 3 章：Topic、Event 与命令行实操

用脚本创建 Topic，写入与读取 Event，并解决内外网连接与容器配置问题。

## 整章核心讲解

Topic 是逻辑分类，Partition 是物理分片，Event 是写入日志的一条记录。创建 Topic 时指定分区数和副本数，会直接影响吞吐、顺序范围和容错能力。

命令行 Producer/Consumer 的价值不是背脚本，而是看清最小链路：创建 Topic、写入 Event、从指定位置读取。外部连接失败时，重点检查 listener 与 advertised listener 的区别。

## 先看懂整章数据流

```mermaid
flowchart LR
    C0["Topic"]
    C1["创建主题"]
    C0 --> C1
    C2["Producer CLI"]
    C1 --> C2
    C3["Consumer CLI"]
    C2 --> C3
    C4["外部连接"]
    C3 --> C4
    C5["容器配置"]
    C4 --> C5
```

## 本章逐节目录

1. [P32 Kafka的主题Topic和事件Event](./p032-Kafka的主题Topic和事件Event.md) · 02:42
2. [P33 通过脚本工具创建主题Topic](./p033-通过脚本工具创建主题Topic.md) · 06:53
3. [P34 kafka-topics.sh脚本工具的使用](./p034-kafka-topics.sh脚本工具的使用.md) · 06:42
4. [P35 在主题Topic中写入一些事件Events](./p035-在主题Topic中写入一些事件Events.md) · 09:05
5. [P36 从主题Topic中读取事件Events](./p036-从主题Topic中读取事件Events.md) · 05:21
6. [P37 从主题Topic中读取事件Events](./p037-从主题Topic中读取事件Events.md) · 05:44
7. [P38 外部环境连接Kafka](./p038-外部环境连接Kafka.md) · 06:15
8. [P39 外部环境连不上Kafka？](./p039-外部环境连不上Kafka.md) · 07:18
9. [P40 Docker容器Kafka配置文件](./p040-Docker容器Kafka配置文件.md) · 05:01
10. [P41 Docker容器Kafka配置文件复制到Linux](./p041-Docker容器Kafka配置文件复制到Linux.md) · 05:07
11. [P42 Docker容器Kafka配置文件修改](./p042-Docker容器Kafka配置文件修改.md) · 06:43
12. [P43 Docker容器Kafka配置文件映射](./p043-Docker容器Kafka配置文件映射.md) · 03:51

## 本章学习方法

1. 先把上面的流程图画在纸上，明确每节位于哪一步。
2. 读逐节正文，再用 ASR 核查老师的补充、口头提醒和演示顺序。
3. 遇到命令或代码课，必须记录“输入—配置—输出—失败原因”。
4. 学完后从头解释整章，不以“视频播放完”作为完成标准。
