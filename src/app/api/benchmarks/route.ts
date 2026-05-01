import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/errors/messages';
import {
  BENCHMARK_MIN_CORPUS_N,
  BenchmarkQuerySchema,
  TopGapEntrySchema,
  type BenchmarkStats,
} from '@/lib/validation/schemas';
import { z } from 'zod';

// The DB function is the cross-user privacy boundary. The API layer adds a
// secondary defense: if the corpus for the requested model_type is below the
// minimum threshold, we suppress the medians here too — even if the function
// returned them — so an N=1 bucket can never leak another user's exact score
// through any code path.
const RpcResultSchema = z.object({
  corpus_n: z.number().int().min(0),
  synthetic_n: z.number().int().min(0),
  real_n: z.number().int().min(0),
  cs_median: z.union([z.number(), z.string()]).nullable(),
  oa_median: z.union([z.number(), z.string()]).nullable(),
  om_median: z.union([z.number(), z.string()]).nullable(),
  final_median: z.union([z.number(), z.string()]).nullable(),
  top_gaps: z.array(TopGapEntrySchema),
});

function toNum(v: number | string | null): number | null {
  if (v === null) return null;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: Request) {
  let supabase;
  try {
    supabase = await createServerClient();
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('UNKNOWN_ERROR');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse('AUTH_REQUIRED');
  }

  const { searchParams } = new URL(request.url);
  const includeSyntheticParam = searchParams.get('include_synthetic');
  const parsed = BenchmarkQuerySchema.safeParse({
    model_type: searchParams.get('model_type') ?? undefined,
    // Treat the absence of the query param as the default (true). Coerce
    // explicitly: only the literal string "false" turns it off — anything
    // else (including "true", "1", "") is true. z.coerce.boolean() would
    // turn "false" into true, which is not what we want.
    include_synthetic:
      includeSyntheticParam === null ? true : includeSyntheticParam !== 'false',
  });

  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', {
      message: parsed.error.issues[0]?.message ?? 'Invalid benchmark query.',
    });
  }

  const { model_type, include_synthetic } = parsed.data;

  try {
    const { data, error } = await supabase.rpc('get_benchmark_stats', {
      model_type_filter: model_type,
      include_synthetic,
    });

    if (error) {
      Sentry.captureException(error);
      return errorResponse('DATABASE_ERROR');
    }

    // Postgres functions returning TABLE shape come back as an array.
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      // No row means no submissions exist with that filter combination.
      const empty: BenchmarkStats = {
        model_type,
        include_synthetic,
        corpus_n: 0,
        synthetic_n: 0,
        real_n: 0,
        cs_median: null,
        oa_median: null,
        om_median: null,
        final_median: null,
        top_gaps: [],
      };
      return NextResponse.json(empty);
    }

    const rpcResult = RpcResultSchema.safeParse(row);
    if (!rpcResult.success) {
      Sentry.captureException(
        new Error(`get_benchmark_stats returned unexpected shape: ${rpcResult.error.message}`)
      );
      return errorResponse('DATABASE_ERROR');
    }

    const r = rpcResult.data;
    const belowMinN = r.corpus_n < BENCHMARK_MIN_CORPUS_N;

    const result: BenchmarkStats = {
      model_type,
      include_synthetic,
      corpus_n: r.corpus_n,
      synthetic_n: r.synthetic_n,
      real_n: r.real_n,
      // Suppress medians below the minimum-N gate. corpus_n is still surfaced
      // so the UI can render an honest "Insufficient corpus (N=X)" message.
      cs_median: belowMinN ? null : toNum(r.cs_median),
      oa_median: belowMinN ? null : toNum(r.oa_median),
      om_median: belowMinN ? null : toNum(r.om_median),
      final_median: belowMinN ? null : toNum(r.final_median),
      // Top gaps are also suppressed below min N — element_code distribution
      // could still leak inference about which document a single user submitted.
      top_gaps: belowMinN ? [] : r.top_gaps,
    };

    return NextResponse.json(result);
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('DATABASE_ERROR');
  }
}
