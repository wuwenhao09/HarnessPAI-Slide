import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "HarnessPAI_30分钟中文讲稿.md");
const outputPath = path.join(root, "teleprompter.html");
const markdown = fs.readFileSync(sourcePath, "utf8");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

const pageHeadingPattern = /^## 第(\d+)页｜(.+)$/gm;
const matches = [...markdown.matchAll(pageHeadingPattern)];

const pages = matches.map((match, index) => {
  const pageNumber = Number(match[1]);
  const title = match[2].trim();
  const start = match.index + match[0].length;
  const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
  const section = markdown.slice(start, end).trim();

  const timeMatch = section.match(/\*\*时间：([^*]+)\*\*/);
  const timeText = timeMatch ? timeMatch[1].trim() : "";
  const rangeMatch = timeText.match(/(\d{2}:\d{2}[–-]\d{2}:\d{2})/);
  const durationMatch = timeText.match(/(\d+秒)/);
  const detailMatch = timeText.match(/，((?:含|约).*)$/);
  const timeRange = rangeMatch ? rangeMatch[1] : timeText;
  const duration = durationMatch ? durationMatch[1] : "";
  const timeDetail = detailMatch ? detailMatch[1].replace(/。$/, "") : "";

  const evidenceMatch = section.match(/\*依据：([\s\S]*?)\*/);
  const evidence = evidenceMatch ? evidenceMatch[1].trim() : "";

  const withoutMetadata = section
    .replace(/\*\*时间：[^*]+\*\*/g, "")
    .replace(/\*依据：[\s\S]*?\*/g, "")
    .trim();

  const blocks = withoutMetadata
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const joined = block.replace(/\s*\n\s*/g, " ");
      if (/^\[[\s\S]*\]$/.test(joined)) {
        return { type: "cue", text: joined.slice(1, -1).trim() };
      }
      return { type: "script", text: joined };
    });

  return { pageNumber, title, timeRange, duration, timeDetail, blocks, evidence };
});

const expectedPages = Array.from({ length: 37 }, (_, index) => index + 1);
const actualPages = pages.map((page) => page.pageNumber);
if (JSON.stringify(actualPages) !== JSON.stringify(expectedPages)) {
  throw new Error(`Expected pages 1–37, found: ${actualPages.join(", ")}`);
}

