"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/constants/site";
import "@/styles/team-grid.css";

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

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function modeOf(width, count) {
  if (width < 760) return { phone: true, cols: 1, rowsN: 1 };
  if (width < 1100) return { phone: false, cols: 3, rowsN: Math.max(1, Math.ceil(count / 3)) };
  return { phone: false, cols: Math.max(1, count), rowsN: 1 };
}

export default function TeamGrid() {
  const people = siteConfig.team || [];
  const total = people.length;
  const lines = splitHeading(siteConfig.teamHeading);
  const root = useRef(null);
  const ring = useRef(null);
  const row = useRef(null);
  const maskRef = useRef("");
  const [mask, setMask] = useState("");
  const [seen, setSeen] = useState([]);
  const [on, setOn] = useState(false);
  const [all, setAll] = useState(false);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const phoneQuery = window.matchMedia("(max-width: 759px)");
    const applyPhone = () => setPhone(phoneQuery.matches);
    applyPhone();

    if (reduce.matches) {
      setAll(true);
      setOn(true);
      return () => phoneQuery.removeEventListener("change", applyPhone);
    }

    let shown = false;

    const place = (progress) => {
      const mode = modeOf(el.offsetWidth || window.innerWidth, total);
      let x = 0;
      let y = 0.44;
      const lit = [];

      if (mode.phone) {
        x = 0.02 + progress * 0.96;
        y = 0.4;
        for (let index = 0; index < total; index += 1) lit.push(index === 0 && x >= 0.4);
      } else {
        const travel = progress * mode.rowsN;
        const rowIndex = Math.min(mode.rowsN - 1, Math.floor(travel));
        const local = progress >= 1 ? 1 : travel - rowIndex;
        const across = rowIndex % 2 ? 1 - local : local;
        x = -0.04 + across * 1.08;
        y = mode.rowsN > 1 ? (rowIndex + 0.5) / mode.rowsN : 0.44;
        for (let index = 0; index < total; index += 1) {
          const cardRow = Math.floor(index / mode.cols);
          const center = ((index % mode.cols) + 0.5) / mode.cols;
          const passed = rowIndex % 2 ? x <= center + 0.03 : x >= center - 0.03;
          lit.push(cardRow < rowIndex || (cardRow === rowIndex && passed));
        }
      }

      if (ring.current) {
        ring.current.style.setProperty("--rx", `${(x * 100).toFixed(2)}%`);
        ring.current.style.setProperty("--ry", `${(y * 100).toFixed(1)}%`);
      }

      const next = lit.map((item) => (item ? "1" : "0")).join("");
      if (next !== maskRef.current) {
        maskRef.current = next;
        setMask(next);
      }
    };

    const paint = () => {
      const rect = el.getBoundingClientRect();
      const view = window.innerHeight || 1;
      const rowTop = window.scrollY + (row.current ? row.current.getBoundingClientRect().top : rect.top + rect.height * 0.45);
      const start = rowTop - view * 0.92;
      const end = Math.min(rowTop - view * 0.28, document.documentElement.scrollHeight - view);
      const progress = clamp01((window.scrollY - start) / Math.max(1, end - start));
      if (!shown && rect.top < view * 0.92) {
        shown = true;
        setOn(true);
      }
      place(progress);
    };

    paint();
    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
    phoneQuery.addEventListener("change", applyPhone);
    reduce.addEventListener("change", paint);
    return () => {
      window.removeEventListener("scroll", paint);
      window.removeEventListener("resize", paint);
      phoneQuery.removeEventListener("change", applyPhone);
      reduce.removeEventListener("change", paint);
    };
  }, [total]);

  useEffect(() => {
    if (!phone || !row.current) return;
    const scroller = row.current;
    const watcher = new IntersectionObserver(
      (entries) => {
        const add = [];
        entries.forEach((entry) => {
          if (entry.isIntersecting) add.push(Number(entry.target.dataset.i));
        });
        if (add.length) {
          setSeen((current) => Array.from(new Set([...current, ...add])));
        }
      },
      { root: scroller, threshold: 0.6 },
    );
    Array.from(scroller.children).forEach((child, index) => {
      if (index > 0) watcher.observe(child);
    });
    return () => watcher.disconnect();
  }, [phone, total]);

  useEffect(() => {
    const el = ring.current;
    const section = root.current;
    if (!all || !el || !section) return;
    const mode = modeOf(section.offsetWidth || window.innerWidth, total);
    const last = Math.max(0, total - 1);
    const x = mode.phone ? 0.42 : ((last % mode.cols) + 0.5) / mode.cols;
    const y = mode.phone ? 0.4 : mode.rowsN > 1 ? (Math.floor(last / mode.cols) + 0.5) / mode.rowsN : 0.44;
    el.style.setProperty("--rx", `${x * 100}%`);
    el.style.setProperty("--ry", `${y * 100}%`);
  }, [all, total]);

  const lit = (index) => all || mask.charAt(index) === "1" || (phone && on && seen.includes(index));
  let reached = 0;
  for (let index = 0; index < total; index += 1) if (lit(index)) reached += 1;

  let wordDelay = 90;

  return (
    <section ref={root} className={`team${on ? " is-on" : ""}${all ? " is-still" : ""}`} id="team" aria-label="Team">
      <div className="team-wrap">
        <div className="team-top">
          <div>
            <p className="team-kicker">
              <i />
              {siteConfig.teamKicker}
            </p>
            <h2 className="team-title" aria-label={String(siteConfig.teamHeading || "").replace(/\*/g, "").replace(/\|/g, " ")}>
              {lines.map((line, lineIndex) => (
                <span className="team-line" key={lineIndex}>
                  {line.flatMap((part) =>
                    part.text.split(/\s+/).filter(Boolean).map((word) => {
                      const delay = wordDelay;
                      wordDelay += 55;
                      return (
                        <span className="team-word" key={`${lineIndex}-${word}`}>
                          <span className="team-word-in" style={{ transitionDelay: `${delay}ms` }}>
                            {part.accent ? <em className="team-mark">{word}</em> : word}{" "}
                          </span>
                        </span>
                      );
                    }),
                  )}
                </span>
              ))}
            </h2>
          </div>
          <div className="team-side">
            <p className="team-body">{siteConfig.teamBody}</p>
            <div className="team-bar">
              <Link className="team-cta" href={siteConfig.teamCtaHref || "/#team"}>
                <span>{siteConfig.teamCta}</span>
                <span className="team-cta-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </Link>
              <p className="team-count">
                <i className="team-count-dot" aria-hidden="true" />
                <span>{siteConfig.teamReachedLabel}</span>
                <strong>
                  {String(reached).padStart(2, "0")}
                  <small>/{String(total).padStart(2, "0")}</small>
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className="team-stage">
          <div ref={ring} className="team-ring" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <ul ref={row} className="team-grid">
            {people.map((person, index) => (
              <li className={`team-card${lit(index) ? " is-lit" : ""}`} data-i={index} key={person.name}>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person.image} alt="" />
                  <span className="team-flash" aria-hidden="true" />
                  <span className="team-tag">
                    <i aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    </i>
                    {person.tag}
                    <b aria-hidden="true" />
                  </span>
                  <span className="team-n">{person.n}</span>
                </figure>
                <h3>{person.name}</h3>
                <p>{person.role}</p>
                <a className="team-in" href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M6.9 8.8H3.6V20h3.3V8.8zM5.2 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zM20.4 13.4c0-3-1.6-4.9-4.2-4.9-1.4 0-2.4.7-2.9 1.5V8.8H10V20h3.3v-5.7c0-1.5.6-2.6 2-2.6 1.3 0 1.8 1 1.8 2.6V20h3.3v-6.6z"
                    />
                  </svg>
                  LinkedIn
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
