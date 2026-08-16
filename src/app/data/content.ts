// Landing-page content. Keeping copy here (not inline in JSX) makes the section
// components purely presentational and the content easy to edit in one place.

export type NavLink = {
  label: string;
  href: string;
  /** Highlighted primary action in the menu. */
  accent?: boolean;
};

export const CALENDLY_URL = "https://calendly.com/garda4199/30min";

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "Our Philosophy", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "FAQ", href: "#faq" },
  { label: "Book A Free Session", href: "#contact", accent: true },
];

export const HERO = {
  prefix: "We make custom",
  cycling: ["agents", "systems", "software", "tools", "platforms","apps"],
  suffix: "better, safer, faster. ",
  links: [
    { label: "Book a call", href: CALENDLY_URL },
    { label: "Refer a friend", href: "#refer" },
  ],
} as const satisfies {
  prefix: string;
  cycling: readonly string[];
  suffix: string;
  links: readonly { label: string; href: string }[];
};

export type Service = {
  title: string;
  hook?: string;
  description: string;
  /** Renders the subtle gradient accent surface. */
  gradient?: boolean;
};

/**
 * Sits between the section heading and the cards, framing the three points.
 * An array of lines, not one string with a "\n": HTML collapses newlines to a
 * space, so the break has to be structural — one element per line.
 * Services.tsx maps over this; keep it an array if you edit the copy.
 */
export const PHILOSOPHY_INTRO = [
  "Nalar in Bahasa means “common sense”.",
  "Because of AI, old ways of building software don't make sense anymore and here's why:",
] as const;

/** Closes the section and hands off to the calculator. */
export const PHILOSOPHY_OUTRO = "Still Not Convinced?";

/**
 * The three philosophy points. They render as the section's cards, so the
 * scroll-pin animation — which is built for exactly three — still applies.
 */
export const SERVICES: Service[] = [
  {
    title: "SaaS Should be Dead",
    description:
      "Why pay for expensive software subscriptions when you can build it yourself, own all the code, and customize freely at a fraction of the cost.",
  },
  {
    title: "Data Should be Yours",
    description:
      "Why give your data away to frontier labs or software vendors. Protect your most valuable business asset.",
  },
  {
    title: "Things Should Move 10x Faster",
    description:
      "Don't wait a month for a new design, or spend three months building an MVP. AI has completely upended the speed of shipping software.",
    gradient: true,
  },
];

export type ApproachStep = {
  title: string;
  subtitle?: string;
  /** Numbered list body (mutually exclusive with `paragraph`). */
  steps?: string[];
  paragraph?: string;
};

export const APPROACH_STEPS: ApproachStep[] = [
  {
    title: "Start with a free call.",
    subtitle: "Worst case, you leave with free advice.",
    steps: [
      "Book a free 30-minute call and tell us what's slowing you down.",
      "If the call alone solves your problem, great. If not, we'll come back with a plan.",
      "When the plan impresses you, we'll write up a detailed proposal and get to work.",
    ],
  },
  {
    title: "We build in sprints you can watch.",
    subtitle: "Talk, build, test. Repeat until you're satisfied.",
    paragraph:
      "We design and build in focused sprints with regular online/offline check-ins. All deliverables are documented, versioned, and handed over. We use open tools wherever possible so you're never dependent on a proprietary stack we control.",
  },
  {
    title: "We hand over everything,",
    subtitle: "then teach you not to need us.",
    paragraph:
      "We believe the world is better when people can build things on their own. So when the work is done, your team gets the code, the docs, the credentials, and the training to keep building without us.",
  },
];

export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * Ordered by what earns trust fastest. No-lock-in sits second, ahead of
 * pricing, because it reframes everything below it. The last question names
 * who is *not* a fit, to filter bad-fit leads before they reach the calendar.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How are you different from a dev shop or agency?",
    answer:
      "You work directly with the people building your software — there is no account manager between you and the engineers. We default to open-source tools you own outright, so nothing we build depends on a licence we control.",
  },
  {
    question: "What happens when the project ends — are we stuck with you?",
    answer:
      "No. Every engagement ends with a structured handoff: we document what was built, run hands-on sessions with your team, and hand over versioned code and written guides. We use open tools wherever possible, so you are never dependent on a proprietary stack we control. An ongoing retainer is available if you want one — not because you will need it.",
  },
  {
    question: "How does pricing work?",
    answer:
      "It starts with a free 30-minute call to understand the problem. If there is a fit, we come back with a recommended approach and a rough scope, then run a detailed planning session that produces a fixed, written proposal. You know the number before any build work begins.",
  },
  {
    question: "Do we need an in-house engineer or IT team?",
    answer:
      "No. Most of the teams we work with do not have one — that is usually why they call us. We handle architecture, build, deployment and maintenance, and we train whoever on your team will own the tool day to day.",
  },
  {
    question: "Can AI run privately on our own data?",
    answer:
      "Yes. Models can run on infrastructure you control, so sensitive data never leaves your environment. Where a hosted model is the better fit, we are explicit about what gets sent, what is retained, and how to turn that off.",
  },
  {
    question: "What kind of companies do you work with?",
    answer:
      "Teams of roughly 10 to 60 people where technology is a means rather than the product — operations, services, manufacturing, education. We are a poor fit if you are a tech company building your own engineering org, or if you already have an in-house team that just needs extra hands.",
  },
];

export const CTA = {
  headline: "Let's start building things the new way.",
  buttonLabel: "Book a call",
  href: CALENDLY_URL,
} as const;

/**
 * Temporary destination for social links that have no page yet. Both
 * LinkedIn and Twitter point here so swapping them later is a one-line
 * change. These are knowingly dead links until then.
 */
export const PLACEHOLDER_URL = "#";

export const FOOTER = {
  links: [
    { label: "Contact", href: CALENDLY_URL },
    { label: "LinkedIn", href: PLACEHOLDER_URL },
    { label: "Twitter", href: PLACEHOLDER_URL },
  ],
  blurb:
    'Nalar is a collective design engineering lab run by people from Indonesia across the world, where Nalar means "makes sense".',
} as const;
