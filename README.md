# Kafka 3.7.0 零基础学习笔记：156 节完整路线

这套笔记按 B 站课程的原声、选集顺序和关键画面整理。每节都保留完整带时间戳 ASR，
正文则把口语、同音字和跳跃讲法校正成可以直接阅读的讲义；安装、配置、代码与测试课
都按“输入—操作—输出—排错”组织。

- 原课程：[BV14J4m187jz](https://www.bilibili.com/video/BV14J4m187jz)
- 选集数量：156 节
- 总时长：15.68 小时
- 课程版本：Kafka 3.7.0、JDK 17，覆盖 ZooKeeper 与 KRaft
- 内容核查：Codex 内置浏览器读取选集、播放器画面和独立音轨；本地 Whisper 生成完整 ASR

## 建议学习顺序

1. 先读章级 README，理解这一章在 Kafka 数据流中的位置。
2. 按 P 号阅读逐节正文；遇到实操课，自己复现后再对照老师结果。
3. 不确定老师是否提到某个细节时，打开对应的带时间戳 ASR 核查。
4. 用 `kafka_from_scratch` 的小实验验证分区、消费组、Offset、ISR/HW 等核心机制。

## 课程目录

### 第 1 章：课程导学与 Kafka 身世

[打开专题学习说明](./notes/01-course-overview/README.md)

1. [P1 课程概述](./notes/01-course-overview/p001-课程概述.md) · 01:54
2. [P2 What is Kafka？](./notes/01-course-overview/p002-What-is-Kafka.md) · 03:03
3. [P3 谁在使用Kafka](./notes/01-course-overview/p003-谁在使用Kafka.md) · 03:50
4. [P4 Kafka的起源](./notes/01-course-overview/p004-Kafka的起源.md) · 04:42
5. [P5 Kafka名字的由来](./notes/01-course-overview/p005-Kafka名字的由来.md) · 01:51
6. [P6 Kafka的发展历程](./notes/01-course-overview/p006-Kafka的发展历程.md) · 03:08
7. [P7 Kafka版本迭代演进](./notes/01-course-overview/p007-Kafka版本迭代演进.md) · 03:12

### 第 2 章：环境准备与三种部署方式

[打开专题学习说明](./notes/02-environment-deployment/README.md)

8. [P8 Kafka运行环境前置要求](./notes/02-environment-deployment/p008-Kafka运行环境前置要求.md) · 05:12
9. [P9 JDK17的下载](./notes/02-environment-deployment/p009-JDK17的下载.md) · 03:24
10. [P10 JDK17的安装与配置](./notes/02-environment-deployment/p010-JDK17的安装与配置.md) · 04:37
11. [P11 Kafka的下载和安装](./notes/02-environment-deployment/p011-Kafka的下载和安装.md) · 03:58
12. [P12 Kafka环境启动的两种方式](./notes/02-environment-deployment/p012-Kafka环境启动的两种方式.md) · 03:38
13. [P13 Kafka安装目录的介绍](./notes/02-environment-deployment/p013-Kafka安装目录的介绍.md) · 02:43
14. [P14 Zookeeper服务器的启动](./notes/02-environment-deployment/p014-Zookeeper服务器的启动.md) · 04:55
15. [P15 Kafka服务器的启动](./notes/02-environment-deployment/p015-Kafka服务器的启动.md) · 04:48
16. [P16 Zookeeper和Kafka服务器的关闭](./notes/02-environment-deployment/p016-Zookeeper和Kafka服务器的关闭.md) · 02:50
17. [P17 Zookeeper服务器的下载](./notes/02-environment-deployment/p017-Zookeeper服务器的下载.md) · 03:56
18. [P18 Zookeeper服务器的安装](./notes/02-environment-deployment/p018-Zookeeper服务器的安装.md) · 03:48
19. [P19 Zookeeper服务器的配置](./notes/02-environment-deployment/p019-Zookeeper服务器的配置.md) · 02:50
20. [P20 Zookeeper服务器的启动](./notes/02-environment-deployment/p020-Zookeeper服务器的启动.md) · 03:44
21. [P21 Zookeeper服务器与Tomcat端口冲突处理](./notes/02-environment-deployment/p021-Zookeeper服务器与Tomcat端口冲突处理.md) · 06:53
22. [P22 使用独立的Zookeeper启动Kafka](./notes/02-environment-deployment/p022-使用独立的Zookeeper启动Kafka.md) · 04:47
23. [P23 Kafka启动使用KRaft生成Cluster UUID](./notes/02-environment-deployment/p023-Kafka启动使用KRaft生成Cluster-UUID.md) · 05:20
24. [P24 kafka-storage.sh脚本参数解读](./notes/02-environment-deployment/p024-kafka-storage.sh脚本参数解读.md) · 05:54
25. [P25 Kafka启动使用KRaft](./notes/02-environment-deployment/p025-Kafka启动使用KRaft.md) · 08:31
26. [P26 自定义Cluster UUID启动Kafka](./notes/02-environment-deployment/p026-自定义Cluster-UUID启动Kafka.md) · 08:04
27. [P27 Docker的卸载和安装](./notes/02-environment-deployment/p027-Docker的卸载和安装.md) · 04:50
28. [P28 Docker的卸载和安装](./notes/02-environment-deployment/p028-Docker的卸载和安装.md) · 06:44
29. [P29 Docker引擎启动与关闭](./notes/02-environment-deployment/p029-Docker引擎启动与关闭.md) · 07:06
30. [P30 拉取Kafka的Docker镜像](./notes/02-environment-deployment/p030-拉取Kafka的Docker镜像.md) · 05:16
31. [P31 启动Kafka的Docker容器](./notes/02-environment-deployment/p031-启动Kafka的Docker容器.md) · 03:48

### 第 3 章：Topic、Event 与命令行实操

[打开专题学习说明](./notes/03-topic-event-cli/README.md)

32. [P32 Kafka的主题Topic和事件Event](./notes/03-topic-event-cli/p032-Kafka的主题Topic和事件Event.md) · 02:42
33. [P33 通过脚本工具创建主题Topic](./notes/03-topic-event-cli/p033-通过脚本工具创建主题Topic.md) · 06:53
34. [P34 kafka-topics.sh脚本工具的使用](./notes/03-topic-event-cli/p034-kafka-topics.sh脚本工具的使用.md) · 06:42
35. [P35 在主题Topic中写入一些事件Events](./notes/03-topic-event-cli/p035-在主题Topic中写入一些事件Events.md) · 09:05
36. [P36 从主题Topic中读取事件Events](./notes/03-topic-event-cli/p036-从主题Topic中读取事件Events.md) · 05:21
37. [P37 从主题Topic中读取事件Events](./notes/03-topic-event-cli/p037-从主题Topic中读取事件Events.md) · 05:44
38. [P38 外部环境连接Kafka](./notes/03-topic-event-cli/p038-外部环境连接Kafka.md) · 06:15
39. [P39 外部环境连不上Kafka？](./notes/03-topic-event-cli/p039-外部环境连不上Kafka.md) · 07:18
40. [P40 Docker容器Kafka配置文件](./notes/03-topic-event-cli/p040-Docker容器Kafka配置文件.md) · 05:01
41. [P41 Docker容器Kafka配置文件复制到Linux](./notes/03-topic-event-cli/p041-Docker容器Kafka配置文件复制到Linux.md) · 05:07
42. [P42 Docker容器Kafka配置文件修改](./notes/03-topic-event-cli/p042-Docker容器Kafka配置文件修改.md) · 06:43
43. [P43 Docker容器Kafka配置文件映射](./notes/03-topic-event-cli/p043-Docker容器Kafka配置文件映射.md) · 03:51

### 第 4 章：连接、管理与监控工具

[打开专题学习说明](./notes/04-tools-monitoring/README.md)

44. [P44 Idea之Kafka插件工具](./notes/04-tools-monitoring/p044-Idea之Kafka插件工具.md) · 04:02
45. [P45 Kafka连接工具Offset Explorer](./notes/04-tools-monitoring/p045-Kafka连接工具Offset-Explorer.md) · 06:50
46. [P46 Kafka连接工具CMAK](./notes/04-tools-monitoring/p046-Kafka连接工具CMAK.md) · 06:43
47. [P47 Kafka连接工具CMAK配置与启动](./notes/04-tools-monitoring/p047-Kafka连接工具CMAK配置与启动.md) · 08:30
48. [P48 Kafka连接工具CMAK使用限制](./notes/04-tools-monitoring/p048-Kafka连接工具CMAK使用限制.md) · 08:16
49. [P49 Kafka监控工具EFAK](./notes/04-tools-monitoring/p049-Kafka监控工具EFAK.md) · 08:57
50. [P50 Kafka监控工具EFAK配置](./notes/04-tools-monitoring/p050-Kafka监控工具EFAK配置.md) · 10:26
51. [P51 Kafka监控工具EFAK部署运行](./notes/04-tools-monitoring/p051-Kafka监控工具EFAK部署运行.md) · 09:57

### 第 5 章：Spring Boot 集成 Kafka

[打开专题学习说明](./notes/05-spring-boot-basics/README.md)

52. [P52 Spring Boot集成Kafka开发](./notes/05-spring-boot-basics/p052-Spring-Boot集成Kafka开发.md) · 06:50
53. [P53 Spring Boot集成Kafka开发配置](./notes/05-spring-boot-basics/p053-Spring-Boot集成Kafka开发配置.md) · 08:48
54. [P54 Spring Boot集成Kafka事件Event发送](./notes/05-spring-boot-basics/p054-Spring-Boot集成Kafka事件Event发送.md) · 05:28
55. [P55 Spring Boot集成Kafka事件Event发送测试](./notes/05-spring-boot-basics/p055-Spring-Boot集成Kafka事件Event发送测试.md) · 09:15
56. [P56 Spring Boot集成Kafka事件Event读取](./notes/05-spring-boot-basics/p056-Spring-Boot集成Kafka事件Event读取.md) · 08:36
57. [P57 Kafka的几个概念快速梳理](./notes/05-spring-boot-basics/p057-Kafka的几个概念快速梳理.md) · 06:40
58. [P58 SpringBoot集成Kafka读取最早的消息](./notes/05-spring-boot-basics/p058-SpringBoot集成Kafka读取最早的消息.md) · 04:16
59. [P59 SpringBoot集成Kafka读取最早的消息](./notes/05-spring-boot-basics/p059-SpringBoot集成Kafka读取最早的消息.md) · 06:00
60. [P60 手动重置Kafka偏移量offset](./notes/05-spring-boot-basics/p060-手动重置Kafka偏移量offset.md) · 07:25
61. [P61 消息消费时偏移量策略的配置](./notes/05-spring-boot-basics/p061-消息消费时偏移量策略的配置.md) · 10:10
62. [P62 Spring Boot集成Kafka发送Message对象消息](./notes/05-spring-boot-basics/p062-Spring-Boot集成Kafka发送Message对象消息.md) · 07:42
63. [P63 Spring Boot集成Kafka发送ProducerRecord对象消息](./notes/05-spring-boot-basics/p063-Spring-Boot集成Kafka发送ProducerRecord对象消息.md) · 12:00
64. [P64 Spring Boot集成Kafka发送指定分区的消息](./notes/05-spring-boot-basics/p064-Spring-Boot集成Kafka发送指定分区的消息.md) · 04:14
65. [P65 Spring Boot集成Kafka发送默认topic消息](./notes/05-spring-boot-basics/p065-Spring-Boot集成Kafka发送默认topic消息.md) · 07:21
66. [P66 kafkaTemplate.send()和kafkaTemplate.sendDefault()的比较](./notes/05-spring-boot-basics/p066-kafkaTemplate.send-和kafkaTemplate.sendDefault-的比较.md) · 03:14
67. [P67 获取生产者消息发送结果](./notes/05-spring-boot-basics/p067-获取生产者消息发送结果.md) · 04:42
68. [P68 阻塞式获取生产者消息发送的结果](./notes/05-spring-boot-basics/p068-阻塞式获取生产者消息发送的结果.md) · 11:18
69. [P69 非阻塞式获取生产者消息发送的结果](./notes/05-spring-boot-basics/p069-非阻塞式获取生产者消息发送的结果.md) · 10:52
70. [P70 SpringBoot集成Kafka开发发送对象消息](./notes/05-spring-boot-basics/p070-SpringBoot集成Kafka开发发送对象消息.md) · 05:20
71. [P71 SpringBoot集成Kafka自动装配的KafkaTemplate](./notes/05-spring-boot-basics/p071-SpringBoot集成Kafka自动装配的KafkaTemplate.md) · 04:06
72. [P72 SpringBoot集成Kafka开发发送对象消息序列化](./notes/05-spring-boot-basics/p072-SpringBoot集成Kafka开发发送对象消息序列化.md) · 09:39
73. [P73 SpringBoot集成Kafka开发发送消息的KafkaTemplate注入](./notes/05-spring-boot-basics/p073-SpringBoot集成Kafka开发发送消息的KafkaTemplate注入.md) · 02:39

### 第 6 章：副本、分区策略与生产者链路

[打开专题学习说明](./notes/06-producer-internals/README.md)

74. [P74 Kafka的核心概念Replica副本](./notes/06-producer-internals/p074-Kafka的核心概念Replica副本.md) · 05:25
75. [P75 Kafka命令行脚本创建topic并指定分区和副本](./notes/06-producer-internals/p075-Kafka命令行脚本创建topic并指定分区和副本.md) · 09:22
76. [P76 SpringBoot集成Kafka创建topic并指定分区和副本](./notes/06-producer-internals/p076-SpringBoot集成Kafka创建topic并指定分区和副本.md) · 08:29
77. [P77 SpringBoot集成Kafka创建topic并指定分区和副本](./notes/06-producer-internals/p077-SpringBoot集成Kafka创建topic并指定分区和副本.md) · 07:44
78. [P78 生产者发送消息的分区策略测试](./notes/06-producer-internals/p078-生产者发送消息的分区策略测试.md) · 04:09
79. [P79 生产者发送消息的分区策略源码分析](./notes/06-producer-internals/p079-生产者发送消息的分区策略源码分析.md) · 09:33
80. [P80 生产者发送消息的分区策略源码分析](./notes/06-producer-internals/p080-生产者发送消息的分区策略源码分析.md) · 10:59
81. [P81 生产者发送消息的分区策略源RoundRobinPartitioner](./notes/06-producer-internals/p081-生产者发送消息的分区策略源RoundRobinPartitioner.md) · 04:30
82. [P82 生产者发送消息配置分区策略RoundRobinPartitioner](./notes/06-producer-internals/p082-生产者发送消息配置分区策略RoundRobinPartitioner.md) · 08:32
83. [P83 生产者发送消息配置分区策略RoundRobinPartitioner测试](./notes/06-producer-internals/p083-生产者发送消息配置分区策略RoundRobinPartitioner测试.md) · 07:50
84. [P84 生产者发送消息自定义分区策略](./notes/06-producer-internals/p084-生产者发送消息自定义分区策略.md) · 06:52
85. [P85 生产者发送消息自定义分区策略](./notes/06-producer-internals/p085-生产者发送消息自定义分区策略.md) · 04:57
86. [P86 Kafka生产者发送消息的流程](./notes/06-producer-internals/p086-Kafka生产者发送消息的流程.md) · 05:44
87. [P87 Kafka自定义消息发送的拦截器](./notes/06-producer-internals/p087-Kafka自定义消息发送的拦截器.md) · 07:00
88. [P88 Kafka自定义消息发送的拦截器测试](./notes/06-producer-internals/p088-Kafka自定义消息发送的拦截器测试.md) · 05:21

### 第 7 章：消费者开发与分区分配

[打开专题学习说明](./notes/07-consumer-internals/README.md)

89. [P89 SpringBoot集成Kafka开发接收消息体内容](./notes/07-consumer-internals/p089-SpringBoot集成Kafka开发接收消息体内容.md) · 09:16
90. [P90 SpringBoot集成Kafka开发接收消息头内容](./notes/07-consumer-internals/p090-SpringBoot集成Kafka开发接收消息头内容.md) · 05:55
91. [P91 SpringBoot集成Kafka开发接收消息所有内容](./notes/07-consumer-internals/p091-SpringBoot集成Kafka开发接收消息所有内容.md) · 05:01
92. [P92 SpringBoot集成Kafka开发接收对象消息](./notes/07-consumer-internals/p092-SpringBoot集成Kafka开发接收对象消息.md) · 07:58
93. [P93 SpringBoot集成Kafka开发接收对象消息](./notes/07-consumer-internals/p093-SpringBoot集成Kafka开发接收对象消息.md) · 04:14
94. [P94 SpringBoot集成Kafka开发接收对象消息](./notes/07-consumer-internals/p094-SpringBoot集成Kafka开发接收对象消息.md) · 07:14
95. [P95 SpringBoot集成Kafka开发接收消息监听器注解](./notes/07-consumer-internals/p095-SpringBoot集成Kafka开发接收消息监听器注解.md) · 04:18
96. [P96 SpringBoot集成Kafka开发接收消息监听器手动确认消息](./notes/07-consumer-internals/p096-SpringBoot集成Kafka开发接收消息监听器手动确认消息.md) · 07:00
97. [P97 SpringBoot集成Kafka开发接收消息监听器手动确认消息](./notes/07-consumer-internals/p097-SpringBoot集成Kafka开发接收消息监听器手动确认消息.md) · 07:25
98. [P98 SpringBoot集成Kafka开发指定topic-partition-offset消费消息](./notes/07-consumer-internals/p098-SpringBoot集成Kafka开发指定topic-partition-offset消费消息.md) · 05:06
99. [P99 SpringBoot集成Kafka开发指定topic-partition-offset消费消息](./notes/07-consumer-internals/p099-SpringBoot集成Kafka开发指定topic-partition-offset消费消息.md) · 06:32
100. [P100 SpringBoot集成Kafka开发指定topic-partition-offset消费消息](./notes/07-consumer-internals/p100-SpringBoot集成Kafka开发指定topic-partition-offset消费消息.md) · 07:22
101. [P101 SpringBoot集成Kafka开发指定topic-partition-offset消费消息](./notes/07-consumer-internals/p101-SpringBoot集成Kafka开发指定topic-partition-offset消费消息.md) · 07:12
102. [P102 SpringBoot集成Kafka开发批量消费消息](./notes/07-consumer-internals/p102-SpringBoot集成Kafka开发批量消费消息.md) · 05:31
103. [P103 SpringBoot集成Kafka开发批量消费消息](./notes/07-consumer-internals/p103-SpringBoot集成Kafka开发批量消费消息.md) · 04:07
104. [P104 SpringBoot集成Kafka开发批量消费消息](./notes/07-consumer-internals/p104-SpringBoot集成Kafka开发批量消费消息.md) · 05:01
105. [P105 SpringBoot集成Kafka开发消费消息拦截器-定义ConsumerInterceptor](./notes/07-consumer-internals/p105-SpringBoot集成Kafka开发消费消息拦截器-定义ConsumerInterceptor.md) · 08:07
106. [P106 SpringBoot集成Kafka开发消费消息拦截器-配置ConsumerFactory](./notes/07-consumer-internals/p106-SpringBoot集成Kafka开发消费消息拦截器-配置ConsumerFactory.md) · 08:17
107. [P107 SpringBoot集成Kafka开发消费消息拦截器-ConsumerFactory](./notes/07-consumer-internals/p107-SpringBoot集成Kafka开发消费消息拦截器-ConsumerFactory.md) · 05:49
108. [P108 SpringBoot集成Kafka开发消费消息拦截器-KafkaListenerContainerFactory](./notes/07-consumer-internals/p108-SpringBoot集成Kafka开发消费消息拦截器-KafkaListenerContainerFactory.md) · 12:09
109. [P109 SpringBoot集成Kafka开发消费消息拦截器-消费者准备](./notes/07-consumer-internals/p109-SpringBoot集成Kafka开发消费消息拦截器-消费者准备.md) · 01:12
110. [P110 SpringBoot集成Kafka开发消费消息拦截器-测试验证](./notes/07-consumer-internals/p110-SpringBoot集成Kafka开发消费消息拦截器-测试验证.md) · 06:12
111. [P111 SpringBoot集成Kafka开发消息转发](./notes/07-consumer-internals/p111-SpringBoot集成Kafka开发消息转发.md) · 08:17
112. [P112 Kafka消息消费时的分区策略接口及实现类](./notes/07-consumer-internals/p112-Kafka消息消费时的分区策略接口及实现类.md) · 05:45
113. [P113 Kafka消息消费时的默认分区策略实现RangeAssignor](./notes/07-consumer-internals/p113-Kafka消息消费时的默认分区策略实现RangeAssignor.md) · 06:10
114. [P114 Kafka消息消费时的默认分区策略RangeAssignor具体分配方式](./notes/07-consumer-internals/p114-Kafka消息消费时的默认分区策略RangeAssignor具体分配方式.md) · 04:58
115. [P115 Kafka消息消费时的默认分区策略RangeAssignor代码测试验证](./notes/07-consumer-internals/p115-Kafka消息消费时的默认分区策略RangeAssignor代码测试验证.md) · 10:54
116. [P116 Kafka消息消费时的分区策略RoundRobinAssignor](./notes/07-consumer-internals/p116-Kafka消息消费时的分区策略RoundRobinAssignor.md) · 07:55
117. [P117 Kafka消息消费时的分区策略RoundRobinAssignor代码测试验证](./notes/07-consumer-internals/p117-Kafka消息消费时的分区策略RoundRobinAssignor代码测试验证.md) · 09:27
118. [P118 Kafka消息消费时的分区策略StickyAssignor和CooperativeStickyAssignor](./notes/07-consumer-internals/p118-Kafka消息消费时的分区策略StickyAssignor和CooperativeStickyAssignor.md) · 07:39

### 第 8 章：消息存储与 Offset

[打开专题学习说明](./notes/08-storage-offsets/README.md)

119. [P119 Kafka事件消息数据的存储](./notes/08-storage-offsets/p119-Kafka事件消息数据的存储.md) · 10:07
120. [P120 Kafka的__consumer_offsets主题](./notes/08-storage-offsets/p120-Kafka的__consumer_offsets主题.md) · 05:49
121. [P121 Kafka的__consumer_offsets主题数据查看](./notes/08-storage-offsets/p121-Kafka的__consumer_offsets主题数据查看.md) · 05:34
122. [P122 Kafka的Offset详解-生产者Offset](./notes/08-storage-offsets/p122-Kafka的Offset详解-生产者Offset.md) · 02:50
123. [P123 Kafka的Offset详解-消费者Offset](./notes/08-storage-offsets/p123-Kafka的Offset详解-消费者Offset.md) · 06:51
124. [P124 Kafka的Offset详解-生产者Offset代码演示](./notes/08-storage-offsets/p124-Kafka的Offset详解-生产者Offset代码演示.md) · 05:26
125. [P125 Kafka的Offset详解-消费者Offset代码演示默认从最新位置消费](./notes/08-storage-offsets/p125-Kafka的Offset详解-消费者Offset代码演示默认从最新位置消费.md) · 11:16
126. [P126 Kafka的Offset详解-消费者Offset代码演示默认从最新位置消费](./notes/08-storage-offsets/p126-Kafka的Offset详解-消费者Offset代码演示默认从最新位置消费.md) · 06:28
127. [P127 Kafka的Offset详解-消费者Offset代码演示总结](./notes/08-storage-offsets/p127-Kafka的Offset详解-消费者Offset代码演示总结.md) · 07:33

### 第 9 章：集群、副本机制与核心水位

[打开专题学习说明](./notes/09-cluster-replication/README.md)

128. [P128 Kafka集群的搭建-整体介绍](./notes/09-cluster-replication/p128-Kafka集群的搭建-整体介绍.md) · 03:01
129. [P129 Kafka集群的搭建-准备3个Kafka](./notes/09-cluster-replication/p129-Kafka集群的搭建-准备3个Kafka.md) · 03:37
130. [P130 Kafka集群的搭建-配置文件](./notes/09-cluster-replication/p130-Kafka集群的搭建-配置文件.md) · 06:27
131. [P131 Kafka集群的搭建-3台配置文件](./notes/09-cluster-replication/p131-Kafka集群的搭建-3台配置文件.md) · 05:43
132. [P132 Kafka集群的测试-运行Zookeeper](./notes/09-cluster-replication/p132-Kafka集群的测试-运行Zookeeper.md) · 05:47
133. [P133 Kafka集群的测试-运行3台Kafka](./notes/09-cluster-replication/p133-Kafka集群的测试-运行3台Kafka.md) · 04:29
134. [P134 Kafka集群的测试-SpringBoot连接集群Kafka](./notes/09-cluster-replication/p134-Kafka集群的测试-SpringBoot连接集群Kafka.md) · 06:36
135. [P135 Kafka集群的测试-SpringBoot连接集群Kafka收发消息](./notes/09-cluster-replication/p135-Kafka集群的测试-SpringBoot连接集群Kafka收发消息.md) · 05:42
136. [P136 Kafka的集群架构分析](./notes/09-cluster-replication/p136-Kafka的集群架构分析.md) · 04:19
137. [P137 Kafka的集群架构分区和副本机制](./notes/09-cluster-replication/p137-Kafka的集群架构分区和副本机制.md) · 03:28
138. [P138 Kafka的集群架构分区和多副本机制分析](./notes/09-cluster-replication/p138-Kafka的集群架构分区和多副本机制分析.md) · 02:40
139. [P139 Kafka的集群架构分区和多副本机制分析](./notes/09-cluster-replication/p139-Kafka的集群架构分区和多副本机制分析.md) · 04:17
140. [P140 Kafka的集群架构分区和多副本机制分析](./notes/09-cluster-replication/p140-Kafka的集群架构分区和多副本机制分析.md) · 05:57
141. [P141 Kafka集群架构的多副本架构](./notes/09-cluster-replication/p141-Kafka集群架构的多副本架构.md) · 08:37
142. [P142 Kafka中的12个核心概念梳理](./notes/09-cluster-replication/p142-Kafka中的12个核心概念梳理.md) · 02:50
143. [P143 Kafka中的12个核心概念-ISR副本](./notes/09-cluster-replication/p143-Kafka中的12个核心概念-ISR副本.md) · 03:06
144. [P144 Kafka中的12个核心概念-ISR副本](./notes/09-cluster-replication/p144-Kafka中的12个核心概念-ISR副本.md) · 05:32
145. [P145 Kafka中的12个核心概念-LEO](./notes/09-cluster-replication/p145-Kafka中的12个核心概念-LEO.md) · 01:48
146. [P146 Kafka中的12个核心概念-HW](./notes/09-cluster-replication/p146-Kafka中的12个核心概念-HW.md) · 04:10
147. [P147 Kafka中ISR、HW、LEO的关系](./notes/09-cluster-replication/p147-Kafka中ISR、HW、LEO的关系.md) · 03:19

### 第 10 章：KRaft 集群实战

[打开专题学习说明](./notes/10-kraft-cluster/README.md)

148. [P148 Kafka基于KRaft方式集群架构分析](./notes/10-kraft-cluster/p148-Kafka基于KRaft方式集群架构分析.md) · 04:07
149. [P149 Kafka基于KRaft方式集群架构分析](./notes/10-kraft-cluster/p149-Kafka基于KRaft方式集群架构分析.md) · 04:52
150. [P150 Kafka基于KRaft方式集群服务器规划](./notes/10-kraft-cluster/p150-Kafka基于KRaft方式集群服务器规划.md) · 04:08
151. [P151 Kafka基于KRaft方式集群准备Broker服务器](./notes/10-kraft-cluster/p151-Kafka基于KRaft方式集群准备Broker服务器.md) · 02:57
152. [P152 Kafka基于KRaft方式集群配置Broker服务器](./notes/10-kraft-cluster/p152-Kafka基于KRaft方式集群配置Broker服务器.md) · 06:39
153. [P153 Kafka基于KRaft方式集群配置Broker服务器](./notes/10-kraft-cluster/p153-Kafka基于KRaft方式集群配置Broker服务器.md) · 07:16
154. [P154 Kafka基于KRaft方式集群启动Broker服务器](./notes/10-kraft-cluster/p154-Kafka基于KRaft方式集群启动Broker服务器.md) · 08:25
155. [P155 Kafka基于KRaft方式集群测试](./notes/10-kraft-cluster/p155-Kafka基于KRaft方式集群测试.md) · 06:45
156. [P156 Kafka基于KRaft方式集群测试与总结](./notes/10-kraft-cluster/p156-Kafka基于KRaft方式集群测试与总结.md) · 03:19

## 配套可运行代码

- [Kafka 核心术语速查](./GLOSSARY.md)
- [Java 17 + Spring Boot + Spring Kafka 课程配套工程（含独立生产者/消费者）](./springboot-kafka-study/README.md)
- [Kafka 核心机制从零实现练习包](./kafka_from_scratch/README.md)
- Java 工程测试：`cd springboot-kafka-study && mvn test`
- 运行测试：`python -m unittest discover -s tests -p 'test_*.py'`

## 来源与完整性

[查看浏览器读取、音轨转写、画面核查和术语校正说明](./sources/README.md)
