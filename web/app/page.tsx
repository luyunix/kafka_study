"use client";

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./MermaidDiagram";
import { ZoomableImage } from "./ZoomableImage";

type Lesson = {
  id: number;
  topic: string;
  topicTitle: string;
  topicIndex: number;
  title: string;
  path: string;
  excerpt: string;
};

type Topic = {
  slug: string;
  title: string;
  description: string;
  count: number;
  lessons: Lesson[];
};

type Catalog = { version: string; total: number; topics: Topic[] };
type SearchEntry = { id: number; text: string };
type SearchIndex = { version: string; lessons: SearchEntry[] };
type SearchResult = { lesson: Lesson; snippet: string };
type MarkdownSegment =
  | { kind: "markdown"; content: string }
  | { kind: "details"; summary: string; content: string };

const DEFAULT_LESSON = 1;
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function withBasePath(path: string) {
  if (!BASE_PATH || !path.startsWith("/") || path.startsWith("//")) return path;
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}

function withoutBasePath(path: string) {
  if (!BASE_PATH) return path;
  if (path === BASE_PATH) return "/";
  return path.startsWith(`${BASE_PATH}/`) ? path.slice(BASE_PATH.length) : path;
}

function splitDetailsBlocks(source: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  const pattern = /<details>\s*<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)\s*<\/details>/gi;
  let cursor = 0;

  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      segments.push({ kind: "markdown", content: source.slice(cursor, index) });
    }
    segments.push({
      kind: "details",
      summary: match[1].trim(),
      content: match[2].trim(),
    });
    cursor = index + match[0].length;
  }

  if (cursor < source.length) {
    segments.push({ kind: "markdown", content: source.slice(cursor) });
  }

  return segments.length ? segments : [{ kind: "markdown", content: source }];
}

function isTranscriptPath(path?: string) {
  return Boolean(path && path.includes("/transcripts/") && path.endsWith(".md"));
}

function readStoredIds(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return new Set<number>(Array.isArray(value) ? value.filter(Number.isInteger) : []);
  } catch {
    return new Set<number>();
  }
}

function searchSnippet(text: string, query: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!query) return normalized.slice(0, 150);
  const index = normalized.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return normalized.slice(0, 150);
  const start = Math.max(0, index - 46);
  const end = Math.min(normalized.length, index + query.length + 92);
  return `${start > 0 ? "…" : ""}${normalized.slice(start, end)}${end < normalized.length ? "…" : ""}`;
}

