"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

type ResourceBlock =
  | { type: "paragraph"; content: string }
  | { type: "code"; language: string; content: string }
  | { type: "list"; items: string[] };

type LessonMeta = {
  id: string;
  number: number;
  title: string;
  duration: string;
  durationSeconds: number;
  chapter: number;
  chapterTitle: string;
};

type Lesson = LessonMeta & {
  conclusion: string;
  steps: string[];
  articleSections: {
    title: string;
    time: string;
    paragraphs: string[];
  }[];
  context: string;
  application: { label: string; value: string }[];
  terms: { term: string; meaning: string }[];
  visualCheck: string;
  pitfall: string;
  selfTest: string[];
  checklist: string[];
  videoUrl: string;
  diagram: string;
  resources: { title: string; blocks: ResourceBlock[] }[];
};

type SearchEntry = { number: number; text: string };

const COMPLETED_KEY = "kafka-study-completed";
const CHECKS_KEY = "kafka-study-checks-v2";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const assetUrl = (pathname: string) => `${BASE_PATH}${pathname}`;

const outline = [
  ["summary", "先看结论"],
  ["logic", "老师怎么讲"],
  ["article", "完整讲解"],
  ["practice", "动手实践"],
  ["terms", "关键术语"],
  ["review", "学完自测"],
];

