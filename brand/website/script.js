// Tabs
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.classList.toggle("active", p.dataset.panel === target);
    });
  });
});

// Click-to-copy on <pre> blocks
document.querySelectorAll("pre").forEach((pre) => {
  pre.title = "Click to copy";
  pre.style.cursor = "copy";
  pre.addEventListener("click", async () => {
    const text = pre.innerText;
    try {
      await navigator.clipboard.writeText(text);
      const original = pre.style.borderColor;
      pre.style.borderColor = "#22D3EE";
      setTimeout(() => { pre.style.borderColor = original; }, 600);
    } catch {
      /* ignore */
    }
  });
});
