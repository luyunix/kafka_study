#!/usr/bin/env python3
"""Build the browser catalog from the canonical Markdown course notes."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NOTES = ROOT / "notes"
OUTPUT = (
    ROOT
    / "springboot-kafka-study"
    / "producer-app"
    / "src"
    / "main"
    / "resources"
    / "static"
    / "course-catalog.json"
)

CHAPTERS = [
    ("01-course-overview", "课程概览", "认识 Kafka 的定位、应用场景与发展脉络"),
    ("02-environment-deployment", "环境与部署", "从 JDK、ZooKeeper 到 KRaft 与 Docker"),
    ("03-topic-event-cli", "Topic 与命令行", "用命令行创建主题并完成第一轮收发"),
    ("04-tools-monitoring", "工具与监控", "连接、查看和管理 Kafka 的常用工具"),
    ("05-spring-boot-basics", "Spring Boot 基础", "KafkaTemplate、监听消费、Offset 与序列化"),
    ("06-producer-internals", "生产者原理", "分区策略、拦截器与完整发送流程"),
    ("07-consumer-internals", "消费者原理", "监听器、确认、转发、拦截器与分配策略"),
    ("08-storage-offsets", "存储与 Offset", "日志存储、消费进度、LEO 与 Lag"),
    ("09-cluster-replication", "集群与副本", "多 Broker、副本、ISR、HW 与容错"),
    ("10-kraft-cluster", "KRaft 集群", "规划、配置并验证三节点 KRaft 集群"),
]

LESSON_RE = re.compile(
    r"^\d+\.\s+\[(P\d+)\s+(.+?)\]\(\./([^)]+\.md)\)\s+·\s+([0-9:]+)\s*$"
)


def build_catalog() -> dict:
    chapters = []
    all_lessons = []

    for index, (folder, title, summary) in enumerate(CHAPTERS, start=1):
        readme = (NOTES / folder / "README.md").read_text(encoding="utf-8")
        lessons = []
        for line in readme.splitlines():
            match = LESSON_RE.match(line)
            if not match:
                continue
            number, lesson_title, filename, duration = match.groups()
            lesson = {
                "id": number.lower(),
                "number": int(number[1:]),
                "title": lesson_title,
                "duration": duration,
                "path": f"{folder}/{filename}",
                "chapterId": folder,
                "chapterTitle": title,
            }
            lessons.append(lesson)
            all_lessons.append(lesson)

        chapters.append(
            {
                "id": folder,
                "number": index,
                "title": title,
                "summary": summary,
                "lessonCount": len(lessons),
                "start": lessons[0]["number"],
                "end": lessons[-1]["number"],
                "lessons": lessons,
            }
        )

    if len(all_lessons) != 156:
        raise SystemExit(f"expected 156 lessons, found {len(all_lessons)}")

    return {
        "title": "Kafka 从入门到 KRaft 集群",
        "lessonCount": len(all_lessons),
        "chapterCount": len(chapters),
        "chapters": chapters,
    }


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(build_catalog(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
