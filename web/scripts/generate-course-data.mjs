import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const notesRoot = path.resolve(webRoot, "..", "notes");
const catalog = JSON.parse(
  await readFile(path.join(webRoot, "public", "course-catalog.json"), "utf8"),
);

const cleanInline = (value) =>
  value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s*/, "")
    .trim();

const section = (markdown, title) => {
  const marker = `## ${title}`;
  const start = markdown.indexOf(marker);
  if (start === -1) return "";
  const contentStart = start + marker.length;
  const next = markdown.indexOf("\n## ", contentStart);
  return markdown.slice(contentStart, next === -1 ? undefined : next).trim();
};

const paragraph = (markdown) =>
  markdown
    .split("\n")
    .filter(
      (line) =>
        line.trim() &&
        !line.startsWith("#") &&
        !line.startsWith("![") &&
        !line.startsWith("```") &&
        !/^[-*]\s+/.test(line) &&
        !/^\d+\.\s+/.test(line),
    )
    .map(cleanInline)
    .join(" ");

const numberedItems = (markdown) =>
  markdown
    .split("\n")
    .map((line) => line.match(/^\d+\.\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(cleanInline);

const checklistItems = (markdown) =>
  markdown
    .split("\n")
    .map((line) => line.match(/^- \[[ xX]\]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(cleanInline);

const termItems = (markdown) =>
  markdown
    .split("\n")
    .map((line) => line.match(/^- \*\*(.+?)：\*\*\s*(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      term: cleanInline(match[1]),
      meaning: cleanInline(match[2]),
    }));

const tableRows = (markdown) =>
  markdown
    .split("\n")
    .map((line) => {
      if (!line.trim().startsWith("|")) return null;
      const cells = line
        .split("|")
        .slice(1, -1)
        .map(cleanInline);
      if (
        cells.length !== 2 ||
        cells[0] === "项目" ||
        cells.every((cell) => /^-+$/.test(cell))
      ) return null;
      return { label: cells[0], value: cells[1] };
    })
    .filter(Boolean);

const articleSections = (markdown) => {
  const source = section(markdown, "老师的补充说明");
  const lines = source.split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(
      /^###\s+(.+?)\s+·\s+(\d{2}:\d{2})[–-](\d{2}:\d{2})$/,
    );
    if (heading) {
      current = {
        title: cleanInline(heading[1]),
        time: `${heading[2]}–${heading[3]}`,
        paragraphs: [],
      };
      sections.push(current);
      continue;
    }
    const value = cleanInline(line);
    if (current && value && !value.startsWith("这一部分是正文") && !value.startsWith("内容已做")) {
      current.paragraphs.push(value);
    }
  }

  return sections;
};

const parseResourceBlocks = (markdown) => {
  const blocks = [];
  let inCode = false;
  let language = "";
  let code = [];
  let list = [];

  const closeList = () => {
    if (list.length) blocks.push({ type: "list", items: list });
    list = [];
  };

  for (const rawLine of markdown.split("\n")) {
    if (rawLine.startsWith("```")) {
      if (!inCode) {
        closeList();
        inCode = true;
        language = rawLine.slice(3).trim();
        code = [];
      } else {
        blocks.push({ type: "code", language, content: code.join("\n") });
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      code.push(rawLine);
      continue;
    }
    const listItem = rawLine.match(/^[-*]\s+(.+)$/)?.[1];
    if (listItem) {
      list.push(cleanInline(listItem));
      continue;
    }
    closeList();
    const value = cleanInline(rawLine);
    if (value && !value.startsWith("### ")) {
      blocks.push({ type: "paragraph", content: value });
    }
  }
  closeList();
  return blocks;
};

const extraSections = (markdown) => {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  return matches
    .map((match, index) => {
      const title = match[1].trim();
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? markdown.length;
      return { title, content: markdown.slice(start, end).trim() };
    })
    .filter(({ title }) => title.startsWith("先用") || title.startsWith("先把"))
    .map(({ title, content }) => ({ title, blocks: parseResourceBlocks(content) }));
};

const durationSeconds = (duration) => {
  const parts = duration.split(":").map(Number);
  return parts.reduce((total, value) => total * 60 + value, 0);
};

const lessons = [];
for (const chapter of catalog.chapters) {
  for (const lesson of chapter.lessons) {
    const notePath = path.join(notesRoot, lesson.path);
    const markdown = await readFile(notePath, "utf8");
    const conclusionSource = section(markdown, "先看结论");
    const contextSource = section(markdown, "放进整套课").split("### 记忆路线")[0];
    const steps = numberedItems(section(markdown, "老师怎么一步步讲"));
    const selfTest = numberedItems(section(markdown, "自测"));
    const checklist = checklistItems(section(markdown, "学完检查"));
    const diagramMatch = markdown.match(/!\[[^\]]*\]\(([^)]+-concept\.svg)\)/);
    let diagram = "";
    if (diagramMatch) {
      const publicDiagramPath = path.posix.normalize(
        path.posix.join(path.posix.dirname(lesson.path), diagramMatch[1]),
      );
      const diagramTarget = path.join(
        webRoot,
        "public",
        "course-notes",
        publicDiagramPath,
      );
      await mkdir(path.dirname(diagramTarget), { recursive: true });
      await copyFile(
        path.resolve(path.dirname(notePath), diagramMatch[1]),
        diagramTarget,
      );
      diagram = `/course-notes/${publicDiagramPath}`;
    }
    const conclusion = paragraph(conclusionSource);

    lessons.push({
      id: lesson.id,
      number: lesson.number,
      title: lesson.title,
      duration: lesson.duration,
      durationSeconds: durationSeconds(lesson.duration),
      chapter: chapter.number,
      chapterTitle: chapter.title,
      conclusion,
      steps: steps.slice(0, 5),
      articleSections: articleSections(markdown),
      context: paragraph(contextSource),
      application: tableRows(section(markdown, "用在工作里")),
      terms: termItems(section(markdown, "关键术语")),
      visualCheck: paragraph(section(markdown, "关键画面核对")),
      pitfall: paragraph(section(markdown, "最容易踩的坑")),
      selfTest,
      checklist,
      videoUrl: `https://www.bilibili.com/video/BV14J4m187jz?p=${lesson.number}`,
      diagram,
      resources: extraSections(markdown),
    });
  }
}

await writeFile(
  path.join(webRoot, "app", "course-data.json"),
  `${JSON.stringify(lessons, null, 2)}\n`,
);

const publicDataRoot = path.join(webRoot, "public", "course-data");
const lessonDataRoot = path.join(publicDataRoot, "lessons");
await mkdir(lessonDataRoot, { recursive: true });

const index = lessons.map((lesson) => ({
  id: lesson.id,
  number: lesson.number,
  title: lesson.title,
  duration: lesson.duration,
  durationSeconds: lesson.durationSeconds,
  chapter: lesson.chapter,
  chapterTitle: lesson.chapterTitle,
}));
const searchIndex = lessons.map((lesson) => ({
  number: lesson.number,
  text: [
    lesson.title,
    lesson.chapterTitle,
    lesson.conclusion,
    ...lesson.steps,
    ...lesson.articleSections.flatMap((item) => [item.title, ...item.paragraphs]),
    ...lesson.terms.flatMap((item) => [item.term, item.meaning]),
  ].join(" ").toLowerCase(),
}));

await writeFile(
  path.join(publicDataRoot, "index.json"),
  `${JSON.stringify(index)}\n`,
);
await writeFile(
  path.join(publicDataRoot, "search-index.json"),
  `${JSON.stringify(searchIndex)}\n`,
);
for (const lesson of lessons) {
  await writeFile(
    path.join(lessonDataRoot, `p${String(lesson.number).padStart(3, "0")}.json`),
    `${JSON.stringify(lesson)}\n`,
  );
}

const missingArticles = lessons.filter((lesson) => !lesson.articleSections.length);
if (missingArticles.length) {
  throw new Error(`Missing teacher explanations: ${missingArticles.map((lesson) => lesson.id).join(", ")}`);
}

console.log(`Generated ${lessons.length} Kafka lessons with complete teacher explanations.`);