function loadStored<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function StudyWorkspace() {
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [activeNumber, setActiveNumber] = useState(1);
  const [loadedLesson, setLoadedLesson] = useState<Lesson | null>(null);
  const [query, setQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchEntry[] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openChapters, setOpenChapters] = useState<Set<number>>(
    () => new Set([1]),
  );
  const [completed, setCompleted] = useState<number[]>([]);
  const [checks, setChecks] = useState<Record<string, number[]>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hashNumber = Number(window.location.hash.replace("#p", ""));
      if (hashNumber > 0) {
        setActiveNumber(hashNumber);
      }
      setCompleted(loadStored(COMPLETED_KEY, []));
      setChecks(loadStored(CHECKS_KEY, {}));
      fetch(assetUrl("/course-data/index.json"))
        .then((response) => response.json())
        .then((data: LessonMeta[]) => {
          setLessons(data);
          setReady(true);
        });
    });

    const syncHash = () => {
      const number = Number(window.location.hash.replace("#p", ""));
      if (number > 0) {
        setActiveNumber(number);
      }
    };
    window.addEventListener("hashchange", syncHash);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  const activeMeta =
    lessons.find((lesson) => lesson.number === activeNumber) ?? lessons[0];

  useEffect(() => {
    if (!activeMeta) return;
    const controller = new AbortController();
    fetch(
      assetUrl(`/course-data/lessons/p${String(activeMeta.number).padStart(3, "0")}.json`),
      { signal: controller.signal },
    )
      .then((response) => response.json())
      .then((lesson: Lesson) => {
        setLoadedLesson(lesson);
        setOpenChapters((current) => new Set(current).add(lesson.chapter));
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") throw error;
      });
    return () => controller.abort();
  }, [activeMeta]);

  useEffect(() => {
    if (!query.trim() || searchIndex) return;
    fetch(assetUrl("/course-data/search-index.json"))
      .then((response) => response.json())
      .then((data: SearchEntry[]) => setSearchIndex(data));
  }, [query, searchIndex]);

  const activeLesson =
    loadedLesson?.number === activeNumber ? loadedLesson : null;

  const chapters = useMemo(() => {
    return lessons.reduce<
      { number: number; title: string; lessons: LessonMeta[] }[]
    >((groups, lesson) => {
      let chapter = groups.find((group) => group.number === lesson.chapter);
      if (!chapter) {
        chapter = {
          number: lesson.chapter,
          title: lesson.chapterTitle,
          lessons: [],
        };
        groups.push(chapter);
      }
      chapter.lessons.push(lesson);
      return groups;
    }, []);
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return lessons;
    if (!searchIndex) {
      return lessons.filter((lesson) =>
        `${lesson.title} ${lesson.chapterTitle}`.toLowerCase().includes(keyword),
      );
    }
    const matches = new Set(
      searchIndex.filter((entry) => entry.text.includes(keyword)).map((entry) => entry.number),
    );
    return lessons.filter((lesson) => matches.has(lesson.number));
  }, [lessons, query, searchIndex]);

  const totalSeconds = lessons.reduce(
    (total, lesson) => total + lesson.durationSeconds,
    0,
  );
  const completedPercent = Math.round((completed.length / lessons.length) * 100);
  const activeChecks = activeLesson ? checks[activeLesson.id] ?? [] : [];

  const selectLesson = (number: number) => {
    setActiveNumber(number);
    setMenuOpen(false);
    window.history.pushState(
      null,
      "",
      `#p${number}`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleComplete = () => {
    const next = completed.includes(activeNumber)
      ? completed.filter((number) => number !== activeNumber)
      : [...completed, activeNumber].sort((a, b) => a - b);
    setCompleted(next);
    window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(next));
  };

  const toggleCheck = (index: number) => {
    if (!activeLesson) return;
    const current = checks[activeLesson.id] ?? [];
    const nextLessonChecks = current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index];
    const next = { ...checks, [activeLesson.id]: nextLessonChecks };
    setChecks(next);
    window.localStorage.setItem(CHECKS_KEY, JSON.stringify(next));
  };

  const activeIndex = lessons.findIndex((lesson) => lesson.number === activeNumber);
  const previous = activeIndex > 0 ? lessons[activeIndex - 1] : undefined;
  const next = activeIndex >= 0 ? lessons[activeIndex + 1] : undefined;
  const totalHours = Math.max(1, Math.round(totalSeconds / 3600));
  return (
    <div className="course-app">
      <header className="topbar">
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "关闭课程目录" : "打开课程目录"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="brand" aria-label="Kafka 学习手册">
          <span className="brand-mark">K</span>
          <span>
            <strong>Kafka 学习手册</strong>
            <small>从消息收发，到集群原理</small>
          </span>
        </div>

        <div className="course-stats" aria-label="课程概况">
          <span>{chapters.length} 个章节</span>
          <span>{lessons.length} 节课</span>
          <span>{totalHours} 小时</span>
        </div>

        <label className="search">
          <span className="search-icon" aria-hidden="true" />
          <span className="sr-only">搜索课程</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 Topic、Offset、Spring Boot…"
          />
          {query && (
            <button
              type="button"
              aria-label="清空搜索"
              onClick={() => setQuery("")}
            >
              ×
            </button>
          )}
        </label>

        <div className="header-progress">
          <span>{ready ? completedPercent : 0}%</span>
          <small>已完成</small>
        </div>
      </header>

      <div className="workspace">
        {menuOpen && (
          <button
            className="drawer-backdrop"
            type="button"
            aria-label="关闭课程目录"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
          <div className="sidebar-intro">
            <div>
              <span className="eyebrow">COURSE MAP</span>
              <h2>课程目录</h2>
            </div>
            <div
              className="progress-ring"
              style={{
                background: `conic-gradient(var(--blue) ${completedPercent * 3.6}deg, var(--line) 0deg)`,
              }}
              aria-label={`课程完成度 ${completedPercent}%`}
            >
              <span>{completed.length}</span>
              <small>/ {lessons.length}</small>
            </div>
          </div>

          {query ? (
            <div className="search-results">
              <p>
                找到 <strong>{filteredLessons.length}</strong> 节相关内容
              </p>
              {filteredLessons.map((lesson) => (
                <button
                  type="button"
                  key={lesson.id}
                  className={`lesson-row ${lesson.number === activeNumber ? "active" : ""}`}
                  onClick={() => selectLesson(lesson.number)}
                >
                  <span className="lesson-number">
                    {String(lesson.number).padStart(2, "0")}
                  </span>
                  <span className="lesson-row-copy">
                    <strong>{lesson.title}</strong>
                    <small>{lesson.chapterTitle}</small>
                  </span>
                </button>
              ))}
              {!filteredLessons.length && (
                <div className="empty-search">
                  <span>没有找到</span>
                  <p>换个更短的关键词试试</p>
                </div>
              )}
            </div>
          ) : (
            <nav className="chapter-list" aria-label="课程章节">
              {chapters.map((chapter) => (
                <section
                  className={`chapter ${openChapters.has(chapter.number) ? "" : "is-collapsed"}`}
                  key={chapter.number}
                  aria-labelledby={`chapter-${chapter.number}`}
                >
                  <button
                    type="button"
                    className="chapter-heading"
                    aria-expanded={openChapters.has(chapter.number)}
                    onClick={() => setOpenChapters((current) => {
                      const nextOpen = new Set(current);
                      if (nextOpen.has(chapter.number)) nextOpen.delete(chapter.number);
                      else nextOpen.add(chapter.number);
                      return nextOpen;
                    })}
                  >
                    <span>{String(chapter.number).padStart(2, "0")}</span>
                    <h3 id={`chapter-${chapter.number}`}>{chapter.title}</h3>
                    <small>{chapter.lessons.length} 节 <i aria-hidden="true">⌄</i></small>
                  </button>
                  {openChapters.has(chapter.number) && <div className="chapter-lessons">
                    {chapter.lessons.map((lesson) => (
                      <button
                        type="button"
                        key={lesson.id}
                        data-lesson={lesson.id}
                        className={`lesson-row ${lesson.number === activeNumber ? "active" : ""}`}
                        onClick={() => selectLesson(lesson.number)}
                      >
                        <span
                          className={`lesson-status ${completed.includes(lesson.number) ? "done" : ""}`}
                          aria-label={
                            completed.includes(lesson.number)
                              ? "已完成"
                              : "未完成"
                          }
                        >
                          {completed.includes(lesson.number)
                            ? "✓"
                            : String(lesson.number).padStart(2, "0")}
                        </span>
                        <span className="lesson-row-copy">
                          <strong>{lesson.title}</strong>
                          <small>{lesson.duration}</small>
                        </span>
                      </button>
                    ))}
                  </div>}
                </section>
              ))}
            </nav>
          )}
        </aside>

        <main className="reader">
          {activeLesson ? <article key={activeLesson.id}>
            <header className="lesson-hero">
              <div className="lesson-meta">
                <span>第 {activeLesson.chapter} 章</span>
                <i />
                <span>{activeLesson.chapterTitle}</span>
                <i />
                <span>{activeLesson.duration}</span>
              </div>
              <div className="lesson-title-row">
                <div className="lesson-index">
                  <span>LESSON</span>
                  <strong>{String(activeLesson.number).padStart(2, "0")}</strong>
                </div>
                <div>
                  <h1>{activeLesson.title}</h1>
                  <p>{activeLesson.context}</p>
                </div>
              </div>
            </header>

            <section className="conclusion-card" id="summary">
              <div className="section-kicker">
                <span>01</span>
                <strong>先看结论</strong>
              </div>
              <blockquote>{activeLesson.conclusion}</blockquote>
            </section>

            <section className="content-section" id="logic">
              <div className="section-heading">
                <div>
                  <span>02 / CORE LOGIC</span>
                  <h2>老师怎么一步步讲</h2>
                </div>
                <p>先抓住本节主线，再进入老师完整的解释、演示和排错过程。</p>
              </div>
              <ol className="logic-steps">
                {activeLesson.steps.map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="content-section teacher-article" id="article">
              <div className="section-heading">
                <div>
                  <span>03 / FULL EXPLANATION</span>
                  <h2>老师的详细讲解与补充说明</h2>
                </div>
                <p>按视频时间顺序完整保留原因、案例、操作过程、提醒与排错细节。</p>
              </div>
              <div className="article-intro">
                <strong>这部分不是要点复述</strong>
                <p>
                  这里按原声顺序还原老师为什么这样做、每一步如何操作、看到什么结果，以及老师随口补充的注意事项。右侧时间可返回视频定位。
                </p>
              </div>
              <div className="article-sections">
                {activeLesson.articleSections.map((section, index) => (
                  <section key={`${section.time}-${section.title}`}>
                    <header>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <h3>{section.title}</h3>
                      <time>{section.time}</time>
                    </header>
                    <div>
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            {activeLesson.resources.length > 0 && (
              <section className="content-section resource-section">
                <div className="section-heading">
                  <div>
                    <span>LAB / DETAILS</span>
                    <h2>本节实操与补充材料</h2>
                  </div>
                  <p>命令、配置和白话解释全部保留，用来跟着老师复现。</p>
                </div>
                <div className="resource-sections">
                  {activeLesson.resources.map((resource) => (
                    <section key={resource.title}>
                      <h3>{resource.title}</h3>
                      {resource.blocks.map((block, index) => {
                        if (block.type === "code") {
                          return (
                            <pre key={`${resource.title}-code-${index}`}>
                              <code>{block.content}</code>
                            </pre>
                          );
                        }
                        if (block.type === "list") {
                          return (
                            <ul key={`${resource.title}-list-${index}`}>
                              {block.items.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                          );
                        }
                        return <p key={`${resource.title}-p-${index}`}>{block.content}</p>;
                      })}
                    </section>
                  ))}
                </div>
              </section>
            )}

            {activeLesson.diagram && (
              <section className="diagram-card">
                <div className="diagram-copy">
                  <span className="eyebrow">CONCEPT MAP</span>
                  <h2>把逻辑画出来</h2>
                  <p>先看关系，再回到老师的操作和解释中验证细节。</p>
                </div>
                <div className="diagram-frame">
                  <img
                    src={assetUrl(activeLesson.diagram)}
                    alt={`${activeLesson.title}概念图`}
                  />
                </div>
              </section>
            )}

            <section className="content-section" id="practice">
              <div className="section-heading">
                <div>
                  <span>04 / ACTION</span>
                  <h2>动手实践</h2>
                </div>
                <p>不只看懂，还要能复述、复现并验证运行结果。</p>
              </div>
              <div className="action-grid">
                {activeLesson.application.map((item, index) => (
                  <div className="action-card" key={item.label}>
                    <span>0{index + 1}</span>
                    <small>{item.label}</small>
                    <p>{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="content-section" id="terms">
              <div className="section-heading">
                <div>
                  <span>05 / VOCABULARY</span>
                  <h2>关键术语</h2>
                </div>
                <p>先统一概念，讨论才不会各说各话。</p>
              </div>
              <dl className="term-list">
                {activeLesson.terms.map((item) => (
                  <div key={item.term}>
                    <dt>{item.term}</dt>
                    <dd>{item.meaning}</dd>
                  </div>
                ))}
              </dl>
              <div className="pitfall">
                <span aria-hidden="true">!</span>
                <div>
                  <strong>最容易踩的坑</strong>
                  <p>{activeLesson.pitfall}</p>
                </div>
              </div>
            </section>

            <section className="review-card" id="review">
              <div className="review-header">
                <div>
                  <span>06 / REVIEW</span>
                  <h2>学完自测</h2>
              <p>能讲清、能判断、能行动，才算真的学会。</p>
                </div>
                <div className="check-count">
                  <strong>{activeChecks.length}</strong>
                  <span>/ {activeLesson.checklist.length}</span>
                </div>
              </div>
              <ol className="self-test">
                {activeLesson.selfTest.map((item, index) => (
                  <li key={item}>
                    <span>{index + 1}</span>
                    <p>{item}</p>
                  </li>
                ))}
              </ol>
              <div className="checklist">
                {activeLesson.checklist.map((item, index) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={activeChecks.includes(index)}
                      onChange={() => toggleCheck(index)}
                    />
                    <span className="custom-check" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </label>
                ))}
              </div>
              <div className="review-actions">
                <a
                  className="video-link"
                  href={activeLesson.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  打开原视频
                  <span aria-hidden="true">↗</span>
                </a>
                <button
                  className={`complete-button ${completed.includes(activeNumber) ? "completed" : ""}`}
                  type="button"
                  onClick={toggleComplete}
                >
                  {completed.includes(activeNumber)
                    ? "✓ 本节已完成"
                    : "标记本节完成"}
                </button>
              </div>
            </section>

            <nav className="lesson-pagination" aria-label="课节导航">
              {previous ? (
                <button
                  type="button"
                  onClick={() => selectLesson(previous.number)}
                >
                  <span>← 上一节</span>
                  <strong>{previous.title}</strong>
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button
                  className="next"
                  type="button"
                  onClick={() => selectLesson(next.number)}
                >
                  <span>下一节 →</span>
                  <strong>{next.title}</strong>
                </button>
              ) : (
                <span />
              )}
            </nav>
          </article> : (
            <div className="lesson-loading" role="status">
              <span className="eyebrow">LOADING LESSON</span>
              <p>正在载入老师的完整讲解…</p>
            </div>
          )}
        </main>

        <aside className="outline" aria-label="本页目录">
          <span className="eyebrow">ON THIS PAGE</span>
          <nav>
            {outline.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                <span />
                {label}
              </a>
            ))}
          </nav>
          <div className="outline-note">
            <span>学习提示</span>
            <p>先抓主线，再读老师的完整解释、操作过程、案例和排错提醒。</p>
          </div>
          <div className="mini-progress">
            <span>课程进度</span>
            <strong>{completedPercent}%</strong>
            <div>
              <i style={{ width: `${completedPercent}%` }} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
