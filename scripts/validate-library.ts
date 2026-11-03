// Validates every data/guides/*.json against GuideSchema and checks they're all registered.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LIBRARY_RAW } from "../data/guides";
import { GuideSchema } from "../lib/schema/guide.schema";
import { checkGuideConsistency } from "../lib/agent/verify";

const dir = join(process.cwd(), "data/guides");
let failed = 0;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const slug = file.replace(/\.json$/, "");
  const r = GuideSchema.safeParse(JSON.parse(readFileSync(join(dir, file), "utf8")));
  if (!r.success) {
    failed++;
    console.error(`✗ ${file}`);
    for (const i of r.error.issues) console.error(`    ${i.path.join(".")}: ${i.message}`);
    continue;
  }
  const problems = checkGuideConsistency(r.data);
  if (!(slug in LIBRARY_RAW)) problems.push(`not registered in data/guides/index.ts`);
  if (r.data.slug !== slug) problems.push(`slug "${r.data.slug}" does not match filename`);
  if (problems.length) {
    failed++;
    console.error(`✗ ${file}`);
    for (const p of problems) console.error(`    ${p}`);
  } else {
    console.log(`✓ ${file}`);
  }
}

process.exit(failed ? 1 : 0);
