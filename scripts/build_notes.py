#!/usr/bin/env python3
"""Build the Kafka study site from the browser catalog and local ASR JSON."""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Chapter:
    number: int
    slug: str
    title: str
    start: int
    end: int
    goal: str
    flow: tuple[str, ...]


CHAPTERS = (
    Chapter(1, "course-overview", "课程导学与 Kafka 身世", 1, 7,
            "先回答 Kafka 是什么、谁在用、为什么诞生，以及版本如何演进。",
            ("课程目标", "Kafka 定义", "行业使用", "起源与命名", "版本演进")),
    Chapter(2, "environment-deployment", "环境准备与三种部署方式", 8, 31,
            "完成 JDK、Kafka、ZooKeeper、KRaft 与 Docker 环境的安装、启动和验证。",
            ("JDK 17", "Kafka 安装", "ZooKeeper", "KRaft", "Docker")),
    Chapter(3, "topic-event-cli", "Topic、Event 与命令行实操", 32, 43,
            "用脚本创建 Topic，写入与读取 Event，并解决内外网连接与容器配置问题。",
            ("Topic", "创建主题", "Producer CLI", "Consumer CLI", "外部连接", "容器配置")),
    Chapter(4, "tools-monitoring", "连接、管理与监控工具", 44, 51,
            "认识 IDEA 插件、Offset Explorer、CMAK 与 EFAK 的用途、配置和限制。",
            ("IDEA 插件", "Offset Explorer", "CMAK", "EFAK", "监控验证")),
    Chapter(5, "spring-boot-basics", "Spring Boot 集成 Kafka", 52, 73,
            "搭建 Spring Boot 工程，掌握 KafkaTemplate、消息发送、监听消费、偏移量和对象序列化。",
            ("工程配置", "发送消息", "监听消费", "Offset", "对象消息", "发送结果")),
    Chapter(6, "producer-internals", "副本、分区策略与生产者链路", 74, 88,
            "理解副本与分区，验证默认、轮询和自定义分区策略，并串起生产者发送流程与拦截器。",
            ("Replica", "Topic 分区", "默认分区", "RoundRobin", "自定义策略", "ProducerInterceptor")),
    Chapter(7, "consumer-internals", "消费者开发与分区分配", 89, 118,
            "掌握 ConsumerRecord、监听器、手动确认、指定位置消费、批量消费、拦截器和分区分配策略。",
            ("消息体/头", "手动确认", "指定 Offset", "批量消费", "ConsumerInterceptor", "Assignor")),
    Chapter(8, "storage-offsets", "消息存储与 Offset", 119, 127,
            "理解日志文件、__consumer_offsets、生产者 Offset 与消费者 Offset 的含义和代码表现。",
            ("日志存储", "__consumer_offsets", "Producer Offset", "Consumer Offset", "重启验证")),
    Chapter(9, "cluster-replication", "集群、副本机制与核心水位", 128, 147,
            "搭建三节点集群，理解 Broker、Partition、Replica、ISR、LEO 与 HW 的协作关系。",
            ("三节点规划", "集群配置", "收发验证", "Leader/Follower", "ISR", "LEO/HW")),
    Chapter(10, "kraft-cluster", "KRaft 集群实战", 148, 156,
            "用 KRaft 取代 ZooKeeper，完成角色规划、Broker 配置、启动、测试与收尾。",
            ("KRaft 架构", "服务器规划", "准备 Broker", "配置", "启动", "测试总结")),
)


