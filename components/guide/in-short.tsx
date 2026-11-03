import { ArrowRight, Checks, Clock, HourglassMedium, Info, Robot, Warning } from "@phosphor-icons/react/dist/ssr";
import { formatMinutes } from "@/lib/format";
import type { Guide } from "@/lib/schema/guide.schema";

function days(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  const hi = max ?? min!;
  const lo = min ?? max!;
  const unit = (d: number) => (d >= 14 ? `${Math.round(d / 7)} weeks` : `${d} day${d === 1 ? "" : "s"}`);
  return lo === hi ? unit(hi) : `${unit(lo)} to ${unit(hi)}`;
}

function approvalSentence(g: Guide): string {
  const w = g.time.approvalWait;
  const d = days(w.minDays, w.maxDays);
  const wait = d ? ` This usually takes ${d}.` : " They don’t publish how long it takes.";
  switch (w.required) {
    case "no":
      return "No approval needed. Your app works as soon as it’s set up.";
    case "for_public_use":
      return `You can build and test without approval. Letting other people use it needs the provider’s review.${wait}`;
    case "for_some_scopes":
      return `Most of it works straight away. Some permissions need the provider’s review first.${wait}`;
    case "always":
      return `Every app needs the provider’s approval before real users can connect.${wait}`;
    default:
      return "We couldn’t confirm whether the provider reviews apps.";
  }
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const SEV = { high: 3, medium: 2, low: 1 } as const;

/** "Your workspace" → "your workspace", but leave "API calls" and "OAuth" alone. */
const lowerFirst = (t: string) => {
  const first = t.split(/\s/)[0] ?? "";
  return first === "A" || /^[A-Z][a-z]+$/.test(first) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
};

/** Plain-English summary built from the guide's own data, so it can never disagree with the details. */
export function InShort({ guide }: { guide: Guide }) {
  const a = guide.time.activeSetup;
  const steps = [...guide.steps].sort((x, y) => x.order - y.order);
  const first = steps[0];
  const agentSteps = steps.filter((s) => s.owner === "agent").length;
  const providerSteps = steps.filter((s) => s.owner === "provider").length;
  const risk = [...guide.blockers].sort((x, y) => SEV[y.severity] - SEV[x.severity])[0];
  const noEvidence = guide.sources.length === 0;

  const rows: { icon: React.ReactNode; text: string }[] = noEvidence
    ? [
        { icon: <Info size={16} weight="duotone" />, text: `We couldn’t find a developer program for ${guide.appName}, so there is nothing reliable to show yet.` },
        { icon: <Checks size={16} weight="duotone" />, text: "Check the app’s website footer for “Developers” or “API”, or ask their support whether third-party apps can connect with OAuth." },
      ]
    : [
        {
          icon: <Clock size={16} weight="duotone" />,
          text: a.maxMinutes > 0 ? `About ${formatMinutes(a.minMinutes, a.maxMinutes)} of hands-on work: creating the app, filling in its settings and writing the sign-in code.` : "We couldn’t estimate the hands-on time.",
        },
        { icon: <HourglassMedium size={16} weight="duotone" />, text: approvalSentence(guide) },
        ...(guide.prerequisites.length
          ? [{ icon: <Checks size={16} weight="duotone" />, text: `Have these ready first: ${list(guide.prerequisites.slice(0, 3).map((p) => lowerFirst(p.label)))}.` }]
          : []),
        ...(risk ? [{ icon: <Warning size={16} weight="duotone" />, text: `The most common problem: ${lowerFirst(risk.title)}. The fix is in Blockers below.` }] : []),
        ...(steps.length
          ? [
              {
                icon: <Robot size={16} weight="duotone" />,
                text: `An AI agent can do ${agentSteps} of the ${steps.length} steps for you. ${providerSteps ? "The rest need you or the provider’s review." : "The rest need you."}`,
              },
            ]
          : []),
      ];

  return (
    <section aria-labelledby="in-short-title" className="rounded-2xl bg-muted/40 p-1.5 ring-1 ring-border">
      <div className="rounded-xl bg-background p-5 ring-1 ring-border sm:p-6">
        <h2 id="in-short-title" className="text-base font-semibold tracking-tight">
          In short
        </h2>
        <ul className="mt-3 space-y-3">
          {rows.map((r) => (
            <li key={r.text} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="mt-0.5 shrink-0 text-muted-foreground">{r.icon}</span>
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
          {first && !noEvidence && (
            <a href={`#step-${first.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
              Start with step 1 <ArrowRight size={14} />
            </a>
          )}
          <details className="group text-sm text-muted-foreground">
            <summary className="cursor-pointer list-none rounded-md px-1 py-1 underline-offset-4 hover:text-foreground hover:underline [&::-webkit-details-marker]:hidden">
              What is an OAuth app?
            </summary>
            <p className="mt-2 max-w-2xl leading-relaxed">
              It’s the registration that lets your product ask people for permission to use their {guide.appName} account. You create it once and get a client ID and secret.
              After that, each of your users connects through it and sees your app’s name on the consent screen.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
