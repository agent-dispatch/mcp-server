# AgentDispatch brand kit

This directory holds the proposed visual identity, org profile README, and marketing site for the AgentDispatch organization. Because this branch lives inside `mcp-server` and my publishing access is scoped to a single repo, everything is staged here for you to copy into the right destination repos.

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
├── proposed-readmes/
│   ├── core/README.md
│   ├── sdk-js/README.md
│   ├── cli/README.md
│   ├── store-sqlite/README.md
│   ├── adapter-aws-agentcore/README.md
│   ├── worker-agentcore/README.md
│   ├── adapter-template/README.md
│   └── docs/README.md
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
| Background (dark) | `#0B1020` |
| Surface (card) | `#131A2E` |
| Border | `#1F2A44` |
| Text | `#E2E8F0` |
| Text muted | `#94A3B8` |
| Accent (violet deep / on light) | `#7C3AED` |
| Accent (cyan deep / on light) | `#06B6D4` |
| Accent (violet light / on dark) | `#A78BFA` |
| Accent (cyan light / on dark) | `#22D3EE` |
| Gradient | `#7C3AED → #06B6D4` (or light variants on dark backgrounds) |
| Typeface | Inter (UI / docs), system-ui fallback |
| Code typeface | ui-monospace / JetBrains Mono |

The logo mark is a **dispatch hub**: one inbound spoke (left), a glowing core, two outbound spokes (right) ending in nodes. It reads literally as "signal in → fan-out to agents" — the system's job in one shape.

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

### 3. Per-repo READMEs

For every sibling package, copy the proposed README over the existing one (or merge — they were written to slot in cleanly):

```bash
for repo in core sdk-js cli store-sqlite adapter-aws-agentcore worker-agentcore adapter-template docs; do
  cp brand/proposed-readmes/$repo/README.md ../$repo/README.md
done
```

The proposed READMEs reference shared brand assets at
`https://raw.githubusercontent.com/agent-dispatch/.github/main/profile/assets/wordmark{,-dark}.svg`,
so deploy the `.github` repo first (step 2) and the images will resolve everywhere.

> ⚠️ The proposed sibling READMEs are written to match each repo's stated purpose. Skim each one and customize package names, API examples, and command surfaces against what you've actually shipped before pushing.

### 4. Website

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

### 5. Once everything is live

Update three things, in order:

1. Set the org avatar (step 1).
2. Push the `.github` repo (step 2) — this also publishes the wordmark SVGs the other READMEs reference.
3. Push the per-repo READMEs (step 3).
4. Publish the website (step 4) and add the canonical URL to:
   - the org profile README ("Learn more →")
   - the mcp-server README header
   - each repo's `package.json` `homepage` field

## Approving the look

If you want to tweak the logo, the two knobs that matter most:

- **Spoke angles.** Currently 0° left, ±28° on the right. Tighter (±15°) reads more focused; wider (±45°) reads more "broadcast". Edit the `x2`/`y2` coordinates in `logo-mark.svg`.
- **Palette.** Violet→cyan is on-trend for AI tooling but easy to change — swap the gradient stops in the `<defs>` block. The whole brand follows from these two colors.

That's the entire kit. Ping me if you want a horizontal social-media banner (1500×500 GitHub-org sized), an animated SVG variant, or a dark-mode preview screenshot of the site.