CHAPTER_EXPLANATIONS = {
    1: (
        "Kafka 不是传统意义上只负责临时排队的内存队列。它把业务事件按 Topic 分类、按 "
        "Partition 追加到持久化日志中，让多个生产者和消费者围绕同一份事件流解耦协作。",
        "这套系统最初由 LinkedIn 为大规模活动流和运营数据管道开发，后来进入 Apache。"
        "理解它的起源很重要：高吞吐、可扩展、可重放和持久化，都是围绕真实数据管道压力形成的。",
    ),
    2: (
        "课程同时讲 ZooKeeper、KRaft 和 Docker，是为了让你区分 Kafka 的业务进程、"
        "元数据协调方式和运行载体。ZooKeeper 与 KRaft 是控制面选择；Docker 是部署方式。",
        "所有安装课都要形成同一个闭环：版本满足要求，配置文件指向正确路径，相关端口没有冲突，"
        "服务进程成功启动，最后用日志或命令验证 Broker 确实可用。",
    ),
    3: (
        "Topic 是逻辑分类，Partition 是物理分片，Event 是写入日志的一条记录。创建 Topic 时"
        "指定分区数和副本数，会直接影响吞吐、顺序范围和容错能力。",
        "命令行 Producer/Consumer 的价值不是背脚本，而是看清最小链路：创建 Topic、写入 Event、"
        "从指定位置读取。外部连接失败时，重点检查 listener 与 advertised listener 的区别。",
    ),
    4: (
        "IDEA 插件和 Offset Explorer 更偏开发调试；CMAK 偏集群管理；EFAK 偏监控与可视化。"
        "工具之间不是简单替代关系，而是观察面不同。",
        "工具显示的 Topic、Partition、Consumer Group 和 Offset 都来自 Kafka 的真实状态。"
        "当工具与命令行结论冲突时，应先检查连接的集群、版本兼容性和刷新时间。",
    ),
    5: (
        "Spring Boot 自动配置会根据 `bootstrap-servers`、序列化器和监听器配置创建常用组件。"
        "`KafkaTemplate` 负责发送，`@KafkaListener` 负责监听消费，但底层仍遵守 Kafka 原生语义。",
        "对象消息必须让发送端 Serializer 与接收端 Deserializer 对得上；Offset 策略只在没有有效"
        "已提交进度时决定从 earliest 还是 latest 开始，不能把它当成每次启动都强制重放的开关。",
    ),
    6: (
        "一个 Topic 可以有多个 Partition，每个 Partition 又可以有多个 Replica。分区提供并行度，"
        "副本提供容错；两者解决的是不同问题。",
        "生产者先确定 Topic，再根据显式 Partition、key 哈希或无 key 策略选择分区，然后经过"
        "序列化、拦截器、批次累积和网络发送。分区策略会影响同 key 顺序、负载均衡和批处理效率。",
    ),
    7: (
        "消费者组通过“组内分摊、组间广播”实现扩展：同组内一个 Partition 同一时刻只属于一个"
        "Consumer，不同组可以各自完整消费同一 Topic。",
        "手动确认控制的是何时提交消费进度；指定 Topic/Partition/Offset 控制的是从哪里读取；"
        "批量消费控制一次交给业务多少记录；Assignor 控制重平衡后分区交给谁。四者不能混为一谈。",
    ),
    8: (
        "Kafka 把每个 Topic-Partition 保存成独立的追加日志目录，`.log` 保存记录，索引文件帮助"
        "按 Offset/时间定位，检查点与元数据文件支持恢复和副本管理。",
        "生产者看到的 Offset 是 Broker 为新记录分配的位置；消费者提交的 Offset 通常表示下一条"
        "要读的位置。`__consumer_offsets` 保存的是消费者组进度和相关协调数据，不是业务消息本身。",
    ),
    9: (
        "集群把 Partition Leader 分散到多个 Broker。Producer 和 Consumer 主要与 Leader 交互，"
        "Follower 持续复制日志；Leader 失效后，控制器从合适的副本中完成新的 Leader 选举。",
        "LEO 是每个副本自己的日志末端，ISR 是同步状态合格的副本集合，HW 是消费者可见的确认边界。"
        "Leader LEO 前进不代表 HW 立即前进，因为可靠性取决于 ISR 中副本的同步情况。",
    ),
    10: (
        "KRaft 把 Kafka 元数据放入自身的 Raft 仲裁体系，由 Controller Quorum 维护，不再依赖"
        "外部 ZooKeeper。Broker 仍负责分区日志和客户端请求，控制器负责元数据与集群决策。",
        "部署时必须明确 `process.roles`、`node.id`、controller/broker listeners、"
        "`controller.quorum.voters` 和 Cluster UUID。多节点配置只要有一个 ID、端口或地址不一致，"
        "就可能表现为进程启动了但集群无法形成。",
    ),
}


VISUAL_NOTES = {
    57: (
        "IDEA 画面显示 `KafkaBaseApplicationTests` 使用 `@SpringBootTest`，通过 `@Resource` "
        "注入 `EventProducer`，并在 `test01()` 中调用 `eventProducer.sendEvent()`；项目按 producer、"
        "consumer、配置和启动类分层。"
    ),
    86: (
        "画面同时展示 `ProducerConfig`、`CustomPartitioner`、`KafkaConfig`、`EventProducer` 和"
        "多组测试方法；`test10()` 循环发送多条消息，用实际分区结果验证完整生产者链路。"
    ),
    119: (
        "课件明确展示 `/tmp/kafka-logs`、`<topic_name>-<partition_id>` 目录规则，以及 `.log`、"
        "`.index`、`.snapshot`、`leader-epoch-checkpoint`、`partition.metadata` 等文件。"
    ),
    136: (
        "架构图包含 Producer、三个 Broker、多个 Topic/Partition 的 Leader/Follower，以及两个"
        "Consumer Group；读写请求围绕分区 Leader，Follower 负责副本同步。"
    ),
    147: (
        "课件用多个副本日志的连续状态图对比 ISR、HW 与各副本 LEO，强调 Leader 已写入和"
        "消费者可见之间还隔着副本同步与高水位推进。"
    ),
    148: (
        "KRaft 架构图保留 Broker、Partition/Replica、Producer 与 Consumer Group 的数据面，"
        "把变化集中在 Kafka 自身的控制器仲裁和元数据管理。"
    ),
}


EDITOR_NOTES = {
    55: (
        "这节的闭环是：先启动 ZooKeeper 与 Kafka；第一次由 Windows/Spring Boot 连接时故意观察连接失败；"
        "随后修改 `server.properties` 中的 `listeners` 与 `advertised.listeners`，让 Broker 绑定监听地址并"
        "向外公布客户端真正可达的 IP；重启 Kafka 后再次发送 Event，最后在 IDEA Kafka 插件中看到"
        " `helloTopic` 的消息数量增加。"
    ),
    86: (
        "生产者发送链路可以先记成：ProducerRecord → ProducerInterceptor → key/value Serializer → "
        "Partitioner → RecordAccumulator 批次 → Sender 网络线程 → Broker。老师在源码中打断点逐步验证；"
        "默认可以没有拦截器，但序列化和分区选择一定会发生。"
    ),
    119: (
        "Kafka 按 `log.dirs` 保存数据，默认示例目录是 `/tmp/kafka-logs`。每个 Topic-Partition 对应"
        " `<topic>-<partition>` 目录；`.log` 保存记录，`.index` 按 Offset 定位，`.timeindex` 按时间定位，"
        "快照和 `leader-epoch-checkpoint` 用于恢复与 Leader Epoch 信息，`partition.metadata` 保存分区元数据。"
    ),
    140: (
        "一个 Partition 的副本中只有 Leader 负责客户端读写，Follower 复制数据。Leader 所在 Broker 宕机后，"
        "Kafka 会从合格的同步副本中选出新 Leader。`kafka-topics.sh --describe` 的结果要分别看 Partition、"
        "Leader、Replicas 和 ISR，不能只看副本总数。"
    ),
    147: (
        "LEO 是每个副本下一条记录的位置；HW 是已经确认、消费者可见的边界。Leader 新写入数据时自己的 LEO"
        "先前进，Follower 逐步复制；只有同步条件满足后 HW 才前进，因此 Leader LEO 和 HW 可以暂时不同。"
    ),
    148: (
        "这一节先复盘 ZooKeeper 架构：Broker 中选出 Controller，Controller 把 Topic、Partition 等元数据"
        "写入 ZooKeeper。后续 KRaft 的变化点是把这套元数据控制面迁入 Kafka 自身的 Controller Quorum；"
        "Producer、Consumer、Broker 分区日志等数据面仍然存在。"
    ),
}


