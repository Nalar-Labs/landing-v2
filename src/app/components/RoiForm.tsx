import { useEffect, useState } from "react";
import { cn } from "../lib/layout";
import { ROI_CONFIG } from "../data/roi-config";
import type { CatalogApp } from "../data/roi-config";
import { ROI_COPY } from "../data/roi-copy";
import type { RoiInputs } from "../data/roi";

export type RoiFormProps = {
  value: RoiInputs;
  onChange: (next: RoiInputs) => void;
  onCalculate: () => void;
};

const FIELD =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 font-body outline-none transition-colors focus:border-ink";

/** One toggleable catalog pill. Shared by the Internal Tools / External Products groups. */
function AppPill({
  app,
  selected,
  onToggle,
}: {
  app: CatalogApp;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onToggle(app.id)}
      className={cn(
        "min-h-11 rounded-full border px-4 py-2 font-body text-sm transition-colors",
        selected ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-ink",
      )}
    >
      {app.label}
    </button>
  );
}

/** A zero prop shows an empty field; any other finite value shows its digits. */
function toFieldText(value: number): string {
  return Number.isFinite(value) && value !== 0 ? String(value) : "";
}

export function RoiForm({ value, onChange, onCalculate }: RoiFormProps) {
  const set = <K extends keyof RoiInputs>(key: K, next: RoiInputs[K]) =>
    onChange({ ...value, [key]: next });

  // Numeric inputs keep their own text so a typed "0" renders as "0" instead
  // of vanishing (Number(0) is falsy, so `value || ""` would blank it).
  const [employeesText, setEmployeesText] = useState(toFieldText(value.employees));
  const [spendText, setSpendText] = useState(toFieldText(value.currentMonthlySpend));
  const [usersText, setUsersText] = useState(toFieldText(value.externalUsers));

  // Re-sync local text with the prop when it changes from outside (reset,
  // prefill, sanitisation) without clobbering a field the user is actively
  // typing in — the functional-setter guard only fires when the parsed
  // current text disagrees with the incoming prop.
  useEffect(() => {
    setEmployeesText((current) =>
      Number(current) === value.employees ? current : toFieldText(value.employees),
    );
  }, [value.employees]);

  useEffect(() => {
    setSpendText((current) =>
      Number(current) === value.currentMonthlySpend
        ? current
        : toFieldText(value.currentMonthlySpend),
    );
  }, [value.currentMonthlySpend]);

  useEffect(() => {
    setUsersText((current) =>
      Number(current) === value.externalUsers ? current : toFieldText(value.externalUsers),
    );
  }, [value.externalUsers]);

  // EITHER internal OR external, never both (owner decision 2026-08-16 —
  // mixed projects made the panel too complex). Picking a pill from the other
  // group switches to it: the previous group's selection is cleared rather
  // than disabled, so no button is ever dead. Multi-select within a group stays.
  const toggleApp = (id: string) => {
    if (value.selectedAppIds.includes(id)) {
      set(
        "selectedAppIds",
        value.selectedAppIds.filter((entry) => entry !== id),
      );
      return;
    }
    const kind = ROI_CONFIG.catalog.find((app) => app.id === id)?.kind;
    const sameKind = value.selectedAppIds.filter((entry) =>
      ROI_CONFIG.catalog.some((app) => app.id === entry && app.kind === kind),
    );
    set("selectedAppIds", [...sameKind, id]);
  };

  const hasInternal = ROI_CONFIG.catalog.some(
    (app) => app.kind === "internal" && value.selectedAppIds.includes(app.id),
  );
  const hasExternal = ROI_CONFIG.catalog.some(
    (app) => app.kind === "external" && value.selectedAppIds.includes(app.id),
  );
  const hasAny = value.selectedAppIds.length > 0;

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        onCalculate();
      }}
    >
      <fieldset className="flex flex-col gap-5">
        <legend className="font-body text-xl pb-4 text-muted-ink">{ROI_COPY.buildLabel}</legend>

        <div>
          <p className="mb-2 font-body text-xs text-muted-ink">{ROI_COPY.internalToolsLabel}</p>
          <div className="flex flex-wrap gap-2">
            {ROI_CONFIG.catalog
              .filter((app) => app.kind === "internal")
              .map((app) => (
                <AppPill key={app.id} app={app} selected={value.selectedAppIds.includes(app.id)} onToggle={toggleApp} />
              ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-body text-xs text-muted-ink">{ROI_COPY.externalProductsLabel}</p>
          <div className="flex flex-wrap gap-2">
            {ROI_CONFIG.catalog
              .filter((app) => app.kind === "external")
              .map((app) => (
                <AppPill key={app.id} app={app} selected={value.selectedAppIds.includes(app.id)} onToggle={toggleApp} />
              ))}
          </div>
        </div>
      </fieldset>

      {/* Progressive disclosure: only ask what the selection makes relevant. */}
      {hasInternal && (
        <>
          <div>
            <label htmlFor="roi-employees" className="mb-2 block font-body text-sm">
              {ROI_COPY.employeesLabel}
            </label>
            <input
              id="roi-employees"
              type="number"
              min={1}
              inputMode="numeric"
              className={FIELD}
              value={employeesText}
              onChange={(event) => {
                const text = event.target.value;
                setEmployeesText(text);
                set("employees", Number(text));
              }}
            />
          </div>

          {/* The label wraps checkbox + text so the whole row is clickable,
              and `min-h-11` gives the combined tap target 44px even though
              the checkbox glyph itself stays visually small. */}
          <label htmlFor="roi-pays" className="flex min-h-11 items-center gap-3">
            <input
              id="roi-pays"
              type="checkbox"
              className="size-5 accent-ink"
              checked={value.paysForSoftware}
              onChange={(event) => set("paysForSoftware", event.target.checked)}
            />
            <span className="font-body text-sm">{ROI_COPY.paysLabel}</span>
          </label>

          {value.paysForSoftware && (
            <div>
              <label htmlFor="roi-spend" className="mb-2 block font-body text-sm">
                {ROI_COPY.spendLabel}
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-page px-4 py-3 font-body text-sm">USD</span>
                <input
                  id="roi-spend"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={FIELD}
                  value={spendText}
                  onChange={(event) => {
                    const text = event.target.value;
                    setSpendText(text);
                    set("currentMonthlySpend", Number(text));
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {hasExternal && (
        <div>
          <label htmlFor="roi-users" className="mb-2 block font-body text-sm">
            {ROI_COPY.usersLabel}
          </label>
          <input
            id="roi-users"
            type="number"
            min={1}
            inputMode="numeric"
            className={FIELD}
            value={usersText}
            onChange={(event) => {
              const text = event.target.value;
              setUsersText(text);
              set("externalUsers", Number(text));
            }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!hasAny}
        className="rounded-full bg-brand px-8 py-4 font-body text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ROI_COPY.calculate}
      </button>
    </form>
  );
}
