"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/constants/site";
import "@/styles/services-board.css";

const SERP_COMPETITORS = [
  { host: "citydentalcare.com", line: "Open · 4.6 · book online" },
  { host: "yelp.com › dentists", line: "Directory · local listings" },
  { host: "smilecentre.co", line: "Open · new patients welcome" },
  { host: "healthgrades.com", line: "Profiles · ratings nearby" },
];

function plainText(value) {
  return String(value || "")
    .replace(/\*/g, "")
    .replace(/\s*\|\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function SerpVisual({ item, active }) {
  const query = item.query || "dentist near me";
  const result = item.result || "yoursite.com";
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState("idle");
  const [slot, setSlot] = useState(-1);
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const wait = (ms, fn) => {
      const id = setTimeout(fn, ms);
      timers.current.push(id);
    };

    if (!active) {
      setTyped("");
      setPhase("idle");
      setSlot(-1);
      return undefined;
    }

    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      setTyped("");
      setPhase("typing");
      setSlot(-1);

      let i = 0;
      const typeNext = () => {
        if (cancelled) return;
        i += 1;
        setTyped(query.slice(0, i));
        if (i < query.length) {
          wait(40 + (i % 3) * 16, typeNext);
          return;
        }

        wait(260, () => {
          if (cancelled) return;
          setPhase("results");
          wait(700, () => {
            if (cancelled) return;
            setPhase("climb");
            setSlot(3);
            wait(380, () => {
              if (cancelled) return;
              setSlot(2);
              wait(380, () => {
                if (cancelled) return;
                setSlot(1);
                wait(380, () => {
                  if (cancelled) return;
                  setSlot(0);
                  wait(420, () => {
                    if (cancelled) return;
                    setPhase("win");
                    wait(2600, run);
                  });
                });
              });
            });
          });
        });
      };

      wait(280, typeNext);
    };

    run();

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [active, query]);

  const showResults = phase === "results" || phase === "climb" || phase === "win";
  const rows = [];

  if (showResults) {
    const comps = SERP_COMPETITORS.map((row, index) => ({ kind: "comp", key: row.host, row, index }));
    if (slot < 0) {
      rows.push(...comps);
    } else {
      const before = comps.slice(0, slot);
      const after = comps.slice(slot, 3);
      rows.push(...before, { kind: "win", key: "win" }, ...after);
    }
  }

  const atTop = phase === "win" || slot === 0;

  return (
    <div className={`svc-mock svc-serp is-${phase}`} aria-hidden="true">
      <div className="svc-serp-bar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M16.2 16.2L20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="svc-serp-query">
          {typed}
          <i className={phase === "typing" || phase === "idle" ? "is-on" : ""} />
        </span>
      </div>

      <p className={`svc-serp-meta${showResults ? " is-on" : ""}`}>About 2,140,000 results · 0.42 s</p>

      <div className="svc-serp-list">
        {showResults ? (
          rows.map((entry) =>
            entry.kind === "win" ? (
              <div key={`win-${slot}`} className={`svc-serp-row is-win${atTop ? " is-top" : " is-rise"}`}>
                <span className="svc-serp-avatar" />
                <div>
                  <b>{result}</b>
                  <span>Your brand · {query}</span>
                </div>
                {atTop ? <em>#1</em> : <strong>#{slot + 1}</strong>}
              </div>
            ) : (
              <div
                key={entry.key}
                className={`svc-serp-row is-comp is-in${phase === "climb" ? " is-shift" : ""}`}
                style={{ animationDelay: `${entry.index * 55}ms` }}
              >
                <span className="svc-serp-avatar is-ghost" />
                <div>
                  <b>{entry.row.host}</b>
                  <span>{entry.row.line}</span>
                </div>
              </div>
            ),
          )
        ) : (
          <>
            <div className="svc-serp-row is-ghost" />
            <div className="svc-serp-row is-ghost" />
            <div className="svc-serp-row is-ghost short" />
          </>
        )}
      </div>

      <p className={`svc-tip${phase === "win" ? " is-pop" : ""}`}>
        <i />
        {item.tip}
        <b />
      </p>
    </div>
  );
}

function FeedsVisual({ item }) {
  return (
    <div className="svc-mock svc-feeds" aria-hidden="true">
      <div className="svc-phone">
        <div className="svc-phone-top">
          <span className="svc-phone-av" />
          <b>@kettlebrook.coffee</b>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="svc-phone-img"
          src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&h=1000&q=80"
          alt=""
        />
        <div className="svc-phone-pop">
          <i />
          +128 likes in 1 h
        </div>
        <div className="svc-phone-meta">
          <div className="svc-phone-acts">
            <svg className="is-heart" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
              />
            </svg>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                d="M12 3.2c5.1 0 8.8 3.55 8.8 7.85 0 4.3-3.7 7.85-8.8 7.85-.85 0-1.68-.1-2.46-.3L4.2 20.8l1.35-3.55A7.4 7.4 0 0 1 3.2 11.05C3.2 6.75 6.9 3.2 12 3.2Z"
              />
            </svg>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                d="M21.5 3.5 10.8 14.2M21.5 3.5 14.6 21l-3.8-6.8L4 10.4 21.5 3.5Z"
              />
            </svg>
          </div>
          <b>1,312 likes</b>
          <p>
            <strong>kettlebrook.coffee</strong> Monday mornings, sorted
          </p>
        </div>
      </div>
      <p className="svc-tip is-dark">
        <i />
        {item.tip}
        <b />
      </p>
    </div>
  );
}

function usePanelLoop(active, steps) {
  const [step, setStep] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (!active) {
      setStep(0);
      return undefined;
    }

    let cancelled = false;
    let index = 0;
    setStep(0);

    const tick = () => {
      if (cancelled) return;
      const delay = steps[index] ?? 800;
      const id = setTimeout(() => {
        if (cancelled) return;
        index = (index + 1) % steps.length;
        setStep(index);
        tick();
      }, delay);
      timers.current.push(id);
    };

    tick();

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [active, steps]);

  return active ? step : 0;
}