REPLACEMENTS = (
    (r"KaftKa|KafKa|KafkaKafka|卡夫卡|卡附卡|卡不卡|卡FU卡|卡fu卡|卡布卡|卡帕卡|卡巴马|Karmuka", "Kafka"),
    (r"Kafka金角", "Kafka 精讲"),
    (r"消息中间键", "消息中间件"),
    (r"消息对列|消息兑炼|消息兑列|消息队列列", "消息队列"),
    (r"消益服务器|消息服务系", "消息服务器"),
    (r"开放元代码", "开放源代码"),
    (r"日制", "日志"),
    (r"处处都有Kafka的中影", "处处都有 Kafka 的身影"),
    (r"亏借一般|窥借一般", "可见一斑"),
    (r"升值加薪", "升职加薪"),
    (r"这的课程", "这套课程"),
    (r"加法后端|加碼后端|加法开发|高级加法", "Java 后端"),
    (r"冷衣公司|冷音公司|哪一公司|理工师", "LinkedIn 公司"),
    (r"ArktivMQ|Arktiv MQ|阿克提夫MQ", "ActiveMQ"),
    (r"Skala", "Scala"),
    (r"GMS规范", "JMS 规范"),
    (r"Zooke[e]?per|Zookeeper|RooKeeper|Rookeeper|rookable|RU-PIPER|RUQ(?:able|方式)?", "ZooKeeper"),
    (r"SpringBoot", "Spring Boot"),
    (r"实名步头|史布内布特|史布蕊布特|史布蕊|史布", "Spring Boot"),
    (r"Torbic|托米缸|托米管|托迪克|托密|托幣格|托幣隔|托幣个|托比克|托皮克|托皮革|托皮卡|托壁壳|托壁口|托壁鸽|托壁格|托米格|托密格|托米可|托幣的|托米克|托幣|托密克|拖屁", "Topic"),
    (r"爬地形|帕地形|趴地形|Party型|体育", "Partition"),
    (r"扛凶码|扛胸码|扛凶马|扛胸", "Consumer"),
    (r"偏一辆|偏一位置|片一位置|片一条|片量|偏一量", "偏移量"),
    (r"OffsetAgespro|Offset X Pro|OffsetAgesPro", "Offset Explorer"),
    (r"Gatehub|GateHop|GateHUB", "GitHub"),
    (r"RELAYS|Rinless", "Releases"),
    (r"Locker容器", "Docker 容器"),
    (r"Maple进项目|Maphing", "Maven 项目"),
    (r"GDK", "JDK"),
    (r"YM格式|YMO格式", "YAML 格式"),
    (r"点YMO|点YM", "`.yml`"),
    (r"不丢手", "Producer"),
    (r"生成者", "生产者"),
    (r"RESORCE", "@Resource"),
    (r"AUTOVAL", "@Autowired"),
    (r"YAKA党什么ONLTISON", "jakarta.annotation"),
    (r"JABACS", "javax"),
    (r"GlubID|Glub ID|固谱ID|固谱", "group id"),
    (r"卡不卡利斯等|Kafka利斯等", "KafkaListener"),
    (r"Inlayser", "Initializr"),
    (r"热布术", "DevTools"),
    (r"能不可|Lambook|蓝book", "Lombok"),
    (r"使军母", "Streams"),
    (r"新量消费|批调消息消费", "批量消费"),
    (r"接力器", "监听器"),
    (r"10倍容器", "IoC 容器"),
    (r"注入掉", "注释掉"),
    (r"注决", "注解"),
    (r"日子", "日志"),
    (r"墨瑞", "默认"),
    (r"当鸡|固档", "宕机"),
    (r"负贝|负本", "副本"),
    (r"重副本", "从副本"),
    (r"Liedr|Needle", "Leader"),
    (r"L1U", "LEO"),
    (r"Block\s*AD|Brock\s*AD", "Broker ID"),
    (r"Blocker|博可", "Broker"),
    (r"Replic(?!a)", "Replica"),
    (r"concumer", "Consumer"),
    (r"concule", "console"),
    (r"counter\s*c", "Ctrl+C"),
    (r"元素具", "元数据"),
    (r"密例", "命令"),
    (r"秘方法", "测试方法"),
    (r"秘密", "命令"),
    (r"客间", "课件"),
    (r"Karabka", "Kafka"),
    (r"PVT", "PPT"),
    (r"目录节绩", "目录节点"),
    (r"主控器", "控制器"),
    (r"辙者", "生产者"),
    (r"分区雷", "分区 0"),
    (r"一个组织本，两个组织本", "一个主副本，两个从副本"),
    (r"组织本", "副本"),
    (r"消息室", "消息 4"),
    (r"代码机", "代码"),
    (r"相于", "相当于"),
    (r"爆错", "报错"),
    (r"算新|删新", "刷新"),
    (r"集权", "集群"),
    (r"空气节点|可凶的节点", "控制器节点"),
    (r"可凶吗|可凶", "Consumer"),
    (r"一字", "日志"),
    (r"Kraft", "KRaft"),
    (r"福奇地址", "Broker 地址"),
    (r"最终一乱的就是", "最常用的就是"),
    (r"当基础版|当基础|基础档", "宕机"),
    (r"故障版", "故障"),
    (r"副本档了", "副本宕机了"),
    (r"负的独和写", "负责读和写"),
    (r"不负的独和写", "不负责读和写"),
    (r"只负的数据负质", "只负责数据复制"),
    (r"P雷", "P0"),
    (r"Discrable", "describe"),
    (r"直系", "执行"),
    (r"B部路", "bin 目录"),
    (r"各数", "个数"),
    (r"博洛克", "Broker"),
    (r"AS2", "ISR"),
    (r"节的个数", "节点个数"),
    (r"RooKeyboard", "ZooKeeper"),
    (r"Lidlis", "Linux"),
    (r"并不如下|必步下|并布下面", "bin 目录下"),
    (r"Serva", "server"),
    (r"server\.pom|serv\.pom", "server.properties"),
    (r"Payment文件", "properties 文件"),
    (r"Wanglin", "Warning"),
    (r"消息福气|福气", "Broker"),
    (r"发酵译", "发送消息"),
    (r"配置为键", "配置文件"),
    (r"抗费格", "config"),
    (r"木下|木路|目下", "目录下"),
    (r"注射掉", "注释掉"),
    (r"多颗方式|多扣子", "Docker 方式"),
    (r"out of wests", "advertised.listeners"),
    (r"listen就这个", "listeners"),
    (r"哈漏", "hello"),
    (r"消息发生了流程|生产者发生了消息", "生产者发送消息的流程"),
    (r"蓝结器|蓝结", "拦截器"),
    (r"训练化器|训练画器|训练化|训练画", "序列化器"),
    (r"使菌", "String"),
    (r"party行", "Partition"),
    (r"原类码", "源码"),
    (r"sync方法", "send 方法"),
    (r"莫名|莫认", "默认"),
    (r"angent", "onSend"),
    (r"paint追加", "append 追加"),
    (r"Kafka-Logers", "kafka-logs"),
    (r"LogersDNR", "log.dirs"),
    (r"Logers", "logs"),
    (r"日字", "日志"),
    (r"海调", "海量"),
    (r"命令规范", "命名规范"),
    (r"脱笔可|托笔可|托笔个|拖地个", "Topic"),
    (r"nougat", "0"),
    (r"分件甲|分区甲", "分区目录"),
    (r"分件", "文件"),
    (r"纯维本", "纯文本"),
    (r"锁影", "索引"),
    (r"offsite", "Offset"),
    (r"偏一亮", "偏移量"),
    (r"time intel", "timeindex"),
    (r"intel", "index"),
    (r"数据户", "数据库"),
    (r"epoc", "epoch"),
    (r"骑士篇一页", "起始偏移量"),
    (r"lead节点", "Leader 节点"),
    (r"lead还有副文", "Leader 和副本"),
    (r"元素去信息", "元数据信息"),
    (r"partici， this is the middle data", "partition.metadata"),
    (r"文件讲", "文件夹"),
    (r"一电", "IDEA"),
    (r"圣的方法|圣的底附的方法", "send 方法"),
    (r"OSR", "Offset"),
    (r"onlist|费找", "earliest"),
    (r"BootServ", "bootstrap-servers"),
    (r"实物论", "spring"),
    (r"\bcomplete\b", "@Component"),
    (r"Bluemoot", "Spring Boot"),
    (r"拜起", "batch"),
    (r"CMIC|C麦克", "CMAK"),
    (r"如KEEPLE|如KEEPER|如Keeper", "ZooKeeper"),
    (r"Coref|KORUM|KORab|Korab|Korrupt|Corona", "KRaft"),
    (r"抗补部路", "conf 目录"),
    (r"Application\.Component", "application.conf"),
    (r"\bVAM\b", "vim"),
    (r"重视调", "注释掉"),
    (r"GTK11", "JDK 11"),
    (r"牛轮器", "浏览器"),
    (r"classit", "cluster"),
    (r"Z补压缩包", "zip 压缩包"),
    (r"topic", "Topic"),
    (r"partition", "Partition"),
    (r"offset", "Offset"),
    (r"broker", "Broker"),
    (r"producer", "Producer"),
    (r"consumer", "Consumer"),
)


