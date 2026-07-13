// src/app/sections/Hero.tsx
import { useMemo, useState, type MouseEvent } from "react";
import { ArrowRight, Paperclip } from "lucide-react";
import { motion } from "motion/react";
import { cn, TYPE } from "../lib/layout";
import { CALENDLY_URL, HERO } from "../data/content";
import { CyclingWord } from "../components/CyclingWord";

/** Line 2's cycle fires this long after Line 1's (spec: ~600ms offset). */
const CYCLE_OFFSET_MS = 600;

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
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
            className="mb-8 font-body text-xl tracking-[0.02em] md:mb-10 md:text-4xl"
          >
            Want to win with AI?
          </motion.p>
        <div className="w-full max-w-[1400px] text-center">
          <h1 className={cn(TYPE.hero, "mx-auto mb-10 max-w-[1345px] md:mb-12")}>
            {HERO.lines.map((line, lineIndex) => (
              <motion.span
                key={line.static}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: lineIndex * 0.2 }}
                className="block"
              >
                {line.static}
                {line.cycling && (
                  <>
                    {" "}
                    <CyclingWord
                      words={line.cycling}
                      offsetMs={lineIndex * CYCLE_OFFSET_MS}
                      className="border-b-[3px] border-ink md:border-b-4"
                    />
                  </>
                )}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
            className="flex flex-col items-center justify-center gap-4 font-body text-xl sm:flex-row sm:gap-6 md:text-[24px]"
          >
            {HERO.links.map((link) => {
              const isExternal = link.href.startsWith("http");
              const isRefer = link.href === "#refer";

              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={handleLinkClick(link.href)}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="group inline-flex items-center gap-3 rounded-full border border-black/45 bg-white px-8 py-4 transition-colors hover:border-black"
                >
                  <span>{link.label}</span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:scale-105">
                    {isRefer ? <Paperclip className="size-4" /> : <ArrowRight className="size-4" />}
                  </span>
                </a>
              );
            })}
          </motion.div>
        </div>

      
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
