(() => {
    const state = {
        catalog: null,
        lessons: [],
        currentLesson: null,
        completed: new Set(JSON.parse(localStorage.getItem("kafka-study-completed") || "[]")),
    };

    const byId = id => document.getElementById(id);
    const views = ["dashboardView", "readerView", "searchView"];
    const escapeHtml = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    function persistProgress() {
        localStorage.setItem("kafka-study-completed", JSON.stringify([...state.completed]));
        updateProgress();
    }

    function showView(id) {
        views.forEach(viewId => byId(viewId).hidden = viewId !== id);
        window.scrollTo({top: 0, behavior: "smooth"});
    }

    function updateProgress() {
        const count = state.completed.size;
        const percent = Math.round(count / state.catalog.lessonCount * 100);
        byId("completedCount").textContent = count;
        byId("progressPercent").textContent = `${percent}%`;
        byId("progressRing").style.background =
            `conic-gradient(var(--blue) ${percent * 3.6}deg, #dce7f6 0deg)`;

        document.querySelectorAll("[data-chapter-progress]").forEach(element => {
            const chapter = state.catalog.chapters.find(item => item.id === element.dataset.chapterProgress);
            const completed = chapter.lessons.filter(lesson => state.completed.has(lesson.id)).length;
            element.textContent = `${completed}/${chapter.lessonCount}`;
        });
        updateContinueCard();
    }

    function updateContinueCard() {
        const lastId = localStorage.getItem("kafka-study-last");
        const lastIndex = state.lessons.findIndex(lesson => lesson.id === lastId);
        const nextLesson = state.lessons.find(lesson => !state.completed.has(lesson.id))
            || state.lessons[Math.max(lastIndex, 0)]
            || state.lessons[0];
        byId("continueIndex").textContent = `P${String(nextLesson.number).padStart(2, "0")}`;
        byId("continueLabel").textContent = state.completed.size ? "继续你的学习" : "建议从这里开始";
        byId("continueTitle").textContent = nextLesson.title;
        byId("continueMeta").textContent = `${nextLesson.chapterTitle} · ${nextLesson.duration}`;
        byId("continueButton").textContent = state.completed.size ? "继续学习" : "开始学习";
        byId("continueButton").onclick = () => openLesson(nextLesson);
        byId("continueArrow").onclick = () => openLesson(nextLesson);
        byId("continueCard").onclick = event => {
            if (!event.target.closest("button")) openLesson(nextLesson);
        };
    }

    function renderNavigation() {
        byId("chapterNav").innerHTML = state.catalog.chapters.map(chapter => `
            <button type="button" data-chapter="${chapter.id}">
                <span class="chapter-number">${String(chapter.number).padStart(2, "0")}</span>
                <span>${escapeHtml(chapter.title)}</span>
                <small>${chapter.lessonCount}</small>
            </button>
        `).join("");

        byId("chapterGrid").innerHTML = state.catalog.chapters.map(chapter => `
            <button class="chapter-card" type="button" data-chapter-card="${chapter.id}">
                <span class="chapter-no">CH.${String(chapter.number).padStart(2, "0")}</span>
                <span>
                    <h3>${escapeHtml(chapter.title)}</h3>
                    <p>P${chapter.start}–P${chapter.end} · ${escapeHtml(chapter.summary)}</p>
                </span>
                <span class="chapter-progress" data-chapter-progress="${chapter.id}">0/${chapter.lessonCount}</span>
            </button>
        `).join("");

        document.querySelectorAll("[data-chapter], [data-chapter-card]").forEach(button => {
            button.addEventListener("click", () => {
                const chapterId = button.dataset.chapter || button.dataset.chapterCard;
                const chapter = state.catalog.chapters.find(item => item.id === chapterId);
                renderChapterResults(chapter);
                closeSidebar();
            });
        });
    }

    function renderChapterResults(chapter) {
        byId("searchInput").value = "";
        byId("searchSummary").textContent =
            `第 ${chapter.number} 章 · P${chapter.start}–P${chapter.end} · ${chapter.lessonCount} 节`;
        byId("searchResults").innerHTML = chapter.lessons.map(searchResultHtml).join("");
        bindResultButtons();
        byId("breadcrumbs").textContent = chapter.title;
        document.querySelectorAll("[data-chapter]").forEach(button => {
            button.classList.toggle("active", button.dataset.chapter === chapter.id);
        });
        showView("searchView");
    }

    function searchResultHtml(lesson) {
        const done = state.completed.has(lesson.id);
        return `
            <button class="search-result" type="button" data-lesson="${lesson.id}">
                <span>P${String(lesson.number).padStart(2, "0")}</span>
                <span>
                    <strong>${escapeHtml(lesson.title)}</strong>
                    <small>${escapeHtml(lesson.chapterTitle)} · ${lesson.duration}${done ? " · 已学完" : ""}</small>
                </span>
                <span>${done ? "✓" : "→"}</span>
            </button>
        `;
    }

    function bindResultButtons() {
        document.querySelectorAll("[data-lesson]").forEach(button => {
            button.addEventListener("click", () => {
                const lesson = state.lessons.find(item => item.id === button.dataset.lesson);
                openLesson(lesson);
            });
        });
    }

    function searchLessons(query) {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            showDashboard();
            return;
        }
        const results = state.lessons.filter(lesson =>
            `${lesson.number} ${lesson.title} ${lesson.chapterTitle}`.toLowerCase().includes(normalized)
        );
        byId("searchSummary").textContent = `“${query}” 找到 ${results.length} 节课程`;
        byId("searchResults").innerHTML = results.length
            ? results.map(searchResultHtml).join("")
            : '<div class="empty-search">没有找到课程。可以试试“Offset”“Spring Boot”“分区”或“副本”。</div>';
        bindResultButtons();
        byId("breadcrumbs").textContent = "搜索课程";
        showView("searchView");
    }

    function showDashboard() {
        byId("breadcrumbs").textContent = "学习工作台";
        document.querySelectorAll("[data-chapter]").forEach(button => button.classList.remove("active"));
        showView("dashboardView");
    }

    function inlineMarkdown(text, baseUrl) {
        return text
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, source) =>
                `<img src="${new URL(source, baseUrl).pathname}" alt="${alt}" loading="lazy">`)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, target) => {
                const url = target.startsWith("http") ? target : new URL(target, baseUrl).pathname;
                const external = target.startsWith("http") ? ' target="_blank" rel="noreferrer"' : "";
                return `<a href="${url}"${external}>${label}</a>`;
            })
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    }

    function renderMarkdown(markdown, lesson) {
        const baseUrl = new URL(`/course-notes/${lesson.path}`, window.location.origin);
        const lines = markdown.replace(/\r/g, "").split("\n");
        const output = [];
        let code = false;
        let codeLanguage = "";
        let codeLines = [];
        let listType = null;

        const closeList = () => {
            if (listType) output.push(`</${listType}>`);
            listType = null;
        };

        for (const rawLine of lines) {
            if (rawLine.startsWith("```")) {
                if (!code) {
                    closeList();
                    code = true;
                    codeLanguage = rawLine.slice(3).trim();
                    codeLines = [];
                } else {
                    output.push(`<pre data-language="${escapeHtml(codeLanguage)}"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
                    code = false;
                }
                continue;
            }
            if (code) {
                codeLines.push(rawLine);
                continue;
            }
            const line = escapeHtml(rawLine);
            if (!line.trim()) {
                closeList();
                continue;
            }
            const heading = /^(#{1,4})\s+(.+)$/.exec(line);
            if (heading) {
                closeList();
                const level = heading[1].length;
                output.push(`<h${level}>${inlineMarkdown(heading[2], baseUrl)}</h${level}>`);
                continue;
            }
            if (/^---+$/.test(line)) {
                closeList();
                output.push("<hr>");
                continue;
            }
            if (line.startsWith("&gt; ")) {
                closeList();
                output.push(`<blockquote>${inlineMarkdown(line.slice(5), baseUrl)}</blockquote>`);
                continue;
            }
            const unordered = /^[-*]\s+(.+)$/.exec(line);
            const ordered = /^\d+\.\s+(.+)$/.exec(line);
            if (unordered || ordered) {
                const desired = unordered ? "ul" : "ol";
                if (listType !== desired) {
                    closeList();
                    listType = desired;
                    output.push(`<${desired}>`);
                }
                const content = (unordered || ordered)[1].replace(/^\[([ xX])]\s*/, (_, checked) =>
                    checked.toLowerCase() === "x" ? "✓ " : "□ ");
                output.push(`<li>${inlineMarkdown(content, baseUrl)}</li>`);
                continue;
            }
            closeList();
            output.push(`<p>${inlineMarkdown(line, baseUrl)}</p>`);
        }
        closeList();
        return output.join("\n").replace(
            /(<h2>老师的完整讲解顺序[^<]*<\/h2>)([\s\S]*?)(<h2>关键术语<\/h2>)/,
            '<details class="asr-details"><summary>展开老师完整原声讲解（ASR 辅助复核）</summary>$1$2</details>$3'
        );
    }

    async function openLesson(lesson, pushHash = true) {
        state.currentLesson = lesson;
        if (lesson.number > 0) localStorage.setItem("kafka-study-last", lesson.id);
        byId("article").innerHTML = '<div class="article-loading">正在加载课程笔记…</div>';
        byId("breadcrumbs").textContent = `${lesson.chapterTitle} / ${lesson.number ? `P${lesson.number}` : "速查"}`;
        byId("videoLink").hidden = lesson.number === 0;
        byId("videoLink").href = `https://www.bilibili.com/video/BV14J4m187jz?p=${lesson.number}`;
        byId("completeButton").hidden = lesson.number === 0;
        updateCompleteButton();
        updatePager();
        showView("readerView");
        if (pushHash && lesson.number > 0) history.replaceState(null, "", `#${lesson.id}`);

        try {
            const response = await fetch(`/course-notes/${lesson.path}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const markdown = await response.text();
            byId("article").innerHTML = renderMarkdown(markdown, lesson);
            bindArticleLinks();
        } catch (error) {
            byId("article").innerHTML =
                `<div class="article-loading">课程笔记加载失败：${escapeHtml(error.message)}</div>`;
        }
    }

    function bindArticleLinks() {
        byId("article").querySelectorAll('a[href$=".md"]').forEach(link => {
            link.addEventListener("click", event => {
                const pathname = decodeURIComponent(new URL(link.href).pathname);
                const marker = "/course-notes/";
                const notePath = pathname.slice(pathname.indexOf(marker) + marker.length);
                const lesson = state.lessons.find(item => item.path === notePath);
                if (lesson) {
                    event.preventDefault();
                    openLesson(lesson);
                }
            });
        });
    }

    function updateCompleteButton() {
        if (!state.currentLesson || state.currentLesson.number === 0) return;
        const done = state.completed.has(state.currentLesson.id);
        byId("completeButton").textContent = done ? "✓ 已学完" : "标记为已学完";
        byId("completeButton").classList.toggle("done", done);
    }

    function updatePager() {
        const index = state.lessons.findIndex(lesson => lesson.id === state.currentLesson.id);
        const commandPage = state.currentLesson.number === 0;
        byId("previousLesson").hidden = commandPage;
        byId("nextLesson").hidden = commandPage;
        byId("previousLesson").disabled = index <= 0;
        byId("nextLesson").disabled = index >= state.lessons.length - 1;
        byId("previousLesson").onclick = () => index > 0 && openLesson(state.lessons[index - 1]);
        byId("nextLesson").onclick = () => index < state.lessons.length - 1 && openLesson(state.lessons[index + 1]);
    }

    function closeSidebar() {
        byId("sidebar").classList.remove("open");
        byId("sidebarScrim").classList.remove("show");
    }

    function bindEvents() {
        byId("searchInput").addEventListener("input", event => searchLessons(event.target.value));
        byId("backButton").addEventListener("click", () => {
            history.replaceState(null, "", location.pathname);
            showDashboard();
        });
        byId("completeButton").addEventListener("click", () => {
            const id = state.currentLesson.id;
            state.completed.has(id) ? state.completed.delete(id) : state.completed.add(id);
            persistProgress();
            updateCompleteButton();
        });
        byId("commandButton").addEventListener("click", () => {
            openLesson({
                id: "commands",
                number: 0,
                title: "Kafka 实操命令速查",
                chapterTitle: "学习工具",
                path: "00-practical-command-reference.md",
            });
        });
        byId("resetProgress").addEventListener("click", () => {
            if (!confirm("确定清空当前浏览器中的学习进度吗？")) return;
            state.completed.clear();
            localStorage.removeItem("kafka-study-last");
            persistProgress();
        });
        byId("menuButton").addEventListener("click", () => {
            byId("sidebar").classList.add("open");
            byId("sidebarScrim").classList.add("show");
        });
        byId("sidebarScrim").addEventListener("click", closeSidebar);
        document.addEventListener("keydown", event => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                byId("searchInput").focus();
            }
            if (event.key === "Escape") closeSidebar();
        });
    }

    async function init() {
        const response = await fetch("/course-catalog.json");
        state.catalog = await response.json();
        state.lessons = state.catalog.chapters.flatMap(chapter => chapter.lessons);
        renderNavigation();
        bindEvents();
        updateProgress();

        const hashLesson = state.lessons.find(lesson => `#${lesson.id}` === location.hash);
        hashLesson ? openLesson(hashLesson, false) : showDashboard();
    }

    init().catch(error => {
        byId("mainContent").innerHTML =
            `<div class="empty-search">学习目录加载失败：${escapeHtml(error.message)}</div>`;
    });
})();