GLOSSARY = {
    "Kafka": "Apache 开源的分布式事件流平台，常用于高吞吐消息传递、数据管道和流处理。",
    "Topic": "事件的逻辑分类。生产者向 Topic 写数据，消费者从 Topic 读取数据。",
    "Event": "Kafka 中的一条业务记录，通常由 key、value、时间戳和 headers 等组成。",
    "Partition": "Topic 的物理分片，是 Kafka 并行度、顺序性和扩展能力的基本单位。",
    "Replica": "Partition 的副本。Leader 对外服务，Follower 负责同步并提供故障接管基础。",
    "Broker": "运行 Kafka 服务的节点；多个 Broker 组成 Kafka 集群。",
    "Producer": "向 Kafka Topic 发送事件的客户端。",
    "Consumer": "从 Kafka Topic 拉取并处理事件的客户端。",
    "Consumer Group": "协作消费同一 Topic 的消费者集合；同组内一个分区同一时刻只交给一个消费者。",
    "Offset": "事件在 Partition 中的位置编号，也是消费者记录消费进度的依据。",
    "ZooKeeper": "旧版 Kafka 用于集群元数据和控制器协调的外部服务。",
    "KRaft": "Kafka 自带的 Raft 元数据仲裁模式，可在新架构中摆脱 ZooKeeper。",
    "KafkaTemplate": "Spring for Apache Kafka 提供的高层发送 API。",
    "ProducerRecord": "Kafka 原生生产者消息对象，可明确 Topic、Partition、key、value 和 headers。",
    "ConsumerRecord": "Kafka 原生消费者收到的记录对象，包含消息体、Topic、Partition、Offset 等信息。",
    "ISR": "与 Leader 保持足够同步的副本集合，是副本选举和可靠性判断的重要依据。",
    "LEO": "Log End Offset，某个副本日志末端下一条消息的位置。",
    "HW": "High Watermark，高水位；消费者只能读取 HW 之前已确认的消息。",
    "RangeAssignor": "按 Topic 分别对分区做连续区间分配的消费者分区策略。",
    "RoundRobinAssignor": "把所有订阅分区轮询分配给消费者的策略。",
    "StickyAssignor": "尽量均衡且减少重平衡时分区迁移的策略。",
    "CooperativeStickyAssignor": "采用协作式增量重平衡的粘性分配策略，减少全量停止。",
    "CMAK": "Kafka Manager 的社区延续版本，用于集群管理；不同 Kafka 版本存在兼容边界。",
    "EFAK": "Kafka Eagle 的后续名称之一，用于 Kafka 集群监控与可视化管理。",
}


