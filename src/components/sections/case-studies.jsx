"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/constants/site";
import "@/styles/case-studies.css";

function parseStat(value) {
  const text = String(value ?? "");
  const match = text.match(/^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/);
  if (!match) return { prefix: "", number: 0, suffix: text, decimals: 0, grouped: false };
  const raw = match[2].replace(/,/g, "");
  return {
    prefix: match[1],
    number: Number(raw),
    suffix: match[3],
    decimals: raw.includes(".") ? raw.split(".")[1].length : 0,
    grouped: match[2].includes(","),
  };
}

function formatStat(spec, amount) {
  if (spec.decimals) return `${spec.prefix}${amount.toFixed(spec.decimals)}${spec.suffix}`;
  const rounded = Math.round(amount);
  const body = spec.grouped ? rounded.toLocaleString("en-US") : String(rounded);
  return `${spec.prefix}${body}${spec.suffix}`;
}

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

export default function CaseStudies() {
  const studies = siteConfig.caseStudies || [];
  const [active, setActive] = useState(0);
  const [split, setSplit] = useState(94);
  const [counts, setCounts] = useState({ before: "0", after: "0" });
  const stage = useRef(null);
  const section = useRef(null);
  const frame = useRef(0);
  const dragging = useRef(false);
  const seen = useRef(false);
  const pendingReveal = useRef(false);
  const beforeNum = useRef(null);
  const revealRef = useRef(() => {});
  const study = studies[active] || studies[0];
  const lines = splitHeading(siteConfig.casesHeading);

  const measureTo = () => {
    const stageNode = stage.current;
    const num = beforeNum.current;
    if (!stageNode || !num) return 46;
    const stageRect = stageNode.getBoundingClientRect();
    if (!stageRect.width) return 46;
    const numRect = num.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(num).fontSize) || 56;
    const percent = ((numRect.right - stageRect.left + fontSize * 0.42) / stageRect.width) * 100;
    return Math.min(86, Math.max(14, percent));
  };

  const reveal = (target = studies[active] || studies[0], from = 94, to = measureTo()) => {
    cancelAnimationFrame(frame.current);
    const before = parseStat(target?.beforeStat);
    const after = parseStat(target?.afterStat);
    const paint = (ease) => {
      setSplit(from + (to - from) * ease);
      setCounts({
        before: formatStat(before, before.number * ease),
        after: formatStat(after, after.number * ease),
      });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(1);
      return;
    }
    const start = performance.now();
    const run = (now) => {
      if (dragging.current) return;
      const t = Math.min(1, (now - start) / 1100);
      const ease = 1 - (1 - t) ** 3;
      paint(ease);
      if (t < 1) frame.current = requestAnimationFrame(run);
    };
    paint(0);
    frame.current = requestAnimationFrame(run);
  };
  revealRef.current = reveal;

  useEffect(() => {
    const node = stage.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || seen.current) return;
        seen.current = true;
        const start = () => revealRef.current();
        if (document.fonts?.ready) document.fonts.ready.then(start);
        else start();
      },
      { threshold: 0.35 },
    );
    io.observe(node);
    return () => {
      seen.current = false;
      io.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    if (!pendingReveal.current) return;
    pendingReveal.current = false;
    revealRef.current(studies[active]);
  }, [active, studies]);

  if (!study) return null;

  const setFromPointer = (event) => {
    const node = stage.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const next = ((event.clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(86, Math.max(14, next)));
  };

  return (
    <section id="work" ref={section} className="cases" aria-label="Case studies">
      <div className="cases-top">
        <div className="cases-copy">
          <p className="cases-kicker">
            <i aria-hidden="true" />
            {siteConfig.casesKicker}
          </p>
          <h2 className="cases-title">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex} className="cases-line">
                {line.map((part, partIndex) =>
                  part.accent ? (
                    <span key={partIndex} className="cases-mark">
                      {part.text}
                    </span>
                  ) : (
                    <span key={partIndex}>{part.text}</span>
                  ),
                )}
              </span>
            ))}
          </h2>
        </div>
        <div className="cases-side">
          <p className="cases-body">{siteConfig.casesBody}</p>
          <Link className="cases-all" href={siteConfig.casesCtaHref || "/work"}>
            <span>{siteConfig.casesCta}</span>
            <span className="cases-all-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      <div className="cases-tabs" role="tablist" aria-label="Clients">
        {studies.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={`cases-tab${index === active ? " is-on" : ""}`}
            onClick={() => {
              if (index === active) return;
              pendingReveal.current = true;
              setActive(index);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt="" />
            <span>
              <b>{item.name}</b>
              <em>
                {item.beforeStat} → {item.afterStat}
              </em>
            </span>
          </button>
        ))}
      </div>

      <div
        ref={stage}
        className="cases-stage"
        onPointerDown={(event) => {
          dragging.current = true;
          cancelAnimationFrame(frame.current);
          setCounts({ before: study.beforeStat, after: study.afterStat });
          setFromPointer(event);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* pointer capture is optional */
          }
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromPointer(event);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      >
        <div className="cases-shot is-after">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={study.image} alt="" />
          <span className="cases-chip is-metric">{study.metric}</span>
          <span className="cases-flag is-after">After</span>
          <strong className="cases-num is-after">{counts.after}</strong>
        </div>
        <div className="cases-shot is-before" style={{ width: `${split}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={study.image} alt="" />
          <span className="cases-chip">
            <i />
            {study.name} · {study.year}
          </span>
          <span className="cases-flag">Before</span>
          <strong className="cases-num" ref={beforeNum}>
            <span className="cases-num-sizer">{study.beforeStat}</span>
            <span className="cases-num-value">{counts.before}</span>
          </strong>
        </div>
        <button
          type="button"
          className="cases-handle"
          style={{ left: `${split}%` }}
          aria-label="Drag to compare before and after"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setSplit((value) => Math.max(14, value - 4));
            if (event.key === "ArrowRight") setSplit((value) => Math.min(86, value + 4));
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 7L5 12l4 5M15 7l4 5-4 5" />
          </svg>
        </button>
      </div>

      <div className="cases-foot">
        <div>
          <p className="cases-meta">
            {study.industry} · {study.year}
          </p>
          <h3 className="cases-name">{study.title}</h3>
        </div>
        <div className="cases-detail">
          <p>{study.body}</p>
          <div className="cases-tags">
            {study.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <Link className="cases-read" href={study.href || "/work"}>
            Read the case
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
