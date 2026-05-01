import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/errors/messages';
import { CorpusDisclosureSchema, type CorpusDisclosure } from '@/lib/validation/schemas';

export async function GET() {
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

  try {
    const { data, error } = await supabase.rpc('get_corpus_disclosure');

    if (error) {
      Sentry.captureException(error);
      return errorResponse('DATABASE_ERROR');
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      const empty: CorpusDisclosure = { total_n: 0, synthetic_n: 0, real_n: 0 };
      return NextResponse.json(empty);
    }

    const parsed = CorpusDisclosureSchema.safeParse(row);
    if (!parsed.success) {
      Sentry.captureException(
        new Error(`get_corpus_disclosure returned unexpected shape: ${parsed.error.message}`)
      );
      return errorResponse('DATABASE_ERROR');
    }

    return NextResponse.json(parsed.data);
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('DATABASE_ERROR');
  }
}
