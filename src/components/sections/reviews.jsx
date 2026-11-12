"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/constants/site";
import "@/styles/reviews.css";

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

function Stars({ value = 5 }) {
  const filled = Math.round(Number(value) || 5);
  return (
    <span className="rev-stars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <svg key={index} viewBox="0 0 24 24" style={{ opacity: index < filled ? 1 : 0.28 }}>
          <path
            fill="currentColor"
            d="M12 2.6l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17.6 6.1 20.8l1.2-6.6L2.4 9.6l6.7-.9z"
          />
        </svg>
      ))}
    </span>
  );
}

export default function Reviews() {
  const lines = splitHeading(siteConfig.reviewsHeading);
  const notes = siteConfig.reviewsList || [];
  const root = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} className={`rev${on ? " is-on" : ""}`} id="reviews" aria-label="Client reviews">
      <div className="rev-wrap">
        <div className="rev-copy">
          <p className="rev-kicker">
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
            </i>
            {siteConfig.reviewsKicker}
          </p>

          <div className="rev-score">
            <strong>{siteConfig.reviewsRating}</strong>
            <Stars value={siteConfig.reviewsRating} />
          </div>
          <p className="rev-count">{siteConfig.reviewsCount}</p>

          <div className="rev-platforms">
            {(siteConfig.reviewsPlatforms || []).map((item) => (
              <span key={item.name}>
                {item.name} <b>{item.score}</b>
              </span>
            ))}
          </div>

          <h2 className="rev-title" aria-label={String(siteConfig.reviewsHeading || "").replace(/\*/g, "").replace(/\|/g, " ")}>
            {lines.map((line, lineIndex) => (
              <span className="rev-line" key={lineIndex}>
                {line.map((part, partIndex) =>
                  part.accent ? (
                    <em className="rev-mark" key={`${lineIndex}-${partIndex}`}>
                      {part.text}
                    </em>
                  ) : (
                    <span key={`${lineIndex}-${partIndex}`}>{part.text}</span>
                  ),
                )}
              </span>
            ))}
          </h2>

          <p className="rev-body">{siteConfig.reviewsBody}</p>

          <Link className="rev-cta" href={siteConfig.reviewsCtaHref || "/#work"}>
            <span>{siteConfig.reviewsCta}</span>
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </i>
          </Link>
        </div>

        <div className="rev-stage" aria-hidden="true">
          <div className="rev-phone">
            <span className="rev-btn rev-btn-silent" />
            <span className="rev-btn rev-btn-vol-up" />
            <span className="rev-btn rev-btn-vol-down" />
            <span className="rev-btn rev-btn-power" />

            <div className="rev-screen">
              <div className="rev-wallpaper" aria-hidden="true" />
              <div className="rev-veil" />
              <div className="rev-island" />

              <div className="rev-status">
                <span>{siteConfig.reviewsPhoneDate}</span>
                <strong>{siteConfig.reviewsPhoneTime}</strong>
              </div>

              <div className="rev-pill">{siteConfig.reviewsNew}</div>

              <ul className="rev-stack">
                {notes.map((note, index) => (
                  <li className="rev-note" key={note.name} style={{ ["--i"]: index }}>
                    <div className="rev-note-top">
                      <span className="rev-app">
                        <i aria-hidden="true" />
                        Reachwise
                      </span>
                      <span className="rev-when">{note.when}</span>
                    </div>
                    <div className="rev-note-head">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={note.image} alt="" />
                      <div>
                        <b>{note.name}</b>
                        <span>{note.role}</span>
                      </div>
                      <em>{note.metric}</em>
                    </div>
                    <q>{note.quote}</q>
                  </li>
                ))}
              </ul>

              <div className="rev-dock">
                <span className="rev-dock-btn" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6M10 18a5 5 0 0 1-5-5V9a7 7 0 0 1 14 0v4a5 5 0 0 1-5 5" />
                    <path d="M12 22v-4" />
                  </svg>
                </span>
                <span className="rev-dock-btn" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8.5A3.5 3.5 0 0 1 7.5 5h9A3.5 3.5 0 0 1 20 8.5v5a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 13.5v-5Z" />
                    <circle cx="12" cy="11" r="2.6" />
                    <path d="M8 5.2 8.7 3.8h6.6L16 5.2" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
