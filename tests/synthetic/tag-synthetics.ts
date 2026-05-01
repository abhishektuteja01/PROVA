/**
 * One-time backfill: tag any persisted synthetic-corpus submissions with
 * is_synthetic=true and the appropriate model_type.
 *
 * The script is idempotent — if a row is already correctly tagged, the
 * UPDATE is a no-op. We match by exact document_text equality (the same
 * text content that the compliance route stored after sanitization), so
 * the script only touches rows whose document_text matches one of the
 * synthetic test fixtures on disk.
 *
 * Run with:
 *   npx ts-node --project tsconfig.scripts.json tests/synthetic/tag-synthetics.ts
 *   (or: npx tsx tests/synthetic/tag-synthetics.ts)
 *
 * Requires SUPABASE_SECRET_KEY in the environment because we need to
 * UPDATE rows owned by any user — RLS would otherwise scope the update
 * to the script-runner's user_id.
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { sanitizeText } from "../../src/lib/security/sanitize";
import { ModelTypeEnum, type ModelType } from "../../src/lib/validation/schemas";

interface GoldenLabel {
  doc_id: string;
  model_type: string;
  elements: unknown[];
}

// Golden-label model_type strings → public.model_type enum values.
// Each synthetic doc lands in its nearest enum bucket so it actually
// contributes signal to that bucket's median rather than landing in 'other'.
const MODEL_TYPE_MAP: Record<string, ModelType> = {
  options_pricing_black_scholes: "market_risk_var",
  credit_scorecard: "credit_decisioning",
  mortgage_prepayment: "other",
  interest_rate_swap_valuation: "alm_irrbb",
  volatility_forecasting_garch: "market_risk_var",
  ml_credit_risk_generic: "credit_risk_pd_lgd_ead",
  allowance_cecl_cre: "allowance_cecl_ifrs9",
  unspecified_minimal: "other",
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SECRET_KEY");

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const labelsPath = path.join(__dirname, "golden_labels.json");
  const docsDir = path.join(__dirname, "documents");

  if (!fs.existsSync(labelsPath)) {
    console.error(`golden_labels.json not found at ${labelsPath}`);
    process.exit(1);
  }

  const labels: GoldenLabel[] = JSON.parse(
    fs.readFileSync(labelsPath, "utf-8")
  );

  let totalMatched = 0;
  let totalUpdated = 0;
  let totalAlreadyTagged = 0;

  for (const label of labels) {
    const docPath = path.join(docsDir, `${label.doc_id}.txt`);
    if (!fs.existsSync(docPath)) {
      console.warn(`  skip ${label.doc_id}: source file missing`);
      continue;
    }

    const rawText = fs.readFileSync(docPath, "utf-8");
    const sanitized = sanitizeText(rawText);

    const target = MODEL_TYPE_MAP[label.model_type];
    if (!target) {
      console.warn(
        `  skip ${label.doc_id}: no enum mapping for "${label.model_type}"`
      );
      continue;
    }
    // Defense in depth — confirm the mapping value is itself a valid enum.
    ModelTypeEnum.parse(target);

    // Find candidate submissions: same document_text content. Limit avoids
    // pulling unbounded rows if the synthetic was somehow persisted many
    // times. Untagged-only filter lets the script be idempotent.
    const { data: candidates, error: selectError } = await db
      .from("submissions")
      .select("id, model_type, is_synthetic")
      .eq("document_text", sanitized);

    if (selectError) {
      console.error(`  ${label.doc_id}: select failed:`, selectError.message);
      continue;
    }

    const matched = candidates ?? [];
    if (matched.length === 0) {
      console.log(`  ${label.doc_id}: no matching submissions in db`);
      continue;
    }
    totalMatched += matched.length;

    const needsUpdate = matched.filter(
      (row) => row.is_synthetic !== true || row.model_type !== target
    );
    const alreadyOk = matched.length - needsUpdate.length;
    totalAlreadyTagged += alreadyOk;

    if (needsUpdate.length === 0) {
      console.log(
        `  ${label.doc_id}: ${matched.length} row(s) already tagged → ${target} / synthetic`
      );
      continue;
    }

    const ids = needsUpdate.map((row) => row.id);
    const { error: updateError } = await db
      .from("submissions")
      .update({ is_synthetic: true, model_type: target })
      .in("id", ids);

    if (updateError) {
      console.error(
        `  ${label.doc_id}: update failed for ${ids.length} row(s):`,
        updateError.message
      );
      continue;
    }

    totalUpdated += ids.length;
    console.log(
      `  ${label.doc_id}: tagged ${ids.length} row(s) → ${target} / synthetic` +
        (alreadyOk > 0 ? ` (${alreadyOk} already correct)` : "")
    );
  }

  console.log("");
  console.log("Summary:");
  console.log(`  matched:        ${totalMatched}`);
  console.log(`  updated:        ${totalUpdated}`);
  console.log(`  already tagged: ${totalAlreadyTagged}`);
}

main().catch((err) => {
  console.error("tag-synthetics failed:", err);
  process.exit(1);
});
