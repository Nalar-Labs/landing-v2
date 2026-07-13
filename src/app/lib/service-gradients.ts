/**
 * One gradient per Services card, in the same reading order Services.tsx
 * renders them (Consultation row, then End-to-End Implementation row).
 * Built only from the grey tokens in src/styles/theme.css
 * (`--nalar-line`, `--nalar-surface`) — alternating angle and stop order
 * keeps each one visually distinct. Per the owner's accessibility
 * decision at final review, greys keep card text readable at every
 * inflate intensity.
 */
export const SERVICE_CARD_GRADIENTS = [
  // 0 — AI Strategy & Implementation Roadmap
  "linear-gradient(135deg, var(--nalar-line) 0%, var(--nalar-surface) 100%)",
  // 1 — Technical Cost Optimisation
  "linear-gradient(135deg, var(--nalar-surface) 0%, var(--nalar-line) 100%)",
  // 2 — Vibe-to-Production
  "linear-gradient(225deg, var(--nalar-line) 0%, var(--nalar-surface) 100%)",
  // 3 — Internal Tool Building
  "linear-gradient(225deg, var(--nalar-surface) 0%, var(--nalar-line) 100%)",
  // 4 — External Product Development
  "linear-gradient(315deg, var(--nalar-line) 0%, var(--nalar-surface) 100%)",
  // 5 — Agentic Deployment
  "linear-gradient(315deg, var(--nalar-surface) 0%, var(--nalar-line) 100%)",
] as const;
