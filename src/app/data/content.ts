// Landing-page content. Keeping copy here (not inline in JSX) makes the section
// components purely presentational and the content easy to edit in one place.

export type NavLink = {
  label: string;
  href: string;
  /** Highlighted primary action in the menu. */
  accent?: boolean;
};

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "Key Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "FAQ", href: "#faq" },
  { label: "Book A Free Session", href: "#contact", accent: true },
];

export const HERO = {
  headline:
    "Nalar Labs is an external Authentic Intelligences helping you implement the Artificial one",
  links: [
    { label: "Book a call", href: "#contact" },
    { label: "Refer someone-else", href: "#refer" },
  ],
} as const;

export type Service = {
  title: string;
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
    heading: "Consultation",
    items: [
      {
        title: "AI Strategy & Implementation Roadmap",
        description:
          "Plan where AI fits in your business, what to build, in what order, and how to measure success.",
      },
      {
        title: "Technical Cost Optimisation",
        description:
          "Audit your current systems and recommend ways to reduce infrastructure, tooling, and operational costs.",
      },
      {
        title: "Vibe-to-Production",
        description:
          "Help you manage your prototype projects expectation into clean, production-ready applications.",
        gradient: true,
      },
    ],
  },
  {
    heading: "End-to-End Implementation",
    items: [
      {
        title: "Internal Tool Building",
        description:
          "Migrate your team off paid SaaS subscriptions and replace them with custom in-house tools you own.",
        gradient: true,
      },
      {
        title: "External Product Development",
        description:
          "Build customer-facing products architected to scale to millions of users.",
      },
      {
        title: "Agentic Deployment",
        description:
          "Design and deploy AI agents that automate workflows across your business.",
      },
    ],
  },
];

export type ApproachStep = {
  title: string;
  subtitle?: string;
  active?: boolean;
  /** Numbered list body (mutually exclusive with `paragraph`). */
  steps?: string[];
  paragraph?: string;
};

export const APPROACH_STEPS: ApproachStep[] = [
  {
    title: "Discovery & scoping,",
    subtitle: "Technology is the answer but what was the question?",
    active: true,
    steps: [
      "Intro call — problem discovery, fit assessment (Free)",
      "Solution presentation — we come back with a recommended approach and rough scope (may be paid)",
      "Project planning session — detailed scope, timeline, and contract (Paid)",
    ],
  },
  {
    title: "Execution, answering the question to life",
    paragraph:
      "We design and build in focused sprints with regular check-ins. All deliverables are documented, versioned, and handed over — nothing lives only in our heads or on our machines. We use open tools wherever possible so you're never dependent on a proprietary stack we control.",
  },
  {
    title:
      "Training and hand off, good product is something that can be understood",
    paragraph:
      "Every engagement ends with a structured training phase. We document what was built, run hands-on sessions with your team, and create internal guides so your people can maintain and extend the work without us. Optional ongoing retainer for continued support.",
  },
];

export const CTA = {
  headline: "Let's make your tool your hardest worker",
  buttonLabel: "Book a call",
  href: "#contact",
} as const;