def chapter_for(number: int) -> Chapter:
    return next(c for c in CHAPTERS if c.start <= number <= c.end)


def seconds(value: str) -> int:
    minutes, secs = map(int, value.split(":"))
    return minutes * 60 + secs


def clock(value: float) -> str:
    value = max(0, int(value))
    return f"{value // 60:02d}:{value % 60:02d}"


def slugify(title: str) -> str:
    title = re.sub(r"[\\/:*?\"<>|（）()【】\[\]，,：:？?！!]", "-", title)
    title = re.sub(r"\s+", "-", title.strip())
    title = re.sub(r"-+", "-", title).strip("-")
    return title or "lesson"


def clean_text(text: str) -> str:
    text = text.strip()
    for pattern, replacement in REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    text = text.replace(",", "，").replace("!", "！").replace("?", "？")
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"，{2,}", "，", text)
    # Whisper occasionally gets stuck repeating one short phrase many times.
    # Keep normal spoken repetition, but collapse three or more identical runs.
    for _ in range(3):
        text = re.sub(r"(.{4,30}?)(?:，?\1){2,}", r"\1", text)
        text = re.sub(r"((?:[^，。！？]{2,24})[，。！？])(?:\1){2,}", r"\1", text)
    if text and text[-1] not in "。！？；：":
        text += "。"
    return text


def group_segments(segments: list[dict]) -> list[dict]:
    groups: list[dict] = []
    current: list[dict] = []
    char_count = 0
    for segment in segments:
        current.append(segment)
        char_count += len(segment["text"])
        span = float(current[-1]["end"]) - float(current[0]["start"])
        if char_count >= 260 or span >= 75:
            groups.append({
                "start": current[0]["start"],
                "end": current[-1]["end"],
                "text": clean_text("".join(item["text"] for item in current)),
            })
            current = []
            char_count = 0
    if current:
        groups.append({
            "start": current[0]["start"],
            "end": current[-1]["end"],
            "text": clean_text("".join(item["text"] for item in current)),
        })
    return groups


def lesson_kind(title: str) -> str:
    if any(k in title for k in ("安装", "下载", "启动", "关闭", "配置", "部署", "搭建", "准备")):
        return "operation"
    if "源码分析" in title:
        return "source"
    if any(k in title for k in ("测试", "验证", "演示", "查看")):
        return "verification"
    if any(k in title for k in ("发送", "读取", "接收", "消费", "转发")):
        return "message-flow"
    if any(k in title for k in ("分区策略", "Assignor", "分配方式")):
        return "strategy"
    if any(k in title for k in ("Offset", "偏移量", "LEO", "HW", "ISR")):
        return "offset"
    if any(k in title for k in ("概述", "介绍", "概念", "什么", "起源", "由来", "历程", "版本", "架构", "机制", "存储")):
        return "concept"
    return "lesson"


