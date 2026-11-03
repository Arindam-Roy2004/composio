"use client";

import { BouncyAccordion } from "@/components/motion/bouncy-accordion";

const FAQ = [
  { id: "know", q: "How do you know a claim is true?", a: "Every claim carries a label: tested by a person, probed by the agent, documented in official docs, reported by the community, or uncertain. Hover a label to see the exact source." },
  { id: "verify", q: "Can the model just mark everything as documented?", a: "No. A plain-code verifier checks every label after generation. A claim without an official source is downgraded, and timelines without a citation are removed." },
  { id: "signin", q: "Does the agent sign in or submit forms?", a: "Never. It reads public pages and observes the console page it lands on, such as a login wall or visible fields. Creating the app is always your step." },
  { id: "time", q: "Why split active work from approval wait?", a: "They’re different costs. Registering a Gmail client takes under an hour; getting restricted scopes verified can take six weeks. Treating them as one number hides the part that blocks your launch." },
  { id: "stale", q: "What if a provider changes its policy?", a: "Every guide shows when it was researched and every source shows when it was fetched. You can re-run research on any AI-generated guide." },
  { id: "long", q: "How long does research take?", a: "Usually one to two minutes, capped at 120 seconds and ten tool calls. Existing guides open instantly." },
];

export function Faq() {
  return <BouncyAccordion defaultValue="know" items={FAQ.map((f) => ({ id: f.id, title: f.q, description: f.a }))} />;
}
