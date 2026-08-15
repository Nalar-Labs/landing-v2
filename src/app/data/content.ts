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
  { label: "Key Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "FAQ", href: "#faq" },
  { label: "Book A Free Session", href: "#contact", accent: true },
];

export type HeroLine = {
  /** The part of the line that never changes. */
  static: string;
  /** Words the trailing slot loops through; omit for a fully static line. */
  cycling?: readonly string[];
};

export const HERO = {
  headline: "Want to win with AI?",
  lines: [
    {
      static: "You don't need more",
      cycling: ["SaaS", "Tokens", "Tools", "Developers", "Consultants", "Designers"],
    },

    { static: "You just need partners who have built great products." },
  ],
  links: [
    { label: "Book a call", href: CALENDLY_URL },
    { label: "Refer a friend", href: "#refer" },
  ],
} as const satisfies {
  headline: string;
  lines: readonly HeroLine[];
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
 * One trio, mixed from the two former groups. Cut from six per the Aug-9
 * redesign: the group sub-headings had nothing left to distinguish once a
 * single group remained.
 */
export const SERVICES: Service[] = [
  {
    title: "Replace SaaS with Open Source",
    description:
      "Quit paying for software you don't control, we can help build your own bespoke software using open source tools that are free to use and modify.",
  },
  {
    title: "Replace Vendors with Agents",
    description:
      "Instead of hiring expensive vendors, we help you build custom AI agents that work for you 24/7 for almost any task such as design, finance, and yes even software development.",
  },
  {
    title: "Cost Free Maintenance & Instant Handoff",
    description:
      "We document what was built, train your team, and hand over open tools you own outright — so you are never locked into a stack we control.",
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
    title: "Discovery & Scoping,",
    subtitle: "It all starts with a (free) 30-minute call.",
    steps: [
      "Click on this link right here and let's have a call",
      "If your problem isn't solved by step 1, we'll come back with a plan",
      "Once you're impressed with our plan, we'll write-up a detailed proposal and get to work!",
    ],
  },
  {
    title: "On Loop: Talk, Build, Test.",
    subtitle: "Until: Satisfied.",
    paragraph:
      "We design and build in focused sprints with regular online/offline check-ins. All deliverables are documented, versioned, and handed over. We use open tools wherever possible so you're never dependent on a proprietary stack we control.",
  },
  {
    title:
      "Training and hand off", 
    subtitle: "Unlike other vendors, we don't want to lock you in",
    paragraph:
      "We believe the world would be a better place if everyone had the ability to build things on their own. That's why we want to make sure even when we're gone, you and you're team will be able to continue building.",
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
  headline: "Let's make your tool your hardest worker",
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