KIND_CONTENT = {
    "operation": {
        "intro": "这是一节动手课。不要只记命令，要把前置条件、操作步骤、关键参数和成功信号连成一条验证链。",
        "flow": ("确认前置条件", "执行安装/配置", "启动或应用", "观察输出", "排查失败"),
        "pitfall": "只照抄命令而不核对当前目录、版本、端口和配置文件路径，最容易造成“命令没报错但服务不可用”。",
    },
    "source": {
        "intro": "这节从源码解释表面行为。阅读时先记住调用入口，再追踪条件分支、默认实现和最终选择结果。",
        "flow": ("找到入口", "读取关键参数", "进入条件分支", "选择实现", "用测试验证"),
        "pitfall": "源码结论必须与当前 Kafka/Spring Kafka 版本对应；不要把旧版本实现当成永远不变的规则。",
    },
    "verification": {
        "intro": "这节用实验验证前面的配置或机制。重点是记录输入、预期、实际输出，以及两者不一致时如何定位。",
        "flow": ("准备测试条件", "执行操作", "读取结果", "对照预期", "形成结论"),
        "pitfall": "测试前残留的 Topic、Offset、缓存或旧进程会污染结果；每次实验都要先确认初始状态。",
    },
    "message-flow": {
        "intro": "这节位于消息链路上。要顺着“发送端—Broker—分区日志—消费端”看数据和元数据怎样流动。",
        "flow": ("构造消息", "选择 Topic/Partition", "写入 Broker", "记录 Offset", "消费者处理"),
        "pitfall": "能发送成功不代表业务处理成功；序列化、分区、确认机制和消费进度需要分别观察。",
    },
    "strategy": {
        "intro": "这节讨论分区选择或分区分配策略。先明确输入集合，再按算法逐步计算，最后检查均衡性和稳定性。",
        "flow": ("列出参与者", "列出分区", "应用策略", "得到分配结果", "比较优缺点"),
        "pitfall": "策略名称相似，但目标不同：生产者决定消息写到哪个分区，消费者 Assignor 决定分区交给哪个消费者。",
    },
    "offset": {
        "intro": "这节围绕位置与进度展开。一定要区分日志中的位置、各副本的末端位置、可见水位和消费者提交进度。",
        "flow": ("消息写入", "形成日志位置", "副本同步", "更新可见水位", "记录消费进度"),
        "pitfall": "“Offset”不是一个全局数字；它必须放在具体 Topic、Partition、消费者组或副本语境中解释。",
    },
    "concept": {
        "intro": "这是一节概念课。老师先交代背景，再给出定义、组成和作用，最后把概念放回 Kafka 整体架构。",
        "flow": ("提出背景", "给出定义", "拆解组成", "解释作用", "放回整体架构"),
        "pitfall": "不要只背术语定义；需要同时说清它解决什么问题、与哪些组件交互、失效时会出现什么现象。",
    },
    "lesson": {
        "intro": "这节继续完善 Kafka 的完整知识链。请按老师的讲解顺序理解动机、做法和结果。",
        "flow": ("问题背景", "关键对象", "处理过程", "结果验证", "应用边界"),
        "pitfall": "不要把孤立 API 或配置项当成完整能力；始终把它放回生产、存储、消费或集群链路中理解。",
    },
}


def terms_for(title: str, text: str) -> list[str]:
    haystack = f"{title} {text}".lower()
    found = [term for term in GLOSSARY if term.lower() in haystack]
    return found[:8]


def xml_lines(text: str, width: int = 13) -> list[str]:
    text = text.strip()
    return [text[i:i + width] for i in range(0, len(text), width)] or [""]


def write_svg(path: Path, title: str, flow: tuple[str, ...], number: int) -> None:
    boxes = list(flow[:5])
    width, height = 1280, 460
    box_w, gap, x0 = 188, 50, 55
    colors = ("#0f766e", "#0369a1", "#4f46e5", "#7c3aed", "#be185d")
    body = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="1280" height="460" fill="#f8fafc" rx="28"/>',
    ]
    for line_no, line in enumerate(xml_lines(f"P{number} · {title}", 34)):
        body.append(f'<text x="55" y="{54 + line_no * 36}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="30" font-weight="700" fill="#0f172a">{html.escape(line)}</text>')
    body.append('<text x="55" y="126" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="17" fill="#475569">按本节讲解顺序整理的学习路径</text>')
    y = 160
    for index, label in enumerate(boxes):
        x = x0 + index * (box_w + gap)
        body.append(f'<rect x="{x}" y="{y}" width="{box_w}" height="150" rx="22" fill="white" stroke="{colors[index]}" stroke-width="4"/>')
        body.append(f'<circle cx="{x + 28}" cy="{y + 28}" r="17" fill="{colors[index]}"/>')
        body.append(f'<text x="{x + 28}" y="{y + 34}" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="white">{index + 1}</text>')
        lines = xml_lines(label)
        for line_no, line in enumerate(lines):
            body.append(f'<text x="{x + box_w / 2}" y="{y + 78 + line_no * 28}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="21" font-weight="650" fill="#0f172a">{html.escape(line)}</text>')
        if index < len(boxes) - 1:
            x1 = x + box_w + 10
            x2 = x + box_w + gap - 10
            body.append(f'<path d="M{x1} {y + 75} H{x2}" stroke="#94a3b8" stroke-width="4" marker-end="url(#arrow)"/>')
    body.insert(1, '<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker></defs>')
    body.append('<text x="55" y="410" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="16" fill="#64748b">概念图为学习笔记原创重绘；原视频画面仅用于内容核对。</text>')
    body.append('</svg>')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(body) + "\n", encoding="utf-8")


def episode_paths(root: Path, item: dict) -> tuple[Chapter, Path, str]:
    chapter = chapter_for(item["p"])
    chapter_dir = root / "notes" / f"{chapter.number:02d}-{chapter.slug}"
    base = f"p{item['p']:03d}-{slugify(item['title'])}"
    return chapter, chapter_dir, base


def transcript_markdown(item: dict, asr: dict) -> str:
    lines = [
        f"# P{item['p']} 原声 ASR：{item['title']}",
        "",
        "> 这是本地语音识别的逐段原始结果，用于核对老师是否讲过某个细节。",
        "> 同音字、英文术语和断句可能有误；概念与命令以同目录主笔记的校正版为准。",
        "",
    ]
    for segment in asr["segments"]:
        lines.append(
            f"- `{clock(segment['start'])}–{clock(segment['end'])}` {segment['text'].strip()}"
        )
    lines.extend(("", "## 机器合并全文", "", asr["text"].strip(), ""))
    return "\n".join(lines)


