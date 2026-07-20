# 第 10 章：KRaft 集群实战

用 KRaft 取代 ZooKeeper，完成角色规划、Broker 配置、启动、测试与收尾。

## 整章核心讲解

KRaft 把 Kafka 元数据放入自身的 Raft 仲裁体系，由 Controller Quorum 维护，不再依赖外部 ZooKeeper。Broker 仍负责分区日志和客户端请求，控制器负责元数据与集群决策。

部署时必须明确 `process.roles`、`node.id`、controller/broker listeners、`controller.quorum.voters` 和 Cluster UUID。多节点配置只要有一个 ID、端口或地址不一致，就可能表现为进程启动了但集群无法形成。

## 先看懂整章数据流

```mermaid
flowchart LR
    C0["KRaft 架构"]
    C1["服务器规划"]
    C0 --> C1
    C2["准备 Broker"]
    C1 --> C2
    C3["配置"]
    C2 --> C3
    C4["启动"]
    C3 --> C4
    C5["测试总结"]
    C4 --> C5
```

## 本章逐节目录

1. [P148 Kafka基于KRaft方式集群架构分析](./p148-Kafka基于KRaft方式集群架构分析.md) · 04:07
2. [P149 Kafka基于KRaft方式集群架构分析](./p149-Kafka基于KRaft方式集群架构分析.md) · 04:52
3. [P150 Kafka基于KRaft方式集群服务器规划](./p150-Kafka基于KRaft方式集群服务器规划.md) · 04:08
4. [P151 Kafka基于KRaft方式集群准备Broker服务器](./p151-Kafka基于KRaft方式集群准备Broker服务器.md) · 02:57
5. [P152 Kafka基于KRaft方式集群配置Broker服务器](./p152-Kafka基于KRaft方式集群配置Broker服务器.md) · 06:39
6. [P153 Kafka基于KRaft方式集群配置Broker服务器](./p153-Kafka基于KRaft方式集群配置Broker服务器.md) · 07:16
7. [P154 Kafka基于KRaft方式集群启动Broker服务器](./p154-Kafka基于KRaft方式集群启动Broker服务器.md) · 08:25
8. [P155 Kafka基于KRaft方式集群测试](./p155-Kafka基于KRaft方式集群测试.md) · 06:45
9. [P156 Kafka基于KRaft方式集群测试与总结](./p156-Kafka基于KRaft方式集群测试与总结.md) · 03:19

## 本章学习方法

1. 先把上面的流程图画在纸上，明确每节位于哪一步。
2. 读逐节正文，再用 ASR 核查老师的补充、口头提醒和演示顺序。
3. 遇到命令或代码课，必须记录“输入—配置—输出—失败原因”。
4. 学完后从头解释整章，不以“视频播放完”作为完成标准。