const kafkaTopicGuides: Record<string, {
  analogy: string;
  symbols: string;
  workedExample: string;
  shapePath: string;
}> = {
  "01-course-overview": {
    analogy: "先把 Kafka 当成一条可靠的物流干线：生产者发货，Topic 分类，消费者取货。",
    symbols: "先分清 Producer、Broker、Topic、Consumer 四个角色，不急着背配置。",
    workedExample: "订单服务把“订单已创建”写入 Topic，库存、通知和风控服务分别订阅并处理。",
    shapePath: "业务事件 → Producer → Topic → Broker → Consumer → 业务处理",
  },
  "02-environment-deployment": {
    analogy: "部署 Kafka 像搭建一座仓库：JDK 是运行基础，Broker 是仓库，ZooKeeper 或 KRaft 管理仓库状态。",
    symbols: "始终盯住进程、端口、数据目录和连接地址四项。",
    workedExample: "启动服务后用端口和日志确认 Broker 就绪，再从宿主机连接验证 advertised.listeners。",
    shapePath: "JDK → 配置文件 → 元数据模式 → 启动 Broker → 检查端口与日志",
  },
  "03-topic-event-cli": {
    analogy: "Topic 像业务分类柜，Partition 是柜子里的并行抽屉，Event 是按顺序放入的单据。",
    symbols: "每条命令都要核对 bootstrap-server、Topic 名、Partition 和 Offset。",
    workedExample: "创建三分区 Topic，写入几条消息，再分别从最新位置和最早位置读取。",
    shapePath: "创建 Topic → 写入 Event → 分区追加 → 指定位置读取 → 核对结果",
  },
  "04-tools-monitoring": {
    analogy: "管理工具是 Kafka 的仪表盘，用来观察而不是替代对底层概念的理解。",
    symbols: "连接成功后重点看 Broker、Topic、Partition、Consumer Group 与 Lag。",
    workedExample: "同一个集群分别用 IDEA 插件、Offset Explorer 和监控平台连接，比较各自能看到的指标。",
    shapePath: "工具连接 → 读取元数据 → 查看消息与消费组 → 判断 Lag → 回到配置排错",
  },
  "05-spring-boot-basics": {
    analogy: "Spring Kafka 像把 Kafka 客户端封装成快递柜：KafkaTemplate 负责投递，@KafkaListener 负责取件。",
    symbols: "先盯住 bootstrap-servers、序列化器、Topic 和 group.id。",
    workedExample: "页面或接口触发 KafkaTemplate 发送消息，由监听器接收，并对照 Partition、Offset 与日志。",
    shapePath: "Controller → KafkaTemplate → Broker → @KafkaListener → 业务方法",
  },
  "06-producer-internals": {
    analogy: "生产者像分拣中心：先序列化，再选分区，批量装车，最后等待 Broker 确认。",
    symbols: "区分 key、partition、batch、acks、retry 和幂等性各自控制哪一步。",
    workedExample: "给消息设置相同 key，观察它们进入同一分区，再调整 acks 和重试参数比较可靠性。",
    shapePath: "消息 → Serializer → Partitioner → RecordAccumulator → Sender → Broker ACK",
  },
  "07-consumer-internals": {
    analogy: "消费者组像一组工人分工处理抽屉：同组内一个分区同时只交给一个工人。",
    symbols: "重点追踪 group.id、分区分配、poll、Offset 提交和 Rebalance。",
    workedExample: "启动多个同组消费者，观察分区重新分配，再关闭一个实例验证 Rebalance。",
    shapePath: "加入消费组 → 分配 Partition → poll 拉取 → 业务处理 → 提交 Offset",
  },
  "08-storage-offsets": {
    analogy: "Partition 是只追加的账本，Offset 是每条记录的页码，消费组保存自己读到哪一页。",
    symbols: "必须区分日志中的消息 Offset、Log End Offset 和消费者已提交 Offset。",
    workedExample: "先消费并提交，再重置消费组 Offset，验证同一批消息能否重新读取。",
    shapePath: "追加日志 → 分配 Offset → Consumer 拉取 → 提交进度 → __consumer_offsets",
  },
  "09-cluster-replication": {
    analogy: "副本像同一本账的多份备份，Leader 接收读写，Follower 持续追赶。",
    symbols: "把 Leader、Follower、ISR、LEO、HW 放在同一张分区复制图里理解。",
    workedExample: "三 Broker 集群中停止 Leader，观察新 Leader 选举以及 ISR、HW 的变化。",
    shapePath: "Producer → Leader → Follower 同步 → ISR → HW → Consumer 可见",
  },
  "10-kraft-cluster": {
    analogy: "KRaft 把集群元数据管理收回 Kafka，自身的 Controller Quorum 负责达成一致。",
    symbols: "核对 node.id、process.roles、controller.quorum.voters、listeners 与 cluster.id。",
    workedExample: "为多个节点使用同一 Cluster ID 格式化存储，再启动 Controller/Broker 并验证选举。",
    shapePath: "生成 Cluster ID → 格式化日志目录 → 启动 Quorum → 启动 Broker → 验证集群",
  },
};

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textFromNode((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function headingId(value: ReactNode) {
  return textFromNode(value)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function Icon({ name }: { name: "search" | "menu" | "check" | "star" | "close" | "arrow" }) {
  const icons = {
    search: "⌕",
    menu: "☰",
    check: "✓",
    star: "☆",
    close: "×",
    arrow: "→",
  };
  return <span aria-hidden="true">{icons[name]}</span>;
}

export default function Home() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedId, setSelectedId] = useState(0);
  const [markdown, setMarkdown] = useState("");
  const [loadedPath, setLoadedPath] = useState("");
  const [query, setQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState("01-course-overview");
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [transcriptPath, setTranscriptPath] = useState("");
  const [transcriptMarkdown, setTranscriptMarkdown] = useState("");
  const [loadedTranscriptPath, setLoadedTranscriptPath] = useState("");
  const [transcriptError, setTranscriptError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const transcriptCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch(withBasePath("/catalog.json"), { cache: "no-store" })
      .then((response) => response.json())
      .then((data: Catalog) => {
      const lessons = data.topics.flatMap((item) => item.lessons);
      const requested = Number(new URLSearchParams(window.location.search).get("lesson"));
      const saved = Number(localStorage.getItem("kafka-study-last-lesson"));
      const initial = lessons.find((item) => item.id === requested)
        ?? lessons.find((item) => item.id === saved)
        ?? lessons.find((item) => item.id === DEFAULT_LESSON)
        ?? lessons[0];
      setCatalog(data);
      setCompleted(readStoredIds("kafka-study-progress"));
      setFavorites(readStoredIds("kafka-study-favorites"));
      setSelectedId(initial.id);
      setExpandedTopic(initial.topic);
    });
  }, []);

  const allLessons = useMemo(
    () => catalog?.topics.flatMap((topic) => topic.lessons) ?? [],
    [catalog],
  );
  const lesson = allLessons.find((item) => item.id === selectedId) ?? allLessons[0];
  const loading = Boolean(lesson && loadedPath !== lesson.path);
  const topic = catalog?.topics.find((item) => item.slug === lesson?.topic);
  const kafkaGuide = lesson ? kafkaTopicGuides[lesson.topic] : null;
  const beginnerGuide = lesson && topic && kafkaGuide
    ? {
      premise: `这一章要解决的是：${topic.description}`,
      analogy: kafkaGuide.analogy,
      symbols: kafkaGuide.symbols,
      prerequisites: ["知道 Kafka 用 Topic 保存并传递事件", "会阅读简单命令、配置项或 Java 方法调用"],
      workedExample: kafkaGuide.workedExample,
      shapePath: kafkaGuide.shapePath,
      stages: [{ from: 1, to: topic.count, label: topic.title, goal: topic.description }],
      prerequisiteId: undefined as number | undefined,
      prerequisiteLabel: undefined as string | undefined,
    }
    : null;
  const currentStage = beginnerGuide && lesson
    ? beginnerGuide.stages.find((stage) => lesson.topicIndex >= stage.from && lesson.topicIndex <= stage.to)
    : null;
  const prerequisite = beginnerGuide?.prerequisiteId
    ? allLessons.find((item) => item.id === beginnerGuide.prerequisiteId)
    : null;

  useEffect(() => {
    if (!lesson) return;
    let cancelled = false;
    const versionedPath = `${withBasePath(lesson.path)}?v=${catalog?.version ?? "latest"}`;
    fetch(versionedPath, { cache: "no-store" })
      .then((response) => response.text())
      .then((text) => {
        if (cancelled) return;
        setMarkdown(text);
        setLoadedPath(lesson.path);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    return () => { cancelled = true; };
  }, [lesson, catalog?.version]);

  useEffect(() => {
    if (!catalog) return;
    const onPopState = () => {
      const requested = Number(new URLSearchParams(window.location.search).get("lesson"));
      const nextLesson = catalog.topics.flatMap((item) => item.lessons)
        .find((item) => item.id === requested);
      if (nextLesson) {
        setSelectedId(nextLesson.id);
        setExpandedTopic(nextLesson.topic);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [catalog]);

  useEffect(() => {
    if (!searchOpen || searchIndex) return;
    fetch(withBasePath("/search.json"), { cache: "no-store" })
      .then((response) => response.json())
      .then((data: SearchIndex) => setSearchIndex(data));
  }, [searchOpen, searchIndex]);

  useEffect(() => {
    if (!transcriptPath) return;
    let cancelled = false;

    fetch(`${withBasePath(transcriptPath)}?v=${catalog?.version ?? "latest"}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;
        setTranscriptMarkdown(new TextDecoder("utf-8").decode(buffer));
        setLoadedTranscriptPath(transcriptPath);
      })
      .catch(() => {
        if (!cancelled) setTranscriptError("原声记录暂时无法载入，请稍后重试。");
      });

    return () => { cancelled = true; };
  }, [transcriptPath, catalog?.version]);

  useEffect(() => {
    if (!transcriptPath) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTranscriptPath("");
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    window.setTimeout(() => transcriptCloseRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
      previous?.focus();
    };
  }, [transcriptPath]);

  useEffect(() => {
    if (!searchOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectLesson = useCallback((next: Lesson) => {
    setSelectedId(next.id);
    setExpandedTopic(next.topic);
    setSearchOpen(false);
    setSidebarOpen(false);
    setTranscriptPath("");
    localStorage.setItem("kafka-study-last-lesson", String(next.id));
    const url = new URL(window.location.href);
    url.searchParams.set("lesson", String(next.id));
    window.history.pushState({ lesson: next.id }, "", url);
  }, []);

  const toggleStored = (
    kind: "kafka-study-progress" | "kafka-study-favorites",
    current: Set<number>,
    setter: (next: Set<number>) => void,
  ) => {
    if (!lesson) return;
    const next = new Set(current);
    if (next.has(lesson.id)) next.delete(lesson.id);
    else next.add(lesson.id);
    setter(next);
    localStorage.setItem(kind, JSON.stringify([...next]));
  };

  const searchResults = useMemo<SearchResult[]>(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allLessons.slice(0, 12).map((item) => ({ lesson: item, snippet: item.excerpt }));
    const indexed = new Map(searchIndex?.lessons.map((item) => [item.id, item.text]) ?? []);
    return allLessons
      .map((item) => ({
        lesson: item,
        text: indexed.get(item.id) ?? `${item.title} ${item.excerpt} ${item.topicTitle}`,
      }))
      .filter((item) => item.text.toLowerCase().includes(needle))
      .map((item) => ({ lesson: item.lesson, snippet: searchSnippet(item.text, needle) }))
      .slice(0, 30);
  }, [allLessons, query, searchIndex]);

  const headings = useMemo(() => {
    return [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((match) => ({
      level: match[1].length,
      label: match[2].replace(/[*_`]/g, "").trim(),
      id: headingId(match[2]),
    }));
  }, [markdown]);

  const currentIndex = allLessons.findIndex((item) => item.id === lesson?.id);
  const previous = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < allLessons.length - 1
    ? allLessons[currentIndex + 1]
    : null;
  const progress = catalog ? Math.round((completed.size / catalog.total) * 100) : 0;

  const resolveAsset = (src?: string) => {
    if (!src || !lesson || /^(https?:|data:|blob:|mailto:|#)/.test(src)) return src;
    if (src.startsWith("/")) return withBasePath(src);
    return new URL(src, `${window.location.origin}${withBasePath(lesson.path)}`).pathname;
  };

  const openTranscript = (path: string) => {
    setTranscriptError("");
    setTranscriptMarkdown("");
    setLoadedTranscriptPath("");
    setTranscriptPath(path);
  };

  const handleMarkdownLink = (event: MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (!href || !lesson || !href.endsWith(".md") && !href.includes(".md#")) return;
    const resolved = resolveAsset(href)?.split("#")[0];
    if (isTranscriptPath(resolved)) {
      event.preventDefault();
      openTranscript(resolved ?? "");
      return;
    }
    const linkedLesson = allLessons.find((item) => item.path === withoutBasePath(resolved ?? ""));
    if (!linkedLesson) return;
    event.preventDefault();
    selectLesson(linkedLesson);
  };

  const renderMarkdownFragment = (source: string, key: string, headingPrefix = "") => (
    <ReactMarkdown
      key={key}
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 id={`${headingPrefix}${headingId(children)}`}>{children}</h1>,
        h2: ({ children }) => <h2 id={`${headingPrefix}${headingId(children)}`}>{children}</h2>,
        h3: ({ children }) => <h3 id={`${headingPrefix}${headingId(children)}`}>{children}</h3>,
        img: ({ src, alt }) => (
          <ZoomableImage
            src={typeof src === "string" ? resolveAsset(src) : undefined}
            alt={alt ?? "知识点示意图"}
          />
        ),
        a: ({ href, children }) => {
          const resolved = resolveAsset(href);
          if (isTranscriptPath(resolved)) {
            return (
              <button
                type="button"
                className="transcript-link"
                aria-haspopup="dialog"
                onClick={() => openTranscript(resolved ?? "")}
              >
                {children}
              </button>
            );
          }
          return (
            <a
              href={resolved}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer" : undefined}
              onClick={(event) => handleMarkdownLink(event, href)}
            >
              {children}
            </a>
          );
        },
        pre: ({ children }) => {
          const child = Children.only(children);
          if (
            isValidElement<{ className?: string; children?: ReactNode }>(child)
            && child.props.className === "language-mermaid"
          ) {
            return (
              <MermaidDiagram
                chart={textFromNode(child.props.children).replace(/\n$/, "")}
              />
            );
          }
          return <pre>{children}</pre>;
        },
      }}
    >
      {source}
    </ReactMarkdown>
  );

  const renderMarkdown = (source: string, prefix = "lesson") => (
    splitDetailsBlocks(source).map((segment, index) => {
      const key = `${prefix}-${index}`;
      if (segment.kind === "markdown") {
        return renderMarkdownFragment(segment.content, key, prefix === "transcript" ? "transcript-" : "");
      }
      return (
        <details className="answer-details" key={key}>
          <summary>{segment.summary}</summary>
          <div className="answer-details-body">
            {renderMarkdownFragment(segment.content, `${key}-body`, `${prefix}-answer-`)}
          </div>
        </details>
      );
    })
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="打开课程目录">
          <Icon name="menu" />
        </button>
        <a
          className="brand"
          href="?lesson=1"
          aria-label="Kafka 学习知识库首页"
          onClick={(event) => {
            const first = allLessons.find((item) => item.id === DEFAULT_LESSON);
            if (first) {
              event.preventDefault();
              selectLesson(first);
            }
          }}
        >
          <span>Kafka</span> Study
        </a>
        <button ref={searchTriggerRef} className="search-trigger" onClick={() => setSearchOpen(true)}>
          <Icon name="search" />
          <span>搜索 156 节笔记、代码与概念</span>
          <kbd>⌘ K</kbd>
        </button>
        <div className="top-progress">
          <span>学习进度</span>
          <strong>{progress}%</strong>
          <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <div className="workspace">
        <aside className={`course-sidebar ${sidebarOpen ? "is-open" : ""}`}>
          <div className="sidebar-mobile-head">
            <strong>课程目录</strong>
            <button className="icon-button" onClick={() => setSidebarOpen(false)} aria-label="关闭目录">
              <Icon name="close" />
            </button>
          </div>
          <div className="course-summary">
            <span className="eyebrow">零基础学习路径</span>
            <strong>从消息收发到 KRaft 集群</strong>
            <small>{catalog?.total ?? 156} 节 · 10 个专题</small>
          </div>
          <nav aria-label="课程章节">
            {catalog?.topics.map((item) => (
              <section className="topic-group" key={item.slug}>
                <button
                  className={`topic-button ${expandedTopic === item.slug ? "active" : ""}`}
                  onClick={() => setExpandedTopic(expandedTopic === item.slug ? "" : item.slug)}
                >
                  <span>{item.title}</span>
                  <small>{item.count}</small>
                </button>
                {expandedTopic === item.slug && (
                  <div className="lesson-list">
                    {item.lessons.map((itemLesson) => (
                      <button
                        className={`lesson-link ${itemLesson.id === lesson?.id ? "active" : ""}`}
                        key={itemLesson.id}
                        onClick={() => selectLesson(itemLesson)}
                      >
                        <i className={completed.has(itemLesson.id) ? "done" : ""}>
                          {completed.has(itemLesson.id) ? "✓" : String(itemLesson.topicIndex).padStart(2, "0")}
                        </i>
                        <span>{itemLesson.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </nav>
        </aside>

        {sidebarOpen && <button className="scrim" aria-label="关闭目录" onClick={() => setSidebarOpen(false)} />}

        <main className="reader">
          {lesson && (
            <>
              <div className="reader-meta">
                <span>{lesson.topicTitle}</span>
                <b>第 {lesson.id} 节</b>
                <span>{lesson.topicIndex} / {topic?.count}</span>
              </div>
              <div className="lesson-actions">
                <button
                  className={favorites.has(lesson.id) ? "is-favorite" : ""}
                  onClick={() => toggleStored("kafka-study-favorites", favorites, setFavorites)}
                >
                  <Icon name="star" /> {favorites.has(lesson.id) ? "已收藏" : "收藏"}
                </button>
                <button
                  className={completed.has(lesson.id) ? "is-complete" : ""}
                  onClick={() => toggleStored("kafka-study-progress", completed, setCompleted)}
                >
                  <Icon name="check" /> {completed.has(lesson.id) ? "已完成" : "标记完成"}
                </button>
              </div>
            </>
          )}

          <article className={`markdown-body ${loading ? "is-loading" : ""}`}>
            {lesson && beginnerGuide && !loading && (
              <section className="beginner-guide" aria-label="小白导读">
                <div className="beginner-guide-head">
                  <span>先看这里 · 小白导读</span>
                  <strong>
                    {currentStage
                      ? `你正在学习“${currentStage.label}”：${currentStage.goal}`
                      : "这节先不要背术语，沿着一条主线理解"}
                  </strong>
                </div>
                <div className="beginner-guide-grid">
                  <div>
                    <b>① 为什么要学</b>
                    <p>{beginnerGuide.premise}</p>
                  </div>
                  <div>
                    <b>② 用生活经验理解</b>
                    <p>{beginnerGuide.analogy}</p>
                  </div>
                  <div>
                    <b>③ 阅读时只盯住</b>
                    <p>{beginnerGuide.symbols}</p>
                  </div>
                </div>
                <details className="chapter-guide">
                  <summary>
                    <span>
                      <b>展开本章零基础导学</b>
                      <small>前置知识、完整例子、张量主线与分阶段学习顺序</small>
                    </span>
                    <i aria-hidden="true">⌄</i>
                  </summary>
                  <div className="chapter-guide-body">
                    <section>
                      <h3>开始本章前，只需要会这些</h3>
                      <ul>
                        {beginnerGuide.prerequisites.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </section>
                    <section>
                      <h3>先用一个例子贯穿本章</h3>
                      <p>{beginnerGuide.workedExample}</p>
                    </section>
                    <section>
                      <h3>始终贴在手边的形状主线</h3>
                      <code>{beginnerGuide.shapePath}</code>
                    </section>
                    <section>
                      <h3>本章应该按什么顺序学</h3>
                      <ol className="chapter-stage-list">
                        {beginnerGuide.stages.map((stage) => {
                          const active = currentStage === stage;
                          return (
                            <li className={active ? "active" : ""} key={`${stage.from}-${stage.to}`}>
                              <span>{stage.from === stage.to ? `第 ${stage.from} 节` : `第 ${stage.from}–${stage.to} 节`}</span>
                              <div>
                                <b>{stage.label}{active ? "（你在这里）" : ""}</b>
                                <p>{stage.goal}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                    <p className="chapter-guide-rule">
                      每一节都按同一套四问阅读：输入是什么？形状是什么？这一层改变了什么？它怎样影响最终预测？
                    </p>
                  </div>
                </details>
                {prerequisite && lesson.id !== 1 && (
                  <button onClick={() => selectLesson(prerequisite)}>
                    如果这里已经看不懂，先回到：{beginnerGuide.prerequisiteLabel}
                    <Icon name="arrow" />
                  </button>
                )}
              </section>
            )}
            {loading ? (
              <div className="article-loading">
                <i /><i /><i /><i /><i />
              </div>
            ) : (
              renderMarkdown(markdown)
            )}
          </article>

          <nav className="lesson-pagination" aria-label="前后课程">
            <button disabled={!previous} onClick={() => previous && selectLesson(previous)}>
              <small>上一节</small>
              <span>{previous?.title ?? "已经是第一节"}</span>
            </button>
            <button disabled={!next} onClick={() => next && selectLesson(next)}>
              <small>下一节 <Icon name="arrow" /></small>
              <span>{next?.title ?? "已经学完全部课程"}</span>
            </button>
          </nav>
        </main>

        <aside className="page-toc">
          <span className="eyebrow">本页目录</span>
          <nav>
            {headings.slice(0, 14).map((heading) => (
              <a key={`${heading.id}-${heading.label}`} className={heading.level === 3 ? "sub" : ""} href={`#${heading.id}`}>
                {heading.label}
              </a>
            ))}
          </nav>
          <div className="topic-progress-card">
            <span>专题进度</span>
            <strong>{topic?.title}</strong>
            <small>{topic ? topic.lessons.filter((item) => completed.has(item.id)).length : 0} / {topic?.count ?? 0} 节已完成</small>
            <div className="progress-track">
              <i style={{
                width: topic
                  ? `${(topic.lessons.filter((item) => completed.has(item.id)).length / topic.count) * 100}%`
                  : "0%",
              }} />
            </div>
          </div>
        </aside>
      </div>

      {searchOpen && (
        <div className="search-modal" role="dialog" aria-modal="true" aria-label="搜索课程">
          <button className="modal-backdrop" onClick={() => setSearchOpen(false)} aria-label="关闭搜索" />
          <div
            ref={searchPanelRef}
            className="search-panel"
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const focusable = searchPanelRef.current?.querySelectorAll<HTMLElement>(
                'input, button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
              );
              if (!focusable?.length) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
          >
            <div className="search-input-row">
              <Icon name="search" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="输入：Topic、Offset、拦截器、KRaft…"
              />
              <button onClick={() => setSearchOpen(false)}>ESC</button>
            </div>
            <div className="search-results">
              <div className="results-label">{query ? `找到 ${searchResults.length} 个匹配结果` : "推荐继续学习"}</div>
              {searchResults.map((result) => (
                <button key={result.lesson.id} onClick={() => selectLesson(result.lesson)}>
                  <span className="result-number">{result.lesson.id}</span>
                  <span>
                    <strong>{result.lesson.title}</strong>
                    <small>{result.lesson.topicTitle} · {result.snippet}</small>
                  </span>
                  <Icon name="arrow" />
                </button>
              ))}
              {searchResults.length === 0 && (
                <div className="empty-search">没有找到相关内容，试试更短的关键词。</div>
              )}
            </div>
          </div>
        </div>
      )}

      {transcriptPath && (
        <div className="transcript-modal" role="dialog" aria-modal="true" aria-label="完整原声逐段记录">
          <button
            className="transcript-backdrop"
            aria-label="关闭原声记录"
            onClick={() => setTranscriptPath("")}
          />
          <section className="transcript-panel">
            <header>
              <div>
                <span>原声核查资料</span>
                <strong>{lesson?.title}</strong>
              </div>
              <button ref={transcriptCloseRef} onClick={() => setTranscriptPath("")}>
                关闭
              </button>
            </header>
            <article className="markdown-body transcript-body">
              {transcriptError ? (
                <p className="transcript-error">{transcriptError}</p>
              ) : loadedTranscriptPath !== transcriptPath ? (
                <div className="article-loading" aria-label="正在载入原声记录">
                  <i /><i /><i /><i />
                </div>
              ) : (
                renderMarkdown(transcriptMarkdown, "transcript")
              )}
            </article>
          </section>
        </div>
      )}
    </div>
  );
}
