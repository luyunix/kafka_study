"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DiagramLightbox } from "./DiagramLightbox";

type MermaidDiagramProps = {
  chart: string;
};

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const reactId = useId();
  const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
          themeVariables: {
            background: "#fbfdfc",
            primaryColor: "#e5f5f2",
            primaryTextColor: "#17343a",
            primaryBorderColor: "#55b8aa",
            secondaryColor: "#edf4ff",
            secondaryTextColor: "#17343a",
            secondaryBorderColor: "#7da9d6",
            tertiaryColor: "#f5efff",
            tertiaryTextColor: "#17343a",
            tertiaryBorderColor: "#a98bd1",
            lineColor: "#6f8e8c",
            textColor: "#294c50",
            mainBkg: "#e5f5f2",
            nodeBorder: "#55b8aa",
            clusterBkg: "#f4f9f8",
            clusterBorder: "#c6dcda",
            edgeLabelBackground: "#ffffff",
            noteBkgColor: "#fff8dc",
            noteBorderColor: "#d9bd65",
            noteTextColor: "#5b4b20",
            actorBkg: "#edf4ff",
            actorBorderColor: "#7da9d6",
            actorTextColor: "#17343a",
            actorLineColor: "#9eb6b4",
            signalColor: "#547a78",
            signalTextColor: "#294c50",
            labelBoxBkgColor: "#ffffff",
            labelBoxBorderColor: "#b8cecc",
            labelTextColor: "#294c50",
            loopTextColor: "#294c50",
            activationBkgColor: "#d9f1ec",
            activationBorderColor: "#55b8aa",
            sequenceNumberColor: "#ffffff",
            classText: "#17343a",
          },
          flowchart: {
            curve: "basis",
            htmlLabels: true,
            padding: 18,
          },
          sequence: {
            useMaxWidth: true,
            wrap: true,
            diagramMarginX: 24,
            diagramMarginY: 20,
          },
        });
        return mermaid.render(id, chart);
      })
      .then(({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "图表渲染失败");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart, id, visible]);

  if (error) {
    return (
      <div className="mermaid-error">
        <strong>这张图暂时无法显示</strong>
        <span>{error}</span>
        <details>
          <summary>查看 UML 源码</summary>
          <pre><code>{chart}</code></pre>
        </details>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mermaid-wrap">
      {!svg ? (
        <div className="mermaid-loading" aria-label="正在绘制 UML 图">
          <i /><span>{visible ? "正在绘制图表…" : "图表将在进入视野时加载"}</span>
        </div>
      ) : (
        <>
          <div className="diagram-toolbar">
            <span>流程图支持横向滚动</span>
            <button type="button" onClick={() => setExpanded(true)}>放大查看</button>
          </div>
          <figure
            className="mermaid-diagram"
            role="img"
            aria-label="课程 UML 与流程图"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {expanded && <DiagramLightbox svg={svg} onClose={() => setExpanded(false)} />}
        </>
      )}
    </div>
  );
}
