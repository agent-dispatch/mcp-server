# AgentDispatch brand kit

This directory holds the visual identity, the org profile README, and the marketing site for the AgentDispatch organization. Because this branch lives inside `mcp-server` and my publishing access is scoped to a single repo, everything is staged here for you to copy into the right destination repos.

## Contents

```
brand/
├── logo-mark.svg              # square mark for org avatar (dark bg, 200×200, scales)
├── logo-mark-light.svg        # square mark for light-bg contexts
├── wordmark.svg               # horizontal lockup for light themes (READMEs)
├── wordmark-dark.svg          # horizontal lockup for dark themes
├── profile-readme/
│   └── profile/
│       ├── README.md          # the org profile README
│       └── assets/            # SVGs the README references
└── website/                   # static site, no build step
    ├── index.html
    ├── styles.css
    ├── script.js
    └── assets/
        ├── favicon.svg
        └── og.svg
```

The new `mcp-server` README (the viral entry point) is already in place at the repo root and references `brand/wordmark.svg` directly.

## Design system

| Token | Value |
| --- | --- |
| Ink (text + dark surfaces) | `#0A0A0A` |
| Ink-soft (secondary dark) | `#18181B` |
| Paper (light surface) | `#FAFAFA` |
| Paper-soft (subtle fill) | `#F4F4F5` |
| Line | `#E4E4E7` |
| Line-strong | `#D4D4D8` |
| Muted text | `#52525B` |
| Muted-soft text | `#71717A` |
| Accent (CTAs, highlights only) | `#FF5C00` |
| Display typeface | Inter (UI/docs), system-ui fallback |
| Mono typeface | ui-monospace / JetBrains Mono |

**No gradients. No glow. No emoji-as-logo.** The mark is mono­chrome ink-on-paper (or paper-on-ink) with a single forward chevron knocked out of the cloud silhouette. The accent orange is used sparingly — CTA hover state, the eyebrow dot on the scroll-scrub, one or two terminal highlights — and never on the logo itself.

The logo mark is a **cloud silhouette with a forward chevron** cut out of the right-hand bump. It reads as "cloud, dispatched" without resorting to illustration, gradient, or glow. The wordmark is `AgentDispatch` set in Inter ExtraBold at -2.8% tracking, no decorative effects.

## How to deploy each piece

### 1. Org avatar

Upload `brand/logo-mark.svg` (or the light variant) to the AgentDispatch GitHub org settings → *Profile picture*. GitHub will rasterize it for you; the SVG already has a 44px corner radius so it sits well in a rounded display.

### 2. Org profile README

GitHub renders `profile/README.md` from a special repo named `.github` at the org root.

```bash
# Create the .github repo (one-time, manual since this session is scoped to mcp-server)
gh repo create agent-dispatch/.github --public --description "AgentDispatch org profile"

git clone https://github.com/agent-dispatch/.github
cd .github

# Copy from this branch
cp -r path/to/mcp-server/brand/profile-readme/profile ./profile

git add profile
git commit -m "Add org profile README and brand assets"
git push
```

Within a minute of pushing, https://github.com/agent-dispatch will render the new profile.

### 3. Website

The site is intentionally zero-build — three files plus an assets folder.

Three easy deployment options:

**A. GitHub Pages from the docs repo**
```bash
git clone https://github.com/agent-dispatch/docs
cp -r brand/website/* ../docs/
# enable Pages: Settings → Pages → Source: deploy from a branch → main / root
```

**B. A dedicated `website` repo**
```bash
gh repo create agent-dispatch/website --public
cd website
cp -r ../mcp-server/brand/website/* .
git add .; git commit -m "Initial site"; git push
# enable Pages, optionally point a CNAME (agentdispatch.dev / .ai / .io)
```

**C. Netlify / Cloudflare Pages / Vercel**
Drag-drop the `brand/website` directory. It's all static — no framework, no build step.

Recommended: option B with a custom domain. Once live, update README hero links and the OG meta tags in `index.html` to point at the canonical URL.

### 4. Once everything is live

In order:

1. Set the org avatar (step 1).
2. Push the `.github` repo (step 2) — this publishes the wordmark SVGs.
3. Publish the website (step 3) and add the canonical URL to:
   - the org profile README ("Learn more →")
   - the mcp-server README header
   - each repo's `package.json` `homepage` field

## Approving the look

If you want to tweak the logo, the two knobs that matter most:

- **Chevron weight.** Currently `stroke-width=13` in `logo-mark.svg`. Lighter (8–10) feels more refined; heavier (15–17) feels more confident. Pair the change with the wordmark's `stroke-width=10.5` proportionally.
- **Cloud proportions.** The three circles + base rect can be nudged: a slightly taller cloud reads more "weather-icon", a wider/flatter one reads more "infrastructure". Same goes for the chevron — its position determines whether the cloud feels active or passive.

The website's scroll-scrub timing lives in `brand/website/script.js` — `apply(p)`. Each frame (editor, dispatch, cloud, agent tiles, return) is driven by a `ramp(p, start, end)` or `band(p, start, end)` call you can retune without touching markup or CSS.

That's the entire kit. Ping me for: a horizontal social-media banner (1500×500 GitHub-org sized), a video / Lottie variant of the scrub for embedding outside the site, or printable brand-guideline PDF.
