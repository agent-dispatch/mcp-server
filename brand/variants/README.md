# Logo variants — pick one

Two takes on the agent-in-cloud mark. Same cloud silhouette, same monochrome palette, different glyph inside.

| File | What it depicts | Vibe |
| --- | --- | --- |
| [`logo-mark-sparkle.svg`](./logo-mark-sparkle.svg) | A 4-point sparkle / spark at the centre of the cloud. | The 2025 default AI-agent symbol (Apple Intelligence, ChatGPT, Gemini all use it). Most universally readable as "AI". Risk: increasingly generic. |
| [`logo-mark-robot.svg`](./logo-mark-robot.svg) | A compact robot head with eyes, mouth-visor, and an antenna nub poking through the top of the cloud. | More distinctive. Reads specifically as "an agent in the cloud" rather than "AI magic". Risk: edges toward "friendly mascot" if the proportions drift. |

The currently-shipped main mark (`brand/logo-mark.svg`) is the **sparkle** version.

## To promote the robot variant

```bash
# from repo root
cp brand/variants/logo-mark-robot.svg          brand/logo-mark.svg
cp brand/variants/logo-mark-robot-light.svg    brand/logo-mark-light.svg
# (the wordmark / favicon / OG already inline a compact glyph — I'll regenerate
#  them in matching style on confirmation rather than guessing now)
```

…or tell me which and I'll do the swap-and-resync in one commit.

## To stay with the sparkle

Do nothing — it's already live. Delete this `variants/` directory once you've decided.
