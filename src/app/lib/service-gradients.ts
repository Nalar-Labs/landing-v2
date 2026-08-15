/** One gradient per Services card, in the order Services.tsx renders them. */
export const SERVICE_CARD_GRADIENTS = [
  // 0 — Replace SaaS with Open Source
  "linear-gradient(135deg, var(--nalar-line) 0%, var(--nalar-surface) 100%)",
  // 1 — Replace Vendors with Agents
  "linear-gradient(135deg, var(--nalar-surface) 0%, var(--nalar-line) 100%)",
  // 2 — Cost Free Maintenance & Instant Handoff
  "linear-gradient(135deg, var(--nalar-line) 0%, var(--nalar-surface) 100%)",
] as const;
