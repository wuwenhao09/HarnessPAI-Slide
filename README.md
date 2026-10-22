# HarnessPAI Research Seminar

A self-contained, offline Beamer-style HTML presentation: white paper, navy accents, a 16:9 canvas, section navigation, slide-level references, and English speaker notes. **27 main slides + 3 appendix slides**, intended for a 30–35 minute talk.

## Open

Open `index.html` directly in a browser. No Node.js, build step, CDN, or internet connection is required. Keep the entire `slides` directory together when copying the presentation.

For an optional local HTTP server, run from this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000`.

## Controls

| Action | Shortcut |
| --- | --- |
| Previous / next slide | `←` / `→`, `Page Up` / `Page Down`, Space |
| First / last slide | `Home` / `End` |
| Outline / jump to a slide | `O`, or enter a number in the toolbar |
| Speaker notes | `N` |
| Fullscreen | `F` |
| Play / pause the current video | `V` on slides 5, 6, 7, and 13 |
| Print / save PDF | `P` |
| Keyboard help | `?` |

Horizontal swipes navigate on touchscreens. On narrow screens, toolbar actions use their shortcut letters. Notes include a manual start / pause / reset timer. Videos never autoplay and pause when leaving the slide.

Direct slide addresses:

- `#slide-13`: irreversible physical failures, with the added pot-handling video.
- `#slide-15`: the two-timescale distinction.
- `#slide-18`: the evolution loop.
- `#slide-19`: the success contract and independent diagnosis.

## Talk structure

1. **Background and observations (3–7):** action-centered models, standard-versus-perturbed performance, and language, scene, and contact examples.
2. **Motivation and design choice (8–10):** retain atomic motor competence, add grounding and verification, and compare harness designs.
3. **Framework and evolution (11–22):** architecture, pseudocode, irreversible physical failures, program-level open-loop execution, two timescales, gates, initialization, evolution, contracts, and reusable repair knowledge.
4. **Evidence and takeaways (23–27):** main results, backbone transfer, data feedback, limitations, and summary.
5. **Appendix (28–30):** protocols, serial runtime costs, and the full pipeline.

For a shorter talk, omit slides 7, 12, 17, 20, 24, and 25. Preserve slides 13, 15, 18, and 19 to explain the motivation and mechanism.

## The added irreversibility example

Slide 13 uses `media/irreversible-comparison.mp4` and its poster. A wrong physical action can persistently change the scene: a dropped or overturned object may be unrecoverable within the current rollout. Reasoning after such a failure may be too late.

The design response is **program-level open-loop execution**: execute a previously validated task program, ground targets and check conditions before risky transitions, then revise code between rollouts. This does **not** mean disabling sensors, feedback control, conditional branches, predefined recovery, or stopping. Irreversibility motivates prevention; it does not prove that open-loop control is universally safer.

The source video is an illustration in **robosuite TwoArmLift**, played at 2× source speed. The left side is a scripted pot drop, with the pot lost below the table; the right side is a successful HarnessPAI lift. It is **not a pure-WAM baseline or a RoboCasa benchmark comparison**. The slide and speaker notes state this distinction explicitly.

## PDF

`HarnessPAI-lecture.pdf` is the exported English deck. After editing the HTML, regenerate it using **Export** or `P` and select **Save as PDF**.

The stylesheet declares a 16:9 page with no margins. If the browser provides print options, select landscape, no margins, background graphics, and no browser headers or footers. All 30 slides print; videos become poster images. The toolbar, outline, speaker notes, and timer are excluded.

## Sources and scope

- Content is based on this repository’s `main.tex` and `chapters/*.tex`. Each slide includes a source line.
- Figures and videos come from the user-supplied project website directory `C:\Users\wangxin113\文章\code_physical\网页\HarnessPAI`. Selected assets are copied into `media`; the source website and manuscript are unchanged.
- `task-library.webp` is converted from `images/framework/task_library.pdf` in the manuscript.
- `motivation-language`: different selected VLA and HarnessPAI episodes, at 2× source speed—not a strictly paired initial-state experiment.
- `motivation-visual-swap`: the video swaps a plate and distractor bowl, at 2× source speed; the paper’s Fig. 5 swaps a plate and ramekin. The slide preserves this distinction.
- `motivation-microwave-column2`: head-camera microwave comparison, at 1× source speed. Different source sampling and durations do not establish execution-speed differences.
- Slides 12 and 20 contain teaching pseudocode, not actual APIs, commit histories, or deployable robot controllers.
- Perturbation examples demonstrate behavioral brittleness; they do not independently establish training-induced loss of vision/language or a unique failure mechanism.
- Main harness evolution freezes model weights. Trajectory-based supervised fine-tuning is a separate, one-way data-feedback study—not alternating model–harness co-evolution.
- LIBERO / PRO evaluation includes 15 development seeds among 50 evaluated seeds. Development success is not identical to unseen-scene generalization.
- DreamZero transfer covers LIBERO-Object only; the main RoboCasa result covers 18 Atomic-Seen tasks.
- Gains are percentage points (pp), using the manuscript’s reported precision. The +38.8 pp result is three-suite mixture fine-tuning, not an average of separately fine-tuned suite models.

## Editing

- `index.html`: one `section.slide` per slide. `data-title`, `data-chapter`, and `data-source` define the heading, section, and reference. `aside.speaker-note` holds English presenter notes.
- `slides.css`: presentation layout, responsive controls, and print styles.
- `slides.js`: generated headers/footers, navigation, scaling, notes, videos, and the timer.
- If slides are added or removed, update section-start indices in `slides.js`, roadmap page ranges, and documentation references. Video-page hints and total counts are generated automatically.

## Validation

The deck is checked with local Chromium for layout, offline assets, navigation, speaker notes, the timer, fullscreen, video playback, responsive scaling, touch navigation, and PDF output. Firefox, Safari, and a physical projector are not part of the local test environment.
