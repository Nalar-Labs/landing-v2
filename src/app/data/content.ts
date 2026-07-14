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
} as const satisfies { lines: readonly HeroLine[]; links: readonly { label: string; href: string }[] };

export type Service = {
  title: string;
  hook: string;
  description: string;
  /** Renders the subtle gradient accent surface. */
  gradient?: boolean;
};

export type ServiceGroup = {
  heading: string;
  items: Service[];
};

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    heading: "Think Better about Tech",
    items: [
      {
        title: "AI Transformation",
        hook: "Feeling AI Fomo?",
        description:
          "We help you identify opportunities, plan strategically, and build a realistic roadmap to transform your business.",
      },
      {
        title: "User Research",
        hook: "Not sure what to build?",
        description:
          "We can help build a deep understanding of your users through interviews, surveys, and usability testing to back your decisions.",
      },
      {
        title: "AI Optimization",
        hook: "Bunt through your tokens?",
        description:
          "We provide training to you and your organization to help you make the most of your AI capabilities and transform into an AI native company.",
        gradient: true,
      },
    ],
  },
  {
    heading: "Build What's Best for Your Business",
    items: [
      {
        title: "Internal Tool Building",
        hook: "Paying too much for SaaS?",
        description:
          "Migrate your team off paid SaaS subscriptions. Replacethem with custom in-house tools you own. No more recurring fees for things you don't control.",
        gradient: true,
      },
      {
        title: "External Product Development",
        hook: "Is your vibe-coded app production ready?",
        description:
          "We can build apps with robust architecture, seamless user experience, and maintainable code to support your growth to millions of users.",
      },
      {
        title: "Offline/Online Agent Deployment",
        hook: "Want to build your own agent?",
        description:
          "We can help you train offline models that protect your data and sovereignty across your business.",
      },
    ],
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