function renderPage(page) {
  const titleId = `page-title-${page.pageNumber}`;
  const cueCount = page.blocks.filter((block) => block.type === "cue").length;
  const body = page.blocks
    .map((block) => {
      if (block.type === "cue") {
        return `<aside class="cue-block" aria-label="演示提示，不用朗读"><span class="cue-label">演示提示 · 不用读</span><p>${renderInline(block.text)}</p></aside>`;
      }
      return `<p class="script-paragraph">${renderInline(block.text)}</p>`;
    })
    .join("\n          ");

  const evidence = page.evidence
    ? `<details class="evidence-block"><summary><span>备讲依据</span><kbd>E</kbd></summary><p>${renderInline(page.evidence)}</p></details>`
    : "";

  return `<section class="script-page" id="page-${page.pageNumber}" data-page="${page.pageNumber}" data-title="${escapeHtml(page.title)}" data-cue-count="${cueCount}" aria-hidden="true" inert>
        <div class="reader" aria-labelledby="${titleId}">
          <article class="page-inner">
            <header class="page-heading">
              <div class="page-meta">
                <span class="page-kicker">第 ${String(page.pageNumber).padStart(2, "0")} 页</span>
                <span class="time-chip"><strong>${escapeHtml(page.timeRange)}</strong><span>${escapeHtml(page.duration)}</span></span>
                ${page.timeDetail ? `<span class="time-detail">${escapeHtml(page.timeDetail)}</span>` : ""}
              </div>
              <h1 id="${titleId}">${renderInline(page.title)}</h1>
            </header>
            <div class="page-body">
              ${body}
              ${evidence}
            </div>
          </article>
        </div>
      </section>`;
}

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0a0f16">
  <meta name="description" content="HarnessPAI 30分钟中文讲稿提词器，共37页，支持键盘翻页。">
  <title>HarnessPAI · 中文讲稿提词器</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #080d13;
      --bg-soft: #0e1621;
      --panel: rgba(17, 27, 39, 0.84);
      --panel-solid: #111b27;
      --text: #f4f1e9;
      --text-soft: #d7dbe0;
      --muted: #8e9aaa;
      --line: rgba(255, 255, 255, 0.10);
      --line-strong: rgba(255, 255, 255, 0.16);
      --accent: #ff6900;
      --accent-soft: rgba(255, 105, 0, 0.13);
      --accent-bright: #ff8b3d;
      --green: #6ee7b7;
      --shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
      --reading-size: 34px;
      --radius: 18px;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
    }

    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; }
    body {
      overflow: hidden;
      color: var(--text);
      background:
        radial-gradient(circle at 15% 0%, rgba(255, 105, 0, 0.10), transparent 32rem),
        radial-gradient(circle at 90% 90%, rgba(57, 91, 130, 0.18), transparent 40rem),
        var(--bg);
    }

    button, a { -webkit-tap-highlight-color: transparent; }
    button { font: inherit; }
    a { color: var(--accent-bright); }
    ::selection { color: #fff; background: rgba(255, 105, 0, 0.45); }

    .app {
      height: 100dvh;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
    }

    .topbar {
      min-height: 66px;
      display: grid;
      grid-template-columns: minmax(200px, 1fr) auto minmax(200px, 1fr);
      align-items: center;
      gap: 20px;
      padding: 0 28px;
      border-bottom: 1px solid var(--line);
      background: rgba(8, 13, 19, 0.76);
      backdrop-filter: blur(18px);
      position: relative;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      color: var(--text);
      text-decoration: none;
    }

    .brand-mark {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 105, 0, 0.55);
      border-radius: 9px;
      color: var(--accent-bright);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 15px;
      font-weight: 750;
      background: var(--accent-soft);
      box-shadow: inset 0 0 18px rgba(255, 105, 0, 0.08);
    }

    .brand-copy { min-width: 0; line-height: 1.1; }
    .brand-title {
      display: block;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }
    .brand-subtitle {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 11px;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }

    .page-counter {
      display: flex;
      align-items: baseline;
      gap: 7px;
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.04em;
    }
    .page-counter strong {
      color: var(--text);
      font-size: 20px;
      font-weight: 700;
    }
    .page-counter span { font-size: 13px; }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .tool-button,
    .side-button {
      appearance: none;
      border: 1px solid transparent;
      color: var(--text-soft);
      background: transparent;
      border-radius: 9px;
      cursor: pointer;
      transition: background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
    }

    .tool-button {
      min-width: 38px;
      height: 36px;
      padding: 0 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      font-size: 13px;
    }
    .tool-button:hover, .tool-button:focus-visible, .side-button:hover, .side-button:focus-visible {
      color: #fff;
      border-color: var(--line-strong);
      background: rgba(255, 255, 255, 0.06);
      outline: none;
    }
    .tool-button:active, .side-button:active { transform: scale(0.96); }
    .tool-button.accent { color: var(--accent-bright); }
    .tool-button .shortcut {
      min-width: 18px;
      height: 18px;
      display: inline-grid;
      place-items: center;
      border: 1px solid var(--line-strong);
      border-radius: 5px;
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
    }

    .main {
      min-height: 0;
      position: relative;
      overflow: hidden;
    }

    .script-page {
      display: none;
      height: 100%;
      min-height: 0;
    }
    .script-page.is-active { display: block; }

    .reader {
      height: 100%;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
      padding: clamp(24px, 3.2vh, 46px) clamp(26px, 6vw, 96px) clamp(30px, 4vh, 58px);
      scroll-behavior: smooth;
    }
    .reader::-webkit-scrollbar { width: 8px; }
    .reader::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.18); border-radius: 20px; }

    .page-inner {
      width: min(1120px, 100%);
      margin: 0 auto;
      animation: page-in 220ms ease-out;
    }
    @keyframes page-in {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-heading {
      padding-bottom: clamp(16px, 2vh, 24px);
      margin-bottom: clamp(18px, 2.6vh, 30px);
      border-bottom: 1px solid var(--line);
    }

    .page-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
    }

    .page-kicker {
      color: var(--accent-bright);
      font-size: 14px;
      font-weight: 750;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .time-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      border: 1px solid rgba(255, 105, 0, 0.25);
      border-radius: 999px;
      color: var(--text-soft);
      background: rgba(255, 105, 0, 0.06);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
    .time-chip strong { color: #fff; font-weight: 650; }
    .time-chip span { color: var(--accent-bright); }
    .time-detail { color: var(--muted); font-size: 12px; }

    h1 {
      max-width: 100%;
      margin: 0;
      color: var(--text);
      font-size: clamp(31px, 3.15vw, 50px);
      font-weight: 760;
      line-height: 1.24;
      letter-spacing: -0.025em;
      text-wrap: balance;
    }

    .page-body { padding-bottom: 16px; }

    .script-paragraph {
      margin: 0 0 0.72em;
      color: var(--text);
      font-size: var(--reading-size);
      font-weight: 520;
      line-height: 1.72;
      letter-spacing: 0.012em;
      text-wrap: pretty;
    }
    .script-paragraph:last-of-type { margin-bottom: 0; }

    .cue-block {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
      gap: 14px;
      margin: 0 0 clamp(18px, 2.4vh, 27px);
      padding: 11px 15px;
      border: 1px solid rgba(255, 177, 74, 0.24);
      border-left: 3px solid rgba(255, 177, 74, 0.78);
      border-radius: 9px;
      background: rgba(255, 177, 74, 0.065);
      color: #f4d59c;
    }
    .cue-block p {
      margin: 0;
      font-size: clamp(15px, 1.35vw, 20px);
      line-height: 1.55;
      letter-spacing: 0.01em;
    }
    .cue-label {
      padding-top: 3px;
      color: #ffc66a;
      font-size: 11px;
      font-weight: 720;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .evidence-block {
      margin-top: 28px;
      padding-top: 13px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 13px;
      line-height: 1.65;
    }
    .evidence-block summary {
      width: fit-content;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      cursor: pointer;
      user-select: none;
      list-style: none;
    }
    .evidence-block summary::-webkit-details-marker { display: none; }
    .evidence-block summary::before {
      content: "+";
      width: 15px;
      color: var(--accent-bright);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .evidence-block[open] summary::before { content: "−"; }
    .evidence-block summary kbd {
      margin-left: 2px;
      padding: 1px 5px;
      border: 1px solid var(--line-strong);
      border-radius: 4px;
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
    }
    .evidence-block p { max-width: 900px; margin: 10px 0 0 23px; }

    .side-button {
      width: 46px;
      height: 54px;
      position: absolute;
      top: 50%;
      z-index: 5;
      display: grid;
      place-items: center;
      transform: translateY(-50%);
      border-color: var(--line);
      background: rgba(14, 22, 33, 0.66);
      backdrop-filter: blur(12px);
      font-size: 26px;
      line-height: 1;
    }
    .side-button:hover { transform: translateY(-50%) scale(1.04); }
    .side-button:active { transform: translateY(-50%) scale(0.96); }
    .side-button:disabled { opacity: 0.22; pointer-events: none; }
    .side-button.previous { left: 16px; }
    .side-button.next { right: 16px; }

    .bottom-bar {
      position: relative;
      z-index: 10;
      min-height: 50px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 18px;
      padding: 0 28px;
      border-top: 1px solid var(--line);
      background: rgba(8, 13, 19, 0.78);
      backdrop-filter: blur(18px);
      color: var(--muted);
      font-size: 12px;
    }

    .progress-wrap {
      min-width: 130px;
      max-width: 360px;
      height: 4px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.09);
    }
    .progress-bar {
      width: 2.7%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--accent), #ffb24a);
      box-shadow: 0 0 12px rgba(255, 105, 0, 0.45);
      transition: width 220ms ease;
    }
    .key-hints {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      white-space: nowrap;
    }
    .key-hint { display: inline-flex; align-items: center; gap: 5px; }
    .key-hint kbd {
      min-width: 21px;
      height: 21px;
      display: inline-grid;
      place-items: center;
      padding: 0 5px;
      border: 1px solid var(--line-strong);
      border-bottom-color: rgba(255, 255, 255, 0.25);
      border-radius: 5px;
      color: var(--text-soft);
      background: rgba(255, 255, 255, 0.045);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
    }

    .toast {
      position: fixed;
      left: 50%;
      bottom: 72px;
      z-index: 30;
      transform: translate(-50%, 8px);
      padding: 9px 14px;
      border: 1px solid var(--line-strong);
      border-radius: 9px;
      color: var(--text);
      background: rgba(17, 27, 39, 0.96);
      box-shadow: var(--shadow);
      font-size: 13px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 160ms ease, transform 160ms ease;
    }
    .toast.is-visible { opacity: 1; transform: translate(-50%, 0); }

    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }

    .help-dialog {
      width: min(760px, calc(100vw - 32px));
      max-height: min(760px, calc(100dvh - 36px));
      padding: 0;
      border: 1px solid var(--line-strong);
      border-radius: 18px;
      color: var(--text);
      background: var(--panel-solid);
      box-shadow: var(--shadow);
    }
    .help-dialog::backdrop { background: rgba(2, 6, 10, 0.72); backdrop-filter: blur(6px); }
    .help-card { padding: 26px; }
    .help-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
    .help-head h2 { margin: 0 0 5px; font-size: 24px; }
    .help-head p { margin: 0; color: var(--muted); font-size: 13px; }
    .close-dialog {
      width: 34px;
      height: 34px;
      border: 1px solid var(--line);
      border-radius: 8px;
      color: var(--text-soft);
      background: transparent;
      cursor: pointer;
    }
    .shortcut-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
    .shortcut-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 9px;
      color: var(--text-soft);
      font-size: 13px;
      background: rgba(255, 255, 255, 0.025);
    }
    .shortcut-row kbd {
      padding: 3px 6px;
      border: 1px solid var(--line-strong);
      border-radius: 5px;
      color: var(--text);
      background: rgba(255, 255, 255, 0.05);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      white-space: nowrap;
    }

    @media (max-width: 900px) {
      .topbar { grid-template-columns: 1fr auto; padding: 0 18px; }
      .page-counter { display: none; }
      .tool-button .label { display: none; }
      .bottom-bar { padding: 0 18px; grid-template-columns: auto 1fr; }
      .key-hints { display: none; }
      .progress-wrap { justify-self: end; width: min(42vw, 280px); }
      .side-button { width: 40px; height: 48px; }
      .side-button.previous { left: 8px; }
      .side-button.next { right: 8px; }
      .reader { padding-left: 54px; padding-right: 54px; }
    }

    @media (max-width: 620px) {
      .topbar { min-height: 58px; padding: 0 12px; gap: 8px; }
      .brand-subtitle, .tool-button[data-action="help"], .tool-button[data-action="slides"] span { display: none; }
      .tool-button { min-width: 34px; height: 34px; padding: 0 8px; }
      .reader { padding: 22px 46px 30px; }
      .page-heading { margin-bottom: 18px; }
      .page-meta { margin-bottom: 11px; }
      h1 { font-size: clamp(26px, 8vw, 36px); }
      .cue-block { grid-template-columns: 1fr; gap: 4px; padding: 10px 12px; }
      .cue-block p { font-size: 15px; }
      .shortcut-grid { grid-template-columns: 1fr; }
      .bottom-bar { min-height: 44px; }
    }

    @media (max-height: 680px) {
      .topbar { min-height: 54px; }
      .bottom-bar { min-height: 42px; }
      .reader { padding-top: 18px; padding-bottom: 22px; }
      .page-heading { padding-bottom: 13px; margin-bottom: 16px; }
      .page-meta { margin-bottom: 9px; }
      .cue-block { margin-bottom: 14px; padding-top: 8px; padding-bottom: 8px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; animation: none !important; transition: none !important; }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="topbar">
      <a class="brand" href="#page-1" aria-label="回到第1页">
        <span class="brand-mark">&lt;/&gt;</span>
        <span class="brand-copy"><span class="brand-title">HarnessPAI</span><span class="brand-subtitle">30 分钟中文讲稿 · 提词器</span></span>
      </a>
      <div class="page-counter" aria-hidden="true"><strong id="page-current">01</strong><span>/</span><span id="page-total">37</span></div>
      <nav class="toolbar" aria-label="提词器工具">
        <button class="tool-button" type="button" data-action="slides" title="在演示文稿中查看对应页"><span>对应幻灯片</span><span class="shortcut">↗</span></button>
        <button class="tool-button" type="button" data-action="smaller" title="缩小阅读字号" aria-label="缩小阅读字号">A−</button>
        <button class="tool-button" type="button" data-action="larger" title="放大阅读字号" aria-label="放大阅读字号">A+</button>
        <button class="tool-button" type="button" data-action="fullscreen" title="全屏（F）" aria-label="切换全屏"><span class="shortcut">F</span></button>
        <button class="tool-button" type="button" data-action="help" title="快捷键帮助（?）" aria-label="查看快捷键帮助"><span class="shortcut">?</span></button>
      </nav>
    </header>

    <main class="main" id="main">
      ${pages.map(renderPage).join("\n\n      ")}
      <button class="side-button previous" type="button" data-action="previous" aria-label="上一页" title="上一页">‹</button>
      <button class="side-button next" type="button" data-action="next" aria-label="下一页" title="下一页">›</button>
    </main>

    <footer class="bottom-bar">
      <div class="progress-wrap" role="progressbar" aria-label="讲稿进度" aria-valuemin="1" aria-valuemax="37" aria-valuenow="1"><div class="progress-bar" id="progress-bar"></div></div>
      <span class="sr-only" id="page-announcement" aria-live="polite">第 1 页，共 37 页</span>
      <div class="key-hints" aria-hidden="true">
        <span class="key-hint"><kbd>←</kbd><kbd>→</kbd> 翻页</span>
        <span class="key-hint"><kbd>E</kbd> 依据</span>
        <span class="key-hint"><kbd>F</kbd> 全屏</span>
        <span class="key-hint"><kbd>?</kbd> 帮助</span>
      </div>
      <div></div>
    </footer>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <dialog class="help-dialog" id="help-dialog">
    <div class="help-card">
      <div class="help-head">
        <div><h2>键盘快捷键</h2><p>提词器每次只显示一页，翻页与对应幻灯片保持 1:1。</p></div>
        <button class="close-dialog" type="button" data-action="close-help" aria-label="关闭帮助">×</button>
      </div>
      <div class="shortcut-grid">
        <div class="shortcut-row"><span>下一页</span><span><kbd>→</kbd> <kbd>↓</kbd> <kbd>Space</kbd></span></div>
        <div class="shortcut-row"><span>上一页</span><span><kbd>←</kbd> <kbd>↑</kbd> <kbd>Shift</kbd>+<kbd>Space</kbd></span></div>
        <div class="shortcut-row"><span>第一页 / 最后一页</span><span><kbd>Home</kbd> / <kbd>End</kbd></span></div>
        <div class="shortcut-row"><span>显示或隐藏备讲依据</span><kbd>E</kbd></div>
        <div class="shortcut-row"><span>放大 / 缩小字号</span><span><kbd>+</kbd> / <kbd>−</kbd></span></div>
        <div class="shortcut-row"><span>恢复自动字号</span><kbd>0</kbd></div>
        <div class="shortcut-row"><span>浏览器全屏</span><kbd>F</kbd></div>
        <div class="shortcut-row"><span>打开本帮助</span><kbd>?</kbd></div>
      </div>
    </div>
  </dialog>

  <script>
    (() => {
      const pages = Array.from(document.querySelectorAll(".script-page"));
      const total = pages.length;
      const currentLabel = document.getElementById("page-current");
      const totalLabel = document.getElementById("page-total");
      const progressBar = document.getElementById("progress-bar");
      const progressWrap = progressBar.parentElement;
      const announcement = document.getElementById("page-announcement");
      const toast = document.getElementById("toast");
      const helpDialog = document.getElementById("help-dialog");
      const previousButton = document.querySelector('[data-action="previous"]');
      const nextButton = document.querySelector('[data-action="next"]');
      const storageKeys = {
        zoom: "harnesspai-teleprompter-zoom"
      };
      let current = 0;
      let zoom = 1;
      let toastTimer = null;
      let resizeTimer = null;
      let touchStartX = null;
      let touchStartY = null;

      function safeStorageGet(key) {
        try { return localStorage.getItem(key); } catch { return null; }
      }

      function safeStorageSet(key, value) {
        try { localStorage.setItem(key, value); } catch { /* file:// storage may be unavailable */ }
      }

      function readPageFromHash() {
        const match = location.hash.match(/^#page-(\\d+)$/);
        return match ? Number(match[1]) - 1 : null;
      }

      function initialPage() {
        const fromHash = readPageFromHash();
        if (Number.isInteger(fromHash) && fromHash >= 0 && fromHash < total) return fromHash;
        return 0;
      }

      function showToast(message) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
      }

      function clampZoom(value) {
        return Math.min(1.28, Math.max(0.82, Math.round(value * 100) / 100));
      }

      function fitPage(page) {
        const reader = page.querySelector(".reader");
        if (!reader) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const maxSize = Math.max(26, Math.min(41, viewportWidth * 0.0255));
        const minSize = viewportHeight < 620 ? 18 : (viewportWidth < 640 ? 20 : 22);
        const testSize = (size) => {
          reader.style.setProperty("--reading-size", size + "px");
          return reader.scrollHeight <= reader.clientHeight + 1;
        };

        let low = minSize;
        let high = maxSize;
        if (!testSize(high)) {
          for (let index = 0; index < 10; index += 1) {
            const mid = (low + high) / 2;
            if (testSize(mid)) low = mid;
            else high = mid;
          }
          high = low;
        }

        page.dataset.fitSize = String(Math.floor(high * 2) / 2);
        reader.style.setProperty("--reading-size", (Number(page.dataset.fitSize) * zoom) + "px");
      }

      function scheduleFit() {
        requestAnimationFrame(() => requestAnimationFrame(() => fitPage(pages[current])));
      }

      function applyZoom(nextZoom, announce = true) {
        zoom = clampZoom(nextZoom);
        safeStorageSet(storageKeys.zoom, String(zoom));
        const page = pages[current];
        const fitted = Number(page.dataset.fitSize || 32);
        page.querySelector(".reader").style.setProperty("--reading-size", (fitted * zoom) + "px");
        if (announce) showToast("阅读字号 " + Math.round(zoom * 100) + "%");
      }

      function updateChrome() {
        const page = pages[current];
        currentLabel.textContent = String(current + 1).padStart(2, "0");
        totalLabel.textContent = String(total);
        const percent = ((current + 1) / total) * 100;
        progressBar.style.width = percent + "%";
        progressWrap.setAttribute("aria-valuenow", String(current + 1));
        announcement.textContent = "第 " + (current + 1) + " 页，共 " + total + " 页：" + page.dataset.title;
        previousButton.disabled = current === 0;
        nextButton.disabled = current === total - 1;
        document.title = String(current + 1).padStart(2, "0") + " · " + page.dataset.title + " | HarnessPAI 提词器";
      }

      function showPage(index, options = {}) {
        if (!Number.isInteger(index)) return;
        const next = Math.max(0, Math.min(total - 1, index));
        if (next === current && options.initial) {
          pages[current].classList.add("is-active");
          pages[current].removeAttribute("aria-hidden");
          pages[current].inert = false;
        } else {
          pages.forEach((page, pageIndex) => {
            const active = pageIndex === next;
            page.classList.toggle("is-active", active);
            page.setAttribute("aria-hidden", String(!active));
            page.inert = !active;
            if (!active) page.querySelector(".evidence-block")?.removeAttribute("open");
          });
        }

        current = next;
        const page = pages[current];
        page.querySelector(".reader").scrollTop = 0;
        updateChrome();

        if (options.updateHash !== false) {
          const nextHash = "#page-" + (current + 1);
          if (location.hash !== nextHash) {
            try { history.replaceState(null, "", nextHash); }
            catch { location.hash = nextHash.slice(1); }
          }
        }
        scheduleFit();
      }

      function go(delta) {
        const next = current + delta;
        if (next < 0) return showToast("已经是第一页");
        if (next >= total) return showToast("已经是最后一页");
        showPage(next);
      }

      function openSlides() {
        window.open("index.html#slide-" + (current + 1), "_blank", "noopener");
      }

      async function toggleFullscreen() {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
          else showToast("当前浏览器不支持页面全屏");
        } catch {
          showToast("无法进入全屏，请使用浏览器菜单");
        }
      }

      function toggleEvidence() {
        const details = pages[current].querySelector(".evidence-block");
        if (!details) return showToast("本页没有备讲依据");
        details.open = !details.open;
        if (details.open) details.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }

      function openHelp() {
        if (!helpDialog.open) helpDialog.showModal();
      }

      function handleAction(action) {
        switch (action) {
          case "previous": go(-1); break;
          case "next": go(1); break;
          case "slides": openSlides(); break;
          case "smaller": applyZoom(zoom - 0.05); break;
          case "larger": applyZoom(zoom + 0.05); break;
          case "fullscreen": toggleFullscreen(); break;
          case "help": openHelp(); break;
          case "close-help": helpDialog.close(); break;
        }
      }

      document.addEventListener("click", (event) => {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        handleAction(target.dataset.action);
        if (target.tagName === "BUTTON") target.blur();
      });

      helpDialog.addEventListener("click", (event) => {
        if (event.target === helpDialog) helpDialog.close();
      });

      document.addEventListener("keydown", (event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const target = event.target;
        if (target.closest("summary, input, textarea, select")) return;

        if (helpDialog.open) {
          if (event.key === "Escape") helpDialog.close();
          return;
        }

        switch (event.key) {
          case "ArrowRight":
          case "ArrowDown":
          case "PageDown":
            event.preventDefault();
            go(1);
            break;
          case "ArrowLeft":
          case "ArrowUp":
          case "PageUp":
            event.preventDefault();
            go(-1);
            break;
          case " ":
            event.preventDefault();
            go(event.shiftKey ? -1 : 1);
            break;
          case "Home":
            event.preventDefault();
            showPage(0);
            break;
          case "End":
            event.preventDefault();
            showPage(total - 1);
            break;
          case "e":
          case "E":
            event.preventDefault();
            toggleEvidence();
            break;
          case "+":
          case "=":
            event.preventDefault();
            applyZoom(zoom + 0.05);
            break;
          case "-":
          case "_":
            event.preventDefault();
            applyZoom(zoom - 0.05);
            break;
          case "0":
            event.preventDefault();
            applyZoom(1);
            break;
          case "f":
          case "F":
            event.preventDefault();
            toggleFullscreen();
            break;
          case "?":
            event.preventDefault();
            openHelp();
            break;
          case "Escape":
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            break;
        }
      });

      document.getElementById("main").addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "touch") return;
        touchStartX = event.clientX;
        touchStartY = event.clientY;
      });

      document.getElementById("main").addEventListener("pointerup", (event) => {
        if (event.pointerType !== "touch" || touchStartX === null) return;
        const deltaX = event.clientX - touchStartX;
        const deltaY = event.clientY - touchStartY;
        touchStartX = null;
        touchStartY = null;
        if (Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) go(deltaX < 0 ? 1 : -1);
      });

      window.addEventListener("hashchange", () => {
        const index = readPageFromHash();
        if (Number.isInteger(index) && index !== current) showPage(index, { updateHash: false });
      });

      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(scheduleFit, 120);
      });

      const savedZoom = Number(safeStorageGet(storageKeys.zoom));
      if (Number.isFinite(savedZoom) && savedZoom >= 0.82 && savedZoom <= 1.28) zoom = savedZoom;
      totalLabel.textContent = String(total);
      showPage(initialPage(), { updateHash: false, initial: true });
    })();
  </script>
</body>
</html>
`;

fs.writeFileSync(outputPath, html, "utf8");
console.log(`Built ${path.relative(root, outputPath)} with ${pages.length} pages.`);
