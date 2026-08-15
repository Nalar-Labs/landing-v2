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

export const CTA = {
  headline: "Let's make your tool your hardest worker",
  buttonLabel: "Book a call",
  href: CALENDLY_URL,
} as const;
