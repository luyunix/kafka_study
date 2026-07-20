# 第 4 章：连接、管理与监控工具

认识 IDEA 插件、Offset Explorer、CMAK 与 EFAK 的用途、配置和限制。

## 整章核心讲解

IDEA 插件和 Offset Explorer 更偏开发调试；CMAK 偏集群管理；EFAK 偏监控与可视化。工具之间不是简单替代关系，而是观察面不同。

工具显示的 Topic、Partition、Consumer Group 和 Offset 都来自 Kafka 的真实状态。当工具与命令行结论冲突时，应先检查连接的集群、版本兼容性和刷新时间。

## 先看懂整章数据流

```mermaid
flowchart LR
    C0["IDEA 插件"]
    C1["Offset Explorer"]
    C0 --> C1
    C2["CMAK"]
    C1 --> C2
    C3["EFAK"]
    C2 --> C3
    C4["监控验证"]
    C3 --> C4
```

## 本章逐节目录

1. [P44 Idea之Kafka插件工具](./p044-Idea之Kafka插件工具.md) · 04:02
2. [P45 Kafka连接工具Offset Explorer](./p045-Kafka连接工具Offset-Explorer.md) · 06:50
3. [P46 Kafka连接工具CMAK](./p046-Kafka连接工具CMAK.md) · 06:43
4. [P47 Kafka连接工具CMAK配置与启动](./p047-Kafka连接工具CMAK配置与启动.md) · 08:30
5. [P48 Kafka连接工具CMAK使用限制](./p048-Kafka连接工具CMAK使用限制.md) · 08:16
6. [P49 Kafka监控工具EFAK](./p049-Kafka监控工具EFAK.md) · 08:57
7. [P50 Kafka监控工具EFAK配置](./p050-Kafka监控工具EFAK配置.md) · 10:26
8. [P51 Kafka监控工具EFAK部署运行](./p051-Kafka监控工具EFAK部署运行.md) · 09:57

## 本章学习方法

1. 先把上面的流程图画在纸上，明确每节位于哪一步。
2. 读逐节正文，再用 ASR 核查老师的补充、口头提醒和演示顺序。
3. 遇到命令或代码课，必须记录“输入—配置—输出—失败原因”。
4. 学完后从头解释整章，不以“视频播放完”作为完成标准。