function AdsVisual({ item, active }) {
  const steps = useRef([420, 700, 900, 700, 2200]).current;
  const step = usePanelLoop(active, steps);
  const [ctr, setCtr] = useState(0);
  const [roas, setRoas] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!active || step < 2) {
      setCtr(0);
      setRoas(0);
      return undefined;
    }

    const start = performance.now();
    const duration = 900;
    const animate = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - (1 - t) ** 3;
      setCtr(4.8 * ease);
      setRoas(6.2 * ease);
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [active, step]);

  const showMetrics = step >= 2;
  const showBars = step >= 3;
  const showTip = step >= 4;
  const ctrDash = (ctr / 4.8) * 55;
  const roasDash = (roas / 6.2) * 70;

  return (
    <div className={`svc-mock svc-ads is-step-${step}`} aria-hidden="true">
      <div className={`svc-ad-card${step >= 1 ? " is-on" : ""}`}>
        <div>
          <b>Free whitening with every new-patient visit.</b>
          <span className="svc-ad-cta">Book now</span>
        </div>
        <i className="svc-ad-orb" />
      </div>
      <div className={`svc-ad-metrics${showMetrics ? " is-on" : ""}`}>
        <div>
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="var(--svc-accent)"
              strokeWidth="4"
              strokeDasharray={`${ctrDash} 88`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <em>{ctr.toFixed(1)}% CTR</em>
        </div>
        <div>
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="var(--svc-accent)"
              strokeWidth="4"
              strokeDasharray={`${roasDash} 88`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <em>{roas.toFixed(1)}× ROAS</em>
        </div>
      </div>
      <div className={`svc-ad-bars${showBars ? " is-on" : ""}`} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i className="is-hot" />
      </div>
      <p className={`svc-tip${showTip ? " is-pop" : ""}`}>
        <i />
        {item.tip}
        <b />
      </p>
    </div>
  );
}

function ContentVisual({ item, active }) {
  const steps = useRef([350, 450, 450, 700, 900, 2200]).current;
  const step = usePanelLoop(active, steps);
  const [reads, setReads] = useState(1840);
  const raf = useRef(0);
  const lines = step >= 4 ? 5 : step >= 3 ? 2 : 0;

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!active || step < 5) {
      setReads(1840);
      return undefined;
    }
    const start = performance.now();
    const from = 1840;
    const to = 2410;
    const animate = (now) => {
      const t = Math.min(1, (now - start) / 900);
      const ease = 1 - (1 - t) ** 3;
      setReads(Math.round(from + (to - from) * ease));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [active, step]);

  return (
    <div className={`svc-mock svc-content is-step-${step}`} aria-hidden="true">
      <div className="svc-article">
        <span className={`svc-article-tag${step >= 1 ? " is-on" : ""}`}>
          {item.guideTag || "Guide · 6 min read"}
        </span>
        <h4 className={step >= 2 ? "is-on" : ""}>{item.guideTitle || "How to rank #1 for 'near me' searches"}</h4>
        <div className={`svc-article-by${step >= 3 ? " is-on" : ""}`}>
          <span className="svc-article-av" />
          <em>{item.guideAuthor || "Agreed editorial"}</em>
        </div>
        <div className="svc-article-lines" data-lines={lines}>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className={`svc-article-rule${step >= 5 ? " is-on" : ""}`} />
        <p className={`svc-article-reads${step >= 5 ? " is-on" : ""}`}>
          <b />
          {reads.toLocaleString()} reads this week
        </p>
      </div>
    </div>
  );
}