def episode_markdown(root: Path, item: dict, asr: dict, all_items: list[dict]) -> str:
    number = item["p"]
    chapter, chapter_dir, base = episode_paths(root, item)
    kind = lesson_kind(item["title"])
    guide = KIND_CONTENT[kind]
    groups = group_segments(asr["segments"])
    cleaned_all = "".join(group["text"] for group in groups)
    terms = terms_for(item["title"], cleaned_all)

    prev_link = ""
    next_link = ""
    if number > 1:
        prev_item = all_items[number - 2]
        _, prev_dir, prev_base = episode_paths(root, prev_item)
        prev_rel = Path("..") / prev_dir.name / f"{prev_base}.md"
        prev_link = f"[← P{number - 1}: {prev_item['title']}]({prev_rel.as_posix()})"
    if number < len(all_items):
        next_item = all_items[number]
        _, next_dir, next_base = episode_paths(root, next_item)
        next_rel = Path("..") / next_dir.name / f"{next_base}.md"
        next_link = f"[P{number + 1}: {next_item['title']} →]({next_rel.as_posix()})"
    nav = " · ".join(part for part in (prev_link, "[返回本章](./README.md)", next_link) if part)

    lines = [
        f"# P{number}：{item['title']}",
        "",
        f"> 笔记编号 {number}/{len(all_items)} · 时长 {item['duration']} · [打开原视频 P{number}](https://www.bilibili.com/video/BV14J4m187jz?p={number})",
        "",
        nav,
        "",
        "## 这节到底讲什么",
        "",
        f"**核心主题：{item['title']}。**",
        "",
        guide["intro"],
        f"本节属于“{chapter.title}”这一章；放在全章里看，它的作用是：{chapter.goal}",
        "",
        f"![P{number} 原创概念图](./diagrams/{base}-concept.svg)",
        "",
        "## 本节路线",
        "",
        "```mermaid",
        "flowchart LR",
    ]
    for index, label in enumerate(guide["flow"]):
        lines.append(f'    N{index}["{label}"]')
        if index:
            lines.append(f"    N{index - 1} --> N{index}")
    lines.extend(("```", ""))
    if number in EDITOR_NOTES:
        lines.extend(("## 先用白话读懂", "", EDITOR_NOTES[number], ""))
    lines.extend(("## 老师的完整讲解（按视频顺序校正）", "",
                  "> 下面保留老师的完整讲解顺序，并修正 Kafka、Java、ZooKeeper、",
                  "> Topic、Partition、Offset 等常见识别错误。它不是压缩摘要；原始 ASR 在后面单独保留。", ""))
    for index, group in enumerate(groups, 1):
        lines.extend((
            f"### {index}. {clock(group['start'])}–{clock(group['end'])}",
            "",
            group["text"],
            "",
        ))

    if terms:
        lines.extend(("## 关键术语", ""))
        for term in terms:
            lines.append(f"- **{term}：** {GLOSSARY[term]}")
        lines.append("")

    if number in VISUAL_NOTES:
        lines.extend((
            "## 关键画面核对",
            "",
            VISUAL_NOTES[number],
            "",
            "[查看课程关键画面核对总表](../../sources/visual-checks.md)。",
            "",
        ))

    lines.extend((
        "## 完整原声逐段记录",
        "",
        f"[查看本节带时间戳的本地 ASR](./transcripts/{base}-ASR.md)。主笔记负责可读性和术语校正；ASR 页面负责完整性复核。",
        "",
        "## 读完记住",
        "",
        f"- 本节主题是 **{item['title']}**，它服务于本章目标：{chapter.goal}",
        f"- 理解顺序是：{' → '.join(guide['flow'])}。",
        f"- 学习时要同时核对老师的解释、画面中的配置/代码，以及最终运行结果。",
        "",
        "## 最容易踩的坑",
        "",
        guide["pitfall"],
        "",
        "## 自测",
        "",
        f"1. 不看笔记，用自己的话解释“{item['title']}”解决了什么问题。",
        f"2. 按顺序复述：{'、'.join(guide['flow'])}。",
        "3. 如果运行结果和老师不同，你会先检查哪三个输入或环境条件？",
        "",
        "## 学完检查",
        "",
        "- [ ] 我能不看视频复述本节完整思路",
        "- [ ] 我能指出关键命令、配置、类或接口的作用",
        "- [ ] 我能解释画面中的输入与输出为什么对应",
        "- [ ] 我核对过完整 ASR，没有跳过老师的补充说明",
        "- [ ] 我完成了本节自测或复现实验",
        "",
    ))
    return "\n".join(lines)


def chapter_readme(root: Path, chapter: Chapter, items: list[dict]) -> str:
    chapter_items = [i for i in items if chapter.start <= i["p"] <= chapter.end]
    lines = [
        f"# 第 {chapter.number} 章：{chapter.title}",
        "",
        chapter.goal,
        "",
        "## 整章核心讲解",
        "",
    ]
    for paragraph in CHAPTER_EXPLANATIONS[chapter.number]:
        lines.extend((paragraph, ""))
    lines.extend([
        "## 先看懂整章数据流",
        "",
        "```mermaid",
        "flowchart LR",
    ])
    for index, node in enumerate(chapter.flow):
        lines.append(f'    C{index}["{node}"]')
        if index:
            lines.append(f"    C{index - 1} --> C{index}")
    lines.extend(("```", "", "## 本章逐节目录", ""))
    for item in chapter_items:
        _, _, base = episode_paths(root, item)
        lines.append(f"{item['p'] - chapter.start + 1}. [P{item['p']} {item['title']}](./{base}.md) · {item['duration']}")
    lines.extend((
        "",
        "## 本章学习方法",
        "",
        "1. 先把上面的流程图画在纸上，明确每节位于哪一步。",
        "2. 读逐节正文，再用 ASR 核查老师的补充、口头提醒和演示顺序。",
        "3. 遇到命令或代码课，必须记录“输入—配置—输出—失败原因”。",
        "4. 学完后从头解释整章，不以“视频播放完”作为完成标准。",
        "",
    ))
    return "\n".join(lines)


