"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/constants/site";
import "@/styles/how-we-work.css";

const DOTS = Array.from({ length: 56 }, (_, index) => {
  const x = (index * 37 + 11) % 100;
  const raw = (index * 19 + 5) % 100;
  return {
    x: 6 + (x % 88),
    y: (raw / 100) ** 1.35 * 100,
    s: 2 + (index % 4),
    delay: (index % 9) * 0.35,
  };
});

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

export default function HowWeWork() {
  const steps = siteConfig.workSteps || [];
  const funnel = siteConfig.workFunnel || [];
  const lines = splitHeading(siteConfig.workHeading);
  const section = useRef(null);
  const frame = useRef(0);
  const [fills, setFills] = useState(() => funnel.map(() => 0));

  useEffect(() => {
    const node = section.current;
    if (!node) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paint = (amount) => {
      setFills(
        funnel.map((_, index) => Math.min(1, Math.max(0, amount - index))),
      );
    };
    if (reduced) {
      paint(funnel.length);
      return undefined;
    }
    const update = () => {
      frame.current = 0;
      const total = node.offsetHeight - window.innerHeight;
      const scrolled = Math.min(total, Math.max(0, -node.getBoundingClientRect().top));
      const progress = total > 0 ? scrolled / total : 0;
      paint(progress * funnel.length);
    };
    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [funnel]);

  return (
    <section id="process" ref={section} className="work" aria-label="How we work">
      <div className="work-pin">
      <div className="work-grid">
        <div className="work-copy">
          <p className="work-kicker">
            <i aria-hidden="true" />
            {siteConfig.workKicker}
          </p>
          <h2 className="work-title">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex} className="work-line">
                {line.map((part, partIndex) =>
                  part.accent ? (
                    <em key={partIndex} className="work-mark">
                      {part.text}
                    </em>
                  ) : (
                    <span key={partIndex}>{part.text}</span>
                  ),
                )}
              </span>
            ))}
          </h2>
          <ol className="work-steps">
            {steps.map((step, index) => (
              <li key={step.n} className={fills[index] > 0.04 ? "is-on" : ""} style={{ "--fill": fills[index] || 0 }}>
                <span className="work-row-fill" aria-hidden="true" />
                <span className="work-n">{step.n}</span>
                <span className="work-name">{step.title}</span>
                <span className="work-when">{step.when}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="work-side">
          <div className="work-funnel" aria-hidden="true">
            {DOTS.map((dot, index) => (
              <span
                key={index}
                className="work-dot"
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  width: dot.s,
                  height: dot.s,
                  animationDelay: `${dot.delay}s`,
                }}
              />
            ))}
            {funnel.map((item, index) => (
              <div key={item.label} className={`work-band${fills[index] > 0.04 ? " is-on" : ""}`} style={{ "--fill": fills[index] || 0 }}>
                <span className="work-band-fill" aria-hidden="true" />
                <span className="work-pill">
                  <i />
                  {item.n} {item.label}
                </span>
                <strong>{Math.round(item.value * (fills[index] || 0)).toLocaleString("en-US")}</strong>
              </div>
            ))}
          </div>
          <p className="work-note">
            <i aria-hidden="true" />
            {siteConfig.workNote}
          </p>
        </div>
      </div>
      </div>
    </section>
  );
}
