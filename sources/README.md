# 课程来源与核查说明

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
