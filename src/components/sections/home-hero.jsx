"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/constants/site";
import { startHeroSignal } from "@/components/sections/hero-signal";
import "@/styles/home-hero.css";

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

function headingLines(value) {
  let index = 0;
  return value.split("|").map((line) =>
    splitWords(line).map((word) => {
      const delay = 260 + index * 70;
      index += 1;
      return { ...word, delay };
    }),
  );
}

function Glyph({ name }) {
  if (name === "cal") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

function Button({ href, label, kind, icon = "arrow" }) {
  const external = /^https?:\/\//.test(href || "");

  return (
    <Link
      className={`rw-btn rw-${kind}`}
      data-mag=""
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      <span className="rw-face">
        <span className="rw-fill" aria-hidden="true" />
        <span className="rw-lbl">
          <span className="rw-roll">
            <span className="rw-l1">{label}</span>
            <span className="rw-l2" aria-hidden="true">
              {label}
            </span>
          </span>
        </span>
        <span className="rw-arr" aria-hidden="true">
          <span className="rw-a1">
            <Glyph name={icon} />
          </span>
          <span className="rw-a2">
            <Glyph name={icon} />
          </span>
        </span>
      </span>
      <span className="rw-ping" aria-hidden="true">
        <i className="rw-ping-r" />
        <b>
          <span>1</span>
          <span>+1</span>
        </b>
      </span>
    </Link>
  );
}

export default function HomeHero() {
  const root = useRef(null);
  const canvas = useRef(null);
  const copy = useRef(null);
  const cursor = useRef(null);
  const [entered, setEntered] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [solidNav, setSolidNav] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [reach, setReach] = useState(siteConfig.counterStart);
  const energy = useRef(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    lastScrollY.current = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);

    const readY = () => Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);

    // One scroll listener only — wheel + scroll together made the nav
    // flash in on scroll-up then immediately hide again.
    const onScroll = () => {
      if (menuOpen) return;
      const y = readY();
      const delta = y - lastScrollY.current;
      setSolidNav(y > 48);

      if (y <= 8) {
        setNavHidden(false);
      } else if (delta < -4) {
        // Scroll up → bring nav forward and keep it
        setNavHidden(false);
      } else if (delta > 8) {
        // Scroll down → tuck nav away
        setNavHidden(true);
      }

      lastScrollY.current = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1099px)");
    const apply = () => {
      const matches = media.matches;
      setNarrow(matches);
      if (!matches) setMenuOpen(false);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (energy.current <= 0) return;
      const next = energy.current;
      energy.current = 0;
      setReach((value) => value + next);
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const node = root.current;
    const surface = canvas.current;
    if (!node || !surface) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const stop = startHeroSignal({
      root: node,
      canvas: surface,
      imageUrl: siteConfig.photo,
      copy,
      onReady: () => setGlReady(true),
      onEnergy: (amount) => {
        energy.current += amount;
      },
    });

    return () => {
      stop();
    };
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || narrow) return undefined;
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return undefined;

    node.classList.add("has-cur");
    let x = -99;
    let y = -99;
    let aimX = -99;
    let aimY = -99;
    let mode = "";
    let inside = false;
    let frame = 0;

    const setMode = (next) => {
      if (next === mode || !cursor.current) return;
      mode = next;
      cursor.current.dataset.m = next;
    };

    const onMove = (event) => {
      const box = node.getBoundingClientRect();
      x = event.clientX;
      y = event.clientY;
      inside = y >= box.top && y <= box.bottom && x >= box.left && x <= box.right;
      const target = event.target;
      if (target.closest?.(".rw-btn, .rwh-links a")) setMode("btn");
      else if (target.closest?.(".rwh-h1, .rwh-sub")) setMode("dot");
      else setMode(inside ? "reach" : "out");
    };
    const onLeave = () => {
      inside = false;
      setMode("out");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);

    const loop = () => {
      const mark = cursor.current;
      if (mark && inside) {
        aimX += (x - aimX) * 0.28;
        aimY += (y - aimY) * 0.28;
        mark.style.transform = `translate3d(${aimX.toFixed(1)}px, ${aimY.toFixed(1)}px, 0)`;
      }
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frame);
      node.classList.remove("has-cur");
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [narrow]);

  useEffect(() => {
    const node = root.current;
    if (!node || narrow) return undefined;
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return undefined;

    const move = (event) => {
      node.querySelectorAll("[data-mag]").forEach((button) => {
        const box = button.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const distance = Math.hypot(dx, dy);
        const pull = distance < 150 ? (1 - distance / 150) * 8 : 0;
        button.style.setProperty("--mx", `${(dx / (distance || 1)) * pull}px`);
        button.style.setProperty("--my", `${(dy / (distance || 1)) * pull}px`);
      });
    };
    const leave = () => {
      node.querySelectorAll("[data-mag]").forEach((button) => {
        button.style.setProperty("--mx", "0px");
        button.style.setProperty("--my", "0px");
      });
    };

    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", leave);
    return () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
    };
  }, [narrow]);

  const lines = headingLines(siteConfig.heading);

  const nav = (
    <nav
      className={`rwh-nav${entered ? " is-in" : ""}${solidNav ? " is-solid" : ""}${navHidden && !menuOpen ? " is-away" : ""}${menuOpen ? " is-open" : ""}`}
      aria-label="Main"
    >
      <div className="rwh-shell">
        <div className="rwh-bar">
          <Link className="rwh-logo" href="/" onClick={() => setMenuOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="rwh-mark rwh-mark-light" src="/images/agreed-logo.png" alt="Agreed" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="rwh-mark rwh-mark-dark"
              src="/images/agreed-logo-on-dark.png"
              alt=""
              aria-hidden="true"
            />
          </Link>

          <span className="rwh-nav-cta">
            <Button href={siteConfig.bookHref} label={siteConfig.navCta} kind="quiet" icon="cal" />
          </span>

          <button
            className="rwh-menu"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg className="rwh-menu-x" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <span className="rwh-menu-icon" aria-hidden="true" />
            )}
          </button>
        </div>

        <ul
          id="site-menu"
          className={`rwh-links${menuOpen ? " is-open" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          <li className="rwh-menu-home">
            <Link href="/">
              <svg className="rwh-menu-mark" viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.4" />
                <circle cx="16" cy="16" r="3.4" fill="currentColor" />
              </svg>
              Home
            </Link>
          </li>
          {siteConfig.nav.map((item, index) => (
            <li key={item.href}>
              <Link href={item.href}>
                <span className="rwh-menu-no">{String(index + 2).padStart(2, "0")}</span>
                {item.label}
              </Link>
            </li>
          ))}
          <li className="rwh-links-cta">
            <Button href={siteConfig.bookHref} label={siteConfig.navCta} kind="quiet" icon="cal" />
          </li>
        </ul>
      </div>
    </nav>
  );

  return (
    <>
      {/* Outside .rwh so isolation/stacking never traps the nav behind later sections */}
      {nav}

      <section
        ref={root}
        className={`rwh${entered ? " is-in" : ""}${glReady ? " is-gl" : ""}`}
        aria-label="Reachwise"
      >
      <div className="rwh-bg" aria-hidden="true">
        {/* The canvas replaces this frame. A plain image keeps the first paint and the WebGL upload on the same file. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rwh-img" src={siteConfig.photo} alt="" fetchPriority="high" decoding="async" />
        <canvas ref={canvas} className="rwh-cv" />
        {!glReady && <i className="rwh-stillring" />}
        <i className="rwh-shade" />
      </div>

      {!narrow && (
        <p className="rwh-hint rise d4">
          <i className="rwh-hint-r" aria-hidden="true" />
          {siteConfig.hint}
        </p>
      )}

      <div className="rwh-in">
        <div ref={copy} className="rwh-copy">
          <p className="rwh-ann rise d1">
            <i className="rwh-port" aria-hidden="true" />
            {siteConfig.announce}
          </p>
          <h1 className="rwh-h1" aria-label={plainText(siteConfig.heading)}>
            {lines.map((line) => (
              <span className="rwh-line" key={line.map((word) => word.text).join("-")} aria-hidden="true">
                {line.map((word) => (
                  <span className="rwh-w" key={`${word.text}-${word.delay}`}>
                    <span
                      className={`rwh-wi${word.accent ? " is-acc" : ""}`}
                      style={{ transitionDelay: `${word.delay}ms` }}
                    >
                      {word.text}
                      {word.tail}
                    </span>{" "}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="rwh-sub rise d2">{siteConfig.sub}</p>
          <div className="rwh-btns rise d3">
            <Button href={siteConfig.primaryHref} label={siteConfig.primary} kind="solid" icon="cal" />
            <Button href={siteConfig.secondaryHref} label={siteConfig.secondary} kind="ghost" />
          </div>
        </div>
      </div>

      <div className="rwh-strip rise d4">
        <div className="rwh-count">
          <p className="rwh-count-l">
            <i className="rwh-live" aria-hidden="true" />
            {siteConfig.counterLabel}
          </p>
          <p className="rwh-count-n">{reach.toLocaleString("en-US")}</p>
        </div>
        <ul className="rwh-tags">
          {siteConfig.services.map((service, index) => (
            <li key={service}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {service}
            </li>
          ))}
        </ul>
        <p className="rwh-proof">
          <span className="rwh-stars" aria-hidden="true">
            ★★★★★
          </span>
          <span>
            <b>{siteConfig.rating}</b>
            {` · ${siteConfig.reviews} client reviews`}
          </span>
          <span className="rwh-dim">{siteConfig.clients} brands grown</span>
        </p>
      </div>

      <div ref={cursor} className="rwh-cur" data-m="out" aria-hidden="true">
        <i className="rwh-cur-r">
          <b>Reach</b>
        </i>
        <i className="rwh-cur-d" />
      </div>
      </section>
    </>
  );
}
