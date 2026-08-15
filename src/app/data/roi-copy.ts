// Calculator copy. Kept out of content.ts so this feature owns its own strings.
export const ROI_COPY = {
  eyebrow: "ROI Calculator",
  heading: "What would it cost to build your own?",
  buildLabel: "What should we build for you?",
  employeesLabel: "How many employees?",
  paysLabel: "Are you already paying for software?",
  spendLabel: "Your current monthly cost",
  usersLabel: "Expected users",
  calculate: "Calculate",
  recalculate: "Recalculate",
  restingHeadline: "See what you would pay",
  restingBody:
    "Pick what you would like us to build and we will estimate it against typical agency rates.",
  /** `%s`/`%s` are replaced with the formatted min/max of `agencyShareRange()`. */
  restingRangeTeaser: "Most projects land between {min} and {max} of typical agency rates.",
  paybackLabel: "Pays for itself in",
  paybackLabelFallback: "Payback",
  monthlySavingLabel: {
    positive: "You save",
    negative: "Costs more per month",
    zero: "Monthly cost",
  },
  /** Shown as the stat value only in the exact-zero-saving case. */
  monthlySavingZeroValue: "About the same",
  agencyReason: {
    external: "Customer-facing products have no existing software spend to replace.",
    notPaying: "You are not replacing existing software, so there is nothing to save against.",
  },
  ctaLabel: "Book a call",
  disclaimer: "An estimate, not a quote. We confirm the real numbers on the call.",
} as const;
