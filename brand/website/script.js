// AgentDispatch — scroll-scrub hero + tab + clipboard
// No framework, no build step. ~100 lines.

(() => {
  // ─── Tabs ──────────────────────────────────────────────────────────
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".tab-panel").forEach((p) => {
        p.classList.toggle("active", p.dataset.panel === target);
      });
    });
  });

  // ─── Click-to-copy on <pre> ────────────────────────────────────────
  document.querySelectorAll("pre").forEach((pre) => {
    pre.title = "Click to copy";
    pre.style.cursor = "copy";
    pre.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        pre.style.outline = "1px solid #FF5C00";
        setTimeout(() => { pre.style.outline = ""; }, 500);
      } catch { /* ignore */ }
    });
  });

  // ─── Scroll scrub ──────────────────────────────────────────────────
  // Map scroll progress through the .scrub section (0 → 1) onto a set of
  // CSS custom properties that the SVG and captions consume.

  const scrub = document.querySelector(".scrub");
  if (!scrub) return;

  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // CSS handles the final-state freeze.

  // Smoothstep-style band: returns 1 when p is within [a, b], fading
  // in over `fade` before a and out over `fade` after b.
  const band = (p, a, b, fade = 0.05) => {
    const inP  = clamp01((p - (a - fade)) / fade);
    const outP = clamp01(((b + fade) - p) / fade);
    return Math.min(inP, outP);
  };

  // Step: returns 0 then ramps up to 1 over [a, b] and stays 1.
  const ramp = (p, a, b) => clamp01((p - a) / (b - a));

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  // Map scroll position over .scrub onto p ∈ [0, 1].
  function progress() {
    const r = scrub.getBoundingClientRect();
    const max = scrub.offsetHeight - window.innerHeight;
    if (max <= 0) return 0;
    return clamp01(-r.top / max);
  }

  let ticking = false;
  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      apply(progress());
      ticking = false;
    });
  }

  function apply(p) {
    root.style.setProperty("--p", p.toFixed(4));

    // Captions — five overlapping bands across the timeline.
    root.style.setProperty("--cap-0", band(p, 0.00, 0.18).toFixed(3));
    root.style.setProperty("--cap-1", band(p, 0.20, 0.38).toFixed(3));
    root.style.setProperty("--cap-2", band(p, 0.40, 0.56).toFixed(3));
    root.style.setProperty("--cap-3", band(p, 0.58, 0.78).toFixed(3));
    root.style.setProperty("--cap-4", band(p, 0.80, 1.00).toFixed(3));

    // Frames — appear and persist.
    root.style.setProperty("--editor-show",   ramp(p, 0.05, 0.18).toFixed(3));
    root.style.setProperty("--prompt-show",   ramp(p, 0.20, 0.32).toFixed(3));
    root.style.setProperty("--dispatch-show", ramp(p, 0.34, 0.42).toFixed(3));
    root.style.setProperty("--dispatch-draw", ramp(p, 0.34, 0.48).toFixed(3));
    root.style.setProperty("--cloud-show",    ramp(p, 0.46, 0.58).toFixed(3));

    // Agent tiles spawn in staggered.
    root.style.setProperty("--tile-1", ramp(p, 0.58, 0.64).toFixed(3));
    root.style.setProperty("--tile-2", ramp(p, 0.62, 0.68).toFixed(3));
    root.style.setProperty("--tile-3", ramp(p, 0.66, 0.72).toFixed(3));

    // Return path + result.
    root.style.setProperty("--return-show", ramp(p, 0.76, 0.84).toFixed(3));
    root.style.setProperty("--return-draw", ramp(p, 0.78, 0.92).toFixed(3));
    root.style.setProperty("--result-show", ramp(p, 0.86, 0.96).toFixed(3));
  }

  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  schedule();
})();