function WebVisual({ active }) {
  const steps = useRef([220, 280, 340, 420, 480, 380, 720, 1100, 2400]).current;
  const step = usePanelLoop(active, steps);
  const [rate, setRate] = useState(1.2);
  const raf = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!active || step < 7) {
      setRate(1.2);
      return undefined;
    }
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min(1, (now - start) / 900);
      const ease = 1 - (1 - t) ** 3;
      setRate(1.2 + 2.9 * ease);
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [active, step]);

  return (
    <div className={`svc-mock svc-web is-step-${step}`} aria-hidden="true">
      <div className={`svc-site${step >= 1 ? " is-on" : ""}${step >= 6 ? " is-click" : ""}${step >= 8 ? " is-scroll" : ""}`}>
        <div className={`svc-site-top${step >= 1 ? " is-on" : ""}`}>
          <span />
          <span />
          <span />
        </div>
        <div className="svc-site-scroll">
          <div className="svc-site-page">
            <div className={`svc-site-nav${step >= 2 ? " is-on" : ""}`}>
              <i />
              <i />
              <i />
              <em />
            </div>
            <div className={`svc-site-hero${step >= 3 ? " is-on" : ""}`}>
              <i />
              <div>
                <b />
                <b />
                <em />
              </div>
            </div>
            <div className={`svc-site-grid${step >= 4 ? " is-on" : ""}`}>
              <i />
              <i />
              <i />
            </div>
            <div className={`svc-site-grid is-row2${step >= 5 ? " is-on" : ""}`}>
              <i />
              <i />
            </div>
            <div className={`svc-site-band${step >= 5 ? " is-on" : ""}`} />
            <div className="svc-site-more">
              <b />
              <b />
              <b />
            </div>
            <div className="svc-site-cards">
              <i />
              <i />
            </div>
            <div className="svc-site-end" />
          </div>
          <span className="svc-site-thumb" />
        </div>
        <span className="svc-site-cursor">
          <i />
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.2 8 4.2 12l4 4M10.4 16.2 13.6 7.8M15.8 8l4 4-4 4"
            />
          </svg>
        </span>
        <span className={`svc-site-lead${step >= 7 ? " is-on" : ""}`}>+1 lead</span>
      </div>
      <p className={`svc-tip is-ink${step >= 7 ? " is-pop" : ""}`}>
        <i />
        Conversion {rate.toFixed(1)}% ▲
        <b />
      </p>
    </div>
  );
}

