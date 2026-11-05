"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { siteConfig } from "@/constants/site";
import "@/styles/content-wall.css";


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

function plainText(value) {
  return String(value || "")
    .replace(/\*/g, "")
    .replace(/\s*\|\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function layoutTop(node) {
  let top = 0;
  let current = node;
  while (current) {
    top += current.offsetTop;
    current = current.offsetParent;
  }
  return top - window.scrollY;
}

function Post({ post, cardRef }) {
  return (
    <figure className="wall-card" ref={cardRef}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.image} alt="" style={{ height: post.h, objectPosition: post.focus || "center" }} />
      {post.slide ? <span className="wall-slide">{post.slide}</span> : null}
      {post.views ? (
        <span className="wall-views">
          <i aria-hidden="true" />
          {post.views}
        </span>
      ) : null}
      <figcaption>
        <span className="wall-av" style={{ background: post.color }}>
          {post.handle.slice(0, 1)}
        </span>
        <span className="wall-handle">@{post.handle}</span>
        <span className="wall-likes">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              d="M12 20.2 10.7 19C6.1 14.8 3 12 3 8.6 3 6 5 4 7.6 4c1.5 0 3 .7 3.9 1.9C12.4 4.7 13.9 4 15.4 4 18 4 20 6 20 8.6c0 3.4-3.1 6.2-7.7 10.4L12 20.2Z"
            />
          </svg>
          {post.likes}
        </span>
      </figcaption>
    </figure>
  );
}

export default function ContentWall() {
  const lines = splitHeading(siteConfig.contentHeading);
  const columns = siteConfig.contentColumns || [];
  const cards = useRef([]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const paint = () => {
      frame = 0;
      const list = cards.current.filter(Boolean);
      if (motion.matches) {
        list.forEach((card) => {
          card.style.transform = "";
          card.style.opacity = "";
        });
        return;
      }

      const view = window.innerHeight || 1;
      list.forEach((card) => {
        const distance = view * 0.28;
        const progress = Math.min(1, Math.max(0, (view - layoutTop(card)) / distance));
        const eased = 1 - (1 - progress) ** 3;
        card.style.transform = `translate3d(0, ${((1 - eased) * 56).toFixed(1)}px, 0)`;
        card.style.opacity = eased.toFixed(3);
      });
    };

    const requestPaint = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", requestPaint);
    motion.addEventListener("change", requestPaint);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestPaint);
      window.removeEventListener("resize", requestPaint);
      motion.removeEventListener("change", requestPaint);
    };
  }, []);

  return (
    <section id="content" className="wall" aria-label="Content">
      <div className="wall-wrap">
        <div className="wall-top">
          <div>
            <p className="wall-kicker">
              <i aria-hidden="true" />
              {siteConfig.contentKicker}
            </p>
            <h2 className="wall-title" aria-label={plainText(siteConfig.contentHeading)}>
              {lines.map((line, lineIndex) => (
                <span key={lineIndex} className="wall-line">
                  {line.map((part, partIndex) =>
                    part.accent ? (
                      <em key={partIndex} className="wall-mark">
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
          <div className="wall-side">
            <p className="wall-body">{siteConfig.contentBody}</p>
            <div className="wall-pills">
              {(siteConfig.contentStats || []).map((stat) => (
                <span key={stat}>
                  <i aria-hidden="true" />
                  {stat}
                </span>
              ))}
            </div>
            <p className="wall-lift">
              <i aria-hidden="true" />
              {siteConfig.contentLift}
            </p>
            <Link className="wall-cta" href={siteConfig.contentCtaHref || "/#services"}>
              <span>{siteConfig.contentCta}</span>
              <i aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </i>
            </Link>
          </div>
        </div>

        <div className="wall-grid">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="wall-col">
              {column.map((post, postIndex) => (
                <Post
                  key={`${post.handle}-${post.likes}`}
                  post={post}
                  cardRef={(node) => {
                    cards.current[columnIndex * 10 + postIndex] = node;
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
