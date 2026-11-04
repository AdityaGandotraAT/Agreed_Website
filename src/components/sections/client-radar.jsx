"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/constants/site";
import "@/styles/work-radar.css";

const PARK = 40;
const STYLES = ["grot", "round", "cond", "mono"];

function splitWords(line) {
  return line
    .replace(/\*([^*]+)\*/g, (_, group) =>
      group
        .trim()
        .split(/\s+/)
        .map((word) => {
          const match = word.match(/^(.*?)([.,!?;:’']*)$/);
          return match?.[1] ? `*${match[1]}*${match[2]}` : word;
        })
        .join(" "),
    )
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const match = token.match(/^\*(.+?)\*([.,!?;:’']*)$/);
      return match
        ? { text: match[1], tail: match[2], accent: true }
        : { text: token.replace(/\*/g, ""), tail: "", accent: false };
    });
}

function plainText(value) {
  return value.replace(/\*/g, "").replace(/\s*\|\s*/g, " ").replace(/\s+/g, " ").trim();
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function normalize(angle) {
  return ((angle % 360) + 360) % 360;
}

function place(angle, reach) {
  const rad = (angle * Math.PI) / 180;
  const left = (50 + Math.sin(rad) * reach * 46).toFixed(3);
  const top = (50 - Math.cos(rad) * reach * 46).toFixed(3);
  return { left: `${left}%`, top: `${top}%` };
}

const TICKS = Array.from({ length: 72 }, (_, index) => {
  const angle = (index * 5 * Math.PI) / 180;
  const long = index % 6 === 0;
  const inner = 92;
  const outer = long ? 97 : 94.5;
  return {
    long,
    x1: (100 + Math.sin(angle) * inner).toFixed(3),
    y1: (100 - Math.cos(angle) * inner).toFixed(3),
    x2: (100 + Math.sin(angle) * outer).toFixed(3),
    y2: (100 - Math.cos(angle) * outer).toFixed(3),
  };
});

function parkedHits(clients) {
  return new Set(
    clients
      .map((client, index) => ({ index, delta: normalize(PARK - client.angle) }))
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 3)
      .map((item) => item.index),
  );
}

export default function ClientRadar() {
  const root = useRef(null);
  const scope = useRef(null);
  const sweep = useRef(null);
  const scrollProgress = useRef(0.5);
  const [entered, setEntered] = useState(false);
  const [moving, setMoving] = useState(false);
  const [hits, setHits] = useState(() => parkedHits(siteConfig.radar));
  const [readout, setReadout] = useState(() => {
    const first = [...parkedHits(siteConfig.radar)][0] ?? 0;
    const client = siteConfig.radar[first];
    return client ? `${client.name} · ${client.badge}` : "";
  });

  const heading = siteConfig.workHeading.replace("{n}", siteConfig.clients);
  const lines = heading.split("|").map((line) => splitWords(line));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMoving(!media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setEntered(true);
      },
      { threshold: 0.16 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || !moving) return undefined;

    let visible = true;
    let current = -1;
    const observer = new IntersectionObserver(
      (entries) => {
        visible = !!entries[0]?.isIntersecting;
      },
      { rootMargin: "25% 0px 25% 0px" },
    );
    observer.observe(node);

    let frame = 0;
    const tick = () => {
      if (visible) {
        const rect = node.getBoundingClientRect();
        const view = window.innerHeight || 1;
        const next = clamp01((view - rect.top) / (view + rect.height));
        current = current < 0 ? next : current + (next - current) * 0.18;
        if (Math.abs(next - current) < 0.0005) current = next;
        scrollProgress.current = current;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [moving]);

  useEffect(() => {
    const board = scope.current;
    if (!board || !moving) {
      setHits(parkedHits(siteConfig.radar));
      return undefined;
    }

    const clients = siteConfig.radar;
    const hitAt = clients.map(() => -99);
    const lit = clients.map(() => false);
    let visible = false;
    let drift = 0;
    let previous = 0;
    let started = false;
    let lastTime = 0;
    let angle = PARK;
    let frame = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        visible = !!entries[0]?.isIntersecting;
      },
      { rootMargin: "10% 0px 10% 0px" },
    );
    observer.observe(board);

    const tick = (time) => {
      if (!visible) {
        lastTime = time;
        frame = window.requestAnimationFrame(tick);
        return;
      }

      const delta = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0;
      lastTime = time;
      drift += delta * 9;
      const target = scrollProgress.current * 540 + drift - 120;
      angle = started ? angle + (target - angle) * 0.2 : target;
      if (sweep.current) sweep.current.style.transform = `rotate(${angle.toFixed(2)}deg)`;

      if (started) {
        const low = Math.min(previous, angle);
        const high = Math.max(previous, angle);
        clients.forEach((client, index) => {
          let crossed = false;
          if (high - low >= 360) crossed = true;
          else {
            const cycle = Math.ceil((low - client.angle) / 360);
            const value = client.angle + 360 * cycle;
            crossed = value > low && value <= high;
          }
          if (crossed) {
            hitAt[index] = time;
            setReadout(`${client.name} · ${client.badge}`);
          }
        });
      }

      previous = angle;
      started = true;

      let changed = false;
      const next = lit.map((wasLit, index) => {
        const want = time - hitAt[index] < 1500;
        if (want !== wasLit) changed = true;
        return want;
      });
      if (changed) {
        next.forEach((value, index) => {
          lit[index] = value;
        });
        setHits(new Set(next.map((value, index) => (value ? index : -1)).filter((index) => index >= 0)));
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [moving]);

  return (
    <section
      ref={root}
      id="clients"
      className={`radar${entered ? " is-on" : ""}${moving ? " is-moving" : " is-parked"}`}
      aria-label="Clients"
    >
      <div className="radar-grid">
        <div className="radar-copy">
          <p className="radar-kicker">
            <i className="radar-kicker-dot" aria-hidden="true" />
            {siteConfig.workKicker}
          </p>
          <h2 className="radar-title" aria-label={plainText(heading)}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex} className="radar-line" aria-hidden="true">
                {line.map((word, wordIndex) => (
                  <span key={wordIndex} className={`radar-word${word.accent ? " is-acc" : ""}`}>
                    <span className="radar-word-in">
                      {word.accent ? (
                        <span className="radar-mark">
                          {word.text}
                          {word.tail}
                        </span>
                      ) : (
                        <>
                          {word.text}
                          {word.tail}
                        </>
                      )}
                    </span>{" "}
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <p className="radar-body">{siteConfig.workBody}</p>
          <div className="radar-foot">
            <p className="radar-rate">
              <span className="radar-stars" aria-hidden="true">
                ★★★★★
              </span>
              <span>
                {siteConfig.rating} · {siteConfig.reviews} reviews
              </span>
            </p>
            <p className="radar-read">
              <i className="radar-live" aria-hidden="true" />
              <span className="radar-read-l">{siteConfig.workReadout}</span>
              <span className="radar-read-v">{readout}</span>
            </p>
          </div>
        </div>

        <div className="radar-stage">
          <div
            ref={scope}
            className="radar-scope"
            role="img"
            aria-label={`Client radar: ${siteConfig.radar.map((client) => client.name).join(", ")}`}
          >
            <div className="radar-grid-dots" aria-hidden="true" />
            <svg className="radar-svg" viewBox="0 0 200 200" aria-hidden="true">
              {[0.25, 0.5, 0.75, 1].map((factor, index) => (
                <circle
                  key={factor}
                  cx="100"
                  cy="100"
                  r={92 * factor}
                  className={index === 3 ? "radar-ring radar-ring-o" : "radar-ring"}
                />
              ))}
              <path d="M100 6V194M6 100H194" className="radar-cross" />
              <path d="M34.9 34.9L165.1 165.1M165.1 34.9L34.9 165.1" className="radar-cross radar-diag" />
              {TICKS.map((tick, index) => (
                <line
                  key={index}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  className={tick.long ? "radar-tick radar-tick-l" : "radar-tick"}
                />
              ))}
            </svg>

            {["000", "090", "180", "270"].map((label, index) => (
              <span key={label} className={`radar-deg radar-deg-${index}`} aria-hidden="true">
                {label}°
              </span>
            ))}

            {siteConfig.workRings.map((label, index) => {
              const left = (50 + Math.sin(0.698) * 46 * (0.25 * (index + 1))).toFixed(3);
              const top = (50 - Math.cos(0.698) * 46 * (0.25 * (index + 1))).toFixed(3);
              return (
                <span
                  key={label}
                  className="radar-rl"
                  style={{ left: `${left}%`, top: `${top}%` }}
                  aria-hidden="true"
                >
                  {label}
                </span>
              );
            })}

            <div
              ref={sweep}
              className="radar-sweep"
              style={{ transform: `rotate(${PARK}deg)` }}
              aria-hidden="true"
            >
              <i className="radar-edge" />
            </div>
            <span className="radar-core" aria-hidden="true">
              <i />
            </span>

            {siteConfig.radar.map((client, index) => {
              const style = client.style || STYLES[index % STYLES.length];
              return (
                <div
                  key={client.name}
                  className={`radar-blip radar-${style}${client.left ? " is-left" : ""}${hits.has(index) ? " is-hit" : ""}`}
                  style={place(client.angle, client.reach)}
                >
                  <i className="radar-dot" aria-hidden="true" />
                  <span className="radar-name">{client.name}</span>
                  <b className="radar-badge">{client.badge}</b>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
