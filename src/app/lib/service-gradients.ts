/**
 * One gradient per Services card, in the same reading order Services.tsx
 * renders them (Consultation row, then End-to-End Implementation row).
 * Built only from the brand tokens in src/styles/theme.css — alternating
 * angle and stop order keeps each one visually distinct without
 * introducing any new hues (guidelines/Guidelines.md §2, "one accent per
 * view").
 */
export const SERVICE_CARD_GRADIENTS = [
  // 0 — AI Strategy & Implementation Roadmap
  "linear-gradient(135deg, var(--nalar-brand) 0%, var(--nalar-ink-soft) 100%)",
  // 1 — Technical Cost Optimisation
  "linear-gradient(135deg, var(--nalar-ink-soft) 0%, var(--nalar-brand-hover) 100%)",
  // 2 — Vibe-to-Production
  "linear-gradient(135deg, var(--nalar-brand-hover) 0%, var(--nalar-ink) 100%)",
  // 3 — Internal Tool Building
  "linear-gradient(225deg, var(--nalar-ink) 0%, var(--nalar-brand) 100%)",
  // 4 — External Product Development
  "linear-gradient(225deg, var(--nalar-brand) 0%, var(--nalar-brand-hover) 100%)",
  // 5 — Agentic Deployment
  "linear-gradient(225deg, var(--nalar-brand-hover) 0%, var(--nalar-ink-soft) 100%)",
] as const;