function BrandVisual({ active }) {
  const steps = useRef([350, 500, 1000, 650, 750, 2200]).current;
  const step = usePanelLoop(active, steps);
  const swatches = [
    { hex: "#0D0E10", label: "#0D0E10" },
    { hex: "#0E58D1", label: "#0E58D1" },
    { hex: "#FF3E83", label: "#FF3E83" },
    { hex: "#FFFFFF", label: "#FFFFFF" },
  ];

  return (
    <div className={`svc-mock svc-brand is-step-${step}`} aria-hidden="true">
      <div className="svc-brand-card">
        <div className={`svc-brand-head${step >= 1 ? " is-on" : ""}`}>
          <span className="svc-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="12" cy="12" r="3.2" fill="var(--svc-accent)" />
            </svg>
          </span>
          <b>Agreed</b>
        </div>
        <div className={`svc-swatches${step >= 2 ? " is-on" : ""}`}>
          {swatches.map((swatch, index) => (
            <div
              key={swatch.hex}
              className={`svc-swatch${step >= 2 ? " is-on" : ""}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <i style={{ background: swatch.hex }} />
              <span>{swatch.label}</span>
            </div>
          ))}
        </div>
        <div className={`svc-type${step >= 3 ? " is-on" : ""}`}>
          <strong>Aa</strong>
          <div>
            <p>DISPLAY · SANS · MONO</p>
            <em>Guidelines v1.0</em>
          </div>
        </div>
        <div className={`svc-brand-foot${step >= 4 ? " is-on" : ""}`}>
          <span className="svc-brand-sq" />
          <span className="svc-brand-chip">Agreed</span>
          <span className="svc-brand-split" />
        </div>
      </div>
    </div>
  );
}

function ServiceVisual({ item, active }) {
  switch (item.visual) {
    case "feeds":
      return <FeedsVisual item={item} />;
    case "ads":
      return <AdsVisual item={item} active={active} />;
    case "content":
      return <ContentVisual item={item} active={active} />;
    case "web":
      return <WebVisual item={item} active={active} />;
    case "brand":
      return <BrandVisual item={item} active={active} />;
    default:
      return <SerpVisual item={item} active={active} />;
  }
}

function ServiceDetails({ item }) {
  return (
    <div className="svc-open-copy">
      <h3 className="svc-open-title">{item.title}</h3>
      <p className="svc-open-body">{item.body}</p>
      <div className="svc-includes">
        <p>What&apos;s included</p>
        <ul>
          {item.includes.map((row) => (
            <li key={row}>
              <i aria-hidden="true" />
              {row}
            </li>
          ))}
        </ul>
      </div>
      <span className="svc-badge">
        {item.badge}
        <b />
      </span>
      <div className="svc-foot">
        <Link className="svc-explore" href={item.href || "/services"}>
          <span>Explore</span>
          <span className="svc-explore-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function ServicesBoard() {
  const list = siteConfig.servicesList || [];
  const [open, setOpen] = useState(0);
  const [entered, setEntered] = useState(false);
  const [hoverAble, setHoverAble] = useState(false);
  const lines = splitHeading(siteConfig.servicesHeading);

  useEffect(() => {
    const node = document.getElementById("services");
    if (!node) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setEntered(true);
      },
      { threshold: 0.12 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setHoverAble(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const openPanel = (index) => setOpen(index);

  return (
    <section id="services" className={`svc${entered ? " is-on" : ""}`} aria-label="Services">
      <div className="svc-top">
        <div className="svc-copy">
          <p className="svc-kicker">
            <i aria-hidden="true" />
            {siteConfig.servicesKicker}
          </p>
          <h2 className="svc-title" aria-label={plainText(siteConfig.servicesHeading)}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex} className="svc-line" aria-hidden="true">
                {line.map((part, partIndex) =>
                  part.accent ? (
                    <span key={partIndex} className="svc-mark">
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
        <div className="svc-side">
          <p className="svc-body">{siteConfig.servicesBody}</p>
          <Link className="svc-all" href={siteConfig.servicesCtaHref || "/services"}>
            <span>{siteConfig.servicesCta}</span>
            <span className="svc-all-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      <div className="svc-rail" role="list">
        {list.map((item, index) => {
          const isOpen = open === index;
          const num = String(index + 1).padStart(2, "0");

          return (
            <article
              key={item.id}
              role="listitem"
              className={`svc-panel tone-${item.tone}${isOpen ? " is-open" : ""}`}
              style={{ flexGrow: isOpen ? 8.5 : 1 }}
              onMouseEnter={() => {
                if (hoverAble) openPanel(index);
              }}
              onFocusCapture={() => openPanel(index)}
            >
              <button
                type="button"
                className="svc-hit"
                aria-expanded={isOpen}
                aria-controls={`svc-body-${item.id}`}
                id={`svc-trigger-${item.id}`}
                onClick={() => openPanel(index)}
              >
                <span className="svc-num">{num}</span>
                <span className="svc-name">{item.title}</span>
                <span className="svc-toggle" aria-hidden="true">
                  <i className={isOpen ? "is-minus" : "is-plus"} />
                </span>
              </button>

              <div
                id={`svc-body-${item.id}`}
                role="region"
                aria-labelledby={`svc-trigger-${item.id}`}
                className="svc-body-panel"
                hidden={!isOpen}
              >
                <div className="svc-open">
                  <div className="svc-open-visual">
                    <ServiceVisual item={item} active={isOpen && entered} />
                  </div>
                  <ServiceDetails item={item} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
