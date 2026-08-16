import { useRef, useState } from "react";
import { Plus, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { cn } from "../lib/layout";
import type { RoiInputs, RoiOutcome } from "../data/roi";
import {
  normaliseLink,
  snapshotOutcome,
  submitQuote,
  validateQuoteDraft,
  type QuoteFilePayload,
} from "../data/quote";

const FIELD =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 font-body text-sm outline-none transition-colors focus:border-ink";

const COPY = {
  trigger: "Get Accurate Quote",
  title: "Get an accurate quote",
  intro:
    "Tell us what you have in mind. Your calculator inputs come along automatically, so the quote you get back matches your scenario.",
  describeLabel: "Describe what you want to build",
  linksLabel: "Add any links",
  linksHint: "Briefs, Figma files, competitor products — anything that helps.",
  addLink: "Add another link",
  filesLabel: "Upload any files",
  filesHint: "Up to 5 MB per file, 10 MB total.",
  emailLabel: "Your email",
  nameLabel: "Name (optional)",
  companyLabel: "Company (optional)",
  submit: "Request quote",
  submitting: "Sending…",
  successTitle: "Request sent",
  successBody: "We'll come back with a real quote, usually within two business days.",
  notConfigured:
    "The quote inbox isn't connected yet — please book a call instead, or email us directly.",
  networkError: "That didn't send. Your entries are still here — try again.",
} as const;

type Status = "idle" | "submitting" | "sent" | "not-configured" | "network";

/** Read one File into the transport shape. */
function encodeFile(file: File): Promise<QuoteFilePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
      });
    };
    reader.readAsDataURL(file);
  });
}

export function QuoteDialog({
  inputs,
  outcome,
}: {
  inputs: RoiInputs;
  outcome: RoiOutcome | null;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [files, setFiles] = useState<File[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset on OPEN, not close: Radix keeps the dialog mounted ~200ms after
  // closing (repo gotcha), so a close-time reset visibly flashes empty fields.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setDescription("");
      setLinks([""]);
      setFiles([]);
      setEmail("");
      setName("");
      setCompany("");
      setProblems([]);
      setStatus("idle");
    }
  };

  const setLink = (index: number, value: string) =>
    setLinks(links.map((link, i) => (i === index ? value : link)));
  const removeLink = (index: number) =>
    setLinks(links.length === 1 ? [""] : links.filter((_, i) => i !== index));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles([...files, ...Array.from(list)]);
    // Allow re-picking the same file after removing it.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateQuoteDraft({
      description,
      email,
      links,
      fileSizes: files.map((file) => file.size),
    });
    setProblems(found);
    if (found.length > 0) return;

    setStatus("submitting");
    const encoded = await Promise.all(files.map(encodeFile));
    const result = await submitQuote({
      description: description.trim(),
      // Send the normalised form ("https://…") so sheet cells are clickable;
      // validation already guaranteed every non-blank row normalises.
      links: links
        .map(normaliseLink)
        .filter((link): link is string => link !== null),
      email: email.trim(),
      name: name.trim(),
      company: company.trim(),
      files: encoded,
      roi: { inputs, outcome: snapshotOutcome(outcome) },
      submittedAt: new Date().toISOString(),
    });
    setStatus(result.ok ? "sent" : result.reason === "not-configured" ? "not-configured" : "network");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex w-fit items-center gap-3 rounded-full bg-ink px-6 py-3 font-body text-white transition-colors hover:bg-ink-soft"
        >
          {COPY.trigger}
        </button>
      </DialogTrigger>
      <DialogContent
        data-lenis-prevent
        className="max-h-[85vh] overflow-y-auto rounded-card sm:max-w-xl"
      >
        {status === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-ink text-white">
              <Check className="size-6" />
            </span>
            <DialogTitle className="font-display text-2xl tracking-[-0.72px]">
              {COPY.successTitle}
            </DialogTitle>
            <DialogDescription className="font-body text-muted-ink">
              {COPY.successBody}
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-medium tracking-[-0.72px]">
                {COPY.title}
              </DialogTitle>
              <DialogDescription className="font-body text-sm text-muted-ink">
                {COPY.intro}
              </DialogDescription>
            </DialogHeader>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="quote-description" className="mb-2 block font-body text-sm">
                  {COPY.describeLabel}
                </label>
                <textarea
                  id="quote-description"
                  rows={4}
                  className={cn(FIELD, "resize-y")}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <div>
                <span className="mb-1 block font-body text-sm">{COPY.linksLabel}</span>
                <p className="mb-2 font-body text-xs text-muted-ink">{COPY.linksHint}</p>
                <div className="flex flex-col gap-2">
                  {links.map((link, index) => (
                    // Index keys are safe here: rows are appended/removed by
                    // position and carry no identity beyond their text.
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="url"
                        aria-label={`Link ${index + 1}`}
                        placeholder="https://"
                        className={FIELD}
                        value={link}
                        onChange={(event) => setLink(index, event.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={`Remove link ${index + 1}`}
                        onClick={() => removeLink(index)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:border-ink"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setLinks([...links, ""])}
                  className="mt-2 inline-flex items-center gap-1 font-body text-sm text-muted-ink transition-colors hover:text-ink"
                >
                  <Plus className="size-4" /> {COPY.addLink}
                </button>
              </div>

              <div>
                <label htmlFor="quote-files" className="mb-1 block font-body text-sm">
                  {COPY.filesLabel}
                </label>
                <p className="mb-2 font-body text-xs text-muted-ink">{COPY.filesHint}</p>
                <input
                  id="quote-files"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="block w-full font-body text-sm file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:font-body file:text-sm hover:file:bg-line/50"
                  onChange={(event) => addFiles(event.target.files)}
                />
                {files.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 font-body text-xs"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          className="ml-2 shrink-0 text-muted-ink transition-colors hover:text-ink"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="quote-email" className="mb-2 block font-body text-sm">
                    {COPY.emailLabel}
                  </label>
                  <input
                    id="quote-email"
                    type="email"
                    autoComplete="email"
                    className={FIELD}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="quote-name" className="mb-2 block font-body text-sm">
                    {COPY.nameLabel}
                  </label>
                  <input
                    id="quote-name"
                    type="text"
                    autoComplete="name"
                    className={FIELD}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="quote-company" className="mb-2 block font-body text-sm">
                    {COPY.companyLabel}
                  </label>
                  <input
                    id="quote-company"
                    type="text"
                    autoComplete="organization"
                    className={FIELD}
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                  />
                </div>
              </div>

              {problems.length > 0 && (
                <ul role="alert" className="flex flex-col gap-1 font-body text-sm text-destructive">
                  {problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              )}
              {status === "not-configured" && (
                <p role="alert" className="font-body text-sm text-muted-ink">
                  {COPY.notConfigured}
                </p>
              )}
              {status === "network" && (
                <p role="alert" className="font-body text-sm text-destructive">
                  {COPY.networkError}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="rounded-full bg-brand px-8 py-3 font-body text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === "submitting" ? COPY.submitting : COPY.submit}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
