"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/constants/site";
import "@/styles/the-numbers.css";

function splitHeading(text) {
  return String(text || "")
    .split("|")
    .map((line) =>
      line
        .split(/(\*[^*]+\*)/g)
        .filter(Boolean)
        .map((part) => {
          const match = part.match(/^\*(.+)\*$/);
          return match ? { text: match[1], accent: true } : { text: part.replace(/\*/g, ""), accent: false };
        }),
    );
}

function formatStat(metric, amount) {
  const body = metric.decimals ? amount.toFixed(metric.decimals) : String(Math.round(amount));
  return `${metric.prefix || ""}${body}${metric.suffix || ""}`;
}

function chartPaths(points) {
  const width = 240;
  const height = 78;
  const step = width / Math.max(1, points.length - 1);
  const coords = points.map((point, index) => {
    const y = height - 6 - (Math.max(0, Math.min(100, point)) / 100) * (height - 14);
    return [index * step, y];
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return { line, area: `${line} L${width} ${height} L0 ${height} Z` };
}

export default function TheNumbers() {
  const tabs = siteConfig.numbersTabs || [];
  const feed = siteConfig.numbersFeed || [];
  const lines = splitHeading(siteConfig.numbersHeading);
  const section = useRef(null);
  const frame = useRef(0);
  const [tab, setTab] = useState(0);
  const [seen, setSeen] = useState(false);
  const [counts, setCounts] = useState(() => (tabs[0]?.metrics || []).map(() => 0));
  const report = tabs[tab] || tabs[0];

  useEffect(() => {
    const node = section.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setSeen(true);
      },
      { threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const metrics = tabs[tab]?.metrics || [];
    cancelAnimationFrame(frame.current);
    if (!seen) {
      setCounts(metrics.map(() => 0));
      return undefined;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCounts(metrics.map((metric) => metric.value));
      return undefined;
    }
    const start = performance.now();
    const run = (now) => {
      const t = Math.min(1, (now - start) / 1100);
      const ease = 1 - (1 - t) ** 3;
      setCounts(metrics.map((metric) => metric.value * ease));
      if (t < 1) frame.current = requestAnimationFrame(run);
    };
    setCounts(metrics.map(() => 0));
    frame.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame.current);
  }, [seen, tab, tabs]);

  if (!report) return null;

  const loop = [...feed, ...feed];

  return (
    <section id="numbers" ref={section} className={`nums${seen ? " is-on" : ""}`} aria-label="The numbers">
      <div className="nums-wrap">
        <div className="nums-top">
          <div>
            <p className="nums-kicker">
              <i aria-hidden="true" />
              {siteConfig.numbersKicker}
            </p>
            <h2 className="nums-title">
              {lines.map((line, lineIndex) => (
                <span key={lineIndex} className="nums-line">
                  {line.map((part, partIndex) =>
                    part.accent ? (
                      <em key={partIndex} className="nums-mark">
                        {part.text}
                      </em>
                    ) : (
                      <span key={partIndex}>{part.text}</span>
                    ),
                  )}
                </span>
              ))}
            </h2>
          </div>
          <p className="nums-body">{siteConfig.numbersBody}</p>
        </div>

        <div className="nums-card">
          <div className="nums-bar">
            <p className="nums-report">
              <i aria-hidden="true" />
              Client report · 2025
              <span>{siteConfig.numbersLive}</span>
            </p>
            <div className="nums-tabs" role="tablist" aria-label="Report">
              {tabs.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={index === tab}
                  className={index === tab ? "is-on" : ""}
                  onClick={() => setTab(index)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="nums-range">{siteConfig.numbersRange}</p>
          </div>

          <div className="nums-grid">
            {report.metrics.map((metric, index) => {
              const paths = chartPaths(metric.points || []);
              return (
                <article key={`${report.id}-${metric.n}`}>
                  <p className="nums-label">
                    <b>{metric.n}</b>
                    {metric.label}
                  </p>
                  <strong>{formatStat(metric, counts[index] || 0)}</strong>
                  <span className="nums-vs">
                    <i aria-hidden="true" />
                    {siteConfig.numbersNote}
                  </span>
                  <svg className="nums-chart" viewBox="0 0 240 78" preserveAspectRatio="none" aria-hidden="true">
                    <path className="nums-area" d={paths.area} />
                    <path className="nums-stroke" d={paths.line} pathLength="1" />
                  </svg>
                  <p className="nums-axis">
                    <span>Jan</span>
                    <span>Dec</span>
                  </p>
                </article>
              );
            })}
          </div>
        </div>

      </div>

      <div className="nums-ticker" aria-hidden="true">
        <div className="nums-ticker-track">
          {loop.map((item, index) => (
            <span key={`${item.who}-${item.when}-${index}`}>
              <i />
              {`${item.text} · ${item.who} · ${item.when}`}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
