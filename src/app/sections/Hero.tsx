import { useMemo, useState, type MouseEvent } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn, TYPE } from "../lib/layout";
import { CALENDLY_URL, HERO } from "../data/content";

export function Hero() {
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [referralLink, setReferralLink] = useState("");

  const canGenerateLink = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email]);

  const generateReferralLink = () => {
    const url = new URL(CALENDLY_URL);
    url.searchParams.set("utm_source", "friend_referral");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", "nalar_referral");
    url.searchParams.set("utm_content", email.trim().toLowerCase());
    setReferralLink(url.toString());
  };

  const handleLinkClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (href === "#refer") {
      event.preventDefault();
      setIsReferModalOpen(true);
    }
  };

  return (
    <>
      <section
        id="home"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-32"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[1400px] text-center"
        >
          <h1 className={cn(TYPE.hero, "mx-auto mb-16 max-w-[1345px] md:mb-24")}>
            {HERO.lines.map((line) => (
              <span key={line.static} className="block">
                {line.static}
                {line.cycling ? ` ${line.cycling[0]}` : ""}
              </span>
            ))}
          </h1>

          <div className="flex flex-col items-center justify-center gap-8 font-body text-xl sm:flex-row sm:gap-16 md:text-[24px]">
            {HERO.links.map((link) => {
              const isExternal = link.href.startsWith("http");

              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={handleLinkClick(link.href)}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="transition-opacity hover:opacity-60"
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </motion.div>

        {/* Scroll affordance — mobile */}
        <a
          href="#services"
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-soft px-5 py-2 text-sm font-light text-white md:hidden"
        >
          Explore Nalar
          <ArrowRight className="size-4" />
        </a>
      </section>

      {isReferModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 text-left text-black md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 className="font-display text-3xl leading-tight tracking-[-1px] md:text-4xl">
                Refer a friend
              </h2>
              <button
                type="button"
                onClick={() => setIsReferModalOpen(false)}
                aria-label="Close referral modal"
                className="rounded-full border border-black/20 px-3 py-1 text-sm transition-colors hover:bg-black hover:text-white"
              >
                Close
              </button>
            </div>

            <label className="mb-2 block font-body text-sm">Your email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mb-4 w-full rounded-xl border border-black/20 px-4 py-3 outline-none transition-colors focus:border-black"
            />

            <button
              type="button"
              disabled={!canGenerateLink}
              onClick={generateReferralLink}
              className="rounded-full bg-black px-6 py-3 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate referral link
            </button>

            {referralLink && (
              <div className="mt-5 rounded-xl bg-black/5 p-4">
                <p className="mb-2 text-sm text-black/70">Your referral link</p>
                <a
                  href={referralLink}
                  className="break-all text-sm underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {referralLink}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
