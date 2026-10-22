(() => {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const stage = document.getElementById("stage");
  const deck = document.getElementById("deck");
  const pageInput = document.getElementById("page-number");
  const notesPanel = document.getElementById("notes-panel");
  const overviewDialog = document.getElementById("overview-dialog");
  const helpDialog = document.getElementById("help-dialog");
  const chapters = [
    { name: "Introduction", english: "Research Seminar" },
    { name: "Background", english: "01 · Background & Observations" },
    { name: "Motivation", english: "02 · Motivation & Design Choice" },
    { name: "Method & Evolution", english: "03 · Framework & Evolution" },
    { name: "Experiments", english: "04 · Experiments & Data Feedback" },
    { name: "Appendix", english: "Appendix · Discussion Material" }
  ].map((chapter, chapterIndex) => ({
    ...chapter,
    start: slides.findIndex((slide) => Number(slide.dataset.chapter) === chapterIndex)
  }));
  let current = 0;
  let elapsed = 0;
  let timerStartedAt = null;
  let toastTimeout;
  let touchStart = null;

  const makeElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  slides.forEach((slide, index) => {
    const chapterIndex = Number(slide.dataset.chapter);
    slide.id = `slide-${index + 1}`;
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${index + 1} / ${slides.length}: ${slide.dataset.title}`);
    const topline = makeElement("div", "topline");
    topline.append(makeElement("span", "topline-brand", "HarnessPAI"));
    const chapterNav = makeElement("nav", "chapter-nav");
    chapterNav.setAttribute("aria-label", "Section navigation");
    chapters.slice(1).forEach((chapter, chapterOffset) => {
      const button = makeElement("button", chapterOffset + 1 === chapterIndex ? "is-current" : "", chapter.name);
      button.type = "button";
      button.addEventListener("click", () => showSlide(chapter.start));
      chapterNav.append(button);
    });
    topline.append(chapterNav);
    const heading = makeElement("header", "frame-heading");
    heading.append(makeElement("p", "section-label", chapters[chapterIndex].english));
    heading.append(makeElement("h2", "", slide.dataset.title));
    slide.prepend(topline, heading);
    slide.append(makeElement("p", "slide-source", slide.dataset.source));
    const footer = makeElement("footer", "slide-footer");
    footer.style.setProperty("--progress", `${((index + 1) / slides.length) * 100}%`);
    footer.append(makeElement("span", "", "Darwin Agent Team · Research Seminar"));
    footer.append(makeElement("span", "", "HarnessPAI · An Evolving Harness for Physical AI"));
    footer.append(makeElement("span", "", `${String(index + 1).padStart(2, "0")} / ${slides.length}${chapterIndex === 5 ? " · App." : ""}`));
    slide.append(footer);
    slide.querySelectorAll("video").forEach((video) => {
      const poster = makeElement("img", "print-poster");
      poster.src = video.poster;
      poster.alt = `${video.getAttribute("aria-label")} (print poster)`;
      video.after(poster);
    });
    const overviewItem = makeElement("button", `overview-item${chapterIndex === 5 ? " appendix" : ""}`);
    overviewItem.type = "button";
    overviewItem.dataset.slideIndex = String(index);
    overviewItem.append(makeElement("span", "", `${String(index + 1).padStart(2, "0")} / ${chapters[chapterIndex].name}`));
    overviewItem.append(makeElement("strong", "", slide.dataset.title));
    overviewItem.addEventListener("click", () => {
      overviewDialog.close();
      showSlide(index);
    });
    document.getElementById("overview-grid").append(overviewItem);
  });

  document.getElementById("page-total").textContent = `/ ${slides.length}`;
  pageInput.max = String(slides.length);

  function resizeDeck() {
    const bounds = stage.getBoundingClientRect();
    const margin = window.innerWidth < 600 ? 12 : 40;
    const scale = Math.max(.1, Math.min((bounds.width - margin) / 1280, (bounds.height - margin) / 720));
    deck.style.transform = `scale(${scale})`;
  }

  function readHash() {
    const match = location.hash.match(/^#slide-(\d+)$/);
    return match ? Number(match[1]) - 1 : 0;
  }

  function updateNotes() {
    const slide = slides[current];
    document.getElementById("notes-page").textContent = `Slide ${current + 1} / ${slides.length} · ${chapters[Number(slide.dataset.chapter)].name}`;
    document.getElementById("notes-title").textContent = slide.dataset.title;
    document.getElementById("notes-content").replaceChildren(...Array.from(slide.querySelector(".speaker-note").childNodes, (node) => node.cloneNode(true)));
    document.getElementById("notes-next-title").textContent = slides[current + 1]?.dataset.title || "End of presentation";
    notesPanel.scrollTop = 0;
  }

  function showSlide(index, updateHash = true) {
    if (!Number.isFinite(index)) return;
    current = Math.max(0, Math.min(slides.length - 1, Math.floor(index)));
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === current;
      slide.classList.toggle("is-active", isActive);
      slide.inert = !isActive;
      slide.setAttribute("aria-hidden", String(!isActive));
      if (!isActive) slide.querySelectorAll("video").forEach((video) => video.pause());
    });
    pageInput.value = String(current + 1);
    document.getElementById("previous").disabled = current === 0;
    document.getElementById("next").disabled = current === slides.length - 1;
    document.querySelectorAll(".overview-item").forEach((button, buttonIndex) => {
      if (buttonIndex === current) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.title = `${String(current + 1).padStart(2, "0")} · ${slides[current].dataset.title} | HarnessPAI`;
    document.getElementById("slide-announcement").textContent = `Slide ${current + 1}: ${slides[current].dataset.title}`;
    if (updateHash && location.hash !== `#slide-${current + 1}`) {
      try {
        history.replaceState(null, "", `#slide-${current + 1}`);
      } catch {
        location.hash = `slide-${current + 1}`;
      }
    }
    updateNotes();
  }

  function toggleNotes(force) {
    const shouldOpen = force ?? notesPanel.hidden;
    notesPanel.hidden = !shouldOpen;
    document.body.classList.toggle("notes-open", shouldOpen);
    document.getElementById("notes-toggle").setAttribute("aria-pressed", String(shouldOpen));
    resizeDeck();
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else showToast("Page fullscreen is unavailable. Use your browser’s fullscreen option.");
    } catch {
      showToast("Could not enter fullscreen. Try your browser’s fullscreen option.");
    }
  }

  async function toggleVideo() {
    const video = slides[current].querySelector("video");
    if (!video) {
      const videoPages = slides.flatMap((slide, index) => slide.querySelector("video") ? [index + 1] : []);
      showToast(`No video on this slide. Video demonstrations: ${videoPages.join(", ")}.`);
      return;
    }
    if (video.paused) {
      try { await video.play(); }
      catch { showToast("Use the video’s play button. If loading fails, check the media folder."); }
    } else video.pause();
  }

  function openDialog(dialog) {
    if (dialog.open) dialog.close();
    else {
      slides[current].querySelectorAll("video").forEach((video) => video.pause());
      dialog.showModal();
      if (dialog === overviewDialog) dialog.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "center" });
    }
  }

  function printDeck() {
    document.querySelectorAll("video").forEach((video) => video.pause());
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    window.print();
  }

  function updateTimer() {
    const totalSeconds = Math.floor((elapsed + (timerStartedAt === null ? 0 : Date.now() - timerStartedAt)) / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
    document.getElementById("timer-toggle").textContent = timerStartedAt === null ? "Start" : "Pause";
  }

  document.getElementById("previous").addEventListener("click", () => showSlide(current - 1));
  document.getElementById("next").addEventListener("click", () => showSlide(current + 1));
  document.getElementById("overview-toggle").addEventListener("click", () => openDialog(overviewDialog));
  document.getElementById("help-toggle").addEventListener("click", () => openDialog(helpDialog));
  document.getElementById("notes-toggle").addEventListener("click", () => toggleNotes());
  document.getElementById("notes-close").addEventListener("click", () => toggleNotes(false));
  document.getElementById("fullscreen-toggle").addEventListener("click", toggleFullscreen);
  document.getElementById("print-button").addEventListener("click", printDeck);
  document.getElementById("timer-toggle").addEventListener("click", () => {
    if (timerStartedAt === null) timerStartedAt = Date.now();
    else { elapsed += Date.now() - timerStartedAt; timerStartedAt = null; }
    updateTimer();
  });
  document.getElementById("timer-reset").addEventListener("click", () => {
    elapsed = 0;
    timerStartedAt = null;
    updateTimer();
  });
  pageInput.addEventListener("change", () => showSlide(Number(pageInput.value) - 1));
  pageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { showSlide(Number(pageInput.value) - 1); pageInput.blur(); }
  });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }));

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
    const key = event.key.toLowerCase();
    if (document.querySelector("dialog[open]")) return;
    if (event.target.closest("input, textarea, select, video, [contenteditable='true']")) return;
    if (event.target.closest("button, a") && (key === " " || key === "enter")) return;
    const actions = {
      arrowright: () => showSlide(current + 1), arrowdown: () => showSlide(current + 1),
      pagedown: () => showSlide(current + 1), " ": () => showSlide(current + (event.shiftKey ? -1 : 1)),
      arrowleft: () => showSlide(current - 1), arrowup: () => showSlide(current - 1),
      pageup: () => showSlide(current - 1), home: () => showSlide(0), end: () => showSlide(slides.length - 1),
      o: () => openDialog(overviewDialog), n: () => toggleNotes(), f: toggleFullscreen,
      v: toggleVideo, p: printDeck, "?": () => openDialog(helpDialog), escape: () => toggleNotes(false)
    };
    if (actions[key]) { event.preventDefault(); actions[key](); }
  });

  stage.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1 || event.target.closest("video, button, input, a")) { touchStart = null; return; }
    touchStart = { horizontal: event.touches[0].clientX, vertical: event.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener("touchend", (event) => {
    if (!touchStart || !event.changedTouches.length) return;
    const horizontalDelta = event.changedTouches[0].clientX - touchStart.horizontal;
    const verticalDelta = event.changedTouches[0].clientY - touchStart.vertical;
    if (Math.abs(horizontalDelta) > 55 && Math.abs(horizontalDelta) > Math.abs(verticalDelta) * 1.5) showSlide(current + (horizontalDelta < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  stage.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });
  window.addEventListener("resize", resizeDeck);
  window.addEventListener("hashchange", () => showSlide(readHash(), false));
  window.addEventListener("beforeprint", () => {
    document.title = "HarnessPAI · Beyond the Action Model · Research Seminar";
    slides.forEach((slide) => {
      slide.inert = false;
      slide.setAttribute("aria-hidden", "false");
      slide.querySelectorAll("video").forEach((video) => video.pause());
    });
  });
  window.addEventListener("afterprint", () => showSlide(current));
  document.addEventListener("fullscreenchange", resizeDeck);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) document.querySelectorAll("video").forEach((video) => video.pause());
  });
  setInterval(updateTimer, 500);
  showSlide(readHash());
  resizeDeck();
})();
