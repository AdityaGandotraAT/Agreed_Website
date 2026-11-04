"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/constants/site";
import "@/styles/services-board.css";

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

function SerpVisual({ item }) {
  return (
    <div className="svc-serp" aria-hidden="true">
      <div className="svc-serp-bar">
        <i />
        <span>{item.query || "dentist near me"}</span>
      </div>
      <div className="svc-serp-list">
        <div className="svc-serp-row is-win">
          <b>{item.result || "yoursite.com"}</b>
          <span>Open · highly rated · book online</span>
          <em>#1</em>
        </div>
        <div className="svc-serp-row">
          <b>competitor.example</b>
          <span>Ads · sponsored listing</span>
        </div>
        <div className="svc-serp-row">
          <b>directory.example</b>
          <span>Reviews and listings nearby</span>
        </div>
      </div>
      {item.tip && <p className="svc-tip">{item.tip}</p>}
    </div>
  );
}

function FeedsVisual({ item }) {
  return (
    <div className="svc-mock svc-feeds" aria-hidden="true">
      <div className="svc-feed-card">
        <span className="svc-feed-dot" />
        <div>
          <b>@yourbrand</b>
          <p>New drop for the people already following #coffee</p>
        </div>
      </div>
      <div className="svc-feed-card is-dim">
        <span className="svc-feed-dot" />
        <div>
          <b>@neighbor</b>
          <p>Same feed. Different message.</p>
        </div>
      </div>
      {item.tip && <p className="svc-tip">{item.tip}</p>}
    </div>
  );
}

function AdsVisual({ item }) {
  return (
    <div className="svc-mock svc-ads" aria-hidden="true">
      <div className="svc-ad">
        <span>Sponsored</span>
        <b>Book a consult this week</b>
        <p>Shown to people searching nearby and ready to buy.</p>
      </div>
      {item.tip && <p className="svc-tip">{item.tip}</p>}
    </div>
  );
}

function ContentVisual({ item }) {
  return (
    <div className="svc-mock svc-content" aria-hidden="true">
      <div className="svc-doc">
        <i />
        <i />
        <i />
        <b>Guide: how buyers choose</b>
      </div>
      {item.tip && <p className="svc-tip">{item.tip}</p>}
    </div>
  );
}

function WebVisual({ item }) {
  return (
    <div className="svc-mock svc-web" aria-hidden="true">
      <div className="svc-browser">
        <span />
        <span />
        <span />
        <div className="svc-browser-body">
          <b>yoursite.com</b>
          <p>Fast. Clear. Built to convert.</p>
        </div>
      </div>
      {item.tip && <p className="svc-tip">{item.tip}</p>}
    </div>
  );
}

function BrandVisual({ item }) {
  return (
    <div className="svc-mock svc-brand" aria-hidden="true">
      <div className="svc-swatch">
        <i />
        <i />
        <i />
      </div>
      <b>Your mark. One voice.</b>
      {item.tip && <p className="svc-tip">{item.tip}</p>}
    </div>
  );
}

function ServiceVisual({ item }) {
  switch (item.visual) {
    case "feeds":
      return <FeedsVisual item={item} />;
    case "ads":
      return <AdsVisual item={item} />;
    case "content":
      return <ContentVisual item={item} />;
    case "web":
      return <WebVisual item={item} />;
    case "brand":
      return <BrandVisual item={item} />;
    default:
      return <SerpVisual item={item} />;
  }
}

export default function ServicesBoard() {
  const list = siteConfig.servicesList || [];
  const [open, setOpen] = useState(0);
  const [entered, setEntered] = useState(false);
  const lines = splitHeading(siteConfig.servicesHeading);
  const active = list[open] || list[0];

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

  return (
    <section
      id="services"
      className={`svc${entered ? " is-on" : ""}`}
      aria-label="Services"
    >
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

      <div className="svc-list">
        {list.map((item, index) => {
          const isOpen = open === index;
          const num = String(index + 1).padStart(2, "0");
          return (
            <article
              key={item.id}
              className={`svc-item tone-${item.tone}${isOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="svc-head"
                aria-expanded={isOpen}
                aria-controls={`svc-panel-${item.id}`}
                id={`svc-trigger-${item.id}`}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                <span className="svc-num">{num}</span>
                <span className="svc-name">{item.title}</span>
                <span className="svc-toggle" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              <div
                id={`svc-panel-${item.id}`}
                role="region"
                aria-labelledby={`svc-trigger-${item.id}`}
                className="svc-panel"
                hidden={!isOpen}
              >
                <div className="svc-panel-in">
                  <div className="svc-visual">
                    <ServiceVisual item={item} />
                  </div>
                  <div className="svc-detail">
                    <p className="svc-desc">{item.body}</p>
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
                    <div className="svc-foot">
                      <span className="svc-badge">{item.badge}</span>
                      <span className="svc-price">{item.price}</span>
                      <Link className="svc-explore" href={item.href || "/services"}>
                        <span>Explore</span>
                        <span className="svc-explore-ico" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7M9 7h8v8" />
                          </svg>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {active && (
        <div className="svc-progress" aria-live="polite">
          <span>
            {String(Math.max(open, 0) + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}{" "}
            {open >= 0 ? active.title : "Services"}
          </span>
          <div className="svc-dots" aria-hidden="true">
            {list.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={open === index ? "is-on" : undefined}
                onClick={() => setOpen(index)}
                aria-label={`Open ${item.title}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
