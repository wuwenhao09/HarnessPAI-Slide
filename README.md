# HarnessPAI Presentation

An offline, 16:9 HTML presentation with **37 slides**: a cover, a roadmap, and four substantive parts. The cover retains the Xiaomi logo, project-homepage QR code, affiliation strip, and orange/gray title. Content slides use the existing navy academic style.

## Open and present

Open `index.html` directly in a browser. Keep the directory and its `media` folder together. No build step, network connection, or CDN is required. The project-homepage link is external.

## Keyboard shortcuts

| Action | Key |
| --- | --- |
| Next slide | `→`, `↓`, `Page Down`, or `Space` |
| Previous slide | `←`, `↑`, `Page Up`, or `Shift + Space` |
| First slide | `Home` |
| Last slide | `End` |
| Open outline | `O` |
| Toggle speaker notes | `N` |
| Toggle browser fullscreen | `F` |
| Play / pause the current video | `V` (slides 6, 7, and 10) |
| Print / save PDF | `P` |
| Open keyboard-shortcut help | `?` |
| Close notes or a dialog | `Esc` |
| Enlarge a focused paper figure | `Enter` or `Space` |

The chapter buttons in the top navigation jump directly to their sections. Horizontal swipes navigate on touchscreens, and the speaker-notes panel includes a manual timer. Videos pause when leaving their slide.

## Four-part structure

| Part | Pages | Content |
| --- | --- | --- |
| Background | 3–5 | Physical AI components; standard success versus perturbation robustness; post-training, code-as-policy, and VLA harness paradigms |
| Motivation | 6–11 | Instruction and scene shifts; fine manipulation; persistent physical errors; pot-handling video; executable code |
| Method | 12–20 | Architecture; two timescales; hybrid execution; optional initialization; code evolution; success contract; repair memory; trajectory feedback |
| Experiments | 21–37 | Protocols; LIBERO, LIBERO-PRO, robosuite, RoboCasa, BEHAVIOR-1K, VacuSim, MicroDuck; DreamZero transfer; evolution dynamics; VLA and WAM data feedback; Takeaways; Future Work; Thank You |

Earlier appendix material is integrated into Method and Experiments. There is no fifth section. For a shorter talk, retain the main result on page 22 and the trajectory-learning evidence on pages 33–35, and selectively skip detailed embodiment results.

The talk closes with **Takeaways (35)**, **Future Work (36)**, and a separate **Thank You (37)** contact page. Takeaways connect executable organization, two timescales and repair reuse, and trajectory-based model learning. Future Work covers the paper’s atomic-action interface, scene modeling, and coding-agent collaboration directions, plus the alternating harness–model improvement proposed in §4.5. These directions are clearly distinguished from completed experiments.

## Paper figures and sources

Figures come directly from `../paper/images/framework` and `../paper/images/experiment`. PDF figures are converted with `pdftocairo -svg`; vector text and curves remain sharp when enlarged. `media/paper/sources.json` maps every displayed asset to its source PDF and records intentional panel crops.

The deck uses **22 vector assets on 22 figure slides**, including motivation, architecture, evolution, skill memory, benchmark results, transfer, and fine-tuning. Page 11 uses the HarnessPAI panel of the paper’s adopted Figure 2, rather than the unused overview drawing. Other panel crops separately show optional initialization and main evolution in Figure 9, the embodiment strip of Figure 1, the HarnessPAI rollout row of Figure 5.

Motivation pages 6 and 7 use the project homepage’s complete 15-second instruction and scene perturbation videos from `../code/assets/videos`, replacing their static figures. The videos in `media` keep the source’s 2× playback; their `*-outcomes.webp` posters show the 7-second frame so the contrast is visible before playback and in print. The language clip compares selected episodes with different initial arrangements. The scene clip swaps a plate and distractor bowl; the paper’s static Figure 5 swaps a plate and ramekin. Notes preserve these distinctions. Videos autoplay muted and loop while their slide is active, and print as posters.

The tiny source line above the bottom information bar is removed on all pages. Sources remain in each slide’s `data-source` and appear only in speaker notes. The bottom bar retains `Darwin Agent Team`, the paper title, and the page number.

The affiliation strip is rendered from `../paper/LOGO.pdf`. The cover QR links to `https://darwin-agent.github.io/HarnessPAI/`.

The final page follows the cover’s white, gray, and orange style, retains the Xiaomi logo and project QR code, and omits the affiliation strip. It displays the supplied contact addresses `x-wang24@mails.tsinghua.edu.cn` and `wenhaowu@smail.nju.edu.cn` as email links.

## Evidence and interpretation

- Main harness evolution keeps action backends frozen. Model feedback is a separate supervised fine-tuning study using successful trajectories; the paper does not alternate model updates with harness re-evolution.
- LIBERO / LIBERO-PRO evaluation includes 15 development seeds among 50 evaluated seeds. robosuite uses disjoint development and evaluation seeds.
- BEHAVIOR-1K tests one program zero-shot, then adapts on failing evaluation seeds for eight rounds. Adapted scores are not zero-shot generalization scores.
- DreamZero transfer and WAM fine-tuning cover LIBERO-Object only. RoboCasa covers 18 Atomic-Seen tasks.
- Cross-paper baselines retain their own protocols. Comparisons to the same frozen backbone are the primary system-effect evidence.
- Data feedback trains on seeds 0–39 and evaluates on held-out scene seeds 40–49. Per-suite VLA models select their best checkpoint within 15,000 steps; full-mixture VLA selects within 30,000 steps. DreamZero selects one shared checkpoint at 8,500 steps. Selection uses observed evaluation results.
- The +38.8 pp result is full-mixture VLA training on nine equally sampled categories, rather than an average of separately trained suite models. Scores are copied from paper text rather than estimated from smoothed curves.
- The pot video is a robosuite TwoArmLift illustration: a scripted drop versus a HarnessPAI lift, at 2× source playback. It is not a pure-WAM baseline or quantitative RoboCasa comparison.

## Editing and PDF

- `index.html`: ordered `section.slide` elements, body content, and speaker notes.
- `slides.css`: cover, academic layouts, responsive scaling, enlarged figures, and print styles.
- `slides.js`: headers, exactly four chapter buttons, footers, outline, source notes, navigation, timer, video controls, and figure enlargement. Chapter starts and totals are derived from the slide DOM.
- To export all 37 slides, press P and save as PDF with landscape orientation, no margins or browser headers, and background graphics. Videos print as posters.

Validation covers every slide’s geometry, figures, four-part navigation, removed source rows, preserved footer labels, notes, figure enlargement, offline assets, responsive scaling, and PDF output in local Chromium.
