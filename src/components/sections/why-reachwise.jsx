"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/constants/site";
import "@/styles/why-reachwise.css";

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

function ease(value) {
  const x = clamp01(value);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

function formatCount(value) {
  return Math.round(value).toLocaleString("en-US");
}

function makeRand(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readRgb(el, color, fallback) {
  if (!el || typeof window === "undefined") return fallback;
  const probe = document.createElement("i");
  probe.style.display = "none";
  probe.style.color = color;
  el.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  const match = value.match(/(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/);
  return match
    ? `${Math.round(+match[1])},${Math.round(+match[2])},${Math.round(+match[3])}`
    : fallback;
}

function crowdSize(width) {
  if (width < 810) return 600;
  if (width < 1100) return 900;
  return 1200;
}

function anchorsFor(width) {
  if (width < 810) {
    // Search mid-left, Feeds upper-right, Audiences lower-right — clear of the counter
    return [
      [0.4, 0.42],
      [0.78, 0.26],
      [0.72, 0.72],
    ];
  }
  if (width < 1100) {
    return [
      [0.36, 0.52],
      [0.6, 0.4],
      [0.84, 0.56],
    ];
  }
  return [
    [0.42, 0.52],
    [0.63, 0.38],
    [0.84, 0.58],
  ];
}

export default function WhyReachwise() {
  const root = useRef(null);
  const panel = useRef(null);
  const canvas = useRef(null);
  const ratio = useRef(null);
  const counts = useRef([]);
  const [entered, setEntered] = useState(false);
  const [width, setWidth] = useState(1440);
  const [reduced, setReduced] = useState(false);

  const lines = siteConfig.whyHeading.split("|").map((line) => splitWords(line));
  const clusters = siteConfig.whyClusters;
  const share = Math.max(2, Math.round(siteConfig.whyStatValue || 12));
  const phone = width < 810;
  const tab = width >= 810 && width < 1100;
  const still = reduced;
  const anchors = anchorsFor(width);
  const total = crowdSize(width);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const measure = () => setWidth(Math.round(node.getBoundingClientRect().width) || window.innerWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setEntered(true);
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const board = canvas.current;
    const shell = panel.current;
    if (!board || !shell) return undefined;
    const ctx = board.getContext("2d");
    if (!ctx) return undefined;

    const ink = readRgb(shell, "#ffffff", "255,255,255");
    const lime = readRgb(shell, getComputedStyle(document.documentElement).getPropertyValue("--rw-brass").trim() || "#0e58d1", "14,88,209");
    const N = total;
    const layout = anchorsFor(width);
    const clusterData = siteConfig.whyClusters;
    const rand = makeRand(1207 + N);
    const hx = new Float32Array(N);
    const hy = new Float32Array(N);
    const sz = new Float32Array(N);
    const ph = new Float32Array(N);
    const buyer = new Int8Array(N).fill(-1);
    const dl = new Float32Array(N);
    const ord = new Float32Array(N);
    const bend = new Float32Array(N);
    const ox = new Float32Array(N);
    const oy = new Float32Array(N);
    const gl = new Float32Array(N);
    const bi = [[], [], []];
    const weights = [0.34, 0.4, 0.26];

    let index = 0;
    while (index < N) {
      const gx = rand();
      const gy = rand();
      const group = rand() < 0.3 ? 2 + Math.floor(rand() * 3) : 1;
      for (let j = 0; j < group && index < N; j += 1, index += 1) {
        hx[index] = Math.min(0.99, Math.max(0.01, gx + (rand() - 0.5) * 0.018 * (j ? 1 : 0)));
        hy[index] = Math.min(0.98, Math.max(0.02, gy + (rand() - 0.5) * 0.03 * (j ? 1 : 0)));
        sz[index] = 1.25 + rand() * 0.6;
        ph[index] = rand() * 6.283;
      }
    }

    for (let i = 0; i < N; i += 1) {
      if (rand() >= 1 / share) continue;
      const roll = rand();
      const cluster = roll < weights[0] ? 0 : roll < weights[0] + weights[1] ? 1 : 2;
      if (!clusterData[cluster]) continue;
      buyer[i] = cluster;
      bi[cluster].push(i);
      dl[i] = rand() * 0.42;
      bend[i] = (rand() - 0.5) * 0.5;
    }
    bi.forEach((list) => {
      list.forEach((dot, order) => {
        ord[dot] = order;
      });
    });

    let widthPx = 1;
    let heightPx = 1;
    let dpr = 1;
    let dirty = true;
    let visible = false;
    let progressNow = still ? 1 : 0;
    let progressTarget = progressNow;
    let top = 0;
    let height = 1;
    let view = 1;
    let fresh = false;
    let pointerX = -9999;
    let pointerY = -9999;
    let pointerOn = 0;
    let frame = 0;
    let lastRatio = "";
    let lastCounts = ["", "", ""];

    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const box = board.getBoundingClientRect();
      widthPx = Math.max(1, box.width);
      heightPx = Math.max(1, box.height);
      board.width = Math.round(widthPx * dpr);
      board.height = Math.round(heightPx * dpr);
      dirty = true;
    };

    const draw = (time) => {
      const seconds = time / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, widthPx, heightPx);
      const pack = Math.min(widthPx, heightPx) * (phone ? 0.021 : 0.019) + 2.2;
      const cx = layout.map((point) => point[0] * widthPx);
      const cy = layout.map((point) => point[1] * heightPx);
      const idle = still ? 0 : 1;
      const crowdAlpha = 0.62 - 0.4 * ease(progressNow);
      const glow = [];

      ctx.fillStyle = `rgba(${ink},${crowdAlpha.toFixed(3)})`;
      ctx.beginPath();
      for (let i = 0; i < N; i += 1) {
        if (buyer[i] >= 0) continue;
        let x = hx[i] * widthPx + Math.sin(seconds * 0.6 + ph[i]) * 1.4 * idle;
        let y = hy[i] * heightPx + Math.cos(seconds * 0.5 + ph[i] * 1.3) * 1.2 * idle;
        let best = 0;
        let nearest = 1e9;
        for (let q = 0; q < 3; q += 1) {
          if (!clusterData[q]) continue;
          const distance = (x - cx[q]) ** 2 + (y - cy[q]) ** 2;
          if (distance < nearest) {
            nearest = distance;
            best = q;
          }
        }
        const dist = Math.sqrt(nearest) || 1;
        const push =
          ease(progressNow) *
          Math.max(0, 1 - dist / (Math.min(widthPx, heightPx) * 0.55)) *
          Math.min(widthPx, heightPx) *
          0.12;
        x += ((x - cx[best]) / dist) * push + ox[i];
        y += ((y - cy[best]) / dist) * push + oy[i];
        const radius = sz[i];
        if (gl[i] > 0.05) {
          glow.push(i, x, y);
          continue;
        }
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, 6.2832);
      }
      ctx.fill();

      for (let j = 0; j < glow.length; j += 3) {
        const i = glow[j];
        ctx.fillStyle = `rgba(${ink},${Math.min(1, crowdAlpha + gl[i] * 0.7).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(glow[j + 1], glow[j + 2], sz[i] * (1 + gl[i] * 0.6), 0, 6.2832);
        ctx.fill();
      }

      for (let q = 0; q < 3; q += 1) {
        if (!clusterData[q] || !bi[q].length) continue;
        const halo = ease((progressNow - 0.55) / 0.45);
        if (halo <= 0) continue;
        const radius = pack * Math.sqrt(bi[q].length) * 0.5 + 14;
        ctx.strokeStyle = `rgba(${lime},${(0.55 * halo).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx[q], cy[q], radius + (1 - halo) * 30, 0, 6.2832);
        ctx.stroke();
        ctx.fillStyle = `rgba(${lime},${(0.06 * halo).toFixed(3)})`;
        ctx.fill();
      }

      for (let i = 0; i < N; i += 1) {
        const group = buyer[i];
        if (group < 0) continue;
        const local = ease((progressNow - dl[i]) / 0.58);
        const homeX = hx[i] * widthPx + Math.sin(seconds * 0.6 + ph[i]) * 1.4 * idle * (1 - local);
        const homeY = hy[i] * heightPx + Math.cos(seconds * 0.5 + ph[i] * 1.3) * 1.2 * idle * (1 - local);
        const order = ord[i];
        const angle = order * 2.39996;
        const radius = pack * 0.5 * Math.sqrt(order + 0.5);
        const targetX = cx[group] + Math.cos(angle) * radius + Math.sin(seconds * 1.3 + ph[i]) * 0.6 * idle;
        const targetY = cy[group] + Math.sin(angle) * radius + Math.cos(seconds * 1.1 + ph[i]) * 0.6 * idle;
        const dx = targetX - homeX;
        const dy = targetY - homeY;
        const curve = Math.sin(local * Math.PI) * bend[i];
        const x = homeX + dx * local - dy * curve + ox[i];
        const y = homeY + dy * local + dx * curve + oy[i];
        const size = sz[i] * (1 + 0.6 * local) * (1 + gl[i] * 0.5);

        if (local < 0.999) {
          ctx.fillStyle = `rgba(${ink},${(0.62 * (1 - local)).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 6.2832);
          ctx.fill();
        }
        if (local > 0.001) {
          if (gl[i] > 0.05 || (local > 0.05 && local < 0.95)) {
            ctx.fillStyle = `rgba(${lime},${(0.18 * local).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(x, y, size * 2.6, 0, 6.2832);
            ctx.fill();
          }
          ctx.fillStyle = `rgba(${lime},${local.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 6.2832);
          ctx.fill();
        }
      }
    };

    const writeText = () => {
      const amount = ease(progressNow);
      const denominator = Math.round(N - (N - share) * amount ** 0.6);
      const nextRatio = formatCount(denominator);
      if (nextRatio !== lastRatio && ratio.current) {
        lastRatio = nextRatio;
        ratio.current.textContent = nextRatio;
      }
      clusterData.forEach((cluster, q) => {
        const el = counts.current[q];
        if (!el) return;
        const value = formatCount(cluster.count * ease((progressNow - 0.35) / 0.65));
        if (value !== lastCounts[q]) {
          lastCounts[q] = value;
          el.textContent = value;
        }
      });
      shell.style.setProperty("--p", progressNow.toFixed(3));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = !!entries[0]?.isIntersecting;
        dirty = true;
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    observer.observe(shell);

    const resize = new ResizeObserver(() => {
      size();
      if (still) {
        draw(0);
        writeText();
      }
    });
    resize.observe(board);
    size();

    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const onMove = (event) => {
      const box = board.getBoundingClientRect();
      pointerX = event.clientX - box.left;
      pointerY = event.clientY - box.top;
      pointerOn = 1;
    };
    const onLeave = () => {
      pointerOn = 0;
      pointerX = -9999;
      pointerY = -9999;
    };
    if (fine && !still) {
      board.addEventListener("pointermove", onMove);
      board.addEventListener("pointerleave", onLeave);
    }

    if (still) {
      progressNow = 1;
      draw(0);
      writeText();
      return () => {
        observer.disconnect();
        resize.disconnect();
      };
    }

    const tick = (time) => {
      if (visible) {
        // Drive from the whole card — on phone the counter sits above the canvas,
        // so canvas-only scroll never reaches the Framer sort window.
        const box = shell.getBoundingClientRect();
        top = box.top;
        height = box.height;
        view = window.innerHeight || 1;
        fresh = true;
        const scroll = (view - top) / (view + height);
        progressTarget = phone
          ? clamp01((scroll - 0.08) / 0.38)
          : clamp01((scroll - 0.22) / 0.42);
      }

      const previous = progressNow;
      progressNow += (progressTarget - progressNow) * 0.12;
      if (Math.abs(progressTarget - progressNow) < 0.0005) progressNow = progressTarget;

      const radius = 70;
      for (let i = 0; i < N; i += 1) {
        let tx = 0;
        let ty = 0;
        let tg = 0;
        if (pointerOn) {
          const px = hx[i] * widthPx;
          const py = hy[i] * heightPx;
          const dx = px - pointerX;
          const dy = py - pointerY;
          const dist2 = dx * dx + dy * dy;
          if (!(buyer[i] >= 0 && progressNow > 0.5) && dist2 < radius * radius) {
            const dist = Math.sqrt(dist2) || 1;
            const force = 1 - dist / radius;
            tx = (dx / dist) * force * 16;
            ty = (dy / dist) * force * 16;
            tg = force;
          }
        }
        ox[i] += (tx - ox[i]) * 0.14;
        oy[i] += (ty - oy[i]) * 0.14;
        gl[i] += (tg - gl[i]) * (tg > gl[i] ? 0.3 : 0.05);
      }

      if (visible || dirty) {
        draw(time);
        if (previous !== progressNow || dirty || fresh) {
          writeText();
          dirty = false;
          fresh = false;
        }
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      board.removeEventListener("pointermove", onMove);
      board.removeEventListener("pointerleave", onLeave);
    };
  }, [total, share, phone, tab, still, width]);

  return (
    <section
      ref={root}
      id="why"
      className={`why${entered ? " is-on" : ""}${phone ? " is-phone" : tab ? " is-tab" : ""}${still ? " is-still" : ""}`}
      aria-label="Why Reachwise"
    >
      <div className="why-top">
        <div className="why-copy">
          <p className="why-kicker">
            <i aria-hidden="true" />
            {siteConfig.whyKicker}
          </p>
          <h2 className="why-title" aria-label={plainText(siteConfig.whyHeading)}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex} className="why-line" aria-hidden="true">
                {line.map((word, wordIndex) => (
                  <span key={wordIndex} className={`why-word${word.accent ? " is-acc" : ""}`}>
                    {word.accent ? (
                      <span className="why-mark">
                        {word.text}
                        {word.tail}
                      </span>
                    ) : (
                      <>
                        {word.text}
                        {word.tail}
                      </>
                    )}
                  </span>
                ))}
              </span>
            ))}
          </h2>
        </div>

        <div className="why-side">
          <p className="why-body">{siteConfig.whyBody}</p>
          <Link className="why-cta" href={siteConfig.whyCtaHref}>
            <span>{siteConfig.whyCta}</span>
            <span className="why-cta-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </span>
          </Link>
          <ul className="why-meta">
            {siteConfig.whyMeta.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div ref={panel} className="why-card" style={{ ["--p"]: still ? 1 : 0 }}>
        <div className="why-ratio">
          <p className="why-crowd-l">
            <i aria-hidden="true" />
            <span>
              {formatCount(total)} {siteConfig.whyCrowdLabel}
            </span>
          </p>
          <p className="why-stat">
            <span className="why-stat-lead">{siteConfig.whyStatLead}</span>
            <span ref={ratio} className="why-stat-num">
              {formatCount(still ? share : total)}
            </span>
          </p>
          <p className="why-stat-tail">{siteConfig.whyStatTail}</p>
        </div>

        <div className="why-field">
          <canvas
            ref={canvas}
            className="why-cv"
            role="img"
            aria-label={`A crowd of ${total} people sorts itself: 1 in ${share} are your buyers, gathered into ${clusters.map((item) => item.tag).join(", ")}`}
          />
          {clusters.map((cluster, index) => (
            <div
              key={cluster.tag}
              className={`why-signal why-signal-${index}`}
              style={{ left: `${anchors[index][0] * 100}%`, top: `${anchors[index][1] * 100}%` }}
            >
              <span>{cluster.tag}</span>
              <p>
                <b
                  ref={(node) => {
                    counts.current[index] = node;
                  }}
                >
                  {formatCount(still ? cluster.count : 0)}
                </b>{" "}
                {cluster.line}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