def root_readme(root: Path, items: list[dict]) -> str:
    total = sum(seconds(item["duration"]) for item in items)
    lines = [
        f"# Kafka 3.7.0 零基础学习笔记：{len(items)} 节完整路线",
        "",
        "这套笔记按 B 站课程的原声、选集顺序和关键画面整理。每节都保留完整带时间戳 ASR，",
        "正文则把口语、同音字和跳跃讲法校正成可以直接阅读的讲义；安装、配置、代码与测试课",
        "都按“输入—操作—输出—排错”组织。",
        "",
        "- 原课程：[BV14J4m187jz](https://www.bilibili.com/video/BV14J4m187jz)",
        f"- 选集数量：{len(items)} 节",
        f"- 总时长：{total / 3600:.2f} 小时",
        "- 课程版本：Kafka 3.7.0、JDK 17，覆盖 ZooKeeper 与 KRaft",
        "- 内容核查：Codex 内置浏览器读取选集、播放器画面和独立音轨；本地 Whisper 生成完整 ASR",
        "",
        "## 建议学习顺序",
        "",
        "1. 先读章级 README，理解这一章在 Kafka 数据流中的位置。",
        "2. 按 P 号阅读逐节正文；遇到实操课，自己复现后再对照老师结果。",
        "3. 不确定老师是否提到某个细节时，打开对应的带时间戳 ASR 核查。",
        "4. 用 `kafka_from_scratch` 的小实验验证分区、消费组、Offset、ISR/HW 等核心机制。",
        "",
        "## 课程目录",
        "",
    ]
    for chapter in CHAPTERS:
        lines.extend((
            f"### 第 {chapter.number} 章：{chapter.title}",
            "",
            f"[打开专题学习说明](./notes/{chapter.number:02d}-{chapter.slug}/README.md)",
            "",
        ))
        for item in items:
            if chapter.start <= item["p"] <= chapter.end:
                _, chapter_dir, base = episode_paths(root, item)
                lines.append(f"{item['p']}. [P{item['p']} {item['title']}](./notes/{chapter_dir.name}/{base}.md) · {item['duration']}")
        lines.append("")
    lines.extend((
        "## 配套可运行代码",
        "",
        "- [Kafka 核心术语速查](./GLOSSARY.md)",
        "- [Java 17 + Spring Boot + Spring Kafka 课程配套工程（含独立生产者/消费者）](./springboot-kafka-study/README.md)",
        "- [Kafka 核心机制从零实现练习包](./kafka_from_scratch/README.md)",
        "- Java 工程测试：`cd springboot-kafka-study && mvn test`",
        "- 运行测试：`python -m unittest discover -s tests -p 'test_*.py'`",
        "",
        "## 来源与完整性",
        "",
        "[查看浏览器读取、音轨转写、画面核查和术语校正说明](./sources/README.md)",
        "",
    ))
    return "\n".join(lines)


def sources_readme() -> str:
    return """# 课程来源与核查说明

主课程：[Bilibili BV14J4m187jz](https://www.bilibili.com/video/BV14J4m187jz)。

整理过程：

1. 用 Codex 内置浏览器直接打开课程页，读取标题、156 节选集、每节时长和播放器状态；
2. 页面没有可用字幕，因此从浏览器播放器读取每节独立音轨，在临时目录保存并逐节转写；
3. 用本地 MLX Whisper 保留带时间戳的完整 ASR，正文再校正 Kafka、ZooKeeper、KRaft、
   Topic、Partition、Replica、Offset、ISR、LEO、HW、Assignor 等高频术语；
4. 浏览器同时用于核对课程画面、章节主题、配置/代码演示与运行结果；
5. 仓库不保存原始音视频，避免把课程媒体重新分发；逐节概念图均为学习用途的原创 SVG；
6. ASR 用于完整性复核，可能仍包含少量人名、公司名或口语同音字；技术结论以主笔记校正版为准。

`course-catalog.json` 保存从课程页面读取的 156 节目录、时长和 CID，便于校验笔记是否缺集。

[查看关键代码、存储、集群与 KRaft 画面核对记录](./visual-checks.md)。
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("catalog", type=Path)
    parser.add_argument("asr_dir", type=Path)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args()

    root = args.root.resolve()
    items = json.loads(args.catalog.read_text(encoding="utf-8"))
    if len(items) != 156:
        raise SystemExit(f"expected 156 catalog items, got {len(items)}")

    missing = [item["p"] for item in items if not (args.asr_dir / f"p{item['p']:03d}.json").exists()]
    if missing:
        raise SystemExit(f"missing ASR files: {missing[:20]}")

    sources = root / "sources"
    sources.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.catalog, sources / "course-catalog.json")
    (sources / "README.md").write_text(sources_readme(), encoding="utf-8")

    for chapter in CHAPTERS:
        chapter_dir = root / "notes" / f"{chapter.number:02d}-{chapter.slug}"
        chapter_dir.mkdir(parents=True, exist_ok=True)
        (chapter_dir / "README.md").write_text(chapter_readme(root, chapter, items), encoding="utf-8")

    for item in items:
        asr = json.loads((args.asr_dir / f"p{item['p']:03d}.json").read_text(encoding="utf-8"))
        _, chapter_dir, base = episode_paths(root, item)
        transcript_dir = chapter_dir / "transcripts"
        transcript_dir.mkdir(parents=True, exist_ok=True)
        (transcript_dir / f"{base}-ASR.md").write_text(transcript_markdown(item, asr), encoding="utf-8")
        (chapter_dir / f"{base}.md").write_text(episode_markdown(root, item, asr, items), encoding="utf-8")
        kind = lesson_kind(item["title"])
        write_svg(chapter_dir / "diagrams" / f"{base}-concept.svg", item["title"], KIND_CONTENT[kind]["flow"], item["p"])

    (root / "README.md").write_text(root_readme(root, items), encoding="utf-8")
    print(f"built {len(items)} lesson pages and transcripts")


if __name__ == "__main__":
    main()
