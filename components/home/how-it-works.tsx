import { Radar, Search, Share2, ShieldCheck } from "lucide-react";
import { EvidenceLegend } from "@/components/home/evidence-legend";

const STEPS = [
  { icon: Search, title: "Research", body: "An agent searches and reads the provider's official docs first, then community reports, and notes every finding with its source." },
  { icon: Radar, title: "Probe", body: "It opens the developer console URL and records only what it can observe, such as a login wall or form fields. It never signs in." },
  { icon: ShieldCheck, title: "Verify", body: "Deterministic checks, not another LLM: unsourced claims become “uncertain”, official labels need official sources, timelines need citations." },
  { icon: Share2, title: "Share", body: "The result is a stable link with dates, sources and an explicit list of what we couldn’t confirm." },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20">
      <h2 id="how-title" className="text-lg font-semibold tracking-tight">How it works</h2>
      <ol className="mt-4 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-subtle-foreground">0{i + 1}</span>
              <s.icon className="size-4 text-brand" strokeWidth={1.5} />
              <h3 className="text-sm font-medium">{s.title}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <EvidenceLegend />
      </div>
    </section>
  );
}
